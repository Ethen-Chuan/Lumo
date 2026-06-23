// Lumo App Bridge — 运行在 localhost 上的 Lumo 页面内
// 作用：把来自 service_worker 的采集数据通过 CustomEvent 传给页面
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "LUMO_PUSH_CLIP") {
    window.dispatchEvent(new CustomEvent("lumo:clip-received", {
      detail: message.clip
    }));
  }
  if (message?.type === "LUMO_SYNC_ALL") {
    window.dispatchEvent(new CustomEvent("lumo:clips-sync", {
      detail: { clips: message.clips }
    }));
  }
});
