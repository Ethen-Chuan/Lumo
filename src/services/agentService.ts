/**
 * Lumo Research Agent — Fixed & Robust Version
 * Core: search → read → save_claim → save_evidence → conclude
 */

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat";
import { getApiKey, hasApiKey } from "./aiService";
import { useAppStore } from "../store/useAppStore";
import { uid, stamp } from "../store/useAppStore";

// ── Event types ───────────────────────────────────────────

export type AgentEvent =
  | { type: "thinking"; text: string }
  | { type: "reading"; sourceTitle: string; sourceId: string }
  | { type: "claim_saved"; text: string; confidence: string; sourceTitle?: string }
  | { type: "evidence_saved"; text: string; sourceTitle?: string }
  | { type: "project_recommended"; sourceId: string; sourceTitle: string; projectId: string; projectName: string; reason: string }
  | { type: "message"; text: string }
  | { type: "done"; summary: string; claimCount: number; evidenceCount: number }
  | { type: "error"; error: string };

export type AgentEventHandler = (event: AgentEvent) => void;

// ── Tools definition ──────────────────────────────────────

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_sources",
      description: "Search the user's source library for relevant articles/resources",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keywords" },
          limit: { type: "number", description: "Max results, default 5" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_source",
      description: "Read the full content of a source by ID to analyze it deeply",
      parameters: {
        type: "object",
        properties: {
          sourceId: { type: "string", description: "Source ID from search results" },
        },
        required: ["sourceId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "save_claim",
      description: "Save a key judgement/insight extracted from a source as a reusable Claim",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "The claim text, one concise sentence" },
          sourceId: { type: "string", description: "Source ID this claim comes from" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["text", "sourceId", "confidence"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "save_evidence",
      description: "Save a key fact, data point or quote from a source as Evidence, with confidence based on how directly the source text supports it",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "The evidence text — preferably a direct quote or specific data point" },
          sourceId: { type: "string", description: "Source ID this evidence comes from" },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "high=direct quote/number/date in source; medium=can be inferred from source; low=indirect/weak support"
          },
        },
        required: ["text", "sourceId", "confidence"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "recommend_project",
      description: "After reading a source, recommend which existing project it belongs to",
      parameters: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          projectId: { type: "string", description: "Project ID that best fits this source" },
          reason: { type: "string", description: "One sentence reason" },
        },
        required: ["sourceId", "projectId", "reason"],
      },
    },
  },
];

// ── Tool execution ────────────────────────────────────────

function executeTool(
  name: string,
  args: Record<string, unknown>,
  emit: AgentEventHandler,
): string {
  const { sources, selectedProjectId, projects } = useAppStore.getState();

  try {
    switch (name) {
      case "search_sources": {
        const query = String(args.query ?? "").toLowerCase();
        const limit = Number(args.limit ?? 5);
        const results = sources
          .filter((s) => !["archived", "deleted"].includes(s.status))
          .filter((s) =>
            s.title.toLowerCase().includes(query) ||
            (s.summary ?? "").toLowerCase().includes(query) ||
            s.tags?.some((t) => t.toLowerCase().includes(query)) ||
            s.content.some((p) => p.toLowerCase().includes(query))
          )
          .slice(0, limit);

        if (!results.length) {
          // Fallback: return all active sources if no match
          const fallback = sources.filter((s) => !["archived", "deleted"].includes(s.status)).slice(0, limit);
          if (!fallback.length) return "No sources found in library";
          return fallback.map((s) => `ID:${s.id} | ${s.title} (${s.sourceName})`).join("\n");
        }
        return results.map((s) => `ID:${s.id} | ${s.title} (${s.sourceName})`).join("\n");
      }

      case "read_source": {
        const sourceId = String(args.sourceId ?? "");
        const source = sources.find((s) => s.id === sourceId);
        if (!source) {
          // Try partial match
          const partial = sources.find((s) => s.id.startsWith(sourceId) || sourceId.startsWith(s.id));
          if (!partial) return `Source not found: ${sourceId}`;
          emit({ type: "reading", sourceTitle: partial.title, sourceId: partial.id });
          return `# ${partial.title}\nSource: ${partial.sourceName}\nSummary: ${partial.summary ?? ""}\n\nContent:\n${partial.content.slice(0, 5).join("\n\n")}`;
        }
        emit({ type: "reading", sourceTitle: source.title, sourceId: source.id });
        return `# ${source.title}\nSource: ${source.sourceName}\nSummary: ${source.summary ?? ""}\n\nContent:\n${source.content.slice(0, 5).join("\n\n")}`;
      }

      case "save_claim": {
        const text = String(args.text ?? "").trim();
        const sourceId = String(args.sourceId ?? "");
        if (!text) return "Error: claim text is required";
        const confidence = (String(args.confidence ?? "medium")) as "high" | "medium" | "low";
        const sourceTitle = sources.find(s => s.id === sourceId)?.title;
        const claim = {
          id: uid("c"),
          sourceId,
          projectId: selectedProjectId ?? "",
          text,
          confidence,
          tags: ["agent"],
          evidenceIds: [],
          createdAt: stamp(),
        };
        useAppStore.setState((state) => ({
          claims: [claim as never, ...state.claims],
          projects: state.projects.map((p) =>
            p.id === selectedProjectId ? { ...p, claimIds: [claim.id, ...p.claimIds] } : p
          ),
        }));
        emit({ type: "claim_saved", text, confidence, sourceTitle });
        return `Claim saved: ${text}`;
      }

      case "save_evidence": {
        const text = String(args.text ?? "").trim();
        const sourceId = String(args.sourceId ?? "");
        if (!text) return "Error: evidence text is required";
        const rawConf = String(args.confidence ?? "medium");
        const confidence = (["high","medium","low"].includes(rawConf) ? rawConf : "medium") as "high"|"medium"|"low";
        const source = sources.find((s) => s.id === sourceId);
        const ev = {
          id: uid("e"),
          sourceId,
          projectId: selectedProjectId ?? "",
          text,
          type: "quote" as const,
          confidence,
          originalUrl: source?.url ?? "",
          sourceTitle: source?.title ?? sourceId,
          claimId: undefined,
          tagIds: ["agent"],
          createdAt: stamp(),
        };
        useAppStore.setState((state) => ({
          evidence: [ev as never, ...state.evidence],
          projects: state.projects.map((p) =>
            p.id === selectedProjectId ? { ...p, evidenceIds: [ev.id, ...p.evidenceIds] } : p
          ),
        }));
        emit({ type: "evidence_saved", text, sourceTitle: source?.title });
        return `Evidence saved (${confidence}): ${text.slice(0, 60)}`;
      }

      case "recommend_project": {
        const sourceId = String(args.sourceId ?? "");
        const projectId = String(args.projectId ?? "");
        const reason = String(args.reason ?? "");
        const source = sources.find(s => s.id === sourceId);
        const project = projects.find(p => p.id === projectId);
        if (!source || !project) return "Source or project not found";
        emit({ type: "project_recommended", sourceId, sourceTitle: source.title, projectId, projectName: project.name, reason });
        return `Recommended: ${source.title} → ${project.name}`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Tool error: ${(err as Error).message}`;
  }
}

// ── Agent loop ────────────────────────────────────────────

export async function runResearchAgent(params: {
  goal?: string;
  projectName?: string;
  onEvent: AgentEventHandler;
}): Promise<void> {
  if (!hasApiKey()) {
    params.onEvent({ type: "error", error: "请先在设置中配置 DeepSeek API Key" });
    return;
  }

  const client = new OpenAI({
    apiKey: getApiKey(),
    baseURL: "https://api.deepseek.com",
    dangerouslyAllowBrowser: true,
  });

  const { sources, projects } = useAppStore.getState();

  // Scan ALL active sources — Agent's job is to read everything and judge relevance
  const allActive = sources.filter(s => !["archived", "deleted"].includes(s.status));
  const targetSources = allActive;

  const sampleSources = targetSources
    .slice(0, 10)
    .map((s) => `  - ID:${s.id} | ${s.title} (${s.sourceName})`)
    .join("\n");

  const projectList = projects.filter(p => p.status === "active")
    .map(p => `  - ID:${p.id} | ${p.name}`)
    .join("\n") || "  (暂无活跃项目)";

  const systemPrompt = `You are a sharp product research analyst using the Lumo tool. Your job: read each source carefully and extract precise, specific insights that a PM can actually use.

SOURCES (${targetSources.length} total):
${sampleSources}

AVAILABLE PROJECTS:
${projectList}

For EACH source you read, you MUST call these tools:
1. read_source — read the full content
2. save_claim — extract 1-2 SPECIFIC claims. A good claim:
   - Names specific products, features, numbers, or behaviors (not vague assertions)
   - Is a complete judgment sentence a PM could defend in a meeting
   - BAD: "该产品有核心功能" GOOD: "CeraVe 官网将神经酰胺成分作为首要信任背书，配方透明度是核心转化驱动"
   - confidence: high=source directly states this with data; medium=can be reasonably inferred; low=indirect/speculative
3. save_evidence — extract 1 concrete fact/quote/data point. Confidence rules (STRICT):
   - "high": source has exact quote, number, %, date, or direct statement supporting this
   - "medium": descriptive statement that can be inferred from source but not directly stated
   - "low": indirect association or weak support in source
4. recommend_project — match to the most relevant project, explain WHY in one specific sentence

After all sources: write 2-3 sentences summarizing the cross-source patterns you found. Be concrete — mention actual product names, numbers, or recurring themes. No vague generalizations.

FORMATTING (strictly enforced):
- Plain Chinese only. Zero markdown: no **, ##, *, -, or bullet points
- Every sentence must contain at least one specific noun (product name, metric, feature name)

Process at least ${Math.min(targetSources.length, 8)} sources. Call the tools — do not describe what you will do.`;

  const userMsg = params.goal
    ? `研究目标：${params.goal}\n\n请快读全部 ${targetSources.length} 篇资料，为每篇提炼具体观点和证据，并推荐归入项目。`
    : `请快读待处理的 ${targetSources.length} 篇资料，为每篇提炼观点和证据，并推荐应该归入哪个项目。`;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMsg },
  ];

  params.onEvent({ type: "thinking", text: `开始快读待处理资料（${targetSources.length} 篇）…` });

  let claimCount = 0;
  let evidenceCount = 0;
  let steps = 0;
  const MAX_STEPS = 20;

  while (steps < MAX_STEPS) {
    steps++;

    let response;
    try {
      response = await client.chat.completions.create({
        model: "deepseek-chat",
        max_tokens: 1200,
        tools: TOOLS,
        tool_choice: steps === 1 ? "required" : "auto", // Force tool use on first step
        messages,
      });
    } catch (err) {
      params.onEvent({ type: "error", error: `API 错误：${(err as Error).message}` });
      return;
    }

    const choice = response.choices[0];
    if (!choice) {
      params.onEvent({ type: "error", error: "API 没有返回结果" });
      return;
    }

    const msg = choice.message;
    messages.push(msg as ChatCompletionMessageParam);

    // Model sent a text message (final conclusion)
    if (msg.content && !msg.tool_calls?.length) {
      params.onEvent({ type: "message", text: msg.content });
    }

    // No tool calls → agent is done
    if (!msg.tool_calls?.length) {
      params.onEvent({
        type: "done",
        summary: msg.content ?? `已分析完成，共提炼 ${claimCount} 条观点、${evidenceCount} 条证据`,
        claimCount,
        evidenceCount,
      });
      return;
    }

    // Execute all tool calls
    for (const toolCall of msg.tool_calls) {
      const tc = toolCall as { id: string; function: { name: string; arguments: string } };
      let toolArgs: Record<string, unknown> = {};
      try {
        toolArgs = JSON.parse(tc.function.arguments);
      } catch { /* ignore parse errors */ }

      const result = executeTool(tc.function.name, toolArgs, params.onEvent);

      if (tc.function.name === "save_claim") claimCount++;
      if (tc.function.name === "save_evidence") evidenceCount++;

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }
  }

  // Max steps reached
  params.onEvent({
    type: "done",
    summary: `分析完成（达到最大步数）。共提炼 ${claimCount} 条观点、${evidenceCount} 条证据。`,
    claimCount,
    evidenceCount,
  });
}
