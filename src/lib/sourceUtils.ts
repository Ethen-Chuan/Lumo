import type { Collection, Purpose, Source, SourceType } from "../types";

// ─── static visual data (mirrors App.tsx constants) ──────────────────────────

const realSourceVisuals: Record<string, { image: string; label: string; metric: string; feedback: string[] }> = {
  s1: { image: "/media/cerave-hydrating-cleanser-real.png", label: "美妆个护", metric: "定位 / 成分 / 边界", feedback: ["温和清洁", "保湿", "详情页"] },
  s2: { image: "/media/lumo-photo-duolingo.jpg", label: "教育增长", metric: "Streak / 留存 / 习惯", feedback: ["每日任务", "提醒", "奖励闭环"] },
  s3: { image: "/media/lumo-photo-notion-ai.jpg", label: "AI 办公", metric: "搜索 / 总结 / 写作", feedback: ["知识库", "文档", "协作"] },
  s4: { image: "/media/lumo-photo-dji-pocket.jpg", label: "创作者硬件", metric: "拍摄 / 稳定 / 竖屏", feedback: ["Vlog", "收音", "场景卖点"] },
  s5: { image: "/media/lumo-photo-airbnb-rooms.jpg", label: "平台服务", metric: "信任 / 匹配 / 透明度", feedback: ["房东资料", "筛选", "安全感"] },
  s6: { image: "/media/lumo-photo-spotify-wrapped.jpg", label: "内容增长", metric: "回顾 / 分享 / 情绪", feedback: ["年度总结", "社交传播", "个性化"] },
  s7: { image: "/media/lumo-photo-figma-community.jpg", label: "设计生态", metric: "模板 / 插件 / 协作", feedback: ["社区", "复用", "团队"] },
  s8: { image: "/media/lumo-photo-stripe-billing.jpg", label: "开发者工具", metric: "计费 / 文档 / API", feedback: ["订阅", "发票", "失败重试"] },
  s9: { image: "/media/lumo-photo-ikea-store.jpg", label: "零售空间", metric: "动线 / 场景 / 搭配", feedback: ["样板间", "路径", "组合购"] },
  s10: { image: "/media/lumo-photo-nike-run.jpg", label: "运动健康", metric: "目标 / 教练 / 激励", feedback: ["训练计划", "徽章", "社群"] },
  s11: { image: "/media/lumo-photo-headspace.jpg", label: "心理健康", metric: "睡眠 / 呼吸 / 习惯", feedback: ["课程", "提醒", "情绪"] },
  s12: { image: "/media/lumo-photo-slack-canvas.jpg", label: "团队协作", metric: "线程 / 文档 / 行动", feedback: ["会议沉淀", "异步", "任务"] },
  s13: { image: "/media/lumo-photo-shopify-checkout.jpg", label: "电商转化", metric: "结账 / 信任 / 支付", feedback: ["购物车", "转化", "风控"] },
  s14: { image: "/media/lumo-photo-linear-roadmap.jpg", label: "项目管理", metric: "Issue / Cycle / Roadmap", feedback: ["节奏", "优先级", "发布"] },
  s15: { image: "/media/lumo-photo-tesla-supercharger.jpg", label: "出行能源", metric: "补能 / 地图 / 等待", feedback: ["路线", "充电", "可靠性"] },
  s16: { image: "/media/lumo-photo-patagonia-wornwear.jpg", label: "可持续品牌", metric: "维修 / 二手 / 故事", feedback: ["复用", "信任", "社区"] },
  s17: { image: "/media/lumo-photo-apple-vision.jpg", label: "空间计算", metric: "手势 / 窗口 / 沉浸", feedback: ["上手", "场景", "新范式"] },
};

const collectionEditorialVisuals: Record<string, { heroImage: string; label: string; mood: string; tone: string }> = {
  c1: { heroImage: "/media/lumo-real-workshop.jpg", label: "跨行业研究", mood: "多行业资料统一进入研究画廊", tone: "tone-research" },
  c2: { heroImage: "/media/lumo-photo-notion-ai.jpg", label: "AI 与协作", mood: "工作流、文档、工具生态", tone: "tone-ai" },
  c3: { heroImage: "/media/lumo-photo-spotify-wrapped.jpg", label: "增长与消费", mood: "习惯、内容、情绪和传播", tone: "tone-growth" },
  c4: { heroImage: "/media/lumo-photo-patagonia-wornwear.jpg", label: "商业与品牌", mood: "转化、信任、可持续叙事", tone: "tone-brand" },
  c5: { heroImage: "/media/lumo-photo-apple-vision.jpg", label: "硬件与平台", mood: "新硬件、创作者和平台体验", tone: "tone-hardware" },
};

// ─── exported utilities ───────────────────────────────────────────────────────

export function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

export function sourceThumb(source: { id: string; type: SourceType; sourceName: string }): string {
  if (source.sourceName === "Lumo 快捷收藏") return "/media/lumo-photo-duolingo.jpg";
  if (source.sourceName === "文章快照") return "/media/lumo-photo-notion-ai.jpg";
  if (source.sourceName === "图文快照") return "/media/lumo-photo-airbnb-rooms.jpg";
  if (source.sourceName === "视频时间点") return "/media/lumo-photo-dji-pocket.jpg";
  if (realSourceVisuals[source.id]) return realSourceVisuals[source.id].image;
  if (source.type === "video") return "/media/lumo-demo.gif";
  if (source.type === "audio") return "/media/lumo-audio-thumb.png";
  if (source.type === "image") return "/media/lumo-photo-airbnb-rooms.jpg";
  if (source.type === "note" || source.type === "pdf" || source.type === "newsletter") return "/media/lumo-photo-notion-ai.jpg";
  if (source.sourceName.toLowerCase().includes("perplexity")) return "/media/lumo-video-thumb.png";
  return "/media/lumo-photo-duolingo.jpg";
}

export function collectionVisual(collection: Collection, index: number, items: Source[]): {
  heroImage: string;
  label: string;
  mood: string;
  tone: string;
  previewImages: string[];
} {
  const editorial = collectionEditorialVisuals[collection.id] ?? {
    heroImage: items[0]?.snapshotImage ?? (items[0] ? sourceThumb(items[0]) : "/media/lumo-real-reading-desk.jpg"),
    label: collection.name,
    mood: collection.description,
    tone: `tone-${(index % 5) + 1}`,
  };
  const sourceImages = items.map((source) => source.snapshotImage ?? sourceThumb(source)).filter(Boolean).slice(0, 3);
  return {
    ...editorial,
    previewImages: sourceImages.length ? sourceImages : [editorial.heroImage],
  };
}

export function sourcePreviewData(key: string, title: string, url: string): { label: string; host: string; title: string; rows: string[]; tone: string } | undefined {
  const host = safeHost(url);
  if (key === "s1") {
    return { label: "商品定位", host, title: "美妆详情页摘录", rows: ["用户任务：温和清洁", "证据：成分与适用边界", "成果：详情页卖点"], tone: "blue" };
  }
  if (key === "s2") {
    return { label: "增长机制", host, title: "Duolingo 留存摘录", rows: ["触发：每日提醒", "反馈：streak 奖励", "风险：过度打扰"], tone: "green" };
  }
  if (key === "s3") {
    return { label: "AI 工作流", host, title: "Notion AI 摘录", rows: ["搜索知识库", "总结会议和文档", "在工作台内完成写作"], tone: "purple" };
  }
  if (key === "s4") {
    return { label: "硬件场景", host, title: "创作者设备摘录", rows: ["便携开拍", "稳定画面", "短视频工作流"], tone: "yellow" };
  }
  if (key === "s5") {
    return { label: "平台信任", host, title: "Airbnb Rooms 摘录", rows: ["房东资料", "筛选与透明度", "交易前安全感"], tone: "blue" };
  }
  return undefined;
}

export function suggestCollectionId(
  input: { title: string; sourceName?: string; purpose: Purpose; tags?: string[] },
  collections: Collection[]
): string | undefined {
  if (!collections.length) return undefined;
  const text = [input.title, input.sourceName, input.purpose, ...(input.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
  const rules: Array<{ id: string; keywords: string[]; purpose?: Purpose[] }> = [
    { id: "c2", keywords: ["ai", "notion", "figma", "stripe", "slack", "linear", "workflow", "tool", "office"] },
    { id: "c3", keywords: ["growth", "duolingo", "spotify", "ikea", "nike", "headspace", "consumer", "留存", "增长"], purpose: ["learning", "writing_material", "inspiration"] },
    { id: "c4", keywords: ["shopify", "tesla", "patagonia", "commerce", "brand", "checkout", "商业", "品牌"], purpose: ["competitor_analysis", "interview_prep"] },
    { id: "c5", keywords: ["hardware", "dji", "apple", "vision", "camera", "platform", "硬件", "空间计算"] },
    { id: "c1", keywords: ["product", "cerave", "airbnb", "case", "platform", "跨行业", "产品研究"], purpose: ["project_research", "task_reference"] },
  ];
  const best = rules
    .map((rule) => ({
      id: rule.id,
      score: rule.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 2 : 0), 0) + (rule.purpose?.includes(input.purpose) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)[0];
  return best?.score ? best.id : collections[0]?.id;
}

export function collectionSources(collection: Collection, sources: Source[]): Source[] {
  return collection.sourceIds.map((id) => sources.find((source) => source.id === id)).filter((source): source is Source => Boolean(source));
}

export function sourceStatusDot(source: Pick<Source, "status">): "read" | "unread" {
  if (source.status === "read" || source.status === "archived") return "read";
  return "unread";
}
