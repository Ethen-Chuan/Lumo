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
  return source.keyPoints.map((point, index) => ({
    id: id("cl"),
    text: `基于「${source.title}」可形成观点：${point}`,
    sourceId: source.id,
    evidenceIds: [],
    entityIds: source.entityIds.slice(0, 2),
    tags: ["ai-generated", source.purpose],
    confidence: index === 0 ? "high" : "medium",
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
  return [
    {
      id: id("in"),
      title: `${project.name}: evidence-backed workflow opportunity`,
      content: `The project has ${claims.length} claims and ${evidence.length} evidence items. The strongest opportunity is to make synthesis feel like the natural continuation of reading, not a separate research task.`,
      type: "product_opportunity",
      priority: "high",
      projectId: project.id,
      claimIds: claims.slice(0, 4).map((claim) => claim.id),
      evidenceIds: evidence.slice(0, 4).map((item) => item.id),
      suggestedDeliverables: ["prd", "competitive_analysis", "weekly_report"],
      createdAt: new Date().toISOString(),
    },
  ];
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
    prd: "Product Requirements Document",
    competitive_analysis: "Competitive Analysis",
    weekly_report: "Research Weekly Report",
    interview_material: "Interview Material",
    article_outline: "Article Outline",
    research_brief: "Research Brief",
    content_script: "Content Script",
  };
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
    content: `# ${titleMap[type]}\n\n## 1. Research Objective\n${project.goal}\n\n## 2. Source Base\n${sources.map((source) => `- ${source.title}`).join("\n")}\n\n## 3. Important Claims\n${claims.slice(0, 5).map((claim) => `- ${claim.text}`).join("\n")}\n\n## 4. Evidence Highlights\n${evidence.slice(0, 5).map((item) => `- ${item.text}`).join("\n")}\n\n## 5. Insights\n${insights.slice(0, 4).map((insight) => `- ${insight.title}: ${insight.content}`).join("\n")}\n\n## 6. Recommended Actions\n- Validate the strongest opportunity with target users.\n- Convert high-confidence evidence into the next product requirement.\n- Keep sources linked for review and export later.`,
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
