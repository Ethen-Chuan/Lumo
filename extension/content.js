function readMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content ||
    document.querySelector(`meta[property="${name}"]`)?.content ||
    "";
}

function textFrom(selector, limit = 2800) {
  const node = document.querySelector(selector);
  if (!node) return "";
  return node.innerText.replace(/\s+/g, " ").trim().slice(0, limit);
}

function collectPageData() {
  const selection = window.getSelection()?.toString().trim() || "";
  const video = document.querySelector("video");
  const articleText = selection || textFrom("article") || textFrom("main") || textFrom("body", 1800);
  const image = readMeta("og:image") || document.querySelector("img")?.currentSrc || document.querySelector("img")?.src || "";
  return {
    title: document.title || readMeta("og:title") || location.hostname,
    url: location.href,
    host: location.hostname,
    description: readMeta("description") || readMeta("og:description"),
    image,
    selection,
    articleText,
    savedAt: new Date().toISOString(),
    video: video ? {
      currentTime: Math.floor(video.currentTime || 0),
      duration: Math.floor(video.duration || 0),
      paused: video.paused,
      src: video.currentSrc || video.src || location.href
    } : null
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "LUMO_COLLECT_PAGE") return false;
  sendResponse(collectPageData());
  return true;
});
