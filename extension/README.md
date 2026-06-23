# Lumo Chrome 插件

这个目录是 Lumo 的跨网页采集插件。它不是 App 内模拟按钮，而是在 Chrome 任意网页中工作。

## 加载方式

1. 打开 `chrome://extensions`
2. 开启右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择本项目的 `extension` 文件夹

## 快捷键

- `Ctrl/Command + Shift + S`：保存当前链接
- `Ctrl/Command + Shift + A`：保存文章图文快照
- `Ctrl/Command + Shift + X`：保存当前可视区域截图
- `Ctrl/Command + Shift + V`：保存视频时间点

## 真实截图说明

插件使用 `chrome.tabs.captureVisibleTab` 保存当前标签页可视区域截图，保存的是你正在看的页面画面，不再使用 Lumo App 里的示意图。

## 导入到 Lumo

1. 在任意网页按快捷键完成采集
2. 点击浏览器右上角 Lumo 插件图标
3. 点击“导出 JSON”保存采集文件，或点击“打开 Lumo”进入导入页
4. 在 Lumo 的“导入导出”页面选择该 JSON 文件
5. 导入后，资料会进入“资料库”，并保留真实链接、截图、选中文本、正文片段和视频时间点

弹窗里的“复制 JSON”适合临时备份；“清空”只会清除浏览器本机插件缓存，不会删除已经导入 Lumo 的资料。
