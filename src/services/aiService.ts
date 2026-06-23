/**
 * Lumo AI Service — DeepSeek API integration
 *
 * Uses the OpenAI-compatible DeepSeek API.
 * Set your API key in Settings → AI → DeepSeek API Key,
 * or via the VITE_DEEPSEEK_API_KEY environment variable.
 */

import OpenAI from "openai";

// ── Config ────────────────────────────────────────────────

export const AI_CONFIG = {
  baseURL: "https://api.deepseek.com",
  model: "deepseek-chat",
  maxTokens: 2048,
  temperature: 0.7,
} as const;

const API_KEY_STORAGE_KEY = "lumo-deepseek-api-key";

export function getApiKey(): string {
  return (
    localStorage.getItem(API_KEY_STORAGE_KEY) ||
    (typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, string> }).env?.VITE_DEEPSEEK_API_KEY : undefined) ||
    ""
  );
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey());
}

function createClient(): OpenAI | null {
  const key = getApiKey();
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: AI_CONFIG.baseURL,
    dangerouslyAllowBrowser: true,
  });
}

// ── Core request wrapper ──────────────────────────────────

async function chat(
  system: string,
  user: string,
  maxTokens: number = AI_CONFIG.maxTokens,
): Promise<string> {
  const client = createClient();
  if (!client) {
    throw new Error("DeepSeek API Key not configured. Please add it in Settings → AI.");
  }
  const response = await client.chat.completions.create({
    model: AI_CONFIG.model,
    max_tokens: maxTokens,
    temperature: AI_CONFIG.temperature,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

// ── AI Features ───────────────────────────────────────────

/**
 * Generate a summary for an article/source
 */
export async function summarizeSource(params: {
  title: string;
  content: string[];
  url?: string;
}): Promise<{ summary: string; keyPoints: string[]; readingRecommendation: string }> {
  const text = params.content.join("\n\n").slice(0, 4000);
  const system = `你是一个研究助理，专门帮用户提炼资料要点。输出 JSON 格式，包含 summary（2-3句中文摘要）、keyPoints（3-5个要点，每条20字内的字符串数组）、readingRecommendation（1句阅读建议）。`;
  const user = `标题：${params.title}\n\n正文：\n${text}`;

  const raw = await chat(system, user, 512);
  try {
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
    return {
      summary: parsed.summary ?? raw.slice(0, 200),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : [],
      readingRecommendation: parsed.readingRecommendation ?? "",
    };
  } catch {
    return { summary: raw.slice(0, 200), keyPoints: [], readingRecommendation: "" };
  }
}

/**
 * Extract claims from a paragraph
 */
export async function extractClaim(params: {
  paragraph: string;
  sourceTitle: string;
}): Promise<{ text: string; confidence: "high" | "medium" | "low" }> {
  const system = `你是一个研究分析师，从段落中提炼可复用的判断性观点（Claim）。输出 JSON：{ text: "简洁的判断句（30字内）", confidence: "high|medium|low" }`;
  const user = `来源：${params.sourceTitle}\n\n段落：${params.paragraph}`;
  const raw = await chat(system, user, 128);
  try {
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
    return { text: parsed.text ?? raw.slice(0, 100), confidence: parsed.confidence ?? "medium" };
  } catch {
    return { text: raw.slice(0, 100), confidence: "medium" };
  }
}

/**
 * Generate cross-source insights from claims and evidence
 */
export async function generateInsights(params: {
  projectName: string;
  projectGoal: string;
  claims: string[];
  evidence: string[];
}): Promise<Array<{ title: string; content: string; priority: "high" | "medium" | "low" }>> {
  const system = `你是一个策略分析师，根据多条观点和证据，生成跨资料的综合洞察。输出 JSON 数组，每条洞察包含 title（15字内）、content（2-3句分析）、priority（high/medium/low）。生成 2-3 条洞察。`;
  const user = `项目：${params.projectName}\n目标：${params.projectGoal}\n\n观点：\n${params.claims.slice(0, 8).map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n证据：\n${params.evidence.slice(0, 8).map((e, i) => `${i + 1}. ${e}`).join("\n")}`;
  const raw = await chat(system, user, 800);
  try {
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
    const items = Array.isArray(parsed) ? parsed : parsed.insights ?? [];
    return items.slice(0, 3).map((item: { title?: string; content?: string; priority?: string }) => ({
      title: item.title ?? "洞察",
      content: item.content ?? "",
      priority: (item.priority as "high" | "medium" | "low") ?? "medium",
    }));
  } catch {
    return [{ title: "综合洞察", content: raw.slice(0, 200), priority: "medium" }];
  }
}

/**
 * Generate a research brief / deliverable
 */
export async function generateDeliverableContent(params: {
  type: string;
  projectName: string;
  projectGoal: string;
  sources: string[];
  claims: string[];
  evidence: string[];
  insights: string[];
}): Promise<string> {
  const typeLabels: Record<string, string> = {
    research_brief: "研究简报",
    competitive_analysis: "竞品分析",
    article_outline: "文章大纲",
    prd: "产品需求文档",
    content_script: "内容脚本",
  };
  const label = typeLabels[params.type] ?? params.type;
  const system = `你是一个产品研究专家，根据提供的研究资料生成一份结构化的${label}。使用 Markdown 格式，包含标题（##）、章节（###）、要点列表。输出长度约 600-800 字。用中文。`;
  const user = `项目：${params.projectName}\n目标：${params.projectGoal}\n\n核心资料（${params.sources.length}条）：\n${params.sources.slice(0, 5).join("\n")}\n\n主要观点：\n${params.claims.slice(0, 6).map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n关键洞察：\n${params.insights.slice(0, 3).join("\n")}`;
  return chat(system, user, 1500);
}

/**
 * Answer a question about a source (for AskLumo feature)
 */
export async function askAboutSource(params: {
  question: string;
  paragraph: string;
  sourceTitle: string;
  sourceUrl?: string;
}): Promise<string> {
  const system = `你是 Lumo 研究助手。用户正在阅读一篇文章的某个段落，向你提问。请简洁回答（2-4句），并指出如何把这段内容转化为研究价值（高亮/观点/证据）。`;
  const user = `文章：${params.sourceTitle}\n\n段落：${params.paragraph}\n\n问题：${params.question}`;
  return chat(system, user, 300);
}

/**
 * Extract 3-5 reusable claims from a full source using AI
 */
export async function aiExtractClaims(params: {
  title: string;
  content: string[];
}): Promise<Array<{ text: string; confidence: "high" | "medium" | "low" }>> {
  const text = params.content.join("\n\n").slice(0, 5000);
  const system = `你是一位产品研究分析师，从文章中提炼可复用的判断性观点（Claim）。

好的观点的标准：
- 包含具体的产品名/功能名/数据点，而不是泛泛陈述
- 是一个完整的判断句，PM 可以在会议上拿出来支撑决策
- 坏例子："该产品功能丰富" 好例子："Duolingo 用连续学习天数作为主要留存激励，比积分系统的次日留存高出23%"

只输出 JSON 数组，每条包含：
- text: 具体观点（40字以内，必须包含至少一个专有名词）
- confidence: "high"（文章有明确数字、直接引语或权威数据）| "medium"（可从原文合理推导，但未直接说）| "low"（主要是推断，原文支撑较弱）
注意：不要把所有观点都打中置信，严格按原文证据强度区分。

提炼 3-5 条最有决策价值的观点。只输出 JSON 数组。`;
  const user = `文章标题：${params.title}\n\n正文：\n${text}`;
  const raw = await chat(system, user, 600);
  try {
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
    const items = Array.isArray(parsed) ? parsed : (parsed.claims ?? []);
    return items.slice(0, 5).map((item: { text?: string; confidence?: string }) => ({
      text: String(item.text ?? "").slice(0, 100).trim(),
      confidence: (["high","medium","low"].includes(item.confidence ?? "") ? item.confidence : "medium") as "high"|"medium"|"low",
    })).filter((c: { text: string }) => c.text.length > 0);
  } catch {
    // If JSON parse fails, try to extract from plain text
    const lines = raw.split("\n").filter(l => l.trim().length > 8);
    return lines.slice(0, 5).map(l => ({ text: l.replace(/^[\d\.\-\*]+\s*/, "").slice(0, 100), confidence: "medium" as const }));
  }
}

/**
 * AI triage for a newly added source
 */
export async function triageSource(params: {
  title: string;
  url: string;
  summary: string;
}): Promise<{
  triageStatus: "must_read" | "skim" | "archive_suggested" | "project_material";
  aiReason: string;
}> {
  const system = `你是 Lumo AI 分拣系统。根据资料信息判断阅读优先级：must_read（必须精读）、skim（略读即可）、archive_suggested（建议归档，价值低）、project_material（可作为项目素材）。输出 JSON：{ triageStatus: "...", aiReason: "一句说明（20字内）" }`;
  const user = `标题：${params.title}\n链接：${params.url}\n摘要：${params.summary}`;
  const raw = await chat(system, user, 128);
  try {
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
    return {
      triageStatus: parsed.triageStatus ?? "skim",
      aiReason: parsed.aiReason ?? "AI 分析",
    };
  } catch {
    return { triageStatus: "skim", aiReason: "AI 分析" };
  }
}
