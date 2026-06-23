import { useState, useRef, useMemo } from "react";
import { Sparkles, X, RefreshCw, Lightbulb, ShieldCheck, Box, ChevronRight, BookOpen } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { AgentEvent } from "../services/agentService";

/** Strip common markdown syntax so AI output renders cleanly */
function stripMd(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")          // ### headings
    .replace(/\*\*(.+?)\*\*/g, "$1")       // **bold**
    .replace(/\*(.+?)\*/g, "$1")           // *italic*
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")// `code`
    .replace(/^---+\s*$/gm, "")            // --- dividers
    .replace(/^===+\s*$/gm, "")            // === dividers
    .replace(/^\s*[-*+]\s+/gm, "• ")       // bullet list markers
    .replace(/^\d+\.\s+/gm, "")            // numbered lists
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")    // [links](url)
    .replace(/_{2,}/g, "")                 // __underline__
    .replace(/\n{3,}/g, "\n\n")            // excessive blank lines → max 2
    .trim();
}

/** Render clean text with proper paragraphs and line breaks */
function CleanText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const cleaned = stripMd(text);
  // Split into paragraphs (double newline), then render each as <p>
  const paragraphs = cleaned.split(/\n{2,}/).filter(p => p.trim().length > 0);
  if (paragraphs.length <= 1) {
    // Single block: respect single line breaks
    const lines = cleaned.split("\n").filter(l => l.trim().length > 0);
    return (
      <span style={{ display:"block", lineHeight:1.6, ...style }}>
        {lines.map((line, i) => (
          <span key={i} style={{ display:"block", marginBottom: i < lines.length - 1 ? 4 : 0 }}>{line}</span>
        ))}
      </span>
    );
  }
  return (
    <span style={{ display:"block", ...style }}>
      {paragraphs.map((para, i) => {
        const lines = para.split("\n").filter(l => l.trim().length > 0);
        return (
          <span key={i} style={{ display:"block", marginBottom: i < paragraphs.length - 1 ? 10 : 0, lineHeight:1.6 }}>
            {lines.map((line, j) => (
              <span key={j} style={{ display:"block" }}>{line}</span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

export function AgentPanel({ projectName, onClose, english }: { projectName: string; onClose: () => void; english: boolean }) {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const addSourceToProject = useAppStore((s) => s.addSourceToProject);
  const sources = useAppStore((s) => s.sources);
  const projects = useAppStore((s) => s.projects);
  const [goal, setGoal] = useState("");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sourcesRead, setSourcesRead] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  const pendingCount = sources.filter(s => !["archived","deleted"].includes(s.status)).length;

  const claims = useMemo(() => events.filter((e): e is Extract<AgentEvent, { type: "claim_saved" }> => e.type === "claim_saved"), [events]);
  const evidences = useMemo(() => events.filter((e): e is Extract<AgentEvent, { type: "evidence_saved" }> => e.type === "evidence_saved"), [events]);
  const recommendations = useMemo(() => events.filter((e): e is Extract<AgentEvent, { type: "project_recommended" }> => e.type === "project_recommended"), [events]);
  const currentlyReading = useMemo(() => {
    const r = [...events].reverse().find((e): e is Extract<AgentEvent, { type: "reading" }> => e.type === "reading");
    return r ?? null;
  }, [events]);
  const finalSummary = useMemo(() => {
    const d = events.find((e): e is Extract<AgentEvent, { type: "done" }> => e.type === "done");
    return d?.summary ?? null;
  }, [events]);

  const emit = (event: AgentEvent) => {
    if (abortRef.current) return;
    if (event.type === "reading") {
      setSourcesRead((prev) => prev.includes(event.sourceTitle) ? prev : [...prev, event.sourceTitle]);
    }
    setEvents((prev) => [...prev, event]);
    requestAnimationFrame(() => {
      if (resultsRef.current) resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
    });
  };

  const cancel = () => { abortRef.current = true; setRunning(false); setDone(true); };

  const start = async (customGoal?: string) => {
    abortRef.current = false;
    setEvents([]);
    setDone(false);
    setRunning(true);
    setSourcesRead([]);
    try {
      const { runResearchAgent } = await import("../services/agentService");
      await runResearchAgent({ goal: customGoal || goal || undefined, projectName, onEvent: emit });
    } catch (err) {
      if (!abortRef.current) emit({ type: "error", error: (err as Error).message });
    } finally {
      setRunning(false);
      setDone(true);
    }
  };

  const reset = () => { setDone(false); setEvents([]); setGoal(""); setSourcesRead([]); setSelectedSource(null); };

  const PRESETS = english
    ? ["What are the key differentiators?", "Extract growth mechanisms", "Which sources belong to which project?"]
    : ["各资料的核心差异化是什么？", "提炼增长机制相关观点", "帮我判断每篇应该入哪个项目"];

  return (
    <div className="agent-panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="agent-panel">
        {/* Header */}
        <div className="agent-panel-header">
          <div className="agent-panel-title">
            <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#a78bfa,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <strong>Lumo Agent</strong>
              <small>{english ? `Quick-read all ${pendingCount} sources, extract claims & evidence, recommend projects` : `快读全部 ${pendingCount} 篇资料，提炼观点和证据，推荐归入哪个项目`}</small>
            </div>
          </div>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Input — before start */}
        {!running && !done && (
          <div className="agent-goal-section">
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:"#f5f3ff", marginBottom:14 }}>
              <Sparkles size={14} color="#7c3aed" />
              <span style={{ fontSize:13, color:"#5b21b6", fontWeight:600 }}>
                {pendingCount > 0
                  ? `将快读全部 ${pendingCount} 篇资料，提炼观点和证据，并推荐每篇可归入的项目`
                  : "资料库暂无资料，请先收藏一些内容"}
              </span>
            </div>
            <label style={{ fontSize:12, color:"#6b7280", fontWeight:600, marginBottom:6, display:"block" }}>
              可选：添加研究焦点（不填则全面扫描）
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              className="agent-goal-input"
              placeholder="例如：重点关注增长机制和用户留存策略"
            />
            <div className="agent-goal-tips">
              {PRESETS.map((tip) => (
                <button key={tip} type="button" className="agent-tip-chip" onClick={() => setGoal(tip)}>{tip}</button>
              ))}
            </div>
            <button type="button" className="agent-start-btn" onClick={() => start()} disabled={pendingCount === 0}>
              <Sparkles size={15} /> {english ? `Start quick-read (${pendingCount} sources)` : `开始快读（全部 ${pendingCount} 篇）`}
            </button>
          </div>
        )}

        {/* Status bar while running */}
        {running && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background:"#f5f3ff", borderBottom:"1px solid #e9d5ff", flexShrink:0 }}>
            <span className="agent-live-spinner" />
            <span style={{ fontSize:12, color:"#6d28d9", fontWeight:600, flex:1 }}>
              {currentlyReading ? `正在读取：${currentlyReading.sourceTitle.slice(0,28)}…` : "搜索相关资料中…"}
            </span>
            <span style={{ fontSize:11, color:"#a78bfa" }}>
              {claims.length > 0 && `💡${claims.length}  `}{evidences.length > 0 && `🛡️${evidences.length}`}
            </span>
            <button type="button" onClick={cancel}
              style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #fca5a5", background:"#fef2f2", color:"#dc2626", fontSize:11, fontWeight:600, cursor:"pointer", flexShrink:0 }}>
              停止
            </button>
          </div>
        )}

        {/* Two-column split: source list + detail */}
        {(running || done) && sourcesRead.length > 0 && (
          <div className="agent-results-split">
            {/* Left: source list */}
            <div className="agent-source-list">
              {sourcesRead.map((title) => {
                const sc = claims.filter(c => c.sourceTitle === title);
                const se = evidences.filter(e => e.sourceTitle === title);
                const isReading = running && currentlyReading?.sourceTitle === title;
                const isSelected = selectedSource === title || (!selectedSource && sourcesRead[0] === title);
                return (
                  <div key={title}
                    className={`agent-source-row${isSelected ? " selected" : ""}${isReading ? " reading" : ""}`}
                    onClick={() => setSelectedSource(title)}>
                    <div className={`agent-source-dot${isReading ? " reading" : (sc.length > 0 || se.length > 0) ? " has-content" : ""}`} />
                    <span className="agent-source-title">{title}</span>
                    <div className="agent-source-counts">
                      {sc.length > 0 && <span className="agent-count-pill agent-count-claim">💡{sc.length}</span>}
                      {se.length > 0 && <span className="agent-count-pill agent-count-evidence">🛡️{se.length}</span>}
                    </div>
                    {isSelected && <ChevronRight size={12} style={{ color:"#6366f1", flexShrink:0 }} />}
                  </div>
                );
              })}
            </div>

            {/* Right: detail panel */}
            {(() => {
              const title = selectedSource ?? sourcesRead[0];
              const sc = claims.filter(c => c.sourceTitle === title);
              const se = evidences.filter(e => e.sourceTitle === title);
              const rec = recommendations.find(r => r.sourceTitle === title);
              const isReading = running && currentlyReading?.sourceTitle === title;
              return (
                <div className="agent-detail-panel" ref={resultsRef}>
                  {title && (
                    <>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <BookOpen size={15} color="#6366f1" style={{ flexShrink:0 }} />
                        <h3 className="agent-detail-title">{title}</h3>
                        {isReading && (
                          <span style={{ fontSize:11, color:"#7c3aed", display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                            <span className="agent-live-spinner" style={{ width:8, height:8 }} /> 阅读中
                          </span>
                        )}
                      </div>
                      {sc.length === 0 && se.length === 0 && !rec && (
                        <div className="agent-detail-empty">
                          {isReading ? "正在提炼，稍候…" : "暂无内容"}
                        </div>
                      )}
                      {sc.length > 0 && (
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          <div style={{ fontSize:11, fontWeight:800, color:"#92400e", textTransform:"uppercase", letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:5 }}>
                            <Lightbulb size={11} /> 观点 ({sc.length})
                          </div>
                          {sc.map((c, i) => (
                            <div key={i} className="agent-claim-card">
                              <div className="agent-card-label">
                                <Lightbulb size={10} /> 观点
                                <span className="agent-conf-badge">{c.confidence === "high" ? "高置信" : c.confidence === "medium" ? "中置信" : "低置信"}</span>
                              </div>
                              <CleanText text={c.text} style={{ fontSize:13 }} />
                            </div>
                          ))}
                        </div>
                      )}
                      {se.length > 0 && (
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          <div style={{ fontSize:11, fontWeight:800, color:"#166534", textTransform:"uppercase", letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:5 }}>
                            <ShieldCheck size={11} /> 证据 ({se.length})
                          </div>
                          {se.map((e, i) => (
                            <div key={i} className="agent-evidence-card">
                              <div className="agent-card-label"><ShieldCheck size={10} /> 证据</div>
                              <CleanText text={e.text} style={{ fontSize:13 }} />
                            </div>
                          ))}
                        </div>
                      )}
                      {rec && (
                        <div className="agent-rec-card">
                          <Box size={14} color="#4f46e5" style={{ flexShrink:0 }} />
                          <div className="agent-rec-text">
                            <strong>建议归入：{rec.projectName}</strong>
                            <div style={{ marginTop:3, fontSize:11, opacity:0.85 }}>{stripMd(rec.reason)}</div>
                          </div>
                          <button type="button" className="agent-rec-btn"
                            onClick={() => { const source = sources.find(s => s.id === rec.sourceId); if (source) addSourceToProject(source.id, rec.projectId); }}>
                            入项目 →
                          </button>
                        </div>
                      )}
                      {done && finalSummary && title === (selectedSource ?? sourcesRead[0]) && sourcesRead.indexOf(title) === sourcesRead.length - 1 && (
                        <div className="agent-result-summary" style={{ marginTop:8 }}>
                          <span className="agent-result-badge summary">🎯 总结</span>
                          <CleanText text={finalSummary} style={{ fontSize:13 }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Empty start state */}
        {!running && !done && sourcesRead.length === 0 && events.length > 0 && (
          <div style={{ padding:"20px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
            ⚠️ 未提炼到内容。请先在设置中配置 DeepSeek API Key。
          </div>
        )}

        {/* Done actions */}
        {done && (
          <div className="agent-done-actions">
            <button type="button" className="agent-restart-btn" onClick={reset}>
              <RefreshCw size={14} /> 重新快读
            </button>
            <button type="button" className="agent-close-btn" onClick={() => { setActiveView("claims"); onClose(); }}>
              <Lightbulb size={14} /> 查看全部观点
            </button>
            <button type="button" className="agent-close-btn primary" onClick={onClose}>完成</button>
          </div>
        )}
      </div>
    </div>
  );
}
