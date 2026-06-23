const KIND_LABEL = {
  link: "链接",
  article_snapshot: "文章图文快照",
  image_snapshot: "网页截图",
  video_timestamp: "视频时间点"
};

const LUMO_URL_PATTERNS = [
  "http://localhost:517*/*",
  "http://localhost:518*/*",
  "http://127.0.0.1:517*/*"
];

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("未找到当前标签页");
  return tab;
}

async function collectFromTab(tab, kind) {
  let page = {
    title: tab.title || "未命名网页",
    url: tab.url || "",
    host: tab.url ? new URL(tab.url).hostname : "",
    description: "",
    image: "",
    selection: "",
    articleText: "",
    savedAt: new Date().toISOString(),
    video: null
  };

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "LUMO_COLLECT_PAGE" });
    page = { ...page, ...response };
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    const response = await chrome.tabs.sendMessage(tab.id, { type: "LUMO_COLLECT_PAGE" });
    page = { ...page, ...response };
  }

  let screenshot = "";
  try {
    screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  } catch (error) {
    console.warn("Lumo screenshot failed", error);
  }

  return {
    id: `clip-${Date.now()}`,
    kind,
    kindLabel: KIND_LABEL[kind],
    title: page.title,
    url: page.url,
    host: page.host,
    description: page.description,
    image: page.image,
    selection: page.selection,
    articleText: page.articleText,
    screenshot,
    savedAt: page.savedAt,
    video: page.video,
    source: {
      title: page.title,
      url: page.url,
      sourceName: `Lumo ${KIND_LABEL[kind]}`,
      snapshotImage: screenshot || page.image,
      capturedText: page.selection || page.articleText || page.description,
      captureMode: kind,
      sourceReferences: [{ label: page.host || "当前网页", url: page.url, note: "由 Lumo Chrome 插件从当前标签页采集。" }]
    }
  };
}

/** 找到所有打开的 Lumo App 标签页，推送新采集的资料 */
async function pushToLumoApp(clip) {
  const results = [];
  for (const pattern of LUMO_URL_PATTERNS) {
    try {
      const tabs = await chrome.tabs.query({ url: pattern });
      results.push(...tabs);
    } catch { /* ignore */ }
  }
  for (const tab of results) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "LUMO_PUSH_CLIP", clip });
    } catch { /* Lumo app tab may not have loaded bridge yet */ }
  }
  return results.length > 0;
}

async function saveClip(kind) {
  const tab = await getActiveTab();
  const clip = await collectFromTab(tab, kind);
  const { clips = [] } = await chrome.storage.local.get("clips");
  const newClips = [clip, ...clips].slice(0, 80);
  await chrome.storage.local.set({ clips: newClips });

  // 尝试推送到已打开的 Lumo App
  const pushed = await pushToLumoApp(clip);

  await chrome.action.setBadgeText({ text: pushed ? "✓" : String(Math.min(newClips.length, 99)) });
  await chrome.action.setBadgeBackgroundColor({ color: pushed ? "#16a34a" : "#2563eb" });
  // 3秒后恢复数字
  if (pushed) setTimeout(() => chrome.action.setBadgeText({ text: String(Math.min(newClips.length, 99)) }), 3000);

  return { clip, pushed };
}

chrome.commands.onCommand.addListener((command) => {
  const map = {
    "save-link": "link",
    "save-article": "article_snapshot",
    "save-screenshot": "image_snapshot",
    "save-video": "video_timestamp"
  };
  const kind = map[command];
  if (kind) saveClip(kind).catch((error) => console.error("Lumo capture failed", error));
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "LUMO_CAPTURE") {
    saveClip(message.kind || "link")
      .then(({ clip, pushed }) => sendResponse({ ok: true, clip, pushed }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "LUMO_SYNC_ALL") {
    chrome.storage.local.get("clips").then(({ clips = [] }) => {
      pushToLumoApp({ _syncAll: true, clips });
      sendResponse({ ok: true, count: clips.length });
    });
    return true;
  }
});
