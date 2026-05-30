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
  ["s1", "CeraVe Hydrating Facial Cleanser 官方产品页", "CeraVe", "article", "competitor_analysis", "CeraVe 洗面奶调研"],
  ["s2", "CeraVe 洁面核心卖点与适用肤质拆解", "CeraVe", "webpage", "project_research", "CeraVe 洗面奶调研"],
  ["s3", "Ulta 用户问答：敏感肌、卸妆与适用边界", "Ulta", "webpage", "project_research", "CeraVe 洗面奶调研"],
  ["s4", "Target 货架：保湿洁面价格与相邻竞品", "Target", "webpage", "competitor_analysis", "CeraVe 洗面奶调研"],
  ["s5", "INCI Decoder 成分证据：神经酰胺与透明质酸", "INCI Decoder", "article", "competitor_analysis", "CeraVe 洗面奶调研"],
  ["s6", "The next wave of AI read-it-later tools", "Lumo Research", "article", "project_research", "AI Reading Tools"],
  ["s7", "Personal knowledge management fails after collection", "PKM Weekly", "newsletter", "learning", "Knowledge Management"],
  ["s8", "Information overload and attention triage", "Research Notes", "pdf", "learning", "Knowledge Management"],
  ["s9", "Highlight and note patterns for serious readers", "Reader Lab", "article", "writing_material", "Knowledge Management"],
  ["s10", "Web snapshot reliability for research archives", "Archive Lab", "article", "task_reference", "Knowledge Management"],
  ["s11", "Import and export expectations across knowledge tools", "Ops Notes", "note", "task_reference", "Product Management"],
  ["s12", "RAG Q&A from saved sources: product constraints", "AI Systems", "article", "project_research", "Product Management"],
  ["s13", "Product manager competitive analysis workflow", "PM Library", "article", "interview_prep", "Product Management"],
  ["s14", "Writing AI product PRDs with evidence", "PM School", "article", "interview_prep", "Product Management"],
  ["s15", "Industrial AI platform messaging analysis", "Industrial AI Review", "pdf", "project_research", "Industrial AI"],
  ["s16", "Interview material organization for AI PM roles", "Career Desk", "note", "interview_prep", "Interview Prep"],
  ["s17", "Lumo audio briefing: from saved sources to deliverables", "Lumo Studio", "audio", "project_research", "AI Reading Tools"],
] as const;

const realUrls: Record<string, string> = {
  s1: "https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
  s2: "https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
  s3: "https://www.ulta.com/p/hydrating-facial-cleanser-xlsImpprod4190255",
  s4: "https://www.target.com/p/-/A-13977968",
  s5: "https://incidecoder.com/products/cerave-hydrating-cleanser-2",
};

const cleanserContent: Record<string, string[]> = {
  s1: [
    "这篇资料来自 CeraVe 官方产品页，适合当作产品定位的一手出处。页面把 Hydrating Facial Cleanser 放在温和保湿洁面的语境里，面向偏干或普通肤质，重点不是强去油，而是日常清洁后的舒适肤感。",
    "官方卖点可以拆成三层：第一层是清洁任务，即去除日常污垢和油脂；第二层是肤感任务，即清洁后降低干燥和紧绷；第三层是屏障叙事，即用神经酰胺和透明质酸连接到保湿与屏障维护。",
    "如果把它写成详情页文案，主标题不应该只说“洗得干净”，而应强调“温和清洁、不拔干、保湿型洁面”。这能直接回应干皮用户对洗后紧绷的担忧。",
    "Lumo 可抽取的 Claim：CeraVe Hydrating Facial Cleanser 的核心差异不是泡沫感或强清洁，而是把温和清洁、保湿肤感和屏障友好放在同一个购买理由里。",
    "出处：CeraVe 官方产品页 https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
  ],
  s2: [
    "这篇资料继续使用 CeraVe 官方产品页，但阅读目标换成“卖点拆解”。适合把页面中的功能性表述整理成详情页标签、FAQ 和短视频脚本。",
    "可提取的卖点包括无添加香精、非致痘、MVE 相关保湿释放叙事，以及和皮肤屏障有关的成分逻辑。这些内容适合放在页面第一屏下方的卖点条或成分解释模块里。",
    "表达边界同样重要。无香精、非致痘、温和等信息可以支撑低刺激和日常使用，但不能被写成治疗皮肤问题的医疗承诺。",
    "Lumo 可抽取的 Evidence：官方页面提供了详情页可复用的卖点词库，但每个词都需要在文案中保留适用边界，避免从护肤品表达滑向药品表达。",
    "出处：CeraVe 官方产品页 https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
  ],
  s3: [
    "Ulta 零售页适合用来观察购买前问题。和官方页相比，零售渠道更接近真实用户的决策现场：用户会问适用肤质、是否适合敏感肌、能不能卸妆、组合肌能不能用，以及和其他洁面的区别。",
    "这些问题说明消费者并不只看成分表。对于一款温和保湿洁面，用户真正需要的是使用边界：它适合谁、解决什么、不解决什么、什么时候需要搭配卸妆产品。",
    "详情页 FAQ 可以围绕三个问题写：干皮/普通肤质为什么适合；它是否等于卸妆；如果用户想要泡沫感或控油，是否应该选择其他线。",
    "Lumo 可抽取的 Insight：用户疑虑集中在“温和是否等于洗不干净”和“保湿洁面是否能覆盖卸妆/控油场景”，内容策略应主动解释边界。",
    "出处：Ulta 产品页 https://www.ulta.com/p/hydrating-facial-cleanser-xlsImpprod4190255",
  ],
  s4: [
    "Target 货架页适合做竞品场景分析。用户并不是单独看到 CeraVe Hydrating Facial Cleanser，而是在同一页面或同一货架上与泡沫洁面、敏感肌洁面、酸类洁面以及其他品牌温和洁面对比。",
    "这会形成几个真实取舍：想要保湿的人可能选 Hydrating；想要更清爽泡沫感的人可能转向 Foaming；有痘痘或角质诉求的人会看 SA 类；敏感肌用户可能会比较 Vanicream 或 La Roche-Posay。",
    "竞品矩阵应记录产品、品牌、适用肤质、主成分、价格带、清洁感、潜在风险和详情页主叙事，而不是只记录价格。",
    "Lumo 可抽取的 Evidence：Target 货架能证明用户会在同价位相邻产品中做选择，因此产品文案必须清楚解释“保湿型洁面”和“泡沫/控油型洁面”的差别。",
    "出处：Target 产品页 https://www.target.com/p/-/A-13977968",
  ],
  s5: [
    "INCI Decoder 成分页适合作为第三方成分解释来源。它不能替代官方资料，但能帮助把成分表转成更易读的证据语言，适合支持成分教育模块。",
    "在这条资料里，神经酰胺和透明质酸可以用来支撑“保湿”和“屏障友好”的叙事，但应避免把成分存在直接写成确定性功效。",
    "最稳妥的写法是：官方页负责产品定位和品牌承诺，第三方成分页负责解释成分为什么与保湿、屏障叙事相关，两者交叉后再进入简报。",
    "Lumo 可抽取的 Evidence：成分解释能补强官方卖点，但生成内容时必须保留“护肤品表达”的边界，避免夸大为治疗效果。",
    "出处：INCI Decoder 成分页 https://incidecoder.com/products/cerave-hydrating-cleanser-2",
  ],
};

const cleanserReferences: Record<string, Source["sourceReferences"]> = {
  s1: [{ label: "CeraVe 官方产品页", url: realUrls.s1, note: "用于确认产品定位、适用肤质、核心成分和官方卖点。" }],
  s2: [{ label: "CeraVe 官方产品页", url: realUrls.s2, note: "用于拆解无香精、非致痘、MVE 技术等详情页卖点。" }],
  s3: [{ label: "Ulta 产品页", url: realUrls.s3, note: "用于观察零售渠道用户问答、购买前疑虑和使用边界。" }],
  s4: [{ label: "Target 产品页", url: realUrls.s4, note: "用于观察价格、货架相邻产品和竞品选择场景。" }],
  s5: [{ label: "INCI Decoder 成分页", url: realUrls.s5, note: "用于解释成分表，并和官方卖点交叉验证。" }],
};

const localDemoSource = "/media/lumo-research-note.txt";

export const collections: Collection[] = [
  { id: "c1", name: "CeraVe 洗面奶调研", description: "官方卖点、成分证据、零售货架和用户疑问。", sourceIds: ["s1", "s2", "s3", "s4", "s5"], tags: ["cleanser", "skincare", "competitive"], createdAt: daysAgo(35), updatedAt: daysAgo(1) },
  { id: "c2", name: "Product Management", description: "PRD, research, evidence, and PM workflow material.", sourceIds: ["s11", "s12", "s13", "s14"], tags: ["pm", "prd"], createdAt: daysAgo(28), updatedAt: daysAgo(2) },
  { id: "c3", name: "Knowledge Management", description: "PKM, highlights, notes, retrieval, and review loops.", sourceIds: ["s7", "s8", "s9", "s10"], tags: ["pkm", "notes"], createdAt: daysAgo(25), updatedAt: daysAgo(3) },
  { id: "c4", name: "Interview Prep", description: "Stories and structured material for AI PM interviews.", sourceIds: ["s13", "s14", "s16"], tags: ["career", "interview"], createdAt: daysAgo(12), updatedAt: daysAgo(1) },
  { id: "c5", name: "Industrial AI", description: "Positioning and messaging for industrial AI products.", sourceIds: ["s15"], tags: ["industrial", "messaging"], createdAt: daysAgo(14), updatedAt: daysAgo(4) },
];

export const sources: Source[] = sourceSeed.map(([id, title, sourceName, type, purpose], index) => {
  const collection = collections.find((item) => item.sourceIds.includes(id));
  const tags = [purpose.replace("_", "-"), sourceName.toLowerCase().split(" ")[0], index % 2 ? "workflow" : "insight"];
  return {
    id,
    title,
    url: realUrls[id] ?? localDemoSource,
    sourceName,
    sourceReferences: cleanserReferences[id] ?? [{ label: "Lumo 本地样例文本", url: localDemoSource, note: "本地演示资料，不伪装成外部文章；真实项目可替换为导入文章的原始链接。" }],
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
    summary: cleanserContent[id]
      ? `${title} 可用于 CeraVe Hydrating Facial Cleanser 的产品调研，帮助拆解卖点、用户疑虑、竞品位置和证据链。`
      : `${title} explains how capture, reading, annotation, and later retrieval shape the user's ability to turn saved material into decisions.`,
    aiReason: cleanserContent[id]
      ? "这条资料包含可复用的产品研究证据，建议先阅读并抽取 Claim / Evidence。"
      : index % 4 === 3 ? "This source overlaps with older notes, so Lumo suggests archiving unless it supports an active project." : "This source contains reusable product evidence and should be reviewed before the next research synthesis.",
    readingRecommendation: cleanserContent[id]
      ? "先高亮核心卖点或用户疑问，再转成证据并加入 CeraVe 洗面奶调研项目。"
      : index % 2 ? "Skim for positioning language, then extract the strongest claim." : "Read fully and convert the most specific paragraph into evidence.",
    keyPoints: cleanserContent[id]
      ? [
          "识别核心卖点、适用人群和使用边界。",
          "把官方资料与第三方资料交叉验证。",
          "沉淀成产品定位、FAQ、竞品矩阵和内容脚本。",
        ]
      : [
          "Capture must be nearly frictionless or users postpone saving.",
          "Readers need structured outputs, not only pleasant storage.",
          "Evidence should stay connected to the original source and context.",
        ],
    relatedTopics: cleanserContent[id] ? ["洗面奶", "护肤成分", "竞品分析", "详情页文案"] : ["AI summary", "highlight workflow", "project research", "knowledge review"],
    content: cleanserContent[id] ?? [
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
    title: "温和保湿是主定位，不是附属卖点",
    content: "官方页和成分页共同说明，这款洁面的主叙事应围绕“清洁后不拔干、保湿、屏障友好”展开。它不适合用强清洁或泡沫感做第一卖点，否则会偏离干皮和屏障护理人群的购买动机。",
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
    title: "购买疑虑集中在使用边界",
    content: "Ulta 问答暴露的不是单一成分问题，而是场景边界：能不能卸妆、敏感肌能否用、组合肌会不会闷、泡沫少是否洗得干净。详情页 FAQ 应先回答这些问题，再讲成分。",
    type: "user_pain",
    priority: "high",
    projectId: "p1",
    claimIds: ["cl3", "cl4"],
    evidenceIds: ["ev3", "ev4"],
    suggestedDeliverables: ["research_brief", "content_script"],
    createdAt: daysAgo(2),
  },
  {
    id: "in3",
    title: "竞品比较应按肤感和任务分层",
    content: "Target 货架里的真实选择并不是“哪支洗面奶更好”，而是保湿型、泡沫型、酸类清洁、敏感肌温和清洁各自解决不同任务。竞品矩阵需要把适用肤质、清洁感、价格带和风险分开比较。",
    type: "competitor_gap",
    priority: "medium",
    projectId: "p1",
    claimIds: ["cl5"],
    evidenceIds: ["ev5", "ev6"],
    suggestedDeliverables: ["competitive_analysis"],
    createdAt: daysAgo(3),
  },
  {
    id: "in4",
    title: "成分证据能补强卖点，但不能替代功效证明",
    content: "INCI Decoder 适合解释神经酰胺、透明质酸和配方逻辑，但它只能支撑“保湿、屏障友好”的护肤品表达。生成文案时要避免把成分存在写成确定性治疗效果。",
    type: "risk",
    priority: "high",
    projectId: "p1",
    claimIds: ["cl6"],
    evidenceIds: ["ev7", "ev8"],
    suggestedDeliverables: ["research_brief", "content_script"],
    createdAt: daysAgo(4),
  },
  {
    id: "in5",
    title: "内容转化应先讲使用场景，再讲成分",
    content: "短视频和详情页首屏应先呈现用户能感知的结果：洗后不紧绷、适合早晚日常清洁、干皮友好。成分解释放在第二层，用来增强可信度，而不是一开始就堆术语。",
    type: "content_angle",
    priority: "medium",
    projectId: "p1",
    claimIds: ["cl7", "cl8"],
    evidenceIds: ["ev9", "ev10"],
    suggestedDeliverables: ["content_script", "research_brief"],
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
  { id: "p1", name: "CeraVe 洗面奶产品调研", description: "围绕温和保湿洁面的官方卖点、成分证据、货架竞品和用户疑问建立研究工作台。", goal: "判断 CeraVe Hydrating Facial Cleanser 的核心定位、购买疑虑、竞品差异和内容转化方向。", keyQuestions: ["核心卖点是什么？", "用户购买前最担心什么？", "它和泡沫洁面/敏感肌洁面怎么区分？", "详情页和短视频应该怎么讲？"], status: "active", sourceIds: ["s1", "s2", "s3", "s4", "s5"], claimIds: claims.slice(0, 8).map((i) => i.id), evidenceIds: evidence.slice(0, 10).map((i) => i.id), insightIds: insights.slice(0, 5).map((i) => i.id), deliverableIds: ["d1", "d2"], tags: ["cleanser", "skincare"], createdAt: daysAgo(22), updatedAt: daysAgo(1) },
  { id: "p2", name: "AI Product Manager Interview Kit", description: "Reusable interview stories from Lumo research.", goal: "Turn product research into concise PM interview material.", keyQuestions: ["Which product decisions show depth?", "What evidence supports the story?"], status: "active", sourceIds: ["s13", "s14", "s16"], claimIds: claims.slice(8, 13).map((i) => i.id), evidenceIds: evidence.slice(10, 18).map((i) => i.id), insightIds: insights.slice(5, 8).map((i) => i.id), deliverableIds: ["d3"], tags: ["interview", "pm"], createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  { id: "p3", name: "Industrial AI Platform Messaging", description: "Messaging research for industrial AI platform landing pages.", goal: "Clarify the value proposition and evidence for industrial AI buyers.", keyQuestions: ["Which metrics matter?", "What buyer pain is most credible?"], status: "paused", sourceIds: ["s15"], claimIds: claims.slice(13).map((i) => i.id), evidenceIds: evidence.slice(18).map((i) => i.id), insightIds: insights.slice(8).map((i) => i.id), deliverableIds: ["d4"], tags: ["industrial", "messaging"], createdAt: daysAgo(16), updatedAt: daysAgo(4) },
];

export const deliverables: Deliverable[] = [
  { id: "d1", title: "CeraVe 洗面奶竞品货架分析", type: "competitive_analysis", projectId: "p1", content: "# Competitive Analysis\n\n## 1. Research Objective\n分析 CeraVe Hydrating Facial Cleanser 在保湿洁面货架中的定位、卖点和竞品差异。\n\n## 2. Key Finding\n核心定位是温和保湿与屏障维护，主要竞品压力来自泡沫洁面、敏感肌洁面和同价位自有品牌。\n\n## 3. Evidence Sources\n- CeraVe 官方产品页\n- Ulta 用户问答\n- Target 货架页\n- INCI Decoder 成分页", sourceIds: ["s1", "s2", "s3", "s4", "s5"], claimIds: ["cl1", "cl2"], evidenceIds: ["ev1", "ev2"], insightIds: ["in1"], createdAt: daysAgo(2) },
  { id: "d2", title: "CeraVe 洗面奶产品调研简报", type: "research_brief", projectId: "p1", content: "# Research Brief\n\n## 1. Product Positioning\n温和保湿型洁面，适合 normal to dry skin 和重视屏障维护的人群。\n\n## 2. Core Claims\n- 三种神经酰胺与透明质酸支撑保湿和屏障叙事。\n- 无添加香精、非致痘、清洁后不紧绷是主要购买理由。\n\n## 3. User Questions\n是否能卸妆、是否适合敏感肌、是否会闷痘、泡沫少是否洗得干净。", sourceIds: ["s1", "s2", "s3", "s4", "s5"], claimIds: ["cl3", "cl4"], evidenceIds: ["ev3", "ev4"], insightIds: ["in2"], createdAt: daysAgo(1) },
  { id: "d3", title: "AI Product Manager Interview Kit", type: "interview_material", projectId: "p2", content: "# Interview Material\n\n## 1. Project Background\nBuilt an AI research workspace from read-it-later behavior.\n\n## 7. STAR Stories\nSituation: saved sources did not become decisions. Task: build a workflow from capture to deliverable.", sourceIds: ["s13", "s14", "s16"], claimIds: ["cl9"], evidenceIds: ["ev12"], insightIds: ["in6"], createdAt: daysAgo(3) },
  { id: "d4", title: "Research Weekly Report", type: "weekly_report", projectId: "p3", content: "# Research Weekly Report\n\n## 1. New Sources\nIndustrial AI messaging PDF.\n\n## 6. Recommended Actions\nExtract buyer pains, metrics, and proof points before writing positioning.", sourceIds: ["s15"], claimIds: ["cl15"], evidenceIds: ["ev20"], insightIds: ["in9"], createdAt: daysAgo(4) },
];
