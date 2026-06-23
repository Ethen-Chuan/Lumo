import type { Claim, Collection, Deliverable, DeliverableType, Entity, Evidence, Insight, Project, Source } from "../types";

const id = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

export function generateMockSummary(source: Partial<Source>): string {
  return `Lumo 识别到一条关于「${source.title ?? "产品研究"}」的资料。它的价值在于把阅读行为、证据提取和后续行动连接成可复用的研究流程。`;
}

export function generateMockKeyPoints(source: Partial<Source>): string[] {
  return [
    `${source.sourceName ?? "该资料"}更像一个具体工作流，而不是泛泛的想法。`,
    "真正的价值出现在收藏段落被转成结构化证据之后。",
    "下一步建议把资料加入项目，或直接生成一条观点。",
  ];
}

export function generateMockAiReason(source: Partial<Source>): string {
  return `「${source.title ?? "这条资料"}」值得处理，因为其中的观点可以支撑项目成果，而不是停留在被动阅读材料里。`;
}

export function generateMockReadingRecommendation(source: Partial<Source>): string {
  return `先读摘要，再查看与「${source.purpose ?? "收藏目的"}」相关的段落，并把其中一段转成证据。`;
}

export function generateMockRelatedTopics(source: Partial<Source>): string[] {
  return ["AI Inbox", source.purpose ?? "project research", "Evidence chain", "Deliverable generation"];
}

export function generateMockEntities(source: Partial<Source>): Entity[] {
  return ["Lumo", source.sourceName ?? "Source", "AI Summary"].map((name, index) => ({
    id: id("en"),
    name,
    type: index === 1 ? "product" : "concept",
    sourceIds: source.id ? [source.id] : [],
  }));
}

export function generateMockClaimsFromSource(source: Source): Claim[] {
  // Without AI, we can't determine confidence — default to medium
  // Real confidence scoring happens via aiExtractClaims() when API key is set
  return source.keyPoints.map((point) => ({
    id: id("cl"),
    text: `基于「${source.title}」可形成观点：${point}`,
    sourceId: source.id,
    evidenceIds: [],
    entityIds: source.entityIds.slice(0, 2),
    tags: ["ai-generated", source.purpose],
    confidence: "medium" as const, // placeholder — AI will score when available
    createdAt: new Date().toISOString(),
  }));
}

export function generateMockClaimFromParagraph(source: Source, paragraphIndex: number): Claim {
  const paragraph = source.content[paragraphIndex] ?? source.content[0] ?? "";
  const explicitClaim = paragraph.match(/Lumo 可抽取的 Claim：(.+)/)?.[1];
  const explicitInsight = paragraph.match(/Lumo 可抽取的 Insight：(.+)/)?.[1];
  const cleaned = paragraph.replace(/^出处：.+$/, "").slice(0, 96);
  const text = explicitClaim || explicitInsight || `基于原文可形成观点：${cleaned}${paragraph.length > 96 ? "..." : ""}`;
  return {
    id: id("cl"),
    text,
    sourceId: source.id,
    evidenceIds: [],
    entityIds: source.entityIds.slice(0, 2),
    tags: ["paragraph-claim", source.purpose],
    confidence: "medium",
    createdAt: new Date().toISOString(),
  };
}

export function generateMockEvidenceFromParagraph(source: Source, paragraphIndex: number): Evidence {
  return {
    id: id("ev"),
    sourceId: source.id,
    text: source.content[paragraphIndex] ?? source.content[0],
    originalUrl: source.url,
    sourceTitle: source.title,
    type: "quote",
    confidence: "high",
    createdAt: new Date().toISOString(),
  };
}

export function generateMockInsights(project: Project, claims: Claim[], evidence: Evidence[]): Insight[] {
  const highClaims = claims.filter((c) => c.confidence === "high");
  const unsupported = claims.filter((c) => c.evidenceIds.length === 0);
  const supported = claims.filter((c) => c.evidenceIds.length > 0);
  const insights: Insight[] = [];

  // Insight 1: pattern from top claims (if we have claims)
  if (claims.length > 0) {
    const topClaim = highClaims[0] ?? claims[0];
    insights.push({
      id: id("in"),
      title: `核心发现：${topClaim.text.slice(0, 36)}…`,
      content: `在「${project.name}」的 ${claims.length} 条观点中，最强的信号是「${topClaim.text.slice(0, 60)}」。${supported.length > 0 ? `已有 ${supported.length} 条观点找到了原始证据支撑。` : "目前所有观点尚无直接证据，建议在阅读器中为关键段落添加证据。"}`,
      type: "product_opportunity" as const,
      priority: "high" as const,
      projectId: project.id,
      claimIds: claims.slice(0, 3).map((c) => c.id),
      evidenceIds: evidence.slice(0, 2).map((e) => e.id),
      suggestedDeliverables: ["research_brief", "competitive_analysis"],
      createdAt: new Date().toISOString(),
    });
  }

  // Insight 2: evidence gap or strength
  if (unsupported.length > 0) {
    insights.push({
      id: id("in"),
      title: `证据缺口：${unsupported.length} 条观点待验证`,
      content: `「${project.name}」有 ${unsupported.length} 条观点目前没有原始证据支撑，其中包括：${unsupported.slice(0, 2).map((c) => `"${c.text.slice(0, 30)}"`) .join("；")}。在生成成果文档前，建议优先补全这些证据来源，提升报告可信度。`,
      type: "risk" as const,
      priority: unsupported.length > claims.length / 2 ? "high" as const : "medium" as const,
      projectId: project.id,
      claimIds: unsupported.slice(0, 3).map((c) => c.id),
      evidenceIds: [],
      suggestedDeliverables: ["research_brief"],
      createdAt: new Date().toISOString(),
    });
  } else if (evidence.length > 0) {
    insights.push({
      id: id("in"),
      title: `证据充分：${evidence.length} 条来源可追溯`,
      content: `「${project.name}」已收集 ${evidence.length} 条可追溯证据，所有观点均有原始出处。证据来自：${[...new Set(evidence.map((e) => e.sourceTitle ?? "来源").slice(0, 3))].join("、")}。这为生成研究简报和竞品分析提供了可靠基础。`,
      type: "product_opportunity" as const,
      priority: "medium" as const,
      projectId: project.id,
      claimIds: claims.slice(0, 2).map((c) => c.id),
      evidenceIds: evidence.slice(0, 4).map((e) => e.id),
      suggestedDeliverables: ["research_brief", "competitive_analysis", "prd"],
      createdAt: new Date().toISOString(),
    });
  }

  // Insight 3: next step recommendation
  if (claims.length > 0) {
    const suggested = claims.length >= 5 ? "competitive_analysis" : claims.length >= 3 ? "article_outline" : "research_brief";
    insights.push({
      id: id("in"),
      title: `建议下一步：生成${suggested === "competitive_analysis" ? "竞品分析" : suggested === "article_outline" ? "文章大纲" : "研究简报"}`,
      content: `基于当前 ${claims.length} 条观点和 ${evidence.length} 条证据，「${project.name}」已具备生成${suggested === "competitive_analysis" ? "竞品分析报告" : suggested === "article_outline" ? "文章大纲" : "研究简报"}的基础。${project.keyQuestions?.length ? `关键问题「${project.keyQuestions[0]}」在资料中已有初步覆盖。` : ""}`,
      type: "product_opportunity" as const,
      priority: "medium" as const,
      projectId: project.id,
      claimIds: claims.slice(0, 2).map((c) => c.id),
      evidenceIds: evidence.slice(0, 2).map((e) => e.id),
      suggestedDeliverables: [suggested as DeliverableType],
      createdAt: new Date().toISOString(),
    });
  }

  return insights.slice(0, 3);
}

export function generateMockDeliverable(
  type: DeliverableType,
  project: Project,
  sources: Source[],
  claims: Claim[],
  evidence: Evidence[],
  insights: Insight[],
): Deliverable {
  const titleMap: Record<DeliverableType, string> = {
    prd: "产品需求文档",
    competitive_analysis: "竞品分析报告",
    weekly_report: "研究周报",
    interview_material: "面试素材",
    article_outline: "文章大纲",
    research_brief: "研究简报",
    content_script: "内容脚本",
  };

  const topClaims = claims.slice(0, 5);
  const topEvidence = evidence.slice(0, 6);
  const topSources = sources.slice(0, 6);

  const sourceRefs = topSources.length
    ? topSources.map((s) => `- [${s.title}](${s.url}) — ${s.sourceName}`).join("\n")
    : "- 暂无资料，请先把来源加入项目。";

  const claimBullets = topClaims.length
    ? topClaims.map((c) => `- ${c.text} *(置信度：${c.confidence})*`).join("\n")
    : "- 暂无观点，请先在阅读器中提取。";

  const evidenceQuotes = topEvidence.length
    ? topEvidence.map((e) => `> "${e.text}"\n> — [${e.sourceTitle}](${e.originalUrl})`).join("\n\n")
    : "> 暂无证据，请先高亮段落并转为证据。";

  let content = "";

  if (type === "research_brief") {
    const topInsight = insights[0];
    content = `# ${project.name} · 研究简报

**生成时间**：${new Date().toLocaleDateString("zh-CN")} · **资料来源**：${sources.length} 篇 · **观点数**：${claims.length} · **证据数**：${evidence.length}

---

## 执行摘要

${topInsight ? topInsight.content : `本报告围绕「${project.name}」对 ${sources.length} 份资料进行系统整理，提炼出 ${claims.length} 条核心观点和 ${evidence.length} 条可验证证据，供决策参考。`}

**核心结论**：
${topClaims.slice(0, 3).map((c) => `- ${c.text}`).join("\n") || "- 请先在阅读器中提取观点。"}

---

## 研究背景

**研究目标**：${project.goal}

**核心问题**：
${(project.keyQuestions ?? []).slice(0, 3).map((q) => `- ${q}`).join("\n") || "- 暂无关键问题"}

---

## 关键发现

${topClaims.map((c, i) => `### 发现 ${i + 1}：${c.text.slice(0, 40)}…\n\n${c.text}\n\n**支撑证据**：\n${evidence.filter((e) => c.evidenceIds.includes(e.id)).slice(0, 2).map((e) => `> "${e.text}" — [${e.sourceTitle}](${e.originalUrl})`).join("\n\n") || "> 请在阅读器中为此观点关联证据。"}`).join("\n\n") || "请先从资料中提取观点。"}

---

## 证据全览

${evidenceQuotes}

---

## 资料来源

${sourceRefs}

---

## 下一步建议

- 对置信度为 **medium** 的观点补充至少一条原始引用
- 把执行摘要中的结论提交给利益相关方评审
- 基于本报告生成竞品分析或文章大纲
`;
  } else if (type === "competitive_analysis") {
    const competitorSources = topSources.slice(0, 4);
    const tableRows = competitorSources.map((s) => `| ${s.title.slice(0, 20)} | ${s.sourceName} | ${s.keyPoints?.[0]?.slice(0, 30) ?? "—"} | ${s.summary?.slice(0, 40) ?? "—"} |`).join("\n");
    content = `# ${project.name} · 竞品分析报告

**分析日期**：${new Date().toLocaleDateString("zh-CN")} · **覆盖竞品**：${competitorSources.length} 个 · **分析维度**：定位 / 功能 / 体验 / 差异化

---

## 分析目标

${project.goal}

**本次重点回答**：
${(project.keyQuestions ?? []).slice(0, 3).map((q) => `- ${q}`).join("\n") || "- 各竞品的核心差异是什么？\n- 哪个维度存在明显机会？\n- 我们应该跟进还是差异化？"}

---

## 竞品对比矩阵

| 产品 | 来源 | 核心卖点 | 定位摘要 |
|------|------|---------|---------|
${tableRows || "| — | — | 请先加入竞品资料 | — |"}

---

## 逐品深度分析

${competitorSources.map((s, i) => `### ${i + 1}. ${s.title}

**来源**：[${s.sourceName}](${s.url})

**核心定位**：${s.summary}

**关键证据**：
${evidence.filter((e) => e.sourceId === s.id).slice(0, 2).map((e) => `> "${e.text}"`).join("\n\n") || "> 请在阅读器中为此资料提取证据。"}

**Lumo 判断**：${s.aiReason}
`).join("\n---\n") || "请先将竞品资料加入本项目。"}

---

## 差异化机会

${topClaims.map((c) => `- ${c.text}`).join("\n") || "- 请先提取跨资料的比较性观点。"}

---

## 行动建议

- **跟进**：重点关注功能已有明显领先的竞品，分析其用户路径
- **差异化**：在证据支撑的薄弱环节寻找切入点
- **资料补充**：对评分低于 medium 置信度的竞品补充用户评价来源

---

## 参考来源

${sourceRefs}
`;
  } else if (type === "article_outline") {
    const hook = topClaims[0]?.text ?? `${project.name} 正在改变行业的工作方式`;
    const sections = topClaims.slice(1, 4);
    content = `# ${project.name} · 文章大纲

**适用平台**：公众号 / Newsletter / 知乎长文 · **预估字数**：3000–5000 字 · **写作难度**：中等

---

## 文章标题建议

1. 《${hook.slice(0, 30)}》
2. 《我研究了 ${sources.length} 份资料，关于「${project.name}」的真相》
3. 《${project.goal.slice(0, 28)}：一份来自真实资料的分析》

---

## 核心论点（Thesis）

${topClaims[0]?.text ?? "待补充核心论点——请先在阅读器中提取高置信度观点。"}

**支撑这个论点的证据**：
${topEvidence.slice(0, 2).map((e) => `> "${e.text}" — [${e.sourceTitle}](${e.originalUrl})`).join("\n\n") || "> 请先关联证据。"}

---

## 文章结构

### 开场（300字）：钩子 + 问题设置

> **钩子**：${hook}
>
> 提出问题：${(project.keyQuestions ?? [])[0] ?? "为什么这件事值得认真研究？"}

### 第一节（800字）：背景与现状

- 为什么现在讨论这个话题？
- 现有认知的误区或盲点
- **素材**：${topSources[0] ? `[${topSources[0].title}](${topSources[0].url})` : "请加入背景资料"}

### 第二节（1000字）：核心论点展开

${sections.length ? sections.map((c, i) => `**论点 ${i + 1}**：${c.text}\n- **支撑**：${evidence.find((e) => c.evidenceIds.includes(e.id))?.text?.slice(0, 60) ?? "请关联证据"}`).join("\n\n") : "请先提取 2–3 个核心观点。"}

### 第三节（800字）：反驳与平衡

- 主流反对观点是什么？
- 证据如何回应质疑？
- 留给读者思考的空间

### 结尾（400字）：行动号召

- 对读者的具体建议
- 指向下一步资源

---

## 写作注意事项

- 每个核心论点必须有可链接的原始来源（见证据链）
- 避免仅靠 AI 观点，确保每节至少引用一条真实资料
- 公众号适合加粗重点词；Newsletter 适合加 Callout 块

---

## 参考资料

${sourceRefs}
`;
  } else if (type === "prd") {
    content = `# ${project.name} · 产品需求文档 (PRD)

**版本**：v0.1 Draft · **日期**：${new Date().toLocaleDateString("zh-CN")} · **状态**：待评审

---

## 背景与目标

**背景**：${project.goal}

**成功指标**：
- 用户可以完成从资料收集到成果输出的完整流程
- 核心路径操作步骤 ≤ 5 步
- 证据链可溯源率 100%

---

## 用户故事

${topClaims.slice(0, 3).map((c, i) => `**US-${String(i + 1).padStart(2, "0")}**：作为一名研究型用户，我希望 ${c.text.slice(0, 60)}，以便快速生成有据可查的成果文档。`).join("\n\n") || "**US-01**：作为研究型用户，我希望把阅读时的高亮直接转成证据，不需要手动复制粘贴。\n\n**US-02**：作为内容创作者，我希望项目里所有观点都标注来源，以便写作时不需要回去翻原文。"}

---

## 功能需求

### P0（必须上线）

${topEvidence.slice(0, 3).map((e, i) => `- **F-P0-${i + 1}**：${e.text.slice(0, 60)}\n  - 验收标准：点击高亮段落即可一键转为证据，证据自动携带来源 URL\n  - 参考来源：[${e.sourceTitle}](${e.originalUrl})`).join("\n\n") || "- **F-P0-1**：资料收藏功能（支持 URL / 截图 / 文本）\n- **F-P0-2**：阅读器内高亮转证据\n- **F-P0-3**：项目图谱中展示观点–证据关联"}

### P1（迭代跟进）

- 跨项目证据复用
- AI 自动检测重复观点
- 成果文档版本历史

---

## 非功能需求

- 页面响应时间 < 300ms（P99）
- 本地数据优先，支持离线阅读
- 证据链导出必须保留原始 URL（不可截断）

---

## 待确认事项

${(project.keyQuestions ?? []).map((q) => `- [ ] ${q}`).join("\n") || "- [ ] 目标用户的主要使用场景是什么？\n- [ ] 证据链的最小可用格式？\n- [ ] 上线优先级如何排序？"}

---

## 参考资料

${sourceRefs}
`;
  } else {
    // content_script
    const platform = sources.some((s) => s.type === "video") ? "视频脚本（B站 / 抖音 / YouTube）" : "文章 / 播客脚本";
    const duration = sources.length > 4 ? "10–15 分钟" : "5–8 分钟";
    content = `# ${project.name} · 内容脚本

**平台**：${platform} · **预估时长**：${duration} · **风格**：观点驱动 + 证据支撑

---

## 脚本摘要

本脚本基于 ${sources.length} 份一手资料，提炼 ${claims.length} 个核心论点，以说故事 + 亮证据的方式呈现给目标受众。

---

## 开场钩子（0:00–0:45）

> **旁白**："${topClaims[0]?.text ?? `你有没有想过，${project.name} 其实正在解决一个被忽视已久的问题？`}"

*[镜头建议：特写 + 静态字幕强调核心问题]*

---

## 第一段：问题设置（0:45–2:00）

**口播稿**：
大多数人在做这件事时，都会遇到同一个问题——${(project.keyQuestions ?? [])[0] ?? "信息越来越多，但有价值的东西越来越难找"}。

${topSources[0] ? `我研究了 [${topSources[0].title}](${topSources[0].url}) 这篇报告，里面有一句话让我印象很深——` : "在查阅资料时，有一个数据让我很意外——"}

${topEvidence[0] ? `> "${topEvidence[0].text}"` : "> （请关联证据）"}

*[B-roll 建议：相关产品界面截图或数据图表]*

---

## 第二段：核心论点（2:00–6:00）

${topClaims.slice(0, 3).map((c, i) => `### 论点 ${i + 1}（${1 + i * 1.5}:00–${2 + i * 1.5}:30）

**口播稿**：${c.text}

**证据支撑**：
${evidence.filter((e) => c.evidenceIds.includes(e.id)).slice(0, 1).map((e) => `> "${e.text}" — [${e.sourceTitle}](${e.originalUrl})`).join("") || "> 请关联证据。"}

*[字幕建议：加粗核心数字或关键词]*
`).join("\n") || "请先提取核心观点。"}

---

## 第三段：反转与洞察（6:00–8:00）

**口播稿**：但事情没这么简单。${insights[0]?.content?.slice(0, 80) ?? "当我把这些资料放在一起看，发现了一个有意思的模式——"}

*[建议加入动态图表或对比截图]*

---

## 结尾行动号召（8:00–结束）

**口播稿**：
如果你也在研究这个方向，我把所有参考资料都整理好了，可以直接访问下方链接。

- 📎 ${topSources[0] ? `[${topSources[0].title}](${topSources[0].url})` : "资料链接"}
- 💬 评论区告诉我你的看法

*[字幕：关注 + 点赞 + 转发]*

---

## 参考资料

${sourceRefs}
`;
  }

  return {
    id: id("d"),
    title: `${project.name} ${titleMap[type]}`,
    type,
    projectId: project.id,
    sourceIds: sources.map((source) => source.id),
    claimIds: claims.map((claim) => claim.id),
    evidenceIds: evidence.map((item) => item.id),
    insightIds: insights.map((insight) => insight.id),
    createdAt: new Date().toISOString(),
    content,
  };
}

export function generateMockProjectFromCollection(collection: Collection, sources: Source[]): Project {
  return {
    id: id("p"),
    name: `${collection.name} Research Project`,
    description: `Project generated from the ${collection.name} collection.`,
    goal: `Turn ${collection.name} sources into claims, evidence, insights, and a usable deliverable.`,
    keyQuestions: ["What is the strongest pattern?", "Which sources provide evidence?", "What should we generate next?"],
    status: "active",
    sourceIds: sources.map((source) => source.id),
    claimIds: [],
    evidenceIds: [],
    insightIds: [],
    deliverableIds: [],
    tags: collection.tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
