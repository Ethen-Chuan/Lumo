import type {
  Claim,
  Collection,
  Deliverable,
  Entity,
  Evidence,
  Highlight,
  Insight,
  Note,
  Project,
  Source,
} from "../types";

const now = "2026-05-29T09:00:00.000Z";
const daysAgo = (days: number) => new Date(Date.parse(now) - days * 86400000).toISOString();

const sourceSeed = [
  ["s1", "CeraVe 保湿洁面：官方定位与成分卖点", "CeraVe", "article", "competitor_analysis", "跨行业产品研究"],
  ["s2", "Duolingo 连续学习机制与留存增长拆解", "Duolingo", "webpage", "project_research", "跨行业产品研究"],
  ["s3", "Notion AI：知识工作台的 AI 功能包装", "Notion", "webpage", "competitor_analysis", "跨行业产品研究"],
  ["s4", "DJI Osmo Pocket 3：创作者设备的场景卖点", "DJI", "video", "writing_material", "跨行业产品研究"],
  ["s5", "Airbnb Rooms：信任机制与供给侧体验更新", "Airbnb", "article", "project_research", "跨行业产品研究"],
  ["s6", "Spotify Wrapped：年度回顾的社交传播机制", "Spotify", "article", "writing_material", "内容增长"],
  ["s7", "Figma Community：设计生态与模板复用", "Figma", "webpage", "inspiration", "设计生态"],
  ["s8", "Stripe Billing：开发者文档里的商业转化路径", "Stripe", "webpage", "task_reference", "开发者工具"],
  ["s9", "IKEA 样板间：零售空间动线与组合购买", "IKEA", "image", "inspiration", "零售空间"],
  ["s10", "Nike Run Club：训练计划与运动激励", "Nike", "video", "learning", "运动健康"],
  ["s11", "Headspace 睡眠旅程：课程化留存与情绪照顾", "Headspace", "audio", "learning", "心理健康"],
  ["s12", "Slack Canvas：异步协作文档如何沉淀行动", "Slack", "webpage", "project_research", "团队协作"],
  ["s13", "Shopify Checkout：电商结账信任与转化设计", "Shopify", "article", "competitor_analysis", "电商转化"],
  ["s14", "Linear Roadmap：Issue、Cycle 与发布节奏", "Linear", "webpage", "project_research", "项目管理"],
  ["s15", "Tesla Supercharger：补能网络的路线体验", "Tesla", "pdf", "project_research", "出行能源"],
  ["s16", "Patagonia Worn Wear：维修、二手与品牌信任", "Patagonia", "note", "interview_prep", "可持续品牌"],
  ["s17", "Apple Vision Pro：空间计算的新手引导", "Apple", "audio", "project_research", "空间计算"],
] as const;

const realUrls: Record<string, string> = {
  s1: "https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
  s2: "https://blog.duolingo.com/streak/",
  s3: "https://www.notion.com/product/ai",
  s4: "https://www.dji.com/osmo-pocket-3",
  s5: "https://news.airbnb.com/airbnb-rooms/",
  s6: "https://newsroom.spotify.com/wrapped/",
  s7: "https://www.figma.com/community/",
  s8: "https://docs.stripe.com/billing",
  s9: "https://www.ikea.com/us/en/rooms/",
  s10: "https://www.nike.com/nrc-app",
  s11: "https://www.headspace.com/",
  s12: "https://slack.com/features/canvas",
  s13: "https://www.shopify.com/checkout",
  s14: "https://linear.app/product",
  s15: "https://www.tesla.com/supercharger",
  s16: "https://wornwear.patagonia.com/",
  s17: "https://www.apple.com/apple-vision-pro/",
};

const demoContent: Record<string, string[]> = {
  s1: [
    "CeraVe 官方产品页适合当作美妆个护研究的一手出处。它的核心不是强清洁，而是温和清洁、洗后不紧绷和屏障友好，适合拆成详情页卖点和 FAQ。",
    "官方卖点可以拆成三层：清洁任务、肤感任务和屏障叙事。神经酰胺与透明质酸适合支撑保湿表达，但不能被写成治疗承诺。",
    "Lumo 可抽取的 Claim：保湿型洁面的主叙事应围绕使用后的舒适感，而不是泡沫多少或强去油能力。",
    "出处：CeraVe 官方产品页 https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
  ],
  s2: [
    "Duolingo 的连续学习机制适合作为增长产品案例。它把学习目标拆成每日小任务，用 streak、提醒和奖励把用户从一次性学习引导到长期习惯。",
    "值得观察的不是单个徽章，而是整套行为闭环：触发、完成、反馈、损失厌恶和社交展示。这些机制共同降低了用户第二天回来的心理成本。",
    "Lumo 可抽取的 Insight：教育产品的留存增长不只靠内容质量，也依赖把学习行为设计成低门槛、可见进度和有损失感的日常循环。",
    "出处：Duolingo Blog https://blog.duolingo.com/streak/",
  ],
  s3: [
    "Notion AI 的页面适合研究 AI 办公产品如何包装能力。它没有只强调模型参数，而是把 AI 嵌入文档、搜索、总结和写作流程里。",
    "这类产品的关键表达是减少上下文切换：用户不用离开工作台，就能把会议记录、项目资料和知识库内容转成下一步动作。",
    "Lumo 可抽取的 Claim：AI 办公产品的价值应从具体工作流解释，而不是把“AI”本身当作卖点。",
    "出处：Notion AI 产品页 https://www.notion.com/product/ai",
  ],
  s4: [
    "DJI Osmo Pocket 3 适合做创作者硬件的场景研究。它的卖点不是单纯参数，而是把便携、稳定、对焦、收音和竖屏内容生产放进 vlog 工作流。",
    "创作者设备的详情页需要回答：一个人能不能快速开拍、运动中画面是否稳定、低光下是否可用、素材能否快速进入剪辑流程。",
    "Lumo 可抽取的 Evidence：硬件卖点需要落到拍摄场景和创作链路，否则参数很难转化为购买理由。",
    "出处：DJI Osmo Pocket 3 https://www.dji.com/osmo-pocket-3",
  ],
  s5: [
    "Airbnb Rooms 适合研究平台型产品如何重建信任。它不是只增加一个房源分类，而是通过房东资料、筛选和展示方式降低住客对合住场景的不确定性。",
    "平台产品的体验更新通常同时影响供给和需求：住客需要安全感，房东需要被准确理解，平台需要把匹配效率和信任信号一起展示。",
    "Lumo 可抽取的 Insight：服务平台的核心改版往往不是界面变化，而是重新设计信任信号和交易前的信息透明度。",
    "出处：Airbnb Newsroom https://news.airbnb.com/airbnb-rooms/",
  ],
  s6: [
    "Spotify Wrapped 适合研究内容产品的年度回顾机制。它把用户行为数据转成可分享的身份表达，传播动机来自个性化、仪式感和社交货币。",
    "Lumo 可抽取的 Evidence：增长内容不一定要靠新功能，也可以把已有数据重新包装成用户愿意展示的故事。",
    "出处：Spotify Newsroom https://newsroom.spotify.com/wrapped/",
  ],
  s7: [
    "Figma Community 适合研究设计工具如何通过模板、插件和公开文件建立生态。用户不只是使用工具，也在复用他人的工作流。",
    "Lumo 可抽取的 Claim：生产力工具的护城河可以来自社区供给和可复用资产，而不只是编辑器能力。",
    "出处：Figma Community https://www.figma.com/community/",
  ],
  s8: [
    "Stripe Billing 的文档适合研究开发者工具如何把复杂商业流程拆成清晰路径：订阅、发票、试用、失败重试和报表。",
    "Lumo 可抽取的 Evidence：B2B 工具的转化往往发生在文档里，信息架构本身就是产品体验。",
    "出处：Stripe Docs https://docs.stripe.com/billing",
  ],
  s9: [
    "IKEA 样板间适合研究零售空间如何用场景启发购买。用户看到的不是单件商品，而是一套可复制的生活方案。",
    "Lumo 可抽取的 Insight：线下零售的动线、搭配和空间叙事，可以转译成线上内容和组合推荐。",
    "出处：IKEA Rooms https://www.ikea.com/us/en/rooms/",
  ],
  s10: [
    "Nike Run Club 适合研究运动健康产品如何降低开始训练的心理门槛。训练计划、教练语音、徽章和社群反馈共同支撑坚持。",
    "Lumo 可抽取的 Claim：健康产品的关键不是提醒用户自律，而是把目标拆成可完成的小阶段。",
    "出处：Nike Run Club https://www.nike.com/nrc-app",
  ],
  s11: [
    "Headspace 适合研究心理健康产品的课程化体验。睡眠、呼吸和冥想内容通过温和提醒和进度感形成低压力习惯。",
    "Lumo 可抽取的 Evidence：情绪类产品的语气、节奏和安全感，是和功能同等重要的体验证据。",
    "出处：Headspace https://www.headspace.com/",
  ],
  s12: [
    "Slack Canvas 适合研究团队协作里的异步沉淀。它把聊天中的上下文、决策和行动项整理成可持续更新的工作文档。",
    "Lumo 可抽取的 Insight：协作产品的价值不只在沟通速度，也在能否把沟通转成组织记忆。",
    "出处：Slack Canvas https://slack.com/features/canvas",
  ],
  s13: [
    "Shopify Checkout 适合研究电商转化。结账页需要同时解决速度、支付选择、信任、安全和错误恢复。",
    "Lumo 可抽取的 Evidence：高转化流程不是减少信息，而是把必要信息放在用户最需要判断的位置。",
    "出处：Shopify Checkout https://www.shopify.com/checkout",
  ],
  s14: [
    "Linear 适合研究项目管理产品如何组织节奏。Issue、Cycle、Roadmap 和发布计划把团队注意力从散乱任务拉回优先级。",
    "Lumo 可抽取的 Claim：项目管理工具的核心不是堆字段，而是让团队更容易判断下一步。",
    "出处：Linear Product https://linear.app/product",
  ],
  s15: [
    "Tesla Supercharger 适合研究出行能源网络体验。用户关心的不只是充电速度，还包括路线规划、可用性、等待时间和可靠性。",
    "Lumo 可抽取的 Insight：基础设施型产品需要把物理网络、地图信息和用户焦虑一起设计。",
    "出处：Tesla Supercharger https://www.tesla.com/supercharger",
  ],
  s16: [
    "Patagonia Worn Wear 适合研究可持续品牌如何把维修、二手和故事变成信任机制。它让产品生命周期成为品牌表达的一部分。",
    "Lumo 可抽取的 Evidence：可持续不是单句口号，需要可执行的维修、回收、二手交易和社区故事支撑。",
    "出处：Patagonia Worn Wear https://wornwear.patagonia.com/",
  ],
  s17: [
    "Apple Vision Pro 适合研究新交互范式的新手引导。空间窗口、眼动、手势和沉浸场景需要被解释成普通用户能理解的任务。",
    "Lumo 可抽取的 Claim：新硬件的教育成本很高，首屏体验必须先回答它能替用户完成什么。",
    "出处：Apple Vision Pro https://www.apple.com/apple-vision-pro/",
  ],
};

const demoReferences: Record<string, Source["sourceReferences"]> = {
  s1: [{ label: "CeraVe 官方产品页", url: realUrls.s1, note: "用于确认美妆产品定位、适用肤质、核心成分和官方卖点。" }],
  s2: [{ label: "Duolingo Streak 机制", url: realUrls.s2, note: "用于研究教育产品的习惯养成、提醒和留存机制。" }],
  s3: [{ label: "Notion AI 产品页", url: realUrls.s3, note: "用于研究 AI 办公产品如何把能力嵌入知识工作流。" }],
  s4: [{ label: "DJI Osmo Pocket 3", url: realUrls.s4, note: "用于研究创作者硬件的场景卖点和内容生产流程。" }],
  s5: [{ label: "Airbnb Rooms 发布资料", url: realUrls.s5, note: "用于研究平台产品的信任信号、供需匹配和体验改版。" }],
  s6: [{ label: "Spotify Wrapped", url: realUrls.s6, note: "用于研究内容产品如何把用户数据包装成可分享故事。" }],
  s7: [{ label: "Figma Community", url: realUrls.s7, note: "用于研究设计工具的社区供给、模板复用和插件生态。" }],
  s8: [{ label: "Stripe Billing Docs", url: realUrls.s8, note: "用于研究开发者文档、计费流程和 B2B 转化路径。" }],
  s9: [{ label: "IKEA Rooms", url: realUrls.s9, note: "用于研究零售空间、样板间动线和组合购买场景。" }],
  s10: [{ label: "Nike Run Club", url: realUrls.s10, note: "用于研究运动健康产品的训练计划、激励和社群反馈。" }],
  s11: [{ label: "Headspace", url: realUrls.s11, note: "用于研究心理健康产品的课程化体验和温和留存。" }],
  s12: [{ label: "Slack Canvas", url: realUrls.s12, note: "用于研究异步协作、组织记忆和行动项沉淀。" }],
  s13: [{ label: "Shopify Checkout", url: realUrls.s13, note: "用于研究电商结账页的信任、支付和转化设计。" }],
  s14: [{ label: "Linear Product", url: realUrls.s14, note: "用于研究项目管理工具的 issue、cycle 和路线图节奏。" }],
  s15: [{ label: "Tesla Supercharger", url: realUrls.s15, note: "用于研究出行能源网络、路线规划和可用性体验。" }],
  s16: [{ label: "Patagonia Worn Wear", url: realUrls.s16, note: "用于研究可持续品牌的维修、二手和信任机制。" }],
  s17: [{ label: "Apple Vision Pro", url: realUrls.s17, note: "用于研究新硬件和空间交互的新手引导。" }],
};

const localDemoSource = "/media/lumo-research-note.txt";

export const collections: Collection[] = [
  { id: "c1", name: "跨行业产品研究样例", description: "美妆、教育增长、AI 办公、创作者硬件和平台服务的多元样例。", sourceIds: ["s1", "s2", "s3", "s4", "s5"], tags: ["product", "growth", "ai", "platform"], createdAt: daysAgo(35), updatedAt: daysAgo(1) },
  { id: "c2", name: "AI 与协作工具", description: "Notion、Figma、Stripe、Slack、Linear 等工具型产品样例。", sourceIds: ["s3", "s7", "s8", "s12", "s14"], tags: ["ai", "tools", "workflow"], createdAt: daysAgo(28), updatedAt: daysAgo(2) },
  { id: "c3", name: "增长与消费产品", description: "Duolingo、Spotify、IKEA、Nike、Headspace 的增长和体验样例。", sourceIds: ["s2", "s6", "s9", "s10", "s11"], tags: ["growth", "consumer"], createdAt: daysAgo(25), updatedAt: daysAgo(3) },
  { id: "c4", name: "商业模式与品牌", description: "Shopify、Tesla、Patagonia 等商业机制和品牌信任案例。", sourceIds: ["s13", "s15", "s16"], tags: ["commerce", "brand"], createdAt: daysAgo(12), updatedAt: daysAgo(1) },
  { id: "c5", name: "新硬件与平台体验", description: "DJI、Airbnb、Apple Vision Pro 等硬件和平台服务案例。", sourceIds: ["s4", "s5", "s17"], tags: ["hardware", "platform"], createdAt: daysAgo(14), updatedAt: daysAgo(4) },
];

export const sources: Source[] = sourceSeed.map(([id, title, sourceName, type, purpose], index) => {
  const collection = collections.find((item) => item.sourceIds.includes(id));
  const tags = [purpose.replace("_", "-"), sourceName.toLowerCase().split(" ")[0], index % 2 ? "workflow" : "insight"];
  return {
    id,
    title,
    url: realUrls[id] ?? localDemoSource,
    sourceName,
    sourceReferences: demoReferences[id] ?? [{ label: "Lumo 本地样例文本", url: localDemoSource, note: "本地演示资料，不伪装成外部文章；真实项目可替换为导入文章的原始链接。" }],
    type,
    status: index < 5 ? "inbox" : index < 11 ? "unread" : index < 14 ? "read" : "archived",
    triageStatus: index % 4 === 0 ? "must_read" : index % 4 === 1 ? "project_material" : index % 4 === 2 ? "skim" : "archive_suggested",
    purpose,
    collectionIds: collection ? [collection.id] : [],
    projectIds: index < 6 ? ["p1"] : index > 12 ? ["p2"] : index === 14 ? ["p3"] : [],
    tags,
    isFavorite: index === 0 || index === 3,
    savedAt: daysAgo(index + 2),
    updatedAt: daysAgo(index % 6),
    readingTime: 5 + (index % 8) * 2,
    readingProgress: index % 3 === 0 ? 100 : index % 3 === 1 ? 42 : 0,
    hasSnapshot: index % 5 !== 0,
    snapshotStatus: index % 5 === 0 ? "pending" : "saved",
    summary: demoContent[id]
      ? `${title} 可用于跨行业产品研究，帮助拆解定位、增长机制、场景卖点、信任信号和证据链。`
      : `${title} explains how capture, reading, annotation, and later retrieval shape the user's ability to turn saved material into decisions.`,
    aiReason: demoContent[id]
      ? "这条资料代表一个不同类型的产品问题，建议先阅读并抽取 Claim / Evidence，避免示例集中在单一行业。"
      : index % 4 === 3 ? "This source overlaps with older notes, so Lumo suggests archiving unless it supports an active project." : "This source contains reusable product evidence and should be reviewed before the next research synthesis.",
    readingRecommendation: demoContent[id]
      ? "先高亮产品机制、用户疑虑或场景证据，再转成观点并加入跨行业研究项目。"
      : index % 2 ? "Skim for positioning language, then extract the strongest claim." : "Read fully and convert the most specific paragraph into evidence.",
    keyPoints: demoContent[id]
      ? [
          "识别产品定位、目标用户和关键使用场景。",
          "把公开资料转成可复用的 Claim / Evidence。",
          "比较不同行业里的增长、信任、AI 和硬件卖点。",
        ]
      : [
          "Capture must be nearly frictionless or users postpone saving.",
          "Readers need structured outputs, not only pleasant storage.",
          "Evidence should stay connected to the original source and context.",
        ],
    relatedTopics: demoContent[id] ? ["产品研究", "增长机制", "AI 办公", "平台信任", "创作者工具"] : ["AI summary", "highlight workflow", "project research", "knowledge review"],
    content: demoContent[id] ?? [
      "Most knowledge tools solve capture better than synthesis. The result is a growing library that feels useful at the moment of saving but becomes expensive to revisit later.",
      "A strong reader experience starts with clean typography, fast context, visible progress, and low-friction actions for highlighting, note taking, archiving, and search.",
      "The real product opportunity appears after reading. Teams need to turn highlights into claims, claims into evidence chains, and evidence into deliverables that can be shared.",
      "AI should triage attention before asking the user to read everything. Must-read, skim, project material, and archive suggestions create a lighter inbox routine.",
      "The winning system preserves provenance. Every generated insight should point back to source paragraphs, evidence type, confidence, and the project goal it serves.",
    ],
    claimIds: [`cl${(index % 18) + 1}`],
    evidenceIds: [`ev${(index % 24) + 1}`],
    highlightIds: index < 12 ? [`h${index + 1}`] : [],
    noteIds: index < 8 ? [`n${index + 1}`] : [],
    entityIds: [`en${(index % 20) + 1}`],
  } as Source;
});

export const entities: Entity[] = [
  "Cubox", "Readwise Reader", "Perplexity", "Notion", "Raindrop", "AI Summary", "Web Snapshot", "Highlight", "RAG", "Knowledge Graph",
  "Project Workspace", "Evidence Chain", "Smart Review", "Import Export", "Product Manager", "Industrial AI", "PRD", "Reader", "Entity Recognition", "Deliverable",
].map((name, index) => ({
  id: `en${index + 1}`,
  name,
  type: index < 5 ? "product" : index < 10 ? "technology" : index < 14 ? "concept" : "method",
  sourceIds: [`s${(index % 16) + 1}`],
}));

export const highlights: Highlight[] = Array.from({ length: 12 }, (_, index) => ({
  id: `h${index + 1}`,
  sourceId: `s${(index % 12) + 1}`,
  text: sources[index].content[index % sources[index].content.length],
  paragraphIndex: index % 5,
  color: (["yellow", "green", "blue", "purple", "red"] as const)[index % 5],
  noteIds: index < 8 ? [`n${index + 1}`] : [],
  tagIds: ["insight", "evidence"],
  createdAt: daysAgo(index + 1),
}));

export const notes: Note[] = Array.from({ length: 8 }, (_, index) => ({
  id: `n${index + 1}`,
  sourceId: `s${index + 1}`,
  highlightId: `h${index + 1}`,
  paragraphIndex: index % 5,
  content: `Useful for Lumo because it shows where saved material becomes actionable after reading. Note ${index + 1} should be reused in review.`,
  tagIds: ["reader", "lumo"],
  createdAt: daysAgo(index + 2),
}));

export const claims: Claim[] = Array.from({ length: 18 }, (_, index) => ({
  id: `cl${index + 1}`,
  text: `Saved sources become more valuable when Lumo converts reading activity into structured project evidence ${index + 1}.`,
  sourceId: `s${(index % 16) + 1}`,
  projectId: index < 8 ? "p1" : index < 13 ? "p2" : "p3",
  evidenceIds: [`ev${(index % 24) + 1}`, `ev${((index + 5) % 24) + 1}`],
  entityIds: [`en${(index % 20) + 1}`],
  tags: ["claim", index % 2 ? "workflow" : "strategy"],
  confidence: index % 3 === 0 ? "high" : index % 3 === 1 ? "medium" : "low",
  createdAt: daysAgo(index + 1),
}));

export const evidence: Evidence[] = Array.from({ length: 24 }, (_, index) => {
  const source = sources[index % sources.length];
  return {
    id: `ev${index + 1}`,
    sourceId: source.id,
    claimId: `cl${(index % 18) + 1}`,
    projectId: index < 10 ? "p1" : index < 18 ? "p2" : "p3",
    text: source.content[index % source.content.length],
    originalUrl: source.url,
    sourceTitle: source.title,
    type: (["quote", "feature", "market_signal", "example", "method", "definition"] as const)[index % 6],
    confidence: index % 4 === 0 ? "high" : "medium",
    createdAt: daysAgo(index + 1),
  };
});

export const insights: Insight[] = [
  {
    id: "in1",
    title: "多元样例能证明 Lumo 的通用研究能力",
    content: "首屏不应该连续展示同一品类。把美妆、教育增长、AI 办公、创作者硬件和平台服务放在一起，能更快说明 Lumo 处理的是资料到成果的通用工作流。",
    type: "product_opportunity",
    priority: "high",
    projectId: "p1",
    claimIds: ["cl1", "cl2"],
    evidenceIds: ["ev1", "ev2"],
    suggestedDeliverables: ["competitive_analysis", "research_brief", "content_script"],
    createdAt: daysAgo(1),
  },
  {
    id: "in2",
    title: "增长案例和商品案例需要不同证据结构",
    content: "CeraVe 更适合抽取定位、成分和使用边界；Duolingo 更适合抽取行为闭环、提醒和留存机制。两者并列能展示 Lumo 对不同证据类型的适配能力。",
    type: "learning_summary",
    priority: "high",
    projectId: "p1",
    claimIds: ["cl3", "cl4"],
    evidenceIds: ["ev3", "ev4"],
    suggestedDeliverables: ["research_brief", "content_script"],
    createdAt: daysAgo(2),
  },
  {
    id: "in3",
    title: "AI 产品应按工作流表达，而不是只强调 AI",
    content: "Notion AI 这类样例能补足洗面奶案例没有的产品逻辑：AI 能力必须嵌入搜索、写作、总结和项目协作，才会变成可理解的用户价值。",
    type: "requirement_hypothesis",
    priority: "medium",
    projectId: "p1",
    claimIds: ["cl5"],
    evidenceIds: ["ev5", "ev6"],
    suggestedDeliverables: ["prd", "research_brief"],
    createdAt: daysAgo(3),
  },
  {
    id: "in4",
    title: "硬件卖点要落到创作场景",
    content: "DJI 样例能展示 Lumo 对视频、硬件和创作者场景的支持。稳定、防抖、收音和竖屏不是孤立参数，而是短视频生产流程里的证据。",
    type: "content_angle",
    priority: "high",
    projectId: "p1",
    claimIds: ["cl6"],
    evidenceIds: ["ev7", "ev8"],
    suggestedDeliverables: ["content_script", "competitive_analysis"],
    createdAt: daysAgo(4),
  },
  {
    id: "in5",
    title: "平台服务案例能补上信任机制维度",
    content: "Airbnb Rooms 样例让 Demo 不再只围绕实体商品。平台型产品的证据更多来自信任信号、筛选条件、供需匹配和交易前透明度。",
    type: "market_trend",
    priority: "medium",
    projectId: "p1",
    claimIds: ["cl7", "cl8"],
    evidenceIds: ["ev9", "ev10"],
    suggestedDeliverables: ["research_brief", "weekly_report"],
    createdAt: daysAgo(5),
  },
  {
    id: "in6",
    title: "AI 阅读器的差异化在证据复用",
    content: "普通收藏工具解决“存下来”，但 Lumo 的核心机会是把段落、高亮、笔记转成可追溯的观点和证据，并进入项目成果，而不是停在阅读器里。",
    type: "product_opportunity",
    priority: "high",
    projectId: "p2",
    claimIds: ["cl9", "cl10"],
    evidenceIds: ["ev11", "ev12"],
    suggestedDeliverables: ["prd", "interview_material"],
    createdAt: daysAgo(6),
  },
  {
    id: "in7",
    title: "收件箱需要先帮用户判断优先级",
    content: "如果所有收藏都进入同一列表，用户还是会堆积。必须阅读、略读、项目素材、建议归档这类分流可以降低回访成本，让用户更快进入处理动作。",
    type: "feature_idea",
    priority: "medium",
    projectId: "p2",
    claimIds: ["cl11"],
    evidenceIds: ["ev13", "ev14"],
    suggestedDeliverables: ["prd"],
    createdAt: daysAgo(7),
  },
  {
    id: "in8",
    title: "生成成果必须显示出处链路",
    content: "用户不信任只给结论的 AI 摘要。每条观点、证据和洞察都应该保留原始链接、段落和置信度，方便在 PRD、竞品分析或面试材料里回溯。",
    type: "requirement_hypothesis",
    priority: "high",
    projectId: "p2",
    claimIds: ["cl12", "cl13"],
    evidenceIds: ["ev15", "ev16"],
    suggestedDeliverables: ["prd", "weekly_report"],
    createdAt: daysAgo(8),
  },
  {
    id: "in9",
    title: "工业 AI 买家更关心可验证指标",
    content: "工业场景的价值主张不能只写自动化和智能化，必须落到停机时间、良率、质检效率、部署周期等可验证指标，否则很难让采购和业务负责人相信。",
    type: "market_trend",
    priority: "medium",
    projectId: "p3",
    claimIds: ["cl14", "cl15"],
    evidenceIds: ["ev19", "ev20"],
    suggestedDeliverables: ["weekly_report"],
    createdAt: daysAgo(9),
  },
  {
    id: "in10",
    title: "面试材料需要从资料直接沉淀 STAR 证据",
    content: "AI PM 面试不是背产品概念，而是能讲清楚场景、任务、行动和结果。Lumo 可以把研究过程中的证据链转成 STAR 片段，减少临时整理成本。",
    type: "learning_summary",
    priority: "low",
    projectId: "p2",
    claimIds: ["cl16", "cl17"],
    evidenceIds: ["ev17", "ev18"],
    suggestedDeliverables: ["interview_material"],
    createdAt: daysAgo(10),
  },
];

export const projects: Project[] = [
  { id: "p1", name: "跨行业产品研究工作台", description: "围绕美妆、教育增长、AI 办公、创作者硬件和平台服务建立多元研究样例。", goal: "比较不同行业里的产品定位、增长机制、场景卖点、信任信号和内容转化方向。", keyQuestions: ["每类产品的核心用户任务是什么？", "哪些信息可以转成证据？", "增长、信任和 AI 卖点有什么共同结构？", "如何避免 Demo 示例行业过窄？"], status: "active", sourceIds: ["s1", "s2", "s3", "s4", "s5"], claimIds: claims.slice(0, 8).map((i) => i.id), evidenceIds: evidence.slice(0, 10).map((i) => i.id), insightIds: insights.slice(0, 5).map((i) => i.id), deliverableIds: ["d1", "d2"], tags: ["product-research", "multi-domain"], createdAt: daysAgo(22), updatedAt: daysAgo(1) },
  { id: "p2", name: "AI Product Manager Interview Kit", description: "Reusable interview stories from Lumo research.", goal: "Turn product research into concise PM interview material.", keyQuestions: ["Which product decisions show depth?", "What evidence supports the story?"], status: "active", sourceIds: ["s13", "s14", "s16"], claimIds: claims.slice(8, 13).map((i) => i.id), evidenceIds: evidence.slice(10, 18).map((i) => i.id), insightIds: insights.slice(5, 8).map((i) => i.id), deliverableIds: ["d3"], tags: ["interview", "pm"], createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  { id: "p3", name: "Industrial AI Platform Messaging", description: "Messaging research for industrial AI platform landing pages.", goal: "Clarify the value proposition and evidence for industrial AI buyers.", keyQuestions: ["Which metrics matter?", "What buyer pain is most credible?"], status: "paused", sourceIds: ["s15"], claimIds: claims.slice(13).map((i) => i.id), evidenceIds: evidence.slice(18).map((i) => i.id), insightIds: insights.slice(8).map((i) => i.id), deliverableIds: ["d4"], tags: ["industrial", "messaging"], createdAt: daysAgo(16), updatedAt: daysAgo(4) },
];

export const deliverables: Deliverable[] = [
  {
    id: "d1",
    title: "跨行业产品研究 · 竞品分析报告",
    type: "competitive_analysis",
    projectId: "p1",
    sourceIds: ["s1", "s2", "s3", "s4", "s5"],
    claimIds: ["cl1", "cl2"],
    evidenceIds: ["ev1", "ev2"],
    insightIds: ["in1"],
    createdAt: daysAgo(2),
    content: `# 跨行业产品研究 · 竞品分析报告

**分析日期**：${now.slice(0, 10)} · **覆盖竞品**：5 个 · **维度**：定位 / 用户任务 / 增长机制 / 证据类型

---

## 分析目标

比较不同行业里定位清晰的产品，识别其共性用户任务和可复用的产品设计策略。

---

## 竞品对比矩阵

| 产品 | 行业 | 核心用户任务 | 关键增长机制 | 证据强度 |
| --- | --- | --- | --- | --- |
| CeraVe 保湿洁面 | 美妆个护 | 判断成分安全性 | 皮肤科医生背书 | 高 |
| Duolingo Streak | 教育增长 | 维持学习习惯 | 连续天数 + 社交压力 | 高 |
| Notion AI | AI 办公 | 降低知识整理摩擦 | 工作流内嵌 AI | 中 |
| DJI Osmo Pocket 3 | 创作者硬件 | 快速完成拍摄 | 场景化卖点 | 高 |
| Airbnb Rooms | 平台服务 | 建立陌生人信任 | 房东资料透明化 | 高 |

---

## 1. CeraVe 保湿洁面

![CeraVe 产品实拍](/media/cerave-hydrating-cleanser-real.png)

**定位**：皮肤科医生认可的平价护肤品，主打神经酰胺和透明质酸成分背书。

> "CeraVe 官方产品页把清洁定位为 '温和清洁 + 修护屏障'，而非单纯 '洗净污垢'。"
> — CeraVe 官方产品页

**Lumo 分析**：成分证据链完整，适合抽取「官方定位 vs 用户认知差距」这条核心观点。

---

## 2. Duolingo 学习留存机制

![Duolingo 学习界面](/media/lumo-case-duolingo.svg)

**定位**：全球最大语言学习 App，连续天数设计是留存核心。

> "Streak 功能让用户每天回来不是为了学习，而是为了不断连续记录。"
> — Duolingo Blog

**Lumo 分析**：行为习惯设计可直接复用到 Lumo 的复习提醒逻辑。

---

## 差异化机会

- **跟进**：CeraVe 的成分证据链模式 → Lumo 的观点-证据链模式高度相似，可作为用户教育素材
- **差异化**：现有产品均无法把「跨行业资料」整合成单一研究成果，这是 Lumo 独特的切入点
- **补充资料**：建议补充用户评价截图和定价页对比截图

---

## 参考来源

- [CeraVe 官方产品页](https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser)
- [Duolingo Blog - Streak](https://blog.duolingo.com/streak/)
- [Notion AI 产品页](https://www.notion.com/product/ai)
`,
  },
  {
    id: "d2",
    title: "跨行业产品研究 · 内容脚本",
    type: "content_script",
    projectId: "p1",
    sourceIds: ["s1", "s2", "s3", "s4", "s5"],
    claimIds: ["cl3", "cl4"],
    evidenceIds: ["ev3", "ev4"],
    insightIds: ["in2"],
    createdAt: daysAgo(1),
    content: `# 跨行业产品研究 · 内容脚本

**平台**：公众号长文 / B站视频脚本 · **预估时长**：8–12 分钟 · **风格**：观点驱动 + 实例支撑

---

## 脚本摘要

用 5 个不同行业的真实产品案例，说明「用户任务」比「行业类别」更能预测产品成功的核心规律。

---

## 开场钩子（0:00–0:50）

> **口播**："你有没有发现，一个卖洗面奶的品牌，和一个教英语的 App，底层逻辑其实是一样的？"

*[镜头建议：交替出现 CeraVe 产品图和 Duolingo 截图，字幕强调「用户任务」]*

---

## 第一段：问题设置（0:50–2:30）

**口播稿**：

大多数产品分析都在比「这个行业怎么怎么样」，但真正影响用户是否留下来的，是他们来这里要完成的那一件事。

我研究了 5 个看起来完全不同行业的产品，发现了一个反直觉的规律——

---

## 第二段：案例一 CeraVe（2:30–4:30）

![CeraVe 成分分析](/media/cerave-cleanser-texture-real.jpg)

**口播稿**：

先说 CeraVe。很多人以为它卖的是「洗脸功效」，但实际上它卖的是「我不会伤害你的皮肤屏障」。

> "神经酰胺和透明质酸不是噱头，它们支撑的是一个核心叙事：这款产品修护而不破坏。"
> — CeraVe 官方产品页

*[B-roll：成分表特写，皮肤科医生推荐截图]*

用户任务 = **判断这个产品不会让皮肤变差**，不是「洗干净」。

---

## 第三段：案例二 Duolingo（4:30–6:30）

**口播稿**：

再看 Duolingo。它的核心不是教你学语言，而是让你每天回来。

Streak 设计的本质是：**用连续记录制造损失厌恶**。

> "用户每天回来不是因为想学习，而是因为不想打断连续天数。"

*[字幕：「损失厌恶 > 学习动机」]*

用户任务 = **维持我是「学习者」这个身份认知**，不是「学会西班牙语」。

---

## 第四段：跨行业规律（6:30–9:00）

![研究桌面参考](/media/lumo-real-laptop-research.jpg)

**口播稿**：

把这 5 个产品放在一起看，会发现：

1. 最成功的产品都在服务一个「焦虑点」，不只是一个「功能点」
2. 最强的证据不是功能说明，而是「用户已经在用这个产品解决这个焦虑」的证明
3. 跨行业研究的价值，在于找到那些被行业偏见遮住的共性洞察

---

## 结尾行动号召（9:00–结束）

**口播稿**：

如果你也在做产品研究，我把所有参考资料整理好了。评论区告诉我，你想看哪个行业的深度拆解。

*[字幕：关注 + 点赞 + 完整资料链接]*

---

## 参考来源

- [CeraVe 官方产品页](https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser)
- [Duolingo Blog](https://blog.duolingo.com/streak/)
- [Notion AI](https://www.notion.com/product/ai)
`,
  },
];
