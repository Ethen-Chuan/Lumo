const statusEl = document.querySelector("#status");
const clipsEl = document.querySelector("#clips");
const syncBtn = document.querySelector("#sync-lumo");
const lumoStatusEl = document.querySelector("#lumo-status");
const portInput = document.querySelector("#lumo-port");
const urlModeSelect = document.querySelector("#lumo-url-mode");
const onlineUrlInput = document.querySelector("#lumo-online-url");
const localPortRow = document.querySelector("#local-port-row");
const onlineUrlRow = document.querySelector("#online-url-row");

// Load saved settings
chrome.storage.local.get(["lumoPort", "lumoUrlMode", "lumoOnlineUrl"]).then(
  ({ lumoPort = 5173, lumoUrlMode = "local", lumoOnlineUrl = "" }) => {
    if (portInput) portInput.value = lumoPort;
    if (urlModeSelect) urlModeSelect.value = lumoUrlMode;
    if (onlineUrlInput) onlineUrlInput.value = lumoOnlineUrl;
    applyUrlMode(lumoUrlMode);
  }
);

function applyUrlMode(mode) {
  if (!localPortRow || !onlineUrlRow) return;
  localPortRow.style.display = mode === "local" ? "" : "none";
  onlineUrlRow.style.display = mode === "online" ? "" : "none";
}

urlModeSelect?.addEventListener("change", async () => {
  const mode = urlModeSelect.value;
  await chrome.storage.local.set({ lumoUrlMode: mode });
  applyUrlMode(mode);
  checkLumoStatus();
});

portInput?.addEventListener("change", async () => {
  const port = parseInt(portInput.value, 10);
  if (port > 1000 && port < 65535) {
    await chrome.storage.local.set({ lumoPort: port });
    setStatus(`✓ 端口已更新为 ${port}`);
    checkLumoStatus();
  }
});

onlineUrlInput?.addEventListener("change", async () => {
  const url = onlineUrlInput.value.trim().replace(/\/$/, "");
  if (url.startsWith("https://") || url.startsWith("http://")) {
    await chrome.storage.local.set({ lumoOnlineUrl: url });
    setStatus(`✓ 线上地址已保存`);
    checkLumoStatus();
  }
});

/** Get the current Lumo URL based on mode */
async function getLumoUrl() {
  const { lumoPort = 5173, lumoUrlMode = "local", lumoOnlineUrl = "" } =
    await chrome.storage.local.get(["lumoPort", "lumoUrlMode", "lumoOnlineUrl"]);
  if (lumoUrlMode === "online" && lumoOnlineUrl) return lumoOnlineUrl;
  return `http://localhost:${lumoPort}`;
}

function setStatus(text, type = "") {
  statusEl.textContent = text;
  statusEl.className = type ? `status-${type}` : "";
}

function downloadJson(clips) {
  const blob = new Blob([serializeClips(clips)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lumo-clips-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function serializeClips(clips) {
  return JSON.stringify({ app: "Lumo", schema: "lumo-web-clipper-v1", exportedAt: new Date().toISOString(), clips }, null, 2);
}

function text(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

const LUMO_PATTERNS = [
  "http://localhost:5173/*",
  "http://localhost:5174/*",
  "http://localhost:5175/*",
  "http://localhost:5176/*",
  "http://localhost:5180/*",
  "http://localhost:517*/*",
  "http://localhost:518*/*",
  "http://127.0.0.1:517*/*",
  "http://127.0.0.1:518*/*"
];

async function findLumoTabs() {
  const all = [];
  // Check localhost patterns
  for (const pattern of LUMO_PATTERNS) {
    try { all.push(...await chrome.tabs.query({ url: pattern })); } catch { /* ignore */ }
  }
  // Also check online URL if configured
  const { lumoUrlMode, lumoOnlineUrl } = await chrome.storage.local.get(["lumoUrlMode", "lumoOnlineUrl"]);
  if (lumoUrlMode === "online" && lumoOnlineUrl) {
    try { all.push(...await chrome.tabs.query({ url: lumoOnlineUrl + "/*" })); } catch { /* ignore */ }
    try { all.push(...await chrome.tabs.query({ url: lumoOnlineUrl })); } catch { /* ignore */ }
  }
  return all;
}

async function checkLumoStatus() {
  const tabs = await findLumoTabs();
  if (tabs.length > 0) {
    lumoStatusEl.textContent = "● Lumo App 已连接";
    lumoStatusEl.className = "lumo-connected";
    syncBtn.disabled = false;
  } else {
    lumoStatusEl.textContent = "○ Lumo App 未开启";
    lumoStatusEl.className = "lumo-disconnected";
    syncBtn.disabled = true;
  }
}

async function renderClips() {
  const { clips = [] } = await chrome.storage.local.get("clips");
  clipsEl.replaceChildren();
  if (!clips.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "还没有采集内容。打开任意网页后点上方按钮或使用快捷键。";
    clipsEl.appendChild(empty);
    return;
  }
  for (const clip of clips.slice(0, 12)) {
    const article = document.createElement("article");
    article.className = "clip";
    const image = document.createElement("img");
    image.src = clip.screenshot || clip.image || "";
    image.alt = "网页截图";
    const copy = document.createElement("div");
    const meta = document.createElement("small");
    meta.textContent = `${text(clip.kindLabel, "采集")} · ${text(clip.host)}`;
    const title = document.createElement("strong");
    title.textContent = text(clip.title, "未命名网页");
    const paragraph = document.createElement("p");
    paragraph.textContent = text(clip.selection || clip.description || clip.articleText || clip.url, "已保存当前网页。");
    copy.append(meta, title, paragraph);
    article.append(image, copy);
    clipsEl.appendChild(article);
  }
}

document.querySelectorAll("[data-kind]").forEach((button) => {
  button.addEventListener("click", async () => {
    const kind = button.dataset.kind;
    setStatus("正在保存并尝试推送到 Lumo…");
    const result = await chrome.runtime.sendMessage({ type: "LUMO_CAPTURE", kind });
    if (result.ok) {
      setStatus(result.pushed ? `✓ 已实时推送到 Lumo App` : `已保存（Lumo App 未开启，快捷键收藏后再同步）`, result.pushed ? "success" : "");
    } else {
      setStatus(`保存失败：${result.error}`, "error");
    }
    await renderClips();
    await checkLumoStatus();
  });
});

syncBtn?.addEventListener("click", async () => {
  const { clips = [] } = await chrome.storage.local.get("clips");
  if (!clips.length) { setStatus("没有待同步的内容"); return; }
  const result = await chrome.runtime.sendMessage({ type: "LUMO_SYNC_ALL" });
  setStatus(result?.ok ? `✓ 已将 ${result.count} 条记录同步到 Lumo` : "同步失败，请确认 Lumo App 已打开", result?.ok ? "success" : "error");
});

document.querySelector("#export").addEventListener("click", async () => {
  const { clips = [] } = await chrome.storage.local.get("clips");
  downloadJson(clips);
  setStatus(`已导出 ${clips.length} 条采集记录`);
});

document.querySelector("#copy-json").addEventListener("click", async () => {
  const { clips = [] } = await chrome.storage.local.get("clips");
  await navigator.clipboard.writeText(serializeClips(clips));
  setStatus(`已复制 ${clips.length} 条采集记录`);
});

document.querySelector("#open-lumo").addEventListener("click", async () => {
  const url = await getLumoUrl();
  chrome.tabs.create({ url });
});

document.querySelector("#clear").addEventListener("click", async () => {
  await chrome.storage.local.set({ clips: [] });
  await chrome.action.setBadgeText({ text: "" });
  setStatus("已清空本机插件采集记录");
  await renderClips();
});

// Init
renderClips();
checkLumoStatus();
