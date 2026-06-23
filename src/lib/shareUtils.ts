import type { SocialPlatform } from "../types";

// ShareTargetId is SocialPlatform plus the native "system" share target.
export type ShareTargetId = SocialPlatform | "system";

export function buildShareText(platform: ShareTargetId, title: string, content: string, url?: string): string {
  const linkLine = url ? `\n\n原始链接：${url}` : "";
  if (platform === "redbook") return `标题：${title}\n\n正文：${content}${linkLine}\n\n#Lumo笔记 #知识管理 #阅读笔记`;
  if (platform === "douyin") return `抖音口播脚本\n开头钩子：这条资料/笔记帮我想清楚了一个问题：${title}\n\n核心内容：${content}${linkLine}\n\n结尾引导：想看完整证据链，可以来我的 Lumo 之家。`;
  if (platform === "wechat") return `我用 Lumo 整理了一条笔记：${title}\n\n${content}${linkLine}`;
  if (platform === "bilibili") return `B站动态草稿：${title}\n\n${content}${linkLine}\n\n#学习记录 #知识整理`;
  return `${title}\n\n${content}${linkLine}`;
}
