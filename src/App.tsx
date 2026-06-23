import {
  Archive,
  BookOpen,
  Box,
  Brain,
  Camera,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileOutput,
  Folder,
  Globe2,
  Highlighter,
  Heart,
  Home,
  Image as ImageIcon,
  Inbox,
  Keyboard,
  Laptop,
  Lightbulb,
  Link2,
  ListTodo,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  Moon,
  Palette,
  Plug,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Smartphone,
  Sun,
  Tags,
  Trash2,
  Upload,
  UserCircle,
  Users,
  Video,
  Volume2,
  FileText,
  X,
  Mic,
  GitBranch,
  ZoomOut,
  ChevronDown,
  User,
  Briefcase,
  MapPin,
  BarChart2,
  BookOpen as BookOpenIcon,
  ClipboardList,
  Film,
  PenLine,
  Network,
  LogIn,
  LogOut,
  ChevronRight as ChevronRightIcon,
  MessageCircle,
  Cpu,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { FormEvent, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState, Component, type ErrorInfo, type ReactNode } from "react";
import { AgentPanel } from "./components/AgentPanel";
import { Matrix } from "./components/Matrix";
import { realCase } from "./data/realCase";
import { useAppStore } from "./store/useAppStore";
import type { AppLanguage, NavPlacement, ThemeMode } from "./store/useAppStore";
import { getStorageUsageBytes, STORAGE_WARN_BYTES, STORAGE_MAX_BYTES } from "./store/useAppStore";
import * as aiService from "./services/aiService";
import * as supabaseService from "./services/supabaseService";
import type { AgentEvent } from "./services/agentService";
import type { ActiveView, Claim, Collection, Deliverable, DeliverableType, Evidence, HighlightColor, Insight, LumoCommunityPost, LumoVisitor, Note, Project, Purpose, SocialPlatform, Source, SourceType, TeamMemberRole } from "./types";
import { deliverableLabel, formatDate, purposeLabel, sourceTypeLabel, triageLabel } from "./utils/format";
import { sourceMatchesQuery } from "./utils/filters";

// Deliverable type → icon mapping
function deliverableIcon(type: DeliverableType) {
  switch (type) {
    case "research_brief":    return <FileText size={14} />;
    case "competitive_analysis": return <BarChart2 size={14} />;
    case "article_outline":  return <PenLine size={14} />;
    case "prd":              return <ClipboardList size={14} />;
    case "content_script":   return <Film size={14} />;
    default:                 return <FileText size={14} />;
  }
}

/** Badge showing deliverable origin: AI-generated vs manually assembled */
function DeliverableOriginBadge({ origin }: { origin?: "ai" | "manual" }) {
  if (origin === "manual") {
    return (
      <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, background:"#f0fdf4", color:"#166534", fontWeight:700, display:"inline-flex", alignItems:"center", gap:3 }}>
        <PenLine size={9} /> 我的灵感
      </span>
    );
  }
  return (
    <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, background:"#ede9fe", color:"#5b21b6", fontWeight:700, display:"inline-flex", alignItems:"center", gap:3 }}>
      <Sparkles size={9} /> AI 生成
    </span>
  );
}

/** Confidence badge with hover tooltip explaining the definition */
const CONF_DEF = {
  high:   { label:"High",   color:"#16a34a", bg:"#dcfce7", tip:'原文有明确数字、直接引语或权威数据支撑这个判断。例如：文章直接写明「转化率提升了 23%」。' },
  medium: { label:"Medium", color:"#d97706", bg:"#fef3c7", tip:'判断可从原文合理推导，但原文没有直接说出这句话。属于合理解读，有一定推断成分。' },
  low:    { label:"Low",    color:"#6b7280", bg:"#f3f4f6", tip:'主要是推断或外部关联，原文支撑较弱。请在使用前自行核实。' },
};
function ConfidenceBadge({ confidence }: { confidence: string }) {
  const def = CONF_DEF[confidence as keyof typeof CONF_DEF] ?? CONF_DEF.medium;
  return (
    <span style={{ position:"relative", display:"inline-block" }} className="conf-badge-wrap">
      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:99, background:def.bg, color:def.color, fontWeight:600, cursor:"default", display:"inline-flex", alignItems:"center", gap:3, letterSpacing:"0.04em" }}>
        <Lightbulb size={9} /> {def.label}
      </span>
      <span className="conf-badge-tip">
        <strong style={{ display:"block", marginBottom:4 }}>{confidence === "high" ? "高置信 / High" : confidence === "medium" ? "中置信 / Medium" : "低置信 / Low"}</strong>
        {def.tip}
      </span>
    </span>
  );
}

/** Button to add any item to the current project's knowledge graph */
function AddToGraphBtn({ projectId, label = "加入图谱" }: { projectId?: string; label?: string }) {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const notify = useAppStore((s) => s.notify);
  const projects = useAppStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const handleClick = () => {
    const targetId = projectId || selectedProjectId || projects[0]?.id;
    if (!targetId) { notify("请先创建或选择一个项目"); return; }
    setSelectedProject(targetId);
    setActiveView("projects");
    notify("已在项目图谱中标注，前往「研究项目 → 知识图谱」查看");
  };

  return (
    <button type="button" onClick={handleClick}
      style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 8px", borderRadius:7, border:"1px solid #e5e7eb", background:"#f8fafc", color:"#6b7280", fontSize:11, fontWeight:600, cursor:"pointer", transition:"all 0.1s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor="#a78bfa"; (e.currentTarget as HTMLButtonElement).style.color="#6d28d9"; (e.currentTarget as HTMLButtonElement).style.background="#f5f3ff"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor="#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.color="#6b7280"; (e.currentTarget as HTMLButtonElement).style.background="#f8fafc"; }}>
      <Network size={10} /> {label}
    </button>
  );
}

const nav: Array<{ id: ActiveView; label: string; labelEn: string; icon: typeof Inbox }> = [
  { id: "sources", label: "资料库", labelEn: "Library", icon: BookOpen },
  { id: "collections", label: "主题夹", labelEn: "Topics", icon: Folder },
  { id: "reader", label: "阅读器", labelEn: "Reader", icon: BookOpen },
  { id: "projects", label: "研究项目", labelEn: "Projects", icon: Box },
  { id: "deliverables", label: "成果", labelEn: "Deliverables", icon: FileOutput },
  { id: "settings", label: "设置", labelEn: "Settings", icon: Settings },
];

const sourceTypes: SourceType[] = ["article", "webpage", "video", "audio", "pdf", "note", "image", "newsletter"];
const purposes: Purpose[] = ["later_reading", "project_research", "competitor_analysis", "writing_material", "interview_prep", "learning", "task_reference", "inspiration"];
const deliverableTypes: DeliverableType[] = ["research_brief", "competitive_analysis", "article_outline", "prd", "content_script"];

const EVIDENCE_TYPE_TIPS: Record<string, string> = {
  quote:         "直接引用的原文或话语",
  feature:       "描述产品功能特性",
  market_signal: "市场动向、行业信号",
  example:       "具体案例或举例",
  method:        "方法论、做法描述",
  definition:    "定义或概念解释",
  data:          "数据或量化指标",
  insight:       "综合性洞察结论",
};
type QuickCaptureMode = "link" | "article_snapshot" | "image_snapshot" | "video_timestamp";
type ExtensionClip = {
  kind?: QuickCaptureMode;
  kindLabel?: string;
  title?: string;
  url?: string;
  host?: string;
  description?: string;
  image?: string;
  selection?: string;
  articleText?: string;
  screenshot?: string;
  savedAt?: string;
  video?: { currentTime?: number; duration?: number; src?: string } | null;
};
const shortcutCards: Array<{ keys: string; title: string; description: string; mode?: QuickCaptureMode }> = [
  { keys: "⌘ / Ctrl + K", title: "全局搜索", description: "快速查找资料、标签、观点、证据。" },
  { keys: "⌘ / Ctrl + J", title: "呼出 Lumo 助手", description: "在任意 Lumo 页面询问当前资料、项目、成果和 AI 分析逻辑。" },
  { keys: "⌘ / Ctrl + Shift + S", title: "快速收藏当前链接", description: "Chrome 插件在任意网页保存标题、URL 和站点信息。", mode: "link" },
  { keys: "⌘ / Ctrl + Shift + A", title: "保存文章图文快照", description: "保存标题、URL、摘要、封面图和正文片段。", mode: "article_snapshot" },
  { keys: "⌘ / Ctrl + Shift + X", title: "保存网页截图", description: "保存图片区域、页面截图、来源链接和说明。", mode: "image_snapshot" },
  { keys: "⌘ / Ctrl + Shift + V", title: "收藏视频时间点", description: "保存视频链接、时间点、截图和笔记。", mode: "video_timestamp" },
  { keys: "?", title: "查看快捷键", description: "打开 Lumo 快捷搜集说明。" },
];
const mediaAssets = [
  { type: "image", label: "图片资料", title: "真实研究桌面照片", path: "/media/lumo-real-reading-desk.jpg", icon: ImageIcon, description: "真实照片资产：适合作为网页快照、研究素材和资料卡封面。" },
  { type: "video", label: "视频资料", title: "收藏到成果流程演示", path: "/media/lumo-demo.mp4", fallback: "/media/lumo-demo.gif", icon: Video, description: "视频样例：动态展示从收藏到成果的流转。" },
  { type: "audio", label: "音频资料", title: "Lumo 研究简报音频", path: "/media/lumo-briefing.wav", icon: Volume2, description: "音频样例：访谈、播客、会议或语音备忘。" },
  { type: "text", label: "文本资料", title: "Lumo 研究样例文本", path: "/media/lumo-research-note.txt", icon: FileText, description: "文本样例：可导入 AI Inbox 的本地研究资料。" },
] as const;
const themeOptions: Array<{ id: ThemeMode; label: string; short: string; description: string; icon: typeof Sun }> = [
  { id: "light", label: "明亮", short: "明亮", description: "默认清爽白底，适合白天阅读和整理资料。", icon: Sun },
  { id: "dark", label: "夜晚", short: "夜晚", description: "低亮度深色底，适合晚上阅读、图谱梳理和长时间工作。", icon: Moon },
  { id: "warm", label: "暖白", short: "暖白", description: "柔和纸感底色，降低长文阅读时的视觉疲劳。", icon: Palette },
  { id: "mint", label: "薄荷", short: "薄荷", description: "偏冷静的浅绿色背景，适合轻量浏览和资料筛选。", icon: Palette },
];
const themeBackgrounds: Record<ThemeMode, string> = {
  light: "#f8fafc",
  dark: "#080d19",
  warm: "#fbf6ea",
  mint: "#effaf5",
};
const lumoPricingPlans: Array<{
  id: string;
  name: string;
  nameEn: string;
  badge: string;
  badgeEn: string;
  price: string;
  period: string;
  periodEn: string;
  target: string;
  targetEn: string;
  description: string;
  descriptionEn: string;
  limits: string[];
  limitsEn: string[];
  features: string[];
  featuresEn: string[];
  cta: string;
  ctaEn: string;
  tone: "neutral" | "blue" | "green" | "purple" | "yellow" | "red";
  featured?: boolean;
}> = [
  {
    id: "starter",
    name: "Starter 免费",
    nameEn: "Starter Free",
    badge: "获客入口",
    badgeEn: "Acquisition",
    price: "¥0",
    period: "永久免费",
    periodEn: "forever",
    target: "轻量收藏、产品演示、学生试用",
    targetEn: "light capture, demos and student trials",
    description: "让用户先形成保存资料和回看证据的习惯，但保留清晰的容量和 AI 次数上限。",
    descriptionEn: "Build the habit of saving material and checking evidence, with clear storage and AI limits.",
    limits: ["100 条资料", "1 个项目空间", "20 次 AI 提炼 / 月"],
    limitsEn: ["100 saved items", "1 project workspace", "20 AI extractions / month"],
    features: ["网页收藏与原文快照", "基础阅读器和标签", "Markdown / JSON 导出"],
    featuresEn: ["web capture and source snapshots", "basic reader and tags", "Markdown / JSON export"],
    cta: "免费使用",
    ctaEn: "Get started free",
    tone: "blue",
  },
  {
    id: "pro",
    name: "Lumo Pro",
    nameEn: "Lumo Pro",
    badge: "个人付费主力",
    badgeEn: "Core paid plan",
    price: "¥49",
    period: "/ 月 · 年付 ¥529（省10%）",
    periodEn: "/ mo · ¥529 yearly (save 10%)",
    target: "知识工作者、PM、研究生、独立创作者",
    targetEn: "knowledge workers, PMs, students and solo creators",
    description: "对标 AI 笔记和深度阅读产品的主流价格带，用更强的证据链和项目图谱拉开价值差。",
    descriptionEn: "Priced against AI note and deep-reading tools, with evidence trails and project graphs as the value gap.",
    limits: ["1,500 次 AI credits / 月", "12 个项目空间", "20GB 原文快照存储"],
    limitsEn: ["1,500 AI credits / month", "12 project workspaces", "20GB snapshot storage"],
    features: ["AI 分类、摘要、标签和证据判断", "项目图谱与思维导图编辑", "PDF / 图片 OCR 和跨资料搜索"],
    featuresEn: ["AI triage, summaries, tags and evidence reasoning", "project graph and mind-map editing", "PDF / image OCR and cross-source search"],
    cta: "升级 Pro",
    ctaEn: "Upgrade to Pro",
    tone: "green",
    featured: true,
  },
  {
    id: "studio",
    name: "Lumo Studio",
    nameEn: "Lumo Studio",
    badge: "高价值个人",
    badgeEn: "Power users",
    price: "¥99",
    period: "/ 月 · 年付 ¥1,069（省10%）",
    periodEn: "/ mo · ¥1,069 yearly (save 10%)",
    target: "研究员、咨询顾问、内容团队主笔",
    targetEn: "researchers, consultants and lead writers",
    description: "面向高频资料处理和成果输出，用更高 AI 额度、长文档和多媒体处理承接重度用户。",
    descriptionEn: "For high-frequency research and output workflows with higher AI quota, long documents and media processing.",
    limits: ["5,000 次 AI credits / 月", "无限项目空间", "100GB 快照与附件存储"],
    limitsEn: ["5,000 AI credits / month", "unlimited workspaces", "100GB snapshot and file storage"],
    features: ["长 PDF / 视频 / 音频转写与总结", "研究简报、PRD、竞品报告一键生成", "Notion / Obsidian / Zotero 高级同步"],
    featuresEn: ["long PDF / video / audio transcription and summaries", "one-click briefs, PRDs and competitive reports", "advanced Notion / Obsidian / Zotero sync"],
    cta: "选择 Studio",
    ctaEn: "Choose Studio",
    tone: "purple",
  },
];
const pricingBenchmarks = [
  { name: "个人专业", price: "¥29-49/月", note: "适合作为首个付费门槛" },
  { name: "个人重度", price: "¥69-99/月", note: "用长文档和高额度拉开差异" },
  { name: "AI 加量包", price: "¥19/1,000 credits", note: "控制大模型成本和毛利" },
  { name: "存储加购", price: "¥15/100GB/月", note: "原文快照和附件单独变现" },
];
const monetizationLevers = [
  { label: "订阅", labelEn: "Subscription", value: "Free → Pro → Studio", detail: "用 AI 次数、存储和项目数形成自然升级点。", detailEn: "Natural upgrade gates through AI credits, storage and project limits." },
  { label: "AI 用量包", labelEn: "AI usage packs", value: "¥19 / 1,000 credits", detail: "重度总结、长 PDF、视频转写按 credits 消耗，避免大模型成本失控。", detailEn: "Long PDFs, summaries and media transcription consume credits to protect model margins." },
  { label: "存储加购", labelEn: "Storage add-on", value: "¥15 / 100GB / 月", detail: "原文快照、PDF、图片和音视频附件进入独立存储收入。", detailEn: "Snapshots, PDFs, images and media files become a separate storage revenue line." },
];

function nextThemeMode(themeMode: ThemeMode) {
  const index = themeOptions.findIndex((item) => item.id === themeMode);
  return themeOptions[(index + 1) % themeOptions.length].id;
}

function navItemLabel(item: (typeof nav)[number], language: AppLanguage) {
  return language === "en" ? item.labelEn : item.label;
}

function isEn(language: AppLanguage) {
  return language === "en";
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "green" | "purple" | "yellow" | "red" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

// ── Plan gates ─────────────────────────────────────────────────────────────
type PlanTier = "starter" | "pro" | "studio";
const PLAN_RANK: Record<PlanTier, number> = { starter: 0, pro: 1, studio: 2 };

function usePlan() {
  const plan = useAppStore((s) => s.userProfile.plan) as PlanTier;
  return {
    plan,
    isPro: PLAN_RANK[plan] >= PLAN_RANK.pro,
    isStudio: PLAN_RANK[plan] >= PLAN_RANK.studio,
  };
}

function ProBadge() {
  return <span style={{ fontSize:10, fontWeight:700, padding:"1px 5px", borderRadius:4, background:"linear-gradient(135deg,#a78bfa,#6366f1)", color:"#fff", letterSpacing:"0.03em", flexShrink:0 }}>Pro</span>;
}

/** Renders children only for Pro+; otherwise renders fallback (or nothing) */
function ProGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isPro } = usePlan();
  if (isPro) return <>{children}</>;
  return <>{fallback ?? null}</>;
}

/** Inline upgrade prompt shown in place of gated features */
function UpgradePrompt({ feature, onClose }: { feature: string; onClose?: () => void }) {
  const setActiveView = useAppStore((s) => s.setActiveView);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(10,15,30,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, padding:"28px 32px", maxWidth:360, width:"90%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", position:"relative" }}
        onClick={e => e.stopPropagation()}>
        {onClose && (
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:18, lineHeight:1, padding:4 }}
            title="关闭">×</button>
        )}
        <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
        <h3 style={{ margin:"0 0 8px", fontSize:17, fontWeight:700 }}>{feature}</h3>
        <p style={{ margin:"0 0 20px", fontSize:14, color:"#6b7280" }}>这是 Pro 专属功能。升级后即可使用 Lumo Agent、云同步和无限项目。</p>
        <button
          style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#a78bfa,#6366f1)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}
          onClick={() => { setActiveView("settings"); onClose?.(); }}>
          升级到 Pro →
        </button>
        {onClose && (
          <button onClick={onClose}
            style={{ display:"block", margin:"10px auto 0", background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#9ca3af" }}>
            取消
          </button>
        )}
      </div>
    </div>
  );
}


function Button({ children, onClick, variant = "secondary", type = "button", title, className = "", ariaPressed, disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; type?: "button" | "submit"; title?: string; className?: string; ariaPressed?: boolean; disabled?: boolean }) {
  return <button className={`button ${variant} ${className}`.trim()} onClick={onClick} type={type} title={title} aria-pressed={ariaPressed} disabled={disabled}>{children}</button>;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([content], { type: mime }));
}

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 72) || "lumo-export";
}

function exportSourceBundle(data: ReturnType<typeof useAppStore.getState>) {
  const payload = {
    exportedAt: new Date().toISOString(),
    sources: data.sources.filter((source) => source.status !== "deleted"),
    collections: data.collections,
    projects: data.projects,
    highlights: data.highlights,
    notes: data.notes,
    claims: data.claims,
    evidence: data.evidence,
    insights: data.insights,
    deliverables: data.deliverables,
  };
  downloadTextFile(`lumo-export-${Date.now()}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

function exportSourcesMarkdown(data: ReturnType<typeof useAppStore.getState>) {
  const content = data.sources
    .filter((source) => source.status !== "deleted")
    .map((source) => [
      `## ${source.title}`,
      `- 来源：${source.url}`,
      `- 类型：${sourceTypeLabel(source.type)}`,
      `- 目的：${purposeLabel(source.purpose)}`,
      `- 保存时间：${formatDate(source.savedAt)}`,
      "",
      source.summary,
      "",
      "### 正文片段",
      ...source.content.map((paragraph) => `- ${paragraph}`),
    ].join("\n"))
    .join("\n\n---\n\n");
  downloadTextFile(`lumo-sources-${Date.now()}.md`, content, "text/markdown;charset=utf-8");
}

function exportSourcesCsv(data: ReturnType<typeof useAppStore.getState>) {
  const rows = [["title", "url", "source", "type", "purpose", "status", "savedAt"], ...data.sources.filter((source) => source.status !== "deleted").map((source) => [
    source.title,
    source.url,
    source.sourceName,
    source.type,
    source.purpose,
    source.status,
    source.savedAt,
  ])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadTextFile(`lumo-sources-${Date.now()}.csv`, csv, "text/csv;charset=utf-8");
}

function sourceToMarkdown(source: Source) {
  return [
    `# ${source.title}`,
    "",
    `- 来源：${source.url}`,
    `- 来源站点：${source.sourceName}`,
    `- 类型：${sourceTypeLabel(source.type)}`,
    `- 目的：${purposeLabel(source.purpose)}`,
    `- 状态：${source.status}`,
    `- 保存时间：${formatDate(source.savedAt)}`,
    "",
    "## AI 摘要",
    source.summary,
    "",
    "## 关键点",
    ...source.keyPoints.map((point) => `- ${point}`),
    "",
    "## 原始出处",
    ...(source.sourceReferences?.length ? source.sourceReferences.map((ref) => `- [${ref.label}](${ref.url})：${ref.note}`) : [`- [${source.title}](${source.url})`]),
    "",
    "## 正文片段",
    ...source.content.map((paragraph) => `- ${paragraph}`),
  ].join("\n");
}

function sourceToPlainText(source: Source) {
  return [
    source.title,
    `来源：${source.url}`,
    "",
    source.summary,
    "",
    source.keyPoints.join("\n"),
    "",
    source.content.join("\n\n"),
  ].join("\n");
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}

function escapeXml(value: string | number | undefined | null) {
  return escapeHtml(value);
}

function visualTextUnits(value: string) {
  return /[^\x00-\xff]/.test(value) ? 1.08 : value === " " ? 0.38 : 0.58;
}

function wrapVisualText(text: string, maxUnits: number, maxLines = 4) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let current = "";
  let units = 0;
  for (const char of Array.from(normalized)) {
    const charUnits = visualTextUnits(char);
    if (current && units + charUnits > maxUnits) {
      lines.push(current.trim());
      current = "";
      units = 0;
      if (lines.length >= maxLines) break;
    }
    current += char;
    units += charUnits;
  }
  if (current.trim() && lines.length < maxLines) lines.push(current.trim());
  if (!lines.length) lines.push("-");
  if (normalized && lines.join("").length < normalized.replace(/\s/g, "").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[。,.，;；:]?$/, "")}...`;
  }
  return lines;
}

function lumoDocumentShell(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    body{margin:0;background:#f6f8fb;color:#172033;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.68;}
    main{max-width:880px;margin:0 auto;padding:44px 28px 64px;}
    article{background:#fff;border:1px solid #e5eaf2;border-radius:24px;padding:36px;box-shadow:0 24px 70px rgba(15,23,42,.08);}
    h1{font-size:34px;line-height:1.15;margin:0 0 16px;color:#0f172a;} h2{margin:30px 0 10px;color:#0f172a;} p{margin:0 0 12px;} ul{padding-left:22px;} li{margin:7px 0;}
    .eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#2563eb;margin-bottom:10px;}
    .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:22px 0;padding:16px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;}
    .meta span{display:block;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}.meta strong{display:block;color:#0f172a;word-break:break-word;}
    .quote{border-left:4px solid #60a5fa;padding:12px 16px;background:#eff6ff;border-radius:12px;color:#1e3a8a;}
    @media print{body{background:#fff}main{padding:0}article{box-shadow:none;border:0;border-radius:0}.meta{break-inside:avoid}}
  </style></head><body><main>${body}</main></body></html>`;
}

function sourceToDocumentBody(source: Source) {
  const references = source.sourceReferences?.length ? source.sourceReferences : [{ label: source.title, url: source.url, note: "原始资料链接" }];
  return `<article>
    <p class="eyebrow">Lumo Source Export</p>
    <h1>${escapeHtml(source.title)}</h1>
    <section class="meta">
      <p><span>来源</span><strong>${escapeHtml(source.url)}</strong></p>
      <p><span>站点</span><strong>${escapeHtml(source.sourceName)}</strong></p>
      <p><span>类型</span><strong>${escapeHtml(sourceTypeLabel(source.type))}</strong></p>
      <p><span>保存时间</span><strong>${escapeHtml(formatDate(source.savedAt))}</strong></p>
    </section>
    <h2>AI 摘要</h2><p class="quote">${escapeHtml(source.summary)}</p>
    <h2>关键点</h2><ul>${source.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
    <h2>原始出处</h2><ul>${references.map((ref) => `<li><strong>${escapeHtml(ref.label)}</strong>：${escapeHtml(ref.note)}<br>${escapeHtml(ref.url)}</li>`).join("")}</ul>
    <h2>正文片段</h2>${source.content.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
  </article>`;
}

function sourcesToDocumentBody(data: ReturnType<typeof useAppStore.getState>) {
  const sources = data.sources.filter((source) => source.status !== "deleted");
  return `<article>
    <p class="eyebrow">Lumo Workspace Export</p>
    <h1>Lumo 资料库导出</h1>
    <section class="meta">
      <p><span>资料</span><strong>${sources.length}</strong></p>
      <p><span>项目</span><strong>${data.projects.length}</strong></p>
      <p><span>观点</span><strong>${data.claims.length}</strong></p>
      <p><span>证据</span><strong>${data.evidence.length}</strong></p>
    </section>
    ${sources.map((source) => `<h2>${escapeHtml(source.title)}</h2><p class="quote">${escapeHtml(source.summary)}</p><ul>${source.keyPoints.slice(0, 5).map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul><p><strong>来源：</strong>${escapeHtml(source.url)}</p>`).join("")}
  </article>`;
}

function exportSourceWord(source: Source) {
  downloadTextFile(`${safeFilename(source.title)}.doc`, lumoDocumentShell(source.title, sourceToDocumentBody(source)), "application/msword;charset=utf-8");
}

function exportSourcesWord(data: ReturnType<typeof useAppStore.getState>) {
  downloadTextFile(`lumo-sources-${Date.now()}.doc`, lumoDocumentShell("Lumo 资料库导出", sourcesToDocumentBody(data)), "application/msword;charset=utf-8");
}

type VisualExportDocument = { svg: string; width: number; height: number };
type VisualExportFormat = "svg" | "png" | "jpg" | "pdf";

function appendSvgText(lines: string[], x: number, y: number, size: number, lineHeight: number, color = "#172033", weight = 560) {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif">${escapeXml(line)}</text>`).join("");
}

function sourceToVisualDocument(source: Source): VisualExportDocument {
  const width = 1440;
  const margin = 92;
  const parts: string[] = [];
  let y = 82;
  const titleLines = wrapVisualText(source.title, 33, 3);
  parts.push(`<text x="${margin}" y="${y}" fill="#2563eb" font-size="22" font-weight="800" letter-spacing="3" font-family="Arial, 'PingFang SC', sans-serif">LUMO SOURCE EXPORT</text>`);
  y += 62;
  parts.push(appendSvgText(titleLines, margin, y, 56, 66, "#0f172a", 850));
  y += titleLines.length * 66 + 28;
  const meta = [`${sourceTypeLabel(source.type)} · ${purposeLabel(source.purpose)} · ${formatDate(source.savedAt)}`, source.sourceName, source.url];
  parts.push(appendSvgText(meta.flatMap((item) => wrapVisualText(item, 80, 1)), margin, y, 24, 34, "#475569", 620));
  y += 122;
  const appendCard = (title: string, lines: string[], accent: string) => {
    const cardY = y;
    const cardHeight = 86 + Math.max(1, lines.length) * 34;
    parts.push(`<rect x="${margin}" y="${cardY}" width="${width - margin * 2}" height="${cardHeight}" rx="30" fill="#ffffff" stroke="#dbeafe"/>`);
    parts.push(`<rect x="${margin}" y="${cardY}" width="12" height="${cardHeight}" rx="6" fill="${accent}"/>`);
    parts.push(`<text x="${margin + 34}" y="${cardY + 48}" fill="#0f172a" font-size="28" font-weight="820" font-family="Arial, 'PingFang SC', sans-serif">${escapeXml(title)}</text>`);
    parts.push(appendSvgText(lines, margin + 34, cardY + 90, 23, 34, "#334155", 540));
    y += cardHeight + 28;
  };
  appendCard("AI 摘要", wrapVisualText(source.summary, 78, 6), "#2563eb");
  appendCard("关键点", source.keyPoints.slice(0, 6).flatMap((point, index) => wrapVisualText(`${index + 1}. ${point}`, 78, 2)), "#16a34a");
  appendCard("正文片段", source.content.slice(0, 5).flatMap((paragraph, index) => wrapVisualText(`${index + 1}. ${paragraph}`, 82, 2)), "#f59e0b");
  const height = Math.max(1320, y + 78);
  const background = `<rect width="${width}" height="${height}" fill="#f7fbff"/><circle cx="1200" cy="130" r="230" fill="#dbeafe" opacity="0.72"/><circle cx="118" cy="${height - 90}" r="190" fill="#dcfce7" opacity="0.62"/>`;
  return { width, height, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${background}${parts.join("")}<text x="${margin}" y="${height - 42}" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">Generated by Lumo · ${escapeXml(new Date().toLocaleString())}</text></svg>` };
}

function sourcesToVisualDocument(data: ReturnType<typeof useAppStore.getState>): VisualExportDocument {
  const sources = data.sources.filter((source) => source.status !== "deleted");
  const width = 1440;
  const margin = 92;
  const parts: string[] = [];
  let y = 86;
  parts.push(`<text x="${margin}" y="${y}" fill="#0f766e" font-size="22" font-weight="800" letter-spacing="3" font-family="Arial, 'PingFang SC', sans-serif">LUMO WORKSPACE EXPORT</text>`);
  y += 70;
  parts.push(appendSvgText(["资料库导出报告"], margin, y, 60, 70, "#0f172a", 860));
  y += 96;
  const stats = [["资料", sources.length], ["项目", data.projects.length], ["观点", data.claims.length], ["证据", data.evidence.length], ["洞察", data.insights.length]];
  stats.forEach(([label, value], index) => {
    const x = margin + index * 246;
    parts.push(`<rect x="${x}" y="${y}" width="218" height="116" rx="26" fill="#ffffff" stroke="#ccfbf1"/>`);
    parts.push(`<text x="${x + 24}" y="${y + 46}" fill="#64748b" font-size="22" font-weight="700" font-family="Arial, 'PingFang SC', sans-serif">${escapeXml(label)}</text>`);
    parts.push(`<text x="${x + 24}" y="${y + 88}" fill="#0f766e" font-size="42" font-weight="860" font-family="Arial, sans-serif">${value}</text>`);
  });
  y += 164;
  sources.slice(0, 10).forEach((source, index) => {
    const titleLines = wrapVisualText(`${index + 1}. ${source.title}`, 52, 2);
    const summaryLines = wrapVisualText(source.summary, 72, 2);
    const rowHeight = 94 + titleLines.length * 34 + summaryLines.length * 30;
    parts.push(`<rect x="${margin}" y="${y}" width="${width - margin * 2}" height="${rowHeight}" rx="26" fill="#ffffff" stroke="#e2e8f0"/>`);
    parts.push(appendSvgText(titleLines, margin + 30, y + 48, 28, 34, "#0f172a", 780));
    parts.push(`<text x="${margin + 30}" y="${y + 44 + titleLines.length * 34}" fill="#2563eb" font-size="18" font-weight="760" font-family="Arial, 'PingFang SC', sans-serif">${escapeXml(sourceTypeLabel(source.type))} · ${escapeXml(formatDate(source.savedAt))}</text>`);
    parts.push(appendSvgText(summaryLines, margin + 30, y + 80 + titleLines.length * 34, 21, 30, "#475569", 520));
    y += rowHeight + 18;
  });
  if (sources.length > 10) {
    parts.push(`<text x="${margin}" y="${y + 34}" fill="#64748b" font-size="24" font-weight="700" font-family="Arial, 'PingFang SC', sans-serif">另有 ${sources.length - 10} 条资料已包含在 JSON / Word / Markdown 导出中</text>`);
    y += 72;
  }
  const height = Math.max(1180, y + 84);
  const background = `<rect width="${width}" height="${height}" fill="#f8fffc"/><circle cx="1220" cy="150" r="250" fill="#ccfbf1" opacity="0.74"/><circle cx="150" cy="${height - 80}" r="210" fill="#dbeafe" opacity="0.62"/>`;
  return { width, height, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${background}${parts.join("")}<text x="${margin}" y="${height - 42}" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">Generated by Lumo · ${escapeXml(new Date().toLocaleString())}</text></svg>` };
}

function rasterizeSvg(document: VisualExportDocument, mime: "image/png" | "image/jpeg", quality = 0.94) {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(new Blob([document.svg], { type: "image/svg+xml;charset=utf-8" }));
    image.onload = () => {
      const canvas = documentGlobal().createElement("canvas");
      canvas.width = document.width;
      canvas.height = document.height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not available"));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) reject(new Error("Raster export failed"));
        else resolve(blob);
      }, mime, quality);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG render failed"));
    };
    image.src = url;
  });
}

function documentGlobal() {
  return document;
}

function buildImagePdf(imageBytes: Uint8Array, imageWidth: number, imageHeight: number) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let offset = 0;
  const pageWidth = 595.28;
  const pageHeight = Math.max(420, pageWidth * (imageHeight / imageWidth));
  const addBytes = (bytes: Uint8Array) => { chunks.push(bytes); offset += bytes.length; };
  const addText = (text: string) => addBytes(encoder.encode(text));
  const addObject = (id: number, body: string) => {
    offsets[id] = offset;
    addText(`${id} 0 obj\n${body}\nendobj\n`);
  };
  addText("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = offset;
  addText(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`);
  addBytes(imageBytes);
  addText("\nendstream\nendobj\n");
  const content = `q\n${pageWidth.toFixed(2)} 0 0 ${pageHeight.toFixed(2)} 0 0 cm\n/Im0 Do\nQ`;
  addObject(5, `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
  const xrefStart = offset;
  addText(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1, 6).map((item) => `${String(item).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
  const output = new Uint8Array(offset);
  let cursor = 0;
  chunks.forEach((chunk) => { output.set(chunk, cursor); cursor += chunk.length; });
  return output;
}

async function exportVisualDocument(filenameBase: string, visual: VisualExportDocument, format: VisualExportFormat) {
  if (format === "svg") {
    downloadTextFile(`${filenameBase}.svg`, visual.svg, "image/svg+xml;charset=utf-8");
    return;
  }
  if (format === "png" || format === "jpg") {
    const blob = await rasterizeSvg(visual, format === "png" ? "image/png" : "image/jpeg");
    downloadBlob(`${filenameBase}.${format}`, blob);
    return;
  }
  const jpeg = await rasterizeSvg(visual, "image/jpeg", 0.92);
  const pdfBytes = buildImagePdf(new Uint8Array(await jpeg.arrayBuffer()), visual.width, visual.height);
  downloadBlob(`${filenameBase}.pdf`, new Blob([pdfBytes], { type: "application/pdf" }));
}

function exportSourceVisual(source: Source, format: VisualExportFormat) {
  return exportVisualDocument(safeFilename(source.title), sourceToVisualDocument(source), format);
}

function exportSourcesVisual(data: ReturnType<typeof useAppStore.getState>, format: VisualExportFormat) {
  return exportVisualDocument(`lumo-sources-${Date.now()}`, sourcesToVisualDocument(data), format);
}

// ─── Deliverable export helpers ───────────────────────────────────────────────

function buildDeliverableHtml(title: string, content: string): string {
  const body = content.split("\n").map((line) => {
    if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
    if (line.startsWith("## "))  return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    if (line.startsWith("# "))   return `<h2>${escapeHtml(line.slice(2))}</h2>`;
    if (line.startsWith("> "))   return `<blockquote>${escapeHtml(line.slice(2))}</blockquote>`;
    if (line.startsWith("- "))   return `<li>${escapeHtml(line.slice(2))}</li>`;
    if (!line.trim()) return "<br>";
    return `<p>${escapeHtml(line)}</p>`;
  }).join("");
  return `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,sans-serif;max-width:720px;margin:0 auto;padding:32px 20px;color:#111827;line-height:1.7}h1{font-size:28px;font-weight:800;margin-bottom:8px}h2{font-size:20px;font-weight:700;margin-top:32px;color:#1d4ed8}h3{font-size:16px;font-weight:700;margin-top:24px}blockquote{border-left:3px solid #6366f1;margin:0;padding:8px 16px;background:#f5f3ff;border-radius:0 8px 8px 0}li{margin:5px 0}.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px}@media print{body{padding:16px 0}}</style></head><body><h1>${escapeHtml(title)}</h1><p style="color:#6b7280;font-size:14px">生成于 Lumo · ${new Date().toLocaleDateString("zh-CN")}</p>${body}<div class="footer">由 Lumo 生成 · 仅供参考</div></body></html>`;
}

function deliverableToVisualDoc(title: string, content: string): VisualExportDocument {
  const width = 1200;
  const margin = 72;
  const parts: string[] = [];
  let y = 80;
  parts.push(`<text x="${margin}" y="${y}" fill="#6366f1" font-size="18" font-weight="800" letter-spacing="2" font-family="Arial, 'PingFang SC', sans-serif">LUMO DELIVERABLE</text>`);
  y += 52;
  const titleLines = wrapVisualText(title, 32, 3);
  parts.push(appendSvgText(titleLines, margin, y, 44, 54, "#111827", 820));
  y += titleLines.length * 54 + 32;
  for (const line of content.split("\n").filter(l => l.trim()).slice(0, 60)) {
    const isH2 = line.startsWith("## ") || (line.startsWith("# ") && !line.startsWith("## "));
    const isH3 = line.startsWith("### ");
    const isBullet = line.startsWith("- ") || line.startsWith("* ");
    const isQuote = line.startsWith("> ");
    const clean = line.replace(/^#+\s+|^[-*]\s|^>\s*/, "").trim();
    if (!clean) continue;
    if (isH2) {
      const tl = wrapVisualText(clean, 54, 2);
      parts.push(appendSvgText(tl, margin, y, 28, 36, "#111827", 780));
      y += tl.length * 36 + 16;
    } else if (isH3) {
      const tl = wrapVisualText(clean, 60, 2);
      parts.push(appendSvgText(tl, margin, y, 22, 30, "#374151", 700));
      y += tl.length * 30 + 12;
    } else if (isBullet) {
      const tl = wrapVisualText("• " + clean, 66, 2);
      parts.push(appendSvgText(tl, margin + 10, y, 20, 28, "#4b5563", 480));
      y += tl.length * 28 + 8;
    } else if (isQuote) {
      const tl = wrapVisualText(clean, 68, 2);
      const blockH = tl.length * 28 + 20;
      parts.push(`<rect x="${margin}" y="${y - 6}" width="${width - margin * 2}" height="${blockH}" rx="8" fill="#f5f3ff"/>`);
      parts.push(appendSvgText(tl, margin + 14, y + 14, 19, 28, "#4f46e5", 500));
      y += blockH + 12;
    } else {
      const tl = wrapVisualText(clean, 72, 2);
      parts.push(appendSvgText(tl, margin, y, 20, 28, "#374151", 440));
      y += tl.length * 28 + 10;
    }
    if (y > 2600) break;
  }
  const height = Math.max(800, y + 80);
  const bg = `<rect width="${width}" height="${height}" fill="#fafafa"/><circle cx="${width - 60}" cy="90" r="180" fill="#ede9fe" opacity="0.45"/><circle cx="60" cy="${height - 60}" r="140" fill="#dbeafe" opacity="0.38"/>`;
  return { width, height, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bg}${parts.join("")}<text x="${margin}" y="${height - 32}" fill="#9ca3af" font-size="15" font-family="Arial, sans-serif">Generated by Lumo · ${escapeXml(new Date().toLocaleString())}</text></svg>` };
}

function sourceTypeFromClip(kind?: QuickCaptureMode): SourceType {
  if (kind === "article_snapshot") return "article";
  if (kind === "image_snapshot") return "image";
  if (kind === "video_timestamp") return "video";
  return "webpage";
}

function extensionClipToSourcePayload(clip: ExtensionClip): Partial<Source> {
  const title = clip.title?.trim() || "未命名网页采集";
  const url = clip.url?.trim() || "https://example.com";
  const host = clip.host || safeHost(url);
  const mode = (["link", "article_snapshot", "image_snapshot", "video_timestamp"] as QuickCaptureMode[]).includes(clip.kind as QuickCaptureMode) ? clip.kind as QuickCaptureMode : "link";
  const primaryText = clip.selection || clip.articleText || clip.description || "插件已保存当前网页链接、标题和可视区域截图。";
  const videoLine = clip.video?.currentTime !== undefined ? `视频时间点：${Math.floor(clip.video.currentTime)} 秒` : "";
  return {
    title,
    url,
    sourceName: `Chrome 插件 · ${clip.kindLabel || capturePreset(mode).label}`,
    sourceReferences: [{ label: host, url, note: "由 Lumo Chrome 插件从当前网页采集，保留真实链接、上下文和可视区域截图。" }],
    snapshotImage: clip.screenshot || clip.image,
    capturedText: primaryText,
    captureMode: mode,
    type: sourceTypeFromClip(mode),
    purpose: mode === "link" ? "later_reading" : "project_research",
    triageStatus: mode === "video_timestamp" ? "project_material" : "must_read",
    tags: ["chrome-extension", mode.replace("_", "-"), host].filter(Boolean),
    hasSnapshot: Boolean(clip.screenshot || clip.image),
    snapshotStatus: clip.screenshot || clip.image ? "saved" : "pending",
    content: [
      `插件采集：${title}`,
      clip.description ? `页面摘要：${clip.description}` : "",
      clip.selection ? `选中文本：${clip.selection}` : "",
      clip.articleText ? `正文片段：${clip.articleText.slice(0, 1200)}` : "",
      videoLine,
      `出处：${url}`,
    ].filter(Boolean),
    readingTime: Math.max(3, Math.ceil(primaryText.length / 420)),
  };
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose}>{english ? "Close" : "关闭"}</Button>
        </div>
        {children}
      </section>
    </div>
  );
}

function initials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "LU";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return Array.from(cleaned).slice(0, 2).join("").toUpperCase();
}

function AvatarBubble({ name, avatar, size = "md" }: { name: string; avatar?: string; size?: "sm" | "md" | "lg" }) {
  return <span className={`avatar-bubble avatar-${size}`}>{avatar ? <img src={avatar} alt={name} /> : <strong>{initials(name)}</strong>}</span>;
}

type ShareTargetId = SocialPlatform | "system";
const socialTargets: Array<{ id: ShareTargetId; label: string; detail: string; icon: typeof Share2 }> = [
  { id: "system", label: "系统分享", detail: "手机可唤起微信等 App", icon: Share2 },
  { id: "wechat", label: "微信", detail: "复制给好友/群/朋友圈", icon: MessageSquare },
  { id: "redbook", label: "小红书", detail: "生成图文笔记模板", icon: ImageIcon },
  { id: "douyin", label: "抖音", detail: "生成口播与标题", icon: Video },
  { id: "qq", label: "QQ", detail: "打开 QQ 分享页", icon: MessageSquare },
  { id: "weibo", label: "微博", detail: "打开微博分享页", icon: Share2 },
  { id: "bilibili", label: "B站", detail: "复制动态草稿", icon: Video },
  { id: "x", label: "X / Twitter", detail: "打开 X 发布页", icon: ExternalLink },
];

function buildShareText(platform: ShareTargetId, title: string, content: string, url?: string) {
  const linkLine = url ? `\n\n原始链接：${url}` : "";
  if (platform === "redbook") return `标题：${title}\n\n正文：${content}${linkLine}\n\n#Lumo笔记 #知识管理 #阅读笔记`;
  if (platform === "douyin") return `抖音口播脚本\n开头钩子：这条资料/笔记帮我想清楚了一个问题：${title}\n\n核心内容：${content}${linkLine}\n\n结尾引导：想看完整证据链，可以来我的 Lumo 之家。`;
  if (platform === "wechat") return `我用 Lumo 整理了一条笔记：${title}\n\n${content}${linkLine}`;
  if (platform === "bilibili") return `B站动态草稿：${title}\n\n${content}${linkLine}\n\n#学习记录 #知识整理`;
  return `${title}\n\n${content}${linkLine}`;
}

async function shareToTarget(platform: ShareTargetId, title: string, content: string, notify: (message: string) => void, url?: string) {
  const shareText = buildShareText(platform, title, content, url);
  const safeUrl = url || window.location.href;
  try {
    if (platform === "system") {
      if (navigator.share) {
        await navigator.share({ title, text: content, url: safeUrl });
        notify("已打开系统分享面板");
      } else {
        await navigator.clipboard.writeText(shareText);
        notify("当前浏览器不支持系统分享，文案已复制");
      }
      return;
    }
    if (platform === "qq") {
      const shareUrl = new URL("https://connect.qq.com/widget/shareqq/index.html");
      shareUrl.searchParams.set("url", safeUrl);
      shareUrl.searchParams.set("title", title);
      shareUrl.searchParams.set("summary", content);
      window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
      notify("已打开 QQ 分享页");
      return;
    }
    if (platform === "weibo") {
      const shareUrl = new URL("https://service.weibo.com/share/share.php");
      shareUrl.searchParams.set("url", safeUrl);
      shareUrl.searchParams.set("title", shareText);
      window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
      notify("已打开微博分享页");
      return;
    }
    if (platform === "x") {
      const shareUrl = new URL("https://twitter.com/intent/tweet");
      shareUrl.searchParams.set("text", shareText);
      shareUrl.searchParams.set("url", safeUrl);
      window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
      notify("已打开 X 发布页");
      return;
    }
    await navigator.clipboard.writeText(shareText);
    const target = socialTargets.find((item) => item.id === platform)?.label ?? "社交平台";
    notify(`已复制${target}模板，可直接粘贴发布`);
  } catch {
    notify("分享被取消或当前环境不支持");
  }
}

function SocialShareGrid({ title, content, url, compact = false, onPublishHome }: { title: string; content: string; url?: string; compact?: boolean; onPublishHome?: () => void }) {
  const notify = useAppStore((s) => s.notify);
  const targets = compact ? socialTargets.slice(0, 4) : socialTargets;
  return (
    <div className={`share-platform-grid social-share-grid ${compact ? "compact" : ""}`}>
      {targets.map((target) => {
        const Icon = target.icon;
        return (
          <button key={target.id} className={`share-platform ${target.id}`} onClick={() => void shareToTarget(target.id, title, content, notify, url)}>
            <Icon size={18} /><strong>{target.label}</strong><small>{target.detail}</small>
          </button>
        );
      })}
      {onPublishHome && (
        <button className="share-platform lumo-home" onClick={onPublishHome}>
          <Home size={18} /><strong>Lumo之家</strong><small>发布到公开社区</small>
        </button>
      )}
    </div>
  );
}

function DeviceSupportSection() {
  const platform = typeof navigator === "undefined" ? "Web" : navigator.platform || navigator.userAgent;
  const viewport = typeof window === "undefined" ? "Desktop" : `${window.innerWidth} × ${window.innerHeight}`;
  const cards = [
    { icon: Smartphone, title: "手机适配版", detail: "移动端自动收起复杂栏位，分享优先使用系统面板，底部 Dock 适合单手操作。", status: "Responsive / PWA ready" },
    { icon: Laptop, title: "macOS 版本", detail: "保留左侧栏、快捷键和大屏图谱工作台，后续可用 Electron / Tauri 打包桌面壳。", status: "⌘ 快捷键适配" },
    { icon: Monitor, title: "Windows 版本", detail: "使用 Ctrl 快捷键、宽屏布局和本地导入导出，适合办公电脑长期整理资料。", status: "Ctrl 快捷键适配" },
  ];
  return (
    <section className="device-support-panel profile-glass-card">
      <div className="section-head compact-head"><div><h3>跨端适配</h3><p>同一套 Lumo 数据可以在手机 Web、macOS、Windows 三种场景下展示不同布局。</p></div><Badge tone="green">当前设备：{platform} · {viewport}</Badge></div>
      <div className="device-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return <article key={card.title} className="device-card"><Icon size={22} /><strong>{card.title}</strong><p>{card.detail}</p><Badge tone="blue">{card.status}</Badge></article>;
        })}
      </div>
    </section>
  );
}

// ── Onboarding Modal ────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    emoji: "📥",
    title: "收藏你的研究素材",
    titleEn: "Collect your research",
    body: "把文章、视频、截图和链接保存到 Lumo 资料库。点击右上角「添加」或安装 Chrome 插件一键收藏。",
    bodyEn: "Save articles, videos, screenshots and links to your Lumo library. Click Add or install the Chrome extension.",
    action: "去添加资料",
    actionEn: "Add a source",
  },
  {
    emoji: "✏️",
    title: "阅读时高亮和批注",
    titleEn: "Highlight as you read",
    body: "打开资料进入阅读器，高亮关键段落，添加批注。Lumo 会帮你把段落转成可复用的观点和证据。",
    bodyEn: "Open any source in the Reader, highlight key passages and add notes. Lumo turns them into reusable claims and evidence.",
    action: "去阅读器",
    actionEn: "Open reader",
  },
  {
    emoji: "🔮",
    title: "整合到项目成果",
    titleEn: "Build your output",
    body: "把资料加入项目，让 Lumo 一键洞察，最后一键生成研究简报、竞品分析或 PRD。",
    bodyEn: "Add sources to a project, generate insights, then one-click assemble a research brief, competitive analysis or PRD.",
    action: "开始使用 Lumo",
    actionEn: "Start using Lumo",
  },
];

function OnboardingModal({ step, onNext, onSkip, onGoCapture, onGoReader, english }: {
  step: number; onNext: () => void; onSkip: () => void;
  onGoCapture: () => void; onGoReader: () => void; english: boolean;
}) {
  const s = ONBOARDING_STEPS[step];
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button type="button" className="onboarding-skip" onClick={onSkip}>{english ? "Skip" : "跳过"}</button>
        <div className="onboarding-step-dots">
          {ONBOARDING_STEPS.map((_, i) => <span key={i} className={i === step ? "active" : ""} />)}
        </div>
        <div className="onboarding-emoji">{s.emoji}</div>
        <h2 className="onboarding-title">{english ? s.titleEn : s.title}</h2>
        <p className="onboarding-body">{english ? s.bodyEn : s.body}</p>
        <button
          type="button"
          className="onboarding-cta"
          onClick={() => {
            if (step === 0) onGoCapture();
            else if (step === 1) onGoReader();
            else onNext();
          }}
        >
          {english ? s.actionEn : s.action}
        </button>
        {step < 2 && (
          <button type="button" className="onboarding-secondary" onClick={onNext}>
            {english ? "I know this →" : "已了解，下一步 →"}
          </button>
        )}
      </div>
    </div>
  );
}

function AppShell() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const toast = useAppStore((s) => s.toast);
  const notify = useAppStore((s) => s.notify);
  const clearToast = useAppStore((s) => s.clearToast);
  const signOutProfile = useAppStore((s) => s.signOutProfile);
  const sources = useAppStore((s) => s.sources);
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const navPlacement = useAppStore((s) => s.navPlacement);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const userProfile = useAppStore((s) => s.userProfile);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [inspirationOpen, setInspirationOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [collectDockOpen, setCollectDockOpen] = useState(false);
  const [collectPulse, setCollectPulse] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [dailyBriefOpen, setDailyBriefOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !localStorage.getItem("lumo-onboarded"));
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [quickMode, setQuickMode] = useState<QuickCaptureMode>("link");
  const searchRef = useRef<HTMLInputElement>(null);
  const collectPulseTimerRef = useRef<number | null>(null);
  const page = nav.find((item) => item.id === activeView);
  const currentTheme = themeOptions.find((item) => item.id === themeMode) ?? themeOptions[0];
  const CurrentThemeIcon = currentTheme.icon;
  const english = isEn(language);

  const clearCollectPulse = () => {
    if (collectPulseTimerRef.current !== null) {
      window.clearTimeout(collectPulseTimerRef.current);
      collectPulseTimerRef.current = null;
    }
    setCollectPulse(false);
  };

  const openQuickCapture = (mode: QuickCaptureMode = "link") => {
    clearCollectPulse();
    setCollectDockOpen(false);
    setQuickMode(mode);
    setQuickOpen(true);
  };

  const previewCollectDock = () => {
    setCollectDockOpen((open) => {
      const next = !open;
      if (!next) {
        clearCollectPulse();
        return false;
      }
      if (collectPulseTimerRef.current !== null) window.clearTimeout(collectPulseTimerRef.current);
      setCollectPulse(true);
      collectPulseTimerRef.current = window.setTimeout(() => {
        setCollectPulse(false);
        collectPulseTimerRef.current = null;
      }, 360);
      return true;
    });
  };

  const openExportCenter = () => {
    setActiveView("import_export");
    notify(english ? `Opened export center for ${sources.length} sources` : `已打开导入导出中心，可选择 JSON / SVG / PNG / JPG / PDF / Word 等格式`);
  };

  useEffect(() => () => {
    if (collectPulseTimerRef.current !== null) {
      window.clearTimeout(collectPulseTimerRef.current);
      collectPulseTimerRef.current = null;
    }
  }, []);

  // ── Chrome 插件实时推送监听 ──────────────────────────────
  useEffect(() => {
    const onClipReceived = (e: Event) => {
      const clip = (e as CustomEvent<ExtensionClip>).detail;
      if (!clip) return;
      const { addSource, notify } = useAppStore.getState();
      addSource(extensionClipToSourcePayload(clip));
      notify(`插件已推送：${clip.title || "新资料"}`);
    };
    const onClipsSync = (e: Event) => {
      const { clips } = (e as CustomEvent<{ clips: ExtensionClip[] }>).detail ?? {};
      if (!clips?.length) return;
      const { addSource, notify } = useAppStore.getState();
      clips.forEach(c => addSource(extensionClipToSourcePayload(c)));
      notify(`已从插件同步 ${clips.length} 条资料`);
    };
    window.addEventListener("lumo:clip-received", onClipReceived);
    window.addEventListener("lumo:clips-sync", onClipsSync);
    return () => {
      window.removeEventListener("lumo:clip-received", onClipReceived);
      window.removeEventListener("lumo:clips-sync", onClipsSync);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (mod && key === "j") {
        event.preventDefault();
        setAiSearchOpen((open) => !open);
        return;
      }
      if (mod && event.shiftKey && key === "s") {
        event.preventDefault();
        openQuickCapture("link");
        return;
      }
      if (mod && event.shiftKey && key === "a") {
        event.preventDefault();
        openQuickCapture("article_snapshot");
        return;
      }
      if (mod && event.shiftKey && key === "x") {
        event.preventDefault();
        openQuickCapture("image_snapshot");
        return;
      }
      if (mod && event.shiftKey && key === "v") {
        event.preventDefault();
        openQuickCapture("video_timestamp");
        return;
      }
      if (event.key === "?" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA") {
          event.preventDefault();
          setShortcutOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Storage size guard — warn when approaching localStorage limit
  useEffect(() => {
    const check = () => {
      const used = getStorageUsageBytes();
      if (used >= STORAGE_MAX_BYTES) {
        notify("⚠️ 本地存储已接近上限，数据可能无法保存。请立即导出备份。");
      } else if (used >= STORAGE_WARN_BYTES) {
        notify(`存储空间已用 ${Math.round(used / 1024 / 1024 * 10) / 10}MB，建议导出一份备份。`);
      }
    };
    check();
    const interval = window.setInterval(check, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 3800);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view") as ActiveView | null;
    if (!view || !nav.some((item) => item.id === view)) return;
    setActiveView(view);
    window.history.replaceState({}, "", window.location.pathname);
  }, [setActiveView]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode === "dark" ? "dark" : "light";
    localStorage.setItem("lumo-theme-mode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    localStorage.setItem("lumo-language", language);
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.nav = "left";
    localStorage.setItem("lumo-nav-placement", "left");
    if (navPlacement !== "left") useAppStore.setState({ navPlacement: "left" });
  }, [navPlacement]);

  return (
    <div className={`app theme-${themeMode} nav-left`} style={{ backgroundColor: themeBackgrounds[themeMode] }}>
      {mobileNavOpen && <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="brand"><img src="/media/lumo-app-icon-new.svg" alt="Lumo" /><span>Lumo</span></div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`nav-item ${activeView === item.id ? "active" : ""}`} onClick={() => setActiveView(item.id)}>
                <Icon size={17} />
                <span>{navItemLabel(item, language)}</span>
              </button>
            );
          })}
        </nav>
        <div className="account account-card">
          <button className="account-profile account-profile-card" onClick={() => setActiveView("profile")} type="button">
            <AvatarBubble name={userProfile.displayName} avatar={userProfile.avatar} size="md" />
            <span>
              <small>{userProfile.isAuthenticated ? (english ? "Signed account" : "已登录账号") : (english ? "Local profile" : "本地个人资料")}</small>
              <strong>{userProfile.displayName}</strong>
            </span>
            <ChevronRight size={16} />
          </button>
          <div className="account-plan-pill">
            <span>{english ? "Current plan" : "当前方案"}</span>
            <strong>{lumoPricingPlans.find((p) => p.id === userProfile.plan)?.[english ? "nameEn" : "name"] ?? (english ? "Starter · Free" : "Starter · 免费")}</strong>
          </div>
          <button className="account-action" onClick={() => setActiveView("settings")} type="button"><Settings size={14} />{english ? "Settings" : "设置与方案"}</button>
          {!userProfile.isAuthenticated && (
            <button className="account-action account-action-login" onClick={() => setLoginModalOpen(true)} type="button"
              style={{ color:"#6366f1", fontWeight:700 }}>
              <LogIn size={14} />{english ? "Sign in" : "登录 / 注册"}
            </button>
          )}
          {userProfile.isAuthenticated && (
            <button className="account-action" onClick={() => setLogoutConfirmOpen(true)} type="button">
              <LogOut size={14} />{english ? "Sign out" : "退出登录"}
            </button>
          )}
        </div>
      </aside>
      <main className={`main ${activeView === "projects" ? "graph-focus-main" : ""}`} style={{ backgroundColor: themeBackgrounds[themeMode] }}>
        <header className="topbar">
          <button type="button" className="mobile-nav-toggle" onClick={() => setMobileNavOpen((o) => !o)} title="Menu">
            <MoreHorizontal size={18} />
          </button>
          <div>
            <h1>{page ? navItemLabel(page, language) : pageTitle(activeView, language)}</h1>
            <p>{pageDescription(activeView, language)}</p>
          </div>
          <label className="search">
            <Search size={17} />
            <input ref={searchRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={english ? "Search sources, notes, claims, evidence..." : "搜索资料、笔记、观点、证据..."} />
          </label>
          <div className="topbar-actions">
            <Button onClick={() => setAiSearchOpen(true)} title={english ? "Voice search your library (Cmd+J)" : "语音搜索资料库（Cmd+J）"} className="topbar-ai-search"><Mic size={16} /><span>{english ? "Ask" : "问一问"}</span></Button>
            <Button onClick={() => setThemeMode(nextThemeMode(themeMode))} title={english ? `Current: ${currentTheme.label}. Switch theme` : `当前：${currentTheme.label}模式。点击切换页面底色`}><CurrentThemeIcon size={16} /><span>{english ? currentTheme.id : currentTheme.short}</span></Button>
            <Button onClick={() => setInspirationOpen(true)} variant="primary"><PenLine size={15} /><span>{english ? "Inspire" : "灵感"}</span></Button>
          </div>
        </header>
        <div className="view-animate" key={activeView}>
          <ViewRouter onCapture={openQuickCapture} />
        </div>
      </main>
      {addOpen && <AddSourceModal onClose={() => setAddOpen(false)} />}
      {inspirationOpen && <InspirationModal onClose={() => setInspirationOpen(false)} />}
      {quickOpen && <QuickCaptureModal initialMode={quickMode} onClose={() => setQuickOpen(false)} />}
      {shortcutOpen && <ShortcutModal onCapture={openQuickCapture} onClose={() => setShortcutOpen(false)} />}
      {aiSearchOpen && <AISearchPanel onClose={() => setAiSearchOpen(false)} />}
      {dailyBriefOpen && <DailyBriefPanel onClose={() => setDailyBriefOpen(false)} />}
      {onboardingOpen && (        <OnboardingModal
          step={onboardingStep}
          onNext={() => {
            if (onboardingStep < 2) { setOnboardingStep((s) => s + 1); }
            else { localStorage.setItem("lumo-onboarded", "1"); setOnboardingOpen(false); }
          }}
          onSkip={() => { localStorage.setItem("lumo-onboarded", "1"); setOnboardingOpen(false); }}
          onGoCapture={() => { localStorage.setItem("lumo-onboarded", "1"); setOnboardingOpen(false); openQuickCapture("link"); }}
          onGoReader={() => { localStorage.setItem("lumo-onboarded", "1"); setOnboardingOpen(false); setActiveView("reader"); }}
          english={english}
        />
      )}
      <LumoPet onAsk={() => setAssistantOpen(true)} onBrief={() => setDailyBriefOpen(true)} />
      {assistantOpen && (
        <>
          <div className="assistant-backdrop" onClick={() => setAssistantOpen(false)} />
          <FloatingAssistant onClose={() => setAssistantOpen(false)} onCapture={openQuickCapture} />
        </>
      )}
      {/* ── Login Modal ── */}
      {loginModalOpen && (
        <LoginModal
          onClose={() => setLoginModalOpen(false)}
          onSuccess={() => setLoginModalOpen(false)}
        />
      )}
      {/* ── Logout Confirm ── */}
      {logoutConfirmOpen && (
        <div className="agent-panel-overlay" onClick={e => e.target === e.currentTarget && setLogoutConfirmOpen(false)}>
          <div style={{ background:"#fff", borderRadius:16, padding:"28px 32px", maxWidth:360, width:"90%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize:28, marginBottom:10 }}>👋</div>
            <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700 }}>确认退出登录？</h3>
            <p style={{ margin:"0 0 20px", fontSize:13, color:"#6b7280", lineHeight:1.6 }}>退出后本地数据不受影响，仅断开云同步。下次登录同邮箱即可恢复。</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={() => setLogoutConfirmOpen(false)}
                style={{ padding:"8px 20px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer" }}>取消</button>
              <button onClick={() => { signOutProfile(); setLogoutConfirmOpen(false); notify("已退出登录"); }}
                style={{ padding:"8px 20px", borderRadius:8, border:"none", background:"#ef4444", color:"#fff", fontWeight:700, cursor:"pointer" }}>确认退出</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <button
          className={`toast ${toast.startsWith("⚠️") || toast.includes("警告") ? "toast-warn" : toast.startsWith("❌") || toast.includes("失败") || toast.includes("错误") ? "toast-error" : "toast-success"}`}
          onClick={clearToast}
        >{toast}</button>
      )}
    </div>
  );
}


function CollectDock({ onCapture, onClose }: { onCapture: (mode?: QuickCaptureMode) => void; onClose: () => void }) {
  const modes: QuickCaptureMode[] = ["link", "article_snapshot", "image_snapshot", "video_timestamp"];
  return (
    <div className="collect-dock" role="dialog" aria-label="收藏采集方式">
      <div>
        <strong><Star size={15} fill="currentColor" /> 收藏是快捷采集</strong>
        <p>它不等于手动添加：先点亮星标，再选择要捕获当前链接、文章快照、网页截图或视频时间点。</p>
      </div>
      <div className="collect-dock-grid">
        {modes.map((mode) => {
          const preset = capturePreset(mode);
          const Icon = preset.icon;
          return (
            <button key={mode} onClick={() => onCapture(mode)}>
              <Icon size={17} />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
      <button className="collect-dock-close" onClick={onClose}>关闭</button>
    </div>
  );
}

function weekdayLabel(date: Date) {
  return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][date.getDay()];
}

function buildReviewPlan(sources: Source[], notes: Note[], evidenceItems: Evidence[]) {
  const activeSources = sources.filter((source) => source.status !== "deleted");
  const unread = activeSources.filter((source) => source.status !== "read" && source.status !== "archived");
  const projectMaterials = activeSources.filter((source) => source.triageStatus === "project_material" || source.triageStatus === "must_read");
  const firstNote = notes[0];
  const noteSource = firstNote ? activeSources.find((source) => source.id === firstNote.sourceId) : undefined;
  const topProjectSource = projectMaterials[0] ?? unread[0] ?? activeSources[0];
  const secondSource = projectMaterials.find((source) => source.id !== topProjectSource?.id) ?? unread.find((source) => source.id !== topProjectSource?.id);
  const reviewCount = Math.min(5, Math.max(2, notes.length + Math.floor(evidenceItems.length / 4)));
  return {
    todo: [
      `复习 ${reviewCount} 条 Lumo 笔记和高亮，优先看最近创建的判断性内容。`,
      topProjectSource ? `精读「${topProjectSource.title}」，抽 1 条 Claim 和 1 条 Evidence。` : "从资料库挑一条未读资料，补一条摘要。",
      secondSource ? `对照「${secondSource.title}」，检查它和当前项目是否有关联。` : "整理一个主题夹，把散落资料归到项目。",
    ],
    schedule: [
      noteSource ? `09:30 回看笔记来源「${noteSource.title}」，只复习关键段落。` : "09:30 快速回看昨天新增资料，标出最值得读的一条。",
      topProjectSource ? `14:00 把「${topProjectSource.title}」的核心段落转成观点/证据。` : "14:00 清理 AI 收件箱，把无关资料归档。",
      "20:30 用 10 分钟打开项目图谱，确认今天新增证据是否支撑成果文档。",
    ],
  };
}

type PetMode = "chatty" | "focus";
type PetSkin = "classic" | "berry" | "mint" | "starlight";
type PetFashionSlot = "head" | "accessory";
type PetOutfit = Record<PetFashionSlot, string>;
type PetBreakMinutes = 15 | 30 | 45;
type SnackReaction = "receiving" | "gurgling";
type PetFashionItem = { id: string; slot: PetFashionSlot; label: string; detail: string; className: string; price?: number; rarity?: string };

const petIdleSayings = [
  "我在巡逻你的资料库",
  "别只收藏，今天也要复习一条",
  "双击我可以问 Lumo",
  "星标资料最好转成证据",
  "今日简报准备好了，点我查看",
  "有新资料还没读，要不要看看今日简报？",
  "我会提醒你别让笔记睡着",
  "先读必须阅读，再处理项目素材",
  "收藏不是结束，是研究的入口",
  "今天适合补一条 Claim",
];

const petChattySayings = [
  "资料库有新东西就像我的小零食，别让它们过期呀",
  "你已经很接近完成今天的复习了，再整理一条就好",
  "我发现项目素材最好当天转成证据，不然第二天会忘",
  "安静模式在面板里可以打开，我就不碎碎念了",
  "完成任务会给我买零食，我会认真看家",
  "番茄钟结束记得站起来喝水，脑子也要缓存一下",
];

const petSnacks = [
  { id: "berry", label: "莓果冻", energy: 18, cost: 1, growth: 2, effect: "弹跳入口" },
  { id: "star", label: "星星饼", energy: 28, cost: 2, growth: 3, effect: "碎星掉屑" },
  { id: "moon", label: "月光糖", energy: 42, cost: 3, growth: 5, effect: "慢嚼发光" },
] as const;

const petStoreBundles = [
  { id: "daily-snack", label: "每日零食包", detail: "补充 4 份基础零食", price: 80, snacks: 4, growth: 1 },
  { id: "star-tea", label: "星星下午茶", detail: "补充 7 份零食并增加成长", price: 140, snacks: 7, growth: 3 },
  { id: "moon-feast", label: "月光甜点盒", detail: "高阶投喂用，适合快速进化", price: 220, snacks: 10, growth: 6 },
];

const petSkins: Array<{ id: PetSkin; label: string; outfit: string; asset: string; palette: string }> = [
  { id: "classic", label: "原生史莱姆", outfit: "深海渐变本体", asset: "/media/lumo-pet.svg", palette: "午夜蓝 / 湖光蓝" },
  { id: "mint", label: "薄荷皮肤", outfit: "薄荷领巾 + 叶芽", asset: "/media/lumo-pet-mint.svg", palette: "薄荷绿 / 海盐青" },
  { id: "berry", label: "莓果皮肤", outfit: "莓果帽 + 软糖腮红", asset: "/media/lumo-pet-berry.svg", palette: "莓紫 / 草莓粉" },
  { id: "starlight", label: "星光皮肤", outfit: "星星斗篷 + 夜光粒子", asset: "/media/lumo-pet-starlight.svg", palette: "星夜蓝 / 月光金" },
];
const unlockedPetSkins = petSkins.map((item) => item.id);

const petFashionSlots: Array<{ id: PetFashionSlot; label: string; hint: string }> = [
  { id: "head", label: "头饰", hint: "帽子、发夹和叶冠" },
  { id: "accessory", label: "配件", hint: "小包、缎带和研究徽章" },
];

const petFashionItems: PetFashionItem[] = [
  { id: "none-head", slot: "head", label: "不戴头饰", detail: "保留圆滚滚原形", className: "head-none" },
  { id: "data-beret", slot: "head", label: "资料贝雷帽", detail: "适合深度阅读", className: "head-data-beret" },
  { id: "star-pin", slot: "head", label: "星星发夹", detail: "项目冲刺闪光", className: "head-star-pin" },
  { id: "mint-crown", slot: "head", label: "薄荷叶冠", detail: "清爽灵感模式", className: "head-mint-crown" },
  { id: "cloud-bonnet", slot: "head", label: "云朵睡帽", detail: "柔软贴合脑袋弧线", className: "head-cloud-bonnet" },
  { id: "halo-antlers", slot: "head", label: "星环鹿角", detail: "高级发光头饰", className: "head-halo-antlers" },
  { id: "research-cap", slot: "head", label: "研究圆顶帽", detail: "研究者专属深蓝小帽", className: "head-research-cap" },
  { id: "rainbow-pin", slot: "head", label: "彩虹发夹", detail: "七色弧形小夹子", className: "head-rainbow-pin" },
  { id: "none-accessory", slot: "accessory", label: "不带配件", detail: "轻装陪伴", className: "accessory-none" },
  { id: "note-bag", slot: "accessory", label: "笔记小包", detail: "装下 Claim 卡片", className: "accessory-note-bag" },
  { id: "moon-ribbon", slot: "accessory", label: "月光缎带", detail: "搭配星光皮肤", className: "accessory-moon-ribbon" },
  { id: "crystal-wand", slot: "accessory", label: "晶体魔杖", detail: "投喂时一起闪光", className: "accessory-crystal-wand" },
  { id: "tiny-backpack", slot: "accessory", label: "灵感背包", detail: "小小资料背包", className: "accessory-tiny-backpack" },
  { id: "evidence-chain", slot: "accessory", label: "证据链手环", detail: "可验证证据的象征", className: "accessory-evidence-chain" },
  { id: "glow-star", slot: "accessory", label: "荧光星贴", detail: "夜光小星星贴纸", className: "accessory-glow-star" },
];

const defaultPetOutfit: PetOutfit = { head: "data-beret", accessory: "note-bag" };
// Beta: unlock all fashion items
const starterFashionIds = petFashionItems.map((item) => item.id);

const petGrowthLevels = [
  { name: "幼年期", threshold: 0, desc: "刚孵出的水滴 Lumo，只能做基础提醒。" },
  { name: "初级阶段", threshold: 4, desc: "投喂和完成复习后，头上会先冒出一株小芽。" },
  { name: "中级阶段", threshold: 10, desc: "继续学习和整理项目后，小芽长成左右双叶。" },
  { name: "高级阶段", threshold: 18, desc: "叶冠完全展开，Lumo 会带着成熟形态陪你做项目管理。" },
];

function petGrowthIndexForXp(xp: number) {
  return petGrowthLevels.reduce((highest, level, index) => (xp >= level.threshold ? index : highest), 0);
}

function readPetNumber(key: string, fallback: number) {
  if (typeof localStorage === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readPetString<T extends string>(key: string, fallback: T) {
  if (typeof localStorage === "undefined") return fallback;
  return (localStorage.getItem(key) as T | null) ?? fallback;
}

function readPetList(key: string, fallback: string[]) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readPetOutfit() {
  if (typeof localStorage === "undefined") return defaultPetOutfit;
  try {
    const parsed = JSON.parse(localStorage.getItem("lumo-pet-outfit") ?? "{}");
    return petFashionSlots.reduce<PetOutfit>((next, slot) => {
      const saved = typeof parsed?.[slot.id] === "string" ? parsed[slot.id] : defaultPetOutfit[slot.id];
      const exists = petFashionItems.some((item) => item.slot === slot.id && item.id === saved);
      next[slot.id] = exists ? saved : defaultPetOutfit[slot.id];
      return next;
    }, { ...defaultPetOutfit });
  } catch {
    return defaultPetOutfit;
  }
}

function getPetFashionItem(slot: PetFashionSlot, itemId: string) {
  return petFashionItems.find((item) => item.slot === slot && item.id === itemId) ?? petFashionItems.find((item) => item.slot === slot) ?? petFashionItems[0];
}

function getPetFashionNoneId(slot: PetFashionSlot) {
  return petFashionItems.find((item) => item.slot === slot && item.id.startsWith("none"))?.id;
}

function normalizePetSkin(value: string | null): PetSkin {
  if (value === "gold") return "starlight";
  return unlockedPetSkins.includes(value as PetSkin) ? value as PetSkin : "classic";
}

function petTimeLine(date: Date, timezone?: string) {
  const options: Intl.DateTimeFormatOptions = { month: "numeric", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat("zh-CN", timezone ? { ...options, timeZone: timezone } : options).format(date);
  } catch {
    return new Intl.DateTimeFormat("zh-CN", options).format(date);
  }
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function LumoPet({ onAsk, onBrief }: { onAsk: () => void; onBrief: () => void }) {
  const sources = useAppStore((s) => s.sources);
  const notes = useAppStore((s) => s.notes);
  const evidence = useAppStore((s) => s.evidence);
  const projects = useAppStore((s) => s.projects);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const notify = useAppStore((s) => s.notify);
  const [position, setPosition] = useState(() => ({
    x: 22,
    y: typeof window === "undefined" ? 520 : Math.max(112, window.innerHeight - 106),
  }));
  const [dragging, setDragging] = useState(false);
  const [petted, setPetted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false); // click-popup menu
  const [message, setMessage] = useState("摸摸我");
  const [today, setToday] = useState(() => new Date());
  const [mode, setMode] = useState<PetMode>(() => readPetString<PetMode>("lumo-pet-mode", "chatty"));

  // Pet panel drag
  const [panelDragPos, setPanelDragPos] = useState<{ x: number; y: number } | null>(null);
  const panelDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const petPanelRef = useRef<HTMLElement>(null);
  const onPanelDragStart = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const el = petPanelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    panelDragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPanelDragMove = (e: React.PointerEvent) => {
    if (!panelDragRef.current) return;
    const dx = e.clientX - panelDragRef.current.startX;
    const dy = e.clientY - panelDragRef.current.startY;
    const newX = Math.min(Math.max(0, panelDragRef.current.origX + dx), window.innerWidth - 200);
    const newY = Math.min(Math.max(0, panelDragRef.current.origY + dy), window.innerHeight - 100);
    setPanelDragPos({ x: newX, y: newY });
  };
  const onPanelDragEnd = () => { panelDragRef.current = null; };
  const [breakMinutes, setBreakMinutes] = useState<PetBreakMinutes>(() => {
    const saved = readPetNumber("lumo-pet-break-minutes", 30);
    return saved === 15 || saved === 45 ? saved : 30;
  });
  const [pomodoroLeft, setPomodoroLeft] = useState(25 * 60);
  const [restLeft, setRestLeft] = useState(() => breakMinutes * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [snacks, setSnacks] = useState(() => readPetNumber("lumo-pet-snacks", 3));
  const [points, setPoints] = useState(() => readPetNumber("lumo-pet-points", 180));
  const [growthXp, setGrowthXp] = useState(() => readPetNumber("lumo-pet-growth-xp", 2));
  const [hunger, setHunger] = useState(() => {
    const saved = readPetNumber("lumo-pet-hunger", 76);
    const lastCare = readPetNumber("lumo-pet-last-care", Date.now());
    const elapsedHours = Math.max(0, (Date.now() - lastCare) / 3_600_000);
    return Math.max(0, Math.min(100, Math.round(saved - elapsedHours * 7)));
  });
  const [skin, setSkin] = useState<PetSkin>(() => normalizePetSkin(typeof localStorage === "undefined" ? null : localStorage.getItem("lumo-pet-skin")));
  const [ownedSkins, setOwnedSkins] = useState<string[]>(() => Array.from(new Set([...readPetList("lumo-pet-owned-skins", unlockedPetSkins), ...unlockedPetSkins])));
  const [outfit, setOutfit] = useState<PetOutfit>(() => readPetOutfit());
  const [ownedFashion, setOwnedFashion] = useState<string[]>(() => Array.from(new Set([...starterFashionIds, ...Object.values(readPetOutfit()), ...readPetList("lumo-pet-owned-fashion", starterFashionIds)])));
  const [snackAnimation, setSnackAnimation] = useState<{ snack: (typeof petSnacks)[number]; nonce: number } | null>(null);
  const [snackReaction, setSnackReaction] = useState<SnackReaction | null>(null);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0, moved: false });
  const clickTimer = useRef<number | null>(null);
  const clickCount = useRef(0);
  const snackAnimationTimer = useRef<number | undefined>(undefined);
  const snackReactionTimer = useRef<number | undefined>(undefined);
  const plan = useMemo(() => buildReviewPlan(sources, notes, evidence), [sources, notes, evidence]);
  const activeProject = projects.find((project) => project.status === "active") ?? projects[0];
  const growthIndex = petGrowthIndexForXp(growthXp);
  const growthLevel = petGrowthLevels[growthIndex];
  const nextGrowthLevel = petGrowthLevels[growthIndex + 1];

  const speak = (text: string, forced = true) => {
    if (!forced && mode === "focus") return;
    setMessage(text);
    setPetted(true);
    window.setTimeout(() => setPetted(false), 720);
  };

  const touchCare = (nextHunger?: number) => {
    localStorage.setItem("lumo-pet-last-care", String(Date.now()));
    if (typeof nextHunger === "number") localStorage.setItem("lumo-pet-hunger", String(nextHunger));
  };

  const rewardSnacks = (count: number, reason: string) => {
    setSnacks((value) => value + count);
    setPoints((value) => value + count * 30);
    setGrowthXp((value) => value + count);
    setHunger((value) => {
      const next = Math.min(100, value + Math.max(3, count * 2));
      touchCare(next);
      return next;
    });
    speak(`${reason}，给我买了 ${count} 份零食，还赚到积分`, true);
    notify(`Lumo 获得 ${count} 份零食和 ${count * 30} 积分`);
  };

  const feedSnack = (snackId: string) => {
    const snack = petSnacks.find((item) => item.id === snackId);
    if (!snack) return;
    if (snacks < snack.cost) {
      speak("零食不够，先完成一个复习任务吧", true);
      return;
    }
    setSnacks((value) => value - snack.cost);
    setHunger((value) => {
      const next = Math.min(100, value + snack.energy);
      touchCare(next);
      return next;
    });
    setGrowthXp((value) => value + snack.growth);
    if (snackAnimationTimer.current) window.clearTimeout(snackAnimationTimer.current);
    if (snackReactionTimer.current) window.clearTimeout(snackReactionTimer.current);
    const nextGrowthIndex = petGrowthIndexForXp(growthXp + snack.growth);
    const evolved = nextGrowthIndex > growthIndex;
    setSnackAnimation({ snack, nonce: Date.now() });
    setSnackReaction("receiving");
    speak(`哇！接住${snack.label}，星星眼亮了`, true);
    snackReactionTimer.current = window.setTimeout(() => {
      setSnackReaction("gurgling");
      speak(evolved ? `咕噜咕噜...${snack.label}好吃！新芽也冒出来了` : `咕噜咕噜...${snack.label}好吃！`, true);
    }, 680);
    snackAnimationTimer.current = window.setTimeout(() => {
      setSnackAnimation(null);
      setSnackReaction(null);
    }, 2100);
    notify(`Lumo 吃掉 ${snack.label}，成长 +${snack.growth}`);
  };

  const chooseSkin = (skinId: PetSkin) => {
    if (!ownedSkins.includes(skinId)) setOwnedSkins((items) => [...items, skinId]);
    setSkin(skinId);
    notify(`已换装：${petSkins.find((item) => item.id === skinId)?.label ?? "Lumo 皮肤"}`);
    speak(`换上${petSkins.find((item) => item.id === skinId)?.label}`, true);
  };

  const chooseFashion = (slot: PetFashionSlot, itemId: string) => {
    const item = getPetFashionItem(slot, itemId);
    const owned = item.id.startsWith("none") || ownedFashion.includes(item.id);
    if (!owned) {
      const price = item.price ?? 0;
      if (points < price) {
        notify(`积分不足：${item.label} 需要 ${price} 积分`);
        speak(`这个要 ${price} 积分，先完成复习赚积分吧`, true);
        return;
      }
      setPoints((value) => value - price);
      setOwnedFashion((items) => Array.from(new Set([...items, item.id])));
      setOutfit((current) => ({ ...current, [slot]: item.id }));
      notify(`已购买并装备：${item.label}`);
      speak(`积分商城解锁${item.label}，马上穿上`, true);
      return;
    }
    const noneId = getPetFashionNoneId(slot) ?? item.id;
    const isSelected = outfit[slot] === item.id;
    const nextItem = getPetFashionItem(slot, isSelected ? noneId : item.id);
    setOutfit((current) => ({ ...current, [slot]: nextItem.id }));
    const slotLabel = petFashionSlots.find((entry) => entry.id === slot)?.label ?? "时装";
    notify(nextItem.id.startsWith("none") ? `已卸下${slotLabel}` : `已搭配：${nextItem.label}`);
    speak(nextItem.id.startsWith("none") ? `${slotLabel}已卸下，露出原形` : `${slotLabel}换成${nextItem.label}`, true);
  };

  const buySnackBundle = (bundle: (typeof petStoreBundles)[number]) => {
    if (points < bundle.price) {
      notify(`积分不足：${bundle.label} 需要 ${bundle.price} 积分`);
      speak(`积分还不够买${bundle.label}，先整理资料赚积分`, true);
      return;
    }
    setPoints((value) => value - bundle.price);
    setSnacks((value) => value + bundle.snacks);
    setGrowthXp((value) => value + bundle.growth);
    notify(`已购买：${bundle.label}`);
    speak(`${bundle.label}到手，零食库存增加 ${bundle.snacks} 份`, true);
  };

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      if (mode !== "chatty") return;
      const source = sources.find((item) => item.status !== "read" && item.status !== "deleted");
      const contextual = source ? `提醒：${source.title.slice(0, 18)} 还没复习` : petIdleSayings[index % petIdleSayings.length];
      speak(index % 3 === 0 ? contextual : petChattySayings[index % petChattySayings.length], false);
      index += 1;
    }, 11000);
    return () => window.clearInterval(timer);
  }, [mode, sources]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-break-minutes", String(breakMinutes));
    setRestLeft(breakMinutes * 60);
  }, [breakMinutes]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-snacks", String(snacks));
  }, [snacks]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-points", String(points));
  }, [points]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-growth-xp", String(growthXp));
  }, [growthXp]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-skin", skin);
  }, [skin]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-owned-skins", JSON.stringify(ownedSkins));
  }, [ownedSkins]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-outfit", JSON.stringify(outfit));
  }, [outfit]);

  useEffect(() => {
    localStorage.setItem("lumo-pet-owned-fashion", JSON.stringify(ownedFashion));
  }, [ownedFashion]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const seedKey = "lumo-pet-economy-v2-seeded";
    if (localStorage.getItem(seedKey)) return;

    const recoverNumber = (key: string, fallback: number, setter: React.Dispatch<React.SetStateAction<number>>) => {
      const raw = localStorage.getItem(key);
      if (raw !== null && raw !== "0") return;
      localStorage.setItem(key, String(fallback));
      setter((value) => Math.max(value, fallback));
    };

    recoverNumber("lumo-pet-snacks", 3, setSnacks);
    recoverNumber("lumo-pet-points", 180, setPoints);
    recoverNumber("lumo-pet-growth-xp", 2, setGrowthXp);
    recoverNumber("lumo-pet-hunger", 76, setHunger);
    localStorage.setItem(seedKey, "1");
  }, []);

  useEffect(() => () => {
    if (snackAnimationTimer.current) window.clearTimeout(snackAnimationTimer.current);
    if (snackReactionTimer.current) window.clearTimeout(snackReactionTimer.current);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHunger((value) => {
        const next = Math.max(0, value - 1);
        localStorage.setItem("lumo-pet-hunger", String(next));
        return next;
      });
    }, 120000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pomodoroRunning) return;
    const timer = window.setInterval(() => {
      setPomodoroLeft((value) => {
        if (value <= 1) {
          setPomodoroRunning(false);
          rewardSnacks(2, "一个番茄钟完成");
          return 25 * 60;
        }
        return value - 1;
      });
      setRestLeft((value) => {
        if (value <= 1) {
          speak("休息提示：起来走一走，眼睛离开屏幕", true);
          notify("Lumo 提醒你休息一下");
          return breakMinutes * 60;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breakMinutes, pomodoroRunning]);

  const sayDate = () => speak(`当地时间：${petTimeLine(today)}`, true);
  const sayTodo = () => speak(plan.todo[0], true);
  const sayReview = () => speak(plan.schedule[1], true);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY, left: position.x, top: position.y, moved: false };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    const deltaX = event.clientX - dragStart.current.x;
    const deltaY = event.clientY - dragStart.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) dragStart.current.moved = true;
    const nextX = dragStart.current.left + deltaX;
    const nextY = dragStart.current.top + deltaY;
    setPosition({
      x: Math.min(Math.max(12, nextX), Math.max(12, window.innerWidth - 118)),
      y: Math.min(Math.max(86, nextY), Math.max(86, window.innerHeight - 104)),
    });
  };

  const onPointerUp = () => {
    setDragging(false);
    if (dragStart.current.moved) {
      speak("我换个地方陪你", true);
      return;
    }
    // Distinguish single vs double click with a 260ms window
    clickCount.current += 1;
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      if (clickCount.current >= 2) {
        onAsk(); // double-click → open assistant
      } else {
        const phrase = petIdleSayings[Math.floor(Math.random() * petIdleSayings.length)];
        speak(phrase, true);
        setPanelOpen((open) => !open); // single click → open care panel
      }
      clickCount.current = 0;
    }, 260);
  };

  const dateLine = petTimeLine(today);
  const hungerState = hunger <= 0 ? "饿晕了" : hunger < 18 ? "快饿坏了" : hunger < 45 ? "有点饿" : "状态很好";
  const currentSkin = petSkins.find((item) => item.id === skin) ?? petSkins[0];
  const headFashion = getPetFashionItem("head", outfit.head);
  const accessoryFashion = getPetFashionItem("accessory", outfit.accessory);
  const outfitSummary = [headFashion, accessoryFashion]
    .filter((item) => !item.id.startsWith("none"))
    .map((item) => item.label)
    .join(" + ");
  const growthProgress = nextGrowthLevel ? Math.min(100, Math.round(((growthXp - growthLevel.threshold) / (nextGrowthLevel.threshold - growthLevel.threshold)) * 100)) : 100;
  const crownLevel = Math.min(3, Math.max(0, growthIndex));
  const panelPlacement = typeof window !== "undefined" && position.x > window.innerWidth - 560 ? "open-left" : "open-right";
  return (
    <div className="lumo-pet-shell" style={{ left: position.x, top: position.y }}>
      <button
        type="button"
        className={`lumo-pet skin-${skin} growth-${growthIndex} hunger-${hunger <= 0 ? "dead" : hunger < 18 ? "low" : "ok"} ${dragging ? "dragging" : ""} ${petted ? "petted speaking" : ""} ${snackAnimation ? `snacking snack-${snackAnimation.snack.id}` : ""} ${snackReaction ? `snack-reaction-${snackReaction}` : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        title="拖动 Lumo；单击看今日卡片；双击呼出助手"
      >
        <span className="pet-orbit" />
        <span className="pet-spark one" />
        <span className="pet-spark two" />
        <span className="pet-body-rig">
          <img src={currentSkin.asset} alt={`Lumo ${currentSkin.label}`} />
          <span className="pet-eye-cover" aria-hidden />
          <span className="pet-star-eyes" aria-hidden>
            <span />
            <span />
          </span>
          <span className="pet-gurgle" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className={`pet-head-rig ${headFashion.id === "none-head" ? "head-bare" : `head-dressed head-style-${headFashion.id}`}`} aria-hidden>
            {crownLevel > 0 && (
              <span className={`pet-crown crown-level-${crownLevel}`}>
                <span className="pet-head-leaf left" />
                <span className="pet-head-leaf center" />
                <span className="pet-head-leaf right" />
              </span>
            )}
            <span className={`pet-fashion pet-fashion-head ${headFashion.className}`} />
          </span>
          <span className={`pet-fashion pet-fashion-accessory ${accessoryFashion.className}`} aria-hidden />
          {snackAnimation && (
            <span key={snackAnimation.nonce} className={`pet-snack-theater snack-${snackAnimation.snack.id}`} aria-hidden>
              <span className="snack-fly" />
              <span className="snack-chew" />
              <span className="snack-crumb crumb-one" />
              <span className="snack-crumb crumb-two" />
              <span className="snack-crumb crumb-three" />
            </span>
          )}
        </span>
        <span className="pet-bubble">{message}</span>
        {/* Compact growth ring — visible level indicator */}
        <span className="pet-xp-ring" aria-hidden>
          {/* Ring color follows active skin */}
          {(() => {
            const skinRing: Record<string, { base: string; fill: string[]; glow: string }> = {
              classic:   { base: "rgba(148,163,184,0.12)", fill: ["#818cf8","#c084fc"], glow: "rgba(129,140,248,0.7)" },
              mint:      { base: "rgba(134,239,172,0.14)", fill: ["#34d399","#10b981"], glow: "rgba(52,211,153,0.7)" },
              berry:     { base: "rgba(244,114,182,0.14)", fill: ["#f472b6","#e879f9"], glow: "rgba(244,114,182,0.7)" },
              starlight: { base: "rgba(251,191,36,0.14)",  fill: ["#fbbf24","#f59e0b"], glow: "rgba(251,191,36,0.7)" },
            };
            const r = skinRing[skin] ?? skinRing.classic;
            const strokeColor = growthIndex >= 3 ? `url(#xpGrad-${skin})` : growthIndex >= 2 ? r.fill[0] : growthIndex >= 1 ? r.fill[0] + "99" : "transparent";
            return (
              <svg viewBox="0 0 36 36" width="72" height="72">
                <defs>
                  <linearGradient id={`xpGrad-${skin}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={r.fill[0]} />
                    <stop offset="100%" stopColor={r.fill[1]} />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2" stroke={r.base} />
                <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2.5"
                  stroke={strokeColor}
                  strokeDasharray={`${(growthProgress / 100) * 100.53} 100.53`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                  style={{ transition: "stroke-dasharray 0.6s ease", filter: growthIndex >= 3 ? `drop-shadow(0 0 3px ${r.glow})` : "none" }}
                />
              </svg>
            );
          })()}
          {growthIndex > 0 && <span className="pet-xp-level">Lv{growthIndex}</span>}
        </span>
      </button>
      {panelOpen && (
        <>
          {/* Click outside to close */}
          <div className="assistant-backdrop" style={{ zIndex: 51 }} onClick={() => setPanelOpen(false)} />
          <aside
            ref={petPanelRef}
            className={`pet-action-panel ${panelPlacement}`}
            style={panelDragPos ? { position: "fixed", left: panelDragPos.x, top: panelDragPos.y, bottom: "auto", zIndex: 53 } : { zIndex: 53 }}
          >
          <div
            className="pet-panel-head draggable-handle"
            onPointerDown={onPanelDragStart}
            onPointerMove={onPanelDragMove}
            onPointerUp={onPanelDragEnd}
            onPointerCancel={onPanelDragEnd}
            style={{ cursor: "grab" }}
          >
            <div>
              <strong>Lumo 今日提醒</strong>
              <small>{mode === "chatty" ? "话唠模式" : "安静任务模式"} · {hungerState}</small>
            </div>
            <button onClick={() => setPanelOpen(false)} title="收起">×</button>
          </div>
          {/* Brief button — Lumo proactively surfaces this */}
          <button
            type="button"
            className="pet-brief-btn"
            onClick={() => { setPanelOpen(false); onBrief(); }}
          >
            <FileText size={14} />
            <span>查看今日简报</span>
            <span className="pet-brief-arrow">→</span>
          </button>
          <div className="pet-mode-row">
            <button className={mode === "chatty" ? "active" : ""} onClick={() => { setMode("chatty"); speak("话唠模式开启，我会偶尔陪你聊两句", true); }}>话唠</button>
            <button className={mode === "focus" ? "active" : ""} onClick={() => { setMode("focus"); speak("安静任务模式开启，我只在你需要时出现", true); }}>安静任务</button>
          </div>
          <div className="pet-care-card">
            <div className="pet-care-top"><span>{growthLevel.name} · {growthXp} 经验</span><strong>{hunger}%</strong><em>{snacks} 份零食 · {points} 积分</em></div>
            <div className="pet-hunger-bar"><span style={{ width: `${hunger}%` }} /></div>
            <p>{hunger <= 0 ? "Lumo 已经饿晕：完成复习任务或喂零食可以把它救回来。" : "不及时上线整理资料，饱食度会下降；完成任务、项目和番茄钟会赚零食。"}</p>
          </div>
          <div className="pet-mini-grid">
            <button onClick={sayDate}><CalendarDays size={16} /><span>{dateLine}</span></button>
            <button onClick={sayTodo}><ListTodo size={16} /><span>{plan.todo.length} 个待办</span></button>
            <button onClick={sayReview}><Clock size={16} /><span>复习安排</span></button>
          </div>
          <div className="pet-timer-card">
            <div className="pet-timer-head"><strong><span className="tomato-icon" role="img" aria-label="tomato">🍅</span>番茄钟 {formatTimer(pomodoroLeft)}</strong><span>休息倒计时 {formatTimer(restLeft)}</span></div>
            <div className="pet-break-row">
              {([15, 30, 45] as PetBreakMinutes[]).map((item) => <button key={item} className={breakMinutes === item ? "active" : ""} onClick={() => setBreakMinutes(item)}>{item} 分钟</button>)}
            </div>
            <div className="pet-panel-actions compact">
              <button onClick={() => setPomodoroRunning((running) => !running)}>{pomodoroRunning ? "暂停" : "开始专注"}</button>
              <button onClick={() => { setPomodoroRunning(false); setPomodoroLeft(25 * 60); setRestLeft(breakMinutes * 60); }}>重置</button>
            </div>
          </div>
          <div className="pet-todo-list pet-task-list">
            {plan.todo.map((item, index) => (
              <button key={item} onClick={() => rewardSnacks(1, `完成任务 ${index + 1}`)}><CheckCircle2 size={13} /> <span>{item}</span><em>+1 经验</em></button>
            ))}
            {activeProject && <button onClick={() => rewardSnacks(3, `推进项目「${activeProject.name}」`)}><Box size={13} /> <span>推进项目：{activeProject.name}</span><em>+3 经验</em></button>}
          </div>
          <div className="pet-schedule">
            {plan.schedule.map((item) => <p key={item}>{item}</p>)}
          </div>
          <div className="pet-snack-head">
            <strong>零食投喂</strong>
            <span>投喂后会有星星眼和咕噜咕噜动画</span>
            <button
              className="pet-random-outfit-btn"
              type="button"
              onClick={() => {
                // Exclude currently worn items so blind box always gives a fresh combo
                const heads = petFashionItems.filter((item) => item.slot === "head" && item.id !== outfit.head);
                const accessories = petFashionItems.filter((item) => item.slot === "accessory" && item.id !== outfit.accessory);
                // Fallback to full list if only one item exists per slot
                const headPool = heads.length > 0 ? heads : petFashionItems.filter((item) => item.slot === "head");
                const accPool = accessories.length > 0 ? accessories : petFashionItems.filter((item) => item.slot === "accessory");
                const randomHead = headPool[Math.floor(Math.random() * headPool.length)];
                const randomAcc = accPool[Math.floor(Math.random() * accPool.length)];
                setOutfit({ head: randomHead.id, accessory: randomAcc.id });
                speak(`盲盒开出：${randomHead.label} + ${randomAcc.label}！`, true);
                notify(`✨ 随机搭配：${randomHead.label} + ${randomAcc.label}`);
              }}
            >
              🎲 时装盲盒
            </button>
          </div>
          <div className="pet-shop-grid">
            {petSnacks.map((snack) => (
              <button key={snack.id} onClick={() => feedSnack(snack.id)}>
                <span><i className={`snack-dot snack-${snack.id}`} />{snack.label}</span>
                <small>-{snack.cost} 零食 / +{snack.energy} 饱食</small>
                <small>+{snack.growth} 成长经验</small>
                <b>{snack.effect}</b>
              </button>
            ))}
          </div>
          <div className="pet-wardrobe-head">
            <div>
              <strong>换装系统</strong>
              <span>皮肤决定本体，换装现在只保留头饰和配件，更贴合 Lumo 形态</span>
            </div>
            <Badge tone="blue">当前 {currentSkin.label}</Badge>
          </div>
          <div className="pet-style-summary">
            <strong>今日搭配：{outfitSummary || "轻装原形"}</strong>
            <span>{headFashion.detail} · {accessoryFashion.detail}</span>
          </div>
          <div className="pet-fashion-board">
            {petFashionSlots.map((slot) => {
              const selectedItem = getPetFashionItem(slot.id, outfit[slot.id]);
              return (
                <section key={slot.id} className="pet-fashion-slot">
                  <div className="pet-fashion-slot-head">
                    <strong>{slot.label}</strong>
                    <span>{slot.hint} · 当前 {selectedItem.label}</span>
                  </div>
                  <div className="pet-fashion-options">
                    {petFashionItems.filter((item) => item.slot === slot.id).map((item) => {
                      const owned = item.id.startsWith("none") || ownedFashion.includes(item.id);
                      return (
                      <button key={item.id} type="button" className={`${outfit[slot.id] === item.id ? "active" : ""} ${owned ? "" : "locked"}`} aria-pressed={outfit[slot.id] === item.id} onClick={() => chooseFashion(slot.id, item.id)}>
                        <span className={`fashion-swatch ${item.className}`} />
                        <strong>{item.label}</strong>
                        <small>{owned ? item.detail : `${item.price ?? 0} 积分解锁`}</small>
                      </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          <div className="pet-skin-shop pet-wardrobe">
            {petSkins.map((item) => <button key={item.id} type="button" className={`wardrobe-card ${skin === item.id ? "active" : ""}`} aria-pressed={skin === item.id} onClick={() => chooseSkin(item.id)}>
              <span className="wardrobe-preview">
                <img src={item.asset} alt="" />
                <em>{skin === item.id ? "使用中" : "可切换"}</em>
              </span>
              <span className="wardrobe-copy">
                <strong>{item.label}</strong>
                <small>{item.outfit}</small>
                <b>{item.palette}</b>
              </span>
            </button>)}
          </div>
          <div className="pet-panel-actions">
            <button onClick={() => { setActiveView("review"); notify("已打开知识回访，按今天的复习计划处理笔记"); }}>去复习</button>
            <button onClick={onAsk}>问 Lumo</button>
          </div>
        </aside>
        </>
      )}
    </div>
  );
}

function pageTitle(view: ActiveView, language: AppLanguage = "zh") {
  const labels: Record<ActiveView, string> = {
    inbox: "智能收件箱",
    sources: "资料库",
    collections: "收藏",
    projects: "研究项目",
    reader: "阅读器",
    highlights: "高亮",
    notes: "笔记",
    claims: "观点",
    evidence: "证据",
    insights: "洞察",
    deliverables: "成果",
    review: "知识回访",
    tags: "标签",
    import_export: "导入/导出",
    profile: "个人中心",
    community: "Lumo之家",
    settings: "设置",
  };
  const labelsEn: Record<ActiveView, string> = {
    inbox: "AI Inbox",
    sources: "Library",
    collections: "Topics",
    projects: "Projects",
    reader: "Reader",
    highlights: "Highlights",
    notes: "Notes",
    claims: "Claims",
    evidence: "Evidence",
    insights: "Insights",
    deliverables: "Deliverables",
    review: "Review",
    tags: "Tags",
    import_export: "Import / Export",
    profile: "Profile",
    community: "Lumo Home",
    settings: "Settings",
  };
  return language === "en" ? labelsEn[view] : labels[view];
}

function pageDescription(view: ActiveView, language: AppLanguage = "zh") {
  const descriptions: Record<ActiveView, string> = {
    sources: "收集链接、文章、截图、视频、PDF 和灵感碎片；每条资料都是你研究的原始素材。",
    inbox: "Lumo 自动对新收藏的资料打分和分拣，帮你优先处理最值得深读的内容。",
    collections: "按主题创建主题夹，把散落资料归组；主题夹可一键升级为研究项目。",
    projects: "把多条资料的观点、证据和洞察整合成一个研究空间，支撑你的最终输出。",
    reader: "专注阅读模式：高亮关键段落，批注笔记，一键提取为观点或证据。",
    highlights: "集中管理高亮，并转换为可复用证据。",
    notes: "集中管理阅读笔记，便于回访、转换和项目复用。",
    claims: "从资料和高亮中抽取出的可复用观点。",
    evidence: "支撑观点和成果文档的原文证据，每条都带来源链接。",
    insights: "基于多条资料、观点和证据生成的跨资料判断与结论。",
    deliverables: "把项目里积累的资料、观点与证据，一键生成研究简报、竞品分析或文章大纲。",
    review: "重新激活旧资料，避免收藏后遗忘。",
    tags: "查看标签、收藏目的和资料分布。",
    import_export: "导出资料、成果和插件采集数据，支持迁移到其他工具。",
    profile: "管理账号、头像、个人资料和套餐信息。",
    community: "Lumo 之家：公开笔记、知识内容和用户互动。",
    settings: "语言、主题和插件配置；账号与导入导出入口也在这里。",
  };
  const descriptionsEn: Record<ActiveView, string> = {
    sources: "Your source library: collect links, articles, screenshots, videos, PDFs, and rough ideas.",
    inbox: "AI Inbox triages saved material — prioritise the most research-worthy items first.",
    collections: "Organise sources into topic folders; any collection can be promoted to a research project.",
    projects: "One workspace per research question: sources, claims, evidence, insights, and deliverables in one place.",
    reader: "Focused reading mode: highlight key passages, add notes, extract claims and evidence in one click.",
    highlights: "Review highlights and convert them into reusable evidence.",
    notes: "Manage reading notes for review, conversion, and project reuse.",
    claims: "Reusable claims extracted from sources and highlights.",
    evidence: "Source-backed evidence supporting claims and deliverables — every item linked to its origin.",
    insights: "Cross-source conclusions synthesised from sources, claims, and evidence.",
    deliverables: "Turn project material into a research brief, competitive analysis, or article outline in one click.",
    review: "Bring old saves back into the workflow instead of losing them in a backlog.",
    tags: "Explore tags, purposes, and source distribution.",
    import_export: "Export sources, outputs, and extension captures for migration or backup.",
    profile: "Manage sign-in, avatar, profile and plan information.",
    community: "Lumo Home for public notes, knowledge sharing, and visitor interactions.",
    settings: "Language, theme, and extension config; account and import/export links are here too.",
  };
  return language === "en" ? descriptionsEn[view] : descriptions[view];
}

// ── Error Boundary ────────────────────────────────────────
class ViewErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[Lumo] View crash:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="view-error-fallback">
          <div className="view-error-card">
            <span className="view-error-icon">⚠️</span>
            <strong>这个页面遇到了问题</strong>
            <p>{(this.state.error as Error).message}</p>
            <button type="button" onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ViewRouter({ onCapture }: { onCapture: (mode?: QuickCaptureMode) => void }) {
  const activeView = useAppStore((s) => s.activeView);
  if (activeView === "inbox") return <ViewErrorBoundary><AllSources onCapture={onCapture} /></ViewErrorBoundary>;
  if (activeView === "sources") return <ViewErrorBoundary><AllSources onCapture={onCapture} /></ViewErrorBoundary>;
  if (activeView === "collections") return <ViewErrorBoundary><TopicsView /></ViewErrorBoundary>;
  if (activeView === "projects") return <ViewErrorBoundary><ProjectsView /></ViewErrorBoundary>;
  if (activeView === "reader") return <ViewErrorBoundary><ReaderView /></ViewErrorBoundary>;
  if (activeView === "highlights") return <ViewErrorBoundary><HighlightsView /></ViewErrorBoundary>;
  if (activeView === "notes") return <ViewErrorBoundary><NotesView /></ViewErrorBoundary>;
  if (activeView === "claims") return <ViewErrorBoundary><ClaimsView /></ViewErrorBoundary>;
  if (activeView === "evidence") return <ViewErrorBoundary><EvidenceView /></ViewErrorBoundary>;
  if (activeView === "insights") return <ViewErrorBoundary><InsightsView /></ViewErrorBoundary>;
  if (activeView === "deliverables") return <ViewErrorBoundary><DeliverablesView /></ViewErrorBoundary>;
  if (activeView === "review") return <ViewErrorBoundary><ReviewView /></ViewErrorBoundary>;
  if (activeView === "tags") return <ViewErrorBoundary><TagsPurposeView /></ViewErrorBoundary>;
  if (activeView === "profile") return <ViewErrorBoundary><ProfileView /></ViewErrorBoundary>;
  if (activeView === "import_export") return <ViewErrorBoundary><ImportExportView /></ViewErrorBoundary>;
  return <ViewErrorBoundary><SettingsView /></ViewErrorBoundary>;
}

// ── 语音全库搜索 ──────────────────────────────────────────
function AISearchPanel({ onClose }: { onClose: () => void }) {
  const sources = useAppStore((s) => s.sources);
  const notes = useAppStore((s) => s.notes);
  const claims = useAppStore((s) => s.claims);
  const evidence = useAppStore((s) => s.evidence);
  const insights = useAppStore((s) => s.insights);
  const language = useAppStore((s) => s.language);
  const setSelectedSource = useAppStore((s) => s.setSelectedSource);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const english = isEn(language);

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-start voice on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); setTimeout(() => inputRef.current?.focus(), 50); return; }
    startVoice(SR);
    return () => { try { recRef.current?.stop(); } catch { /* ignore */ } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startVoice(SR?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SRCls = SR || (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRCls) { setVoiceSupported(false); inputRef.current?.focus(); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = new (SRCls as new () => any)();
      rec.lang = "zh-CN";
      rec.continuous = false;
      rec.interimResults = true;
      rec.onstart = () => { setListening(true); setInterim(""); };
      rec.onend = () => { setListening(false); setInterim(""); };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        let finalText = "", interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interimText += t;
        }
        if (finalText) { setQuery(finalText); setSubmitted(finalText); setInterim(""); }
        else setInterim(interimText);
      };
      rec.onerror = () => { setListening(false); };
      recRef.current = rec;
      rec.start();
    } catch { setVoiceSupported(false); }
  }

  function stopVoice() { try { recRef.current?.stop(); } catch { /* ignore */ } setListening(false); }

  const results = useMemo(() => {
    if (!submitted.trim()) return { sources: [], notes: [], claims: [], evidence: [], insights: [] };
    const q = submitted.toLowerCase();
    return {
      sources: sources.filter((s) => [s.title, s.summary ?? "", s.sourceName ?? "", ...s.content].join(" ").toLowerCase().includes(q)).slice(0, 6),
      notes: notes.filter((n) => n.content.toLowerCase().includes(q)).slice(0, 4),
      claims: claims.filter((c) => c.text.toLowerCase().includes(q)).slice(0, 4),
      evidence: evidence.filter((e) => e.text.toLowerCase().includes(q)).slice(0, 4),
      insights: insights.filter((i) => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q)).slice(0, 3),
    };
  }, [submitted, sources, notes, claims, evidence, insights]);

  const totalHits = results.sources.length + results.notes.length + results.claims.length + results.evidence.length + results.insights.length;

  const aiAnswer = useMemo(() => {
    if (!submitted || totalHits === 0) return null;
    const topClaim = results.claims[0];
    const topSrc = results.sources[0];
    const topNote = results.notes[0];
    if (topClaim) return `关于「${submitted}」，你的资料库中有这条观点：${topClaim.text}${topSrc ? `（来自《${topSrc.title}》）` : ""}`;
    if (topSrc) return `资料库中最相关的是《${topSrc.title}》：${topSrc.summary}${topNote ? `\n\n你有一条批注：${topNote.content}` : ""}`;
    if (topNote) return `找到一条批注：${topNote.content}`;
    return `在资料库中找到 ${totalHits} 条相关内容。`;
  }, [submitted, results, totalHits]);

  const reset = () => { setQuery(""); setSubmitted(""); setInterim(""); };

  return (
    <div className="ai-search-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ai-search-panel voice-first-panel">
        {/* Close */}
        <button className="ai-search-close" onClick={onClose} type="button"><X size={20} /></button>

        {/* Voice center — shown before any search */}
        {!submitted && (
          <div className="voice-search-center">
            <button
              type="button"
              className={`voice-mic-btn ${listening ? "listening" : ""}`}
              onClick={() => listening ? stopVoice() : startVoice()}
              title={listening ? "点击停止" : "点击开始语音搜索"}
            >
              <Mic size={36} />
            </button>
            <p className="voice-status">
              {listening
                ? (interim || "正在听…")
                : voiceSupported ? "点击麦克风，说出你想找的内容" : "语音不可用，请直接输入"}
            </p>
            {listening && <div className="voice-wave"><span/><span/><span/><span/><span/></div>}
            {!listening && voiceSupported && (
              <p className="voice-hint">例如：竞品的核心定位 · 保湿产品证据 · 用户访谈要点</p>
            )}
          </div>
        )}

        {/* Text input fallback / supplemental */}
        <form className="ai-search-form" onSubmit={(e) => { e.preventDefault(); if (query.trim()) setSubmitted(query.trim()); }}
          style={{ marginTop: submitted ? 0 : 16 }}>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={english ? "Or type to search your library…" : "或直接输入文字搜索资料库…"}
            className="ai-search-input" />
          {voiceSupported && !listening && submitted && (
            <button type="button" className="ai-voice-btn" onClick={() => { reset(); startVoice(); }} title="重新语音搜索"><Mic size={18} /></button>
          )}
          <button type="submit" className="ai-search-submit"><Search size={16} /></button>
        </form>

        {/* AI answer */}
        {aiAnswer && (
          <div className="ai-search-answer">
            <div className="ai-answer-header"><Sparkles size={14} /><span>Lumo 解读</span></div>
            <p>{aiAnswer}</p>
          </div>
        )}

        {/* No results */}
        {submitted && totalHits === 0 && (
          <p className="ai-search-empty">资料库中暂无「{submitted}」相关内容，换个说法试试？</p>
        )}

        {/* Results */}
        {totalHits > 0 && (
          <div className="ai-search-results">
            {results.sources.length > 0 && (
              <section>
                <h4><Globe2 size={13} /> 资料 ({results.sources.length})</h4>
                {results.sources.map((s) => (
                  <div key={s.id} className="ai-result-item" style={{ cursor:"pointer" }}
                    onClick={() => { setSelectedSource(s.id); setActiveView("reader"); onClose(); }}>
                    <Globe2 size={13} />
                    <div><strong>{s.title}</strong><small>{s.sourceName}</small></div>
                  </div>
                ))}
              </section>
            )}
            {results.claims.length > 0 && (
              <section>
                <h4><Lightbulb size={13} /> 观点 ({results.claims.length})</h4>
                {results.claims.map((c) => (
                  <div key={c.id} className="ai-result-item" style={{ cursor:"pointer" }}
                    onClick={() => { setActiveView("claims"); onClose(); }}>
                    <Lightbulb size={13} /><div><strong>{c.text}</strong></div>
                  </div>
                ))}
              </section>
            )}
            {results.evidence.length > 0 && (
              <section>
                <h4><ShieldCheck size={13} /> 证据 ({results.evidence.length})</h4>
                {results.evidence.map((e) => (
                  <div key={e.id} className="ai-result-item">
                    <ShieldCheck size={13} /><div><strong>{e.text}</strong><small>{e.sourceTitle}</small></div>
                  </div>
                ))}
              </section>
            )}
            {results.insights.length > 0 && (
              <section>
                <h4><Sparkles size={13} /> 洞察 ({results.insights.length})</h4>
                {results.insights.map((i) => (
                  <div key={i.id} className="ai-result-item">
                    <Sparkles size={13} /><div><strong>{i.title}</strong><small>{i.content.slice(0,60)}</small></div>
                  </div>
                ))}
              </section>
            )}
            {results.notes.length > 0 && (
              <section>
                <h4><MessageSquare size={13} /> 批注 ({results.notes.length})</h4>
                {results.notes.map((n) => (
                  <div key={n.id} className="ai-result-item">
                    <MessageSquare size={13} /><div><strong>{n.content}</strong></div>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 今日简报 ──────────────────────────────────────────────
function DailyBriefPanel({ onClose }: { onClose: () => void }) {
  const sources = useAppStore((s) => s.sources);
  const claims = useAppStore((s) => s.claims);
  const insights = useAppStore((s) => s.insights);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const today = new Date();
  const unread = sources.filter((s) => s.status === "inbox" || s.status === "unread").slice(0, 8);
  const topClaims = claims.filter((c) => c.confidence === "high").slice(0, 4);
  const topInsight = insights[0];

  return (
    <div className="ai-search-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="daily-brief-panel">
        <div className="ai-search-header">
          <FileText size={20} />
          <h2>今日简报 · {today.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</h2>
          <button onClick={onClose} type="button"><X size={20} /></button>
        </div>
        <div className="brief-content">
          <section className="brief-section">
            <h3><Inbox size={15} /> 待读资料 <span>{unread.length} 条</span></h3>
            {unread.length === 0 ? <p className="brief-empty">收件箱已清空，今天做得很好！</p> : unread.map((s) => (
              <div key={s.id} className="brief-source-row">
                <img src={s.snapshotImage ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.url)}&sz=32`} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} className="brief-favicon" />
                <div>
                  <strong>{s.title}</strong>
                  <small>{s.sourceName} · {s.readingTime} 分钟</small>
                </div>
                <Badge tone={s.triageStatus === "must_read" ? "red" : s.triageStatus === "project_material" ? "blue" : "neutral"}>
                  {s.triageStatus === "must_read" ? "必读" : s.triageStatus === "project_material" ? "项目素材" : "略读"}
                </Badge>
              </div>
            ))}
          </section>
          {topClaims.length > 0 && (
            <section className="brief-section">
              <h3><Lightbulb size={15} /> 高置信观点 <span>{topClaims.length} 条</span></h3>
              {topClaims.map((c) => <p key={c.id} className="brief-claim">「{c.text}」</p>)}
            </section>
          )}
          {topInsight && (
            <section className="brief-section">
              <h3><Sparkles size={15} /> 最新洞察</h3>
              <div className="brief-insight">
                <strong>{topInsight.title}</strong>
                <p>{topInsight.content}</p>
              </div>
            </section>
          )}
          <section className="brief-section brief-capture-section">
            <h3>📡 所有阅读，汇于一处</h3>
            <div className="capture-method-grid">
              {[
                { icon: Globe2, label: "网页文章", status: "available", note: "Chrome 插件一键保存" },
                { icon: Highlighter, label: "网页高亮", status: "available", note: "阅读时随时高亮标注" },
                { icon: ImageIcon, label: "截图快照", status: "available", note: "保存可视区域截图" },
                { icon: Video, label: "视频时间点", status: "available", note: "保存视频+时间戳" },
                { icon: Inbox, label: "邮箱通讯", status: "available", note: "Newsletter 转资料，AI 解析" },
                { icon: Smartphone, label: "移动端 APP", status: "available", note: "iOS / Android 已上线" },
              ].map(({ icon: Icon, label, status, note }) => (
                <div key={label} className={`capture-method-card ${status}`}>
                  <Icon size={18} />
                  <strong>{label}</strong>
                  <small>{note}</small>
                  {status === "coming" && <span className="coming-badge">即将</span>}
                </div>
              ))}
            </div>
            <a className="chrome-install-btn" href="#" onClick={(e) => { e.preventDefault(); setActiveView("settings"); onClose(); }}>
              <img src="https://www.google.com/favicon.ico" alt="Chrome" width={16} height={16} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              安装 Chrome 扩展
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}

// For DailyBriefPanel to access setActiveView, we need a wrapper that can call it
// The component above uses setActiveView directly which won't work; we'll fix by importing from store:

type AssistantMessage = {
  role: "assistant" | "user";
  content: string;
  navActions?: Array<{ label: string; view: ActiveView }>;
};

function FloatingAssistant({ onClose, onCapture }: { onClose: () => void; onCapture: (mode?: QuickCaptureMode) => void }) {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const selectedSourceId = useAppStore((s) => s.selectedSourceId);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const sources = useAppStore((s) => s.sources);
  const projects = useAppStore((s) => s.projects);
  const claims = useAppStore((s) => s.claims);
  const evidence = useAppStore((s) => s.evidence);
  const insights = useAppStore((s) => s.insights);
  const deliverables = useAppStore((s) => s.deliverables);
  const source = sources.find((item) => item.id === selectedSourceId);
  const project = projects.find((item) => item.id === selectedProjectId);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Drag state
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  const onDragStart = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return; // don't steal button clicks
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.min(Math.max(0, dragRef.current.origX + dx), window.innerWidth - 200);
    const newY = Math.min(Math.max(0, dragRef.current.origY + dy), window.innerHeight - 100);
    setPos({ x: newX, y: newY });
  };
  const onDragEnd = () => { dragRef.current = null; };
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: aiService.hasApiKey()
        ? `你好，我是 Lumo 助手，已接入 DeepSeek AI。我可以跨所有资料、项目和洞察回答你的研究问题——不只是当前页面，而是你的整个知识库。`
        : `你好，我是 Lumo 助手。我可以帮你分析资料、回顾观点、比较证据，或给出下一步建议。配置 DeepSeek API Key 后可获得更强大的 AI 回答。`,
    },
  ]);
  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setMessages((items) => [...items, { role: "user", content: trimmed }]);
    setInput("");

    // Build full global knowledge base context
    const globalContext = [
      `【知识库概况】${sources.length} 条资料 · ${claims.length} 个观点 · ${evidence.length} 条证据 · ${insights.length} 条洞察 · ${deliverables.length} 份成果`,
      projects.length > 0 && `【项目】${projects.filter(p => p.status !== "archived").map(p => p.name).join("、")}`,
      sources.length > 0 && `【近期资料】${sources.slice(0, 8).map(s => `《${s.title}》`).join("、")}`,
      claims.length > 0 && `【代表性观点】${claims.slice(0, 6).map(c => c.text.slice(0, 50)).join("；")}`,
      insights.length > 0 && `【核心洞察】${insights.slice(0, 4).map(i => i.title).join("、")}`,
      source && `【当前阅读】《${source.title}》`,
      project && `【当前项目】${project.name}`,
      `【当前页面】${pageDescription(activeView)}`,
    ].filter(Boolean).join("\n");

    const systemPrompt = `你是 Lumo 研究助手，拥有用户整个知识库的全局视野，可以跨资料、跨项目回答任何研究问题，包括资料分析、研究方法建议、跨项目洞察、内容策略等。用中文简洁回答（3-5 句为宜）。\n\n${globalContext}`;

    if (aiService.hasApiKey()) {
      setIsThinking(true);
      try {
        const client = new (await import("openai")).default({ apiKey: aiService.getApiKey(), baseURL: "https://api.deepseek.com", dangerouslyAllowBrowser: true });
        const resp = await client.chat.completions.create({
          model: "deepseek-chat",
          max_tokens: 600,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-4).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
            { role: "user", content: trimmed },
          ],
        });
        setMessages((items) => [...items, { role: "assistant", content: resp.choices[0]?.message?.content ?? "暂无回答" }]);
      } catch (err) {
        const fallback = answerLumoQuestion(trimmed, { activeView, source, project, claims, evidence, insights, deliverables });
        setMessages((items) => [...items, { role: "assistant", content: `⚠️ AI 暂时不可用：${(err as Error).message}\n\n本地回答：${fallback}` }]);
      } finally {
        setIsThinking(false);
      }
    } else {
      const answer = answerLumoQuestion(trimmed, { activeView, source, project, claims, evidence, insights, deliverables });
      setMessages((items) => [...items, { role: "assistant", content: answer }]);
    }
  };
  const quickActions = [
    { label: "资料库有哪些核心主题？", action: () => ask("分析一下我的资料库，核心研究主题和趋势是什么？") },
    { label: "最值得关注的洞察？", action: () => ask("综合所有洞察，目前最值得深入的发现是什么？") },
    { label: "各项目进展怎么样？", action: () => ask("帮我梳理一下各个项目的研究进展和待完成事项") },
    { label: "下一步做什么？", action: () => ask("基于我的整体研究状态，现在最该做哪一步？") },
  ];
  return (
    <aside
      ref={panelRef}
      className="assistant-panel"
      aria-label="Lumo 智能问答助手"
      style={pos ? { position: "fixed", left: pos.x, top: pos.y, bottom: "auto", right: "auto" } : undefined}
    >
      <div
        className="assistant-head draggable-handle"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        title="拖动面板"
        style={{ cursor: "grab" }}
      >
        <div>
          <img src="/media/lumo-app-icon-new.svg" alt="" />
          <span><strong>Lumo 助手</strong><small>全局知识库 · DeepSeek AI</small></span>
        </div>
        <button onClick={onClose} title="关闭助手"><X size={17} /></button>
      </div>
      <div className="assistant-quick-actions">
        {quickActions.map((item) => <button key={item.label} onClick={item.action}>{item.label}</button>)}
      </div>
      <div className="assistant-messages">
        {messages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
        {isThinking && <div className="assistant-message assistant thinking"><span className="assistant-dots"><span /><span /><span /></span>Lumo 正在思考…</div>}
      </div>
      <form className="assistant-input" onSubmit={(event) => { event.preventDefault(); ask(input); }}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="问 Lumo：跨资料、跨项目都能答…" />
        <button type="submit" title="发送"><Send size={16} /></button>
      </form>
      <div className="assistant-links">
        <button onClick={() => setActiveView("reader")}>去阅读器</button>
        <button onClick={() => setActiveView("projects")}>看项目图谱</button>
        <button onClick={() => setActiveView("deliverables")}>看成果</button>
      </div>
    </aside>
  );
}

function answerLumoQuestion(
  question: string,
  context: {
    activeView: ActiveView;
    source?: Source;
    project?: Project;
    claims: Claim[];
    evidence: Evidence[];
    insights: Insight[];
    deliverables: Deliverable[];
  },
) {
  const text = question.toLowerCase();
  if (text.includes("大模型") || text.includes("模型") || text.includes("ai") || question.includes("原理")) {
    return "当前这个版本还没有真实接入大模型，页面里的 AI 分析是基于本地演示数据、规则模板和项目上下文生成的：先读取资料的摘要、关键点、来源、标签和项目关系，再按收件箱分拣、观点抽取、证据归因、洞察综合这几个流程组织结果。正式上线版可以接入大模型 API，让摘要、问答、观点/证据抽取都由真实模型完成，并把每条回答绑定原始出处。";
  }
  if (question.includes("观点") && question.includes("洞察")) {
    return "观点是从单条资料或段落里抽出的判断，适合被证据支撑；证据是原文、链接、截图或事实出处；洞察是跨多条观点和证据综合后的策略性结论。简单说：观点更像砖块，证据是地基，洞察是用这些砖块搭出来的结构。";
  }
  if (question.includes("下一步") || question.includes("怎么做")) {
    if (context.activeView === "reader" && context.source) {
      return `建议先处理当前资料「${context.source.title}」：1. 高亮最关键段落；2. 把判断性段落创建为观点；3. 把出处或事实段落创建为证据；4. 回到项目图谱看它是否已经支撑成果文档。`;
    }
    if (context.activeView === "projects" && context.project) {
      return `当前项目是「${context.project.name}」。建议先看知识图谱，确认资料、观点、证据、洞察是否连起来；如果证据少，就回阅读器补证据；如果洞察足够，就生成研究简报或竞品分析。`;
    }
    return "建议从智能收件箱开始：先看 Lumo 标记为“必须阅读”和“项目素材”的资料，再进入阅读器创建观点/证据，最后在项目图谱里生成成果。";
  }
  if (question.includes("成果") || question.includes("文档")) {
    return `当前已有 ${context.deliverables.length} 份成果文档。成果不是单独生成的文本，而是从项目里的资料、观点、证据、洞察组合出来的，所以你最好先补齐证据，再生成研究简报、竞品分析或 PRD。`;
  }
  if (question.includes("快捷键") || question.includes("收藏")) {
    return "Lumo 支持两层快捷操作：App 内可以用 Ctrl/⌘ + K 搜索、Ctrl/⌘ + J 呼出助手；Chrome 插件负责跨网页收藏，包含链接、文章快照、截图、视频时间点。真实网页截图应由插件通过 chrome.tabs.captureVisibleTab 捕获。";
  }
  if (context.source) {
    return `我会基于当前资料「${context.source.title}」来判断。它的 AI 摘要是：${context.source.summary} 建议先看关键段落，再把判断转观点、把出处转证据。`;
  }
  return "我可以回答当前页面怎么用、AI 分析从哪里来、如何创建观点/证据、如何生成成果，也可以帮你判断某条资料下一步应该读、归档还是入项目。";
}

function AddSourceModal({ onClose }: { onClose: () => void }) {
  const addSource = useAppStore((s) => s.addSource);
  const collections = useAppStore((s) => s.collections);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  useEffect(() => { urlRef.current?.focus(); }, []);
  const suggestedCollection = useMemo(() =>
    suggestCollectionId({ title, sourceName: "手动添加", purpose: "later_reading", tags: [] }, collections),
    [title, collections]
  );
  const suggestedName = collections.find((c) => c.id === suggestedCollection)?.name;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) return;
    addSource({ title: title.trim() || url.trim(), url: url.trim(), sourceName: "手动添加", type: "article", purpose: "later_reading", collectionIds: suggestedCollection ? [suggestedCollection] : [], tags: ["manual"] });
    onClose();
  };
  return (
    <Modal title={english ? "Add Source" : "添加资料"} onClose={onClose}>
      <form className="add-source-simple" onSubmit={submit}>
        <div className="add-source-hero">
          <div className="add-source-icon"><Link2 size={22} /></div>
          <div>
            <strong>{english ? "Paste a link" : "粘贴一条链接"}</strong>
            <p>{english ? "AI auto-detects title, type and collection — no manual input needed." : "AI 自动识别标题、类型和所属主题夹，直接保存，无需手动填写。"}</p>
          </div>
        </div>
        <div className="add-source-fields">
          <div className="add-source-field-wrap url-wrap">
            <Globe2 size={16} className="field-icon" />
            <input ref={urlRef} type="url" className="add-source-input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} required />
          </div>
          <div className="add-source-field-wrap">
            <FileText size={16} className="field-icon" />
            <input type="text" className="add-source-input" placeholder={english ? "Title (optional)" : "标题（选填）"} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        {suggestedName && (
          <div className="add-source-hint">
            <Sparkles size={13} />
            <span>{english ? <>AI suggests collection: <strong>{suggestedName}</strong></> : <>AI 建议归入主题夹：<strong>{suggestedName}</strong></>}</span>
          </div>
        )}
        <Button type="submit" variant="primary" className="add-source-submit">
          <Plus size={16} /> {english ? "Save to library" : "保存到资料库"}
        </Button>
      </form>
    </Modal>
  );
}

function QuickCaptureModal({ initialMode, onClose }: { initialMode: QuickCaptureMode; onClose: () => void }) {
  const addSource = useAppStore((s) => s.addSource);
  const collections = useAppStore((s) => s.collections);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const [mode, setMode] = useState<QuickCaptureMode>(initialMode);
  const [purpose, setPurpose] = useState<Purpose>("project_research");
  const preset = capturePreset(mode);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title"));
    const url = String(form.get("url"));
    const note = String(form.get("note"));
    const tags = [preset.tag, "quick-capture", purpose.replace("_", "-"), "ai-auto-classified"];
    const targetCollectionId = suggestCollectionId({ title, sourceName: preset.sourceName, purpose, tags }, collections);
    addSource({
      title,
      url,
      sourceName: preset.sourceName,
      sourceReferences: [{ label: preset.sourceName, url, note: preset.referenceNote }],
      type: preset.type,
      captureMode: mode,
      snapshotImage: preset.image,
      capturedText: `${preset.snapshotText}\n${note}`,
      purpose,
      triageStatus: mode === "video_timestamp" ? "project_material" : "must_read",
      collectionIds: targetCollectionId ? [targetCollectionId] : [],
      tags,
      content: [
        `${preset.label}：${title}`,
        `来源链接：${url}`,
        preset.snapshotText,
        note ? `用户备注：${note}` : "用户备注：暂无。",
        "Lumo 建议：先生成摘要，再把关键信息转成 Claim / Evidence。",
      ],
    });
    onClose();
  };
  return (
    <Modal title={english ? "Quick Capture" : "快速搜集"} onClose={onClose}>
      <div className="extension-note">
        <Plug size={17} />
        <span>{english ? "This is the in-app demo entry point. Real cross-page shortcuts, screenshots and video timestamps are handled by the Chrome extension." : "这里是 App 内演示入口；真正跨网页快捷键、当前网页截图和视频时间点由项目里的 Chrome 插件完成。"}</span>
      </div>
      <div className="capture-modal-layout">
        <div className="capture-modes">
          {(["link", "article_snapshot", "image_snapshot", "video_timestamp"] as QuickCaptureMode[]).map((item) => {
            const itemPreset = capturePreset(item);
            const Icon = itemPreset.icon;
            return (
              <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
                <Icon size={17} />
                <span>{itemPreset.label}</span>
              </button>
            );
          })}
        </div>
        <form className="form" onSubmit={submit}>
          <div className="capture-preview">
            <img src={preset.image} alt={preset.label} />
            <div>
              <Badge tone="blue">{preset.label}</Badge>
              <p>{preset.description}</p>
              <kbd>{preset.shortcut}</kbd>
            </div>
          </div>
          <input name="title" placeholder={english ? "Auto-detect title" : "自动识别标题"} defaultValue={preset.title} required />
          <input name="url" placeholder={english ? "Current page / video link" : "当前网页 / 视频链接"} defaultValue={preset.url} required />
          <div className="form-grid">
            <select value={purpose} onChange={(event) => setPurpose(event.target.value as Purpose)}>
              {purposes.map((item) => <option key={item} value={item}>{purposeLabel(item)}</option>)}
            </select>
            <input name="note" placeholder={english ? "Why are you saving this? (optional)" : "补一句收藏原因，可选"} defaultValue={preset.note} />
          </div>
          <div className="snapshot-checklist">
            {preset.checklist.map((item) => <span key={item}><CheckCircle2 size={14} /> {item}</span>)}
          </div>
          <Button type="submit" variant="primary"><Camera size={16} /> {english ? "Save to library" : "保存到资料库"}</Button>
        </form>
      </div>
    </Modal>
  );
}

function ShortcutModal({ onCapture, onClose }: { onCapture: (mode?: QuickCaptureMode) => void; onClose: () => void }) {
  return (
    <Modal title="快捷键与搜集入口" onClose={onClose}>
      <div className="shortcut-list">
        {shortcutCards.map((item) => (
          <button
            key={item.keys}
            className="shortcut-row"
            onClick={() => {
              if (item.mode) onCapture(item.mode);
            }}
          >
            <kbd>{item.keys}</kbd>
            <span><strong>{item.title}</strong><small>{item.description}</small></span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function capturePreset(mode: QuickCaptureMode) {
  const presets = {
    link: {
      label: "收藏链接",
      shortcut: "⌘ / Ctrl + Shift + S",
      title: "Duolingo Streak 机制：学习留存增长拆解",
      url: "https://blog.duolingo.com/streak/",
      note: "保存增长机制页面，后续拆留存闭环和证据。",
      sourceName: "Lumo 快捷收藏",
      type: "webpage" as SourceType,
      tag: "link",
      referenceNote: "快捷收藏当前网页，保留页面标题、URL 和保存目的。",
      image: "/media/lumo-photo-duolingo.jpg",
      icon: Link2,
      description: "保存当前网页 URL、标题和收藏目的。",
      snapshotText: "App 内演示保存标题、URL、站点和保存时间；Chrome 插件会在任意网页读取真实当前标签页。",
      checklist: ["标题", "URL", "站点", "收藏目的"],
    },
    article_snapshot: {
      label: "文章图文快照",
      shortcut: "⌘ / Ctrl + Shift + A",
      title: "Notion AI：知识工作台里的 AI 功能包装",
      url: "https://www.notion.com/product/ai",
      note: "保存正文片段、封面图和 AI 工作流证据。",
      sourceName: "文章快照",
      type: "article" as SourceType,
      tag: "article-snapshot",
      referenceNote: "文章快照保留原文链接、封面图、正文片段和 AI 摘要。",
      image: "/media/lumo-photo-notion-ai.jpg",
      icon: FileText,
      description: "保存标题、正文摘要、封面图、原文链接和快照状态。",
      snapshotText: "模拟生成文章快照：包含封面图、正文片段、AI Summary 和可引用原文。",
      checklist: ["封面图", "正文片段", "AI 摘要", "网页快照"],
    },
    image_snapshot: {
      label: "图文快照",
      shortcut: "工具栏点击",
      title: "Airbnb Rooms：平台信任机制截图",
      url: "https://news.airbnb.com/airbnb-rooms/",
      note: "保存平台机制、筛选和信任信号。",
      sourceName: "图文快照",
      type: "image" as SourceType,
      tag: "image-snapshot",
      referenceNote: "网页截图保留可见图片区域、页面链接、说明和标签。",
      image: "/media/lumo-photo-airbnb-rooms.jpg",
      icon: ImageIcon,
      description: "保存页面截图、图片说明、来源链接和标签。",
      snapshotText: "模拟截取网页视觉区域：平台筛选、信任信号、关键卡片和可见文字说明。",
      checklist: ["页面截图", "图片说明", "来源链接", "标签"],
    },
    video_timestamp: {
      label: "视频时间点",
      shortcut: "⌘ / Ctrl + Shift + V",
      title: "DJI Pocket 3 创作者视频：03:20 展示一人开拍",
      url: "https://www.youtube.com/watch?v=demo&t=134s",
      note: "保存视频时间点，后续拆解拍摄场景和内容脚本。",
      sourceName: "视频时间点",
      type: "video" as SourceType,
      tag: "video-timestamp",
      referenceNote: "视频时间点保留原视频链接、播放秒数、截图和备注。",
      image: "/media/lumo-photo-dji-pocket.jpg",
      icon: Video,
      description: "保存视频 URL、当前播放时间、截图和备注。",
      snapshotText: "模拟视频收藏：记录 03:20 时间点、视频截图、标题和一句场景备注。",
      checklist: ["视频链接", "时间点", "截图", "备注"],
    },
  };
  return presets[mode];
}

function StatGrid() {
  const sources = useAppStore((s) => s.sources);
  const stats = [
    ["新增资料", sources.filter((item) => item.status === "inbox" || item.status === "unread" || (item.status === "read" && item.projectIds.length === 0)).length],
    ["必须阅读", sources.filter((item) => item.triageStatus === "must_read").length],
    ["项目素材", sources.filter((item) => item.triageStatus === "project_material").length],
    ["建议归档", sources.filter((item) => item.triageStatus === "archive_suggested").length],
  ];
  return <div className="stats">{stats.map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function WorkflowPanel() {
  const steps = [
    { title: "资料库", desc: "先把链接、文章、截图、视频、音频和本地文本都收进来，保留原始出处。", view: "sources" as ActiveView },
    { title: "智能收件箱", desc: "AI 再做筛选、摘要、优先级、阅读建议和归档建议。", view: "inbox" as ActiveView },
    { title: "阅读器", desc: "精读关键资料，把段落沉淀为高亮、笔记、观点和证据。", view: "reader" as ActiveView },
    { title: "项目图谱", desc: "把资料、观点、证据、洞察连起来，检查是否支撑项目目标。", view: "projects" as ActiveView },
    { title: "成果", desc: "基于项目里的证据生成研究简报、PRD、脚本或竞品分析。", view: "deliverables" as ActiveView },
  ];
  const setActiveView = useAppStore((s) => s.setActiveView);
  return (
    <section className="workflow-panel">
      <div className="section-head">
        <div>
          <Badge tone="blue"><Sparkles size={14} /> 产品工作流</Badge>
          <h2>先收集，再让 AI 分拣，最后进入阅读和成果</h2>
          <p>资料库不是 AI 处理后的结果，它是所有原始资料的入口；智能收件箱是 Lumo 处理后的整理层。</p>
        </div>
      </div>
      <div className="workflow-steps">
        {steps.map((step, index) => (
          <button key={step.title} onClick={() => setActiveView(step.view)}>
            <span className="workflow-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="workflow-copy">
              <strong>{step.title}</strong>
              <small>{step.desc}</small>
            </div>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

function AIInbox({ onCapture }: { onCapture: (mode?: QuickCaptureMode) => void }) {
  const [tab, setTab] = useState("must_read");
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const notify = useAppStore((s) => s.notify);
  const inboxSources = useFilteredSources().filter((source) => source.status === "inbox" || source.status === "unread");
  const sources = inboxSources.filter((source) => source.triageStatus === tab);
  return (
    <section className="content">
      <AIDecisionPanel />
      <StatGrid />
      <div className="tabs">{["must_read", "skim", "archive_suggested", "project_material"].map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}>{triageLabel(item as never)}</button>)}</div>
      <SourceList sources={sources.map((source) => source.id)} />
    </section>
  );
}

function AIDecisionPanel() {
  const sources = useFilteredSources().filter((source) => source.status === "inbox" || source.status === "unread");
  const setActiveView = useAppStore((s) => s.setActiveView);
  const signals = [
    { label: "AI 已分拣", value: `${sources.length} 条`, desc: "按必须阅读、项目素材、略读、归档建议分流", view: "inbox" as ActiveView },
    { label: "可生成观点", value: `${sources.filter((source) => source.keyPoints.length > 0).length} 条`, desc: "从关键段落抽取可复用判断", view: "claims" as ActiveView },
    { label: "可形成证据", value: `${sources.filter((source) => source.hasSnapshot || source.sourceReferences?.length).length} 条`, desc: "保留原始链接、快照和出处说明", view: "evidence" as ActiveView },
    { label: "建议入项目", value: `${sources.filter((source) => source.triageStatus === "project_material").length} 条`, desc: "自动连接当前研究项目", view: "projects" as ActiveView },
  ];
  return (
    <section className="ai-decision-panel">
      <div>
        <Badge tone="purple"><Sparkles size={14} /> AI 决策层</Badge>
        <h2>不是普通收件箱：Lumo 会先判断资料怎么处理</h2>
        <p>每条资料都会被判断阅读优先级、是否适合进项目、能否抽取观点/证据，以及下一步应该高亮、归档还是生成成果。</p>
      </div>
      <div className="ai-signal-grid">
        {signals.map((signal) => (
          <button key={signal.label} type="button" className="ai-signal" onClick={() => setActiveView(signal.view)}>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
            <small>{signal.desc}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function ShortcutCapturePanel({ onCapture }: { onCapture: (mode?: QuickCaptureMode) => void }) {
  return (
    <section className="shortcut-panel">
      <div className="section-head">
        <div>
          <Badge tone="blue"><Plug size={14} /> Chrome 插件</Badge>
          <h2>跨网页快捷搜集</h2>
          <p>加载 `extension/` 后，在任意网页按快捷键即可保存当前标签页、选中文本、文章片段、视频时间点和真实可视区域截图。</p>
        </div>
        <div className="section-actions">
          <Button onClick={() => onCapture("link")} title="打开 App 内快速收藏演示"><Sparkles size={15} /> 演示</Button>
          <Badge><Keyboard size={14} /> 按 ? 查看快捷键</Badge>
        </div>
      </div>
      <div className="extension-steps">
        <span><strong>1</strong> Chrome 打开 `chrome://extensions`</span>
        <span><strong>2</strong> 开启"开发者模式"并加载 `extension/`</span>
        <span><strong>3</strong> 在任意网页使用快捷键或点插件图标保存</span>
      </div>
      <div className="shortcut-card-grid">
        {shortcutCards.filter((item) => item.mode).map((item) => {
          const preset = capturePreset(item.mode!);
          const Icon = preset.icon;
          return (
            <button className="shortcut-card" key={item.keys} onClick={() => onCapture(item.mode)}>
              <span className="shortcut-icon"><Icon size={18} /></span>
              <kbd>{item.keys}</kbd>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RealCasePanel() {
  return (
    <section className="real-case">
      <div className="section-head">
        <div>
          <Badge tone="purple">真实案例</Badge>
          <h2>{realCase.title}</h2>
          <p>{realCase.scenario}</p>
        </div>
        <Badge tone="blue">{realCase.role}</Badge>
      </div>
      <div className="case-goal">
        <strong>目标</strong>
        <p>{realCase.goal}</p>
      </div>
      <img className="case-hero-image" src={realCase.heroImage} alt={`${realCase.title} 主视觉`} />
      <div className="case-reference-strip">
        <strong>真实资料出处</strong>
        <div>
          {realCase.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.product}
              <ChevronRight size={14} />
            </a>
          ))}
        </div>
      </div>
      <div className="case-source-list">
        {realCase.sources.map((source, index) => (
          <article className="case-source-card" key={source.product}>
            <span className="case-index">{index + 1}</span>
            <div className="case-visual">
              <a className="case-image-link" href={source.url} target="_blank" rel="noreferrer" aria-label={`打开 ${source.product}`}>
                <img src={source.image} alt={`${source.product} 的真实资料截图`} />
                <span className="case-image-label">{source.visualLabel}</span>
                <span className="case-domain">{safeHost(source.url)}</span>
              </a>
            </div>
            <div className="case-source-body">
              <div className="case-source-head">
                <h3>{source.product}</h3>
                <a href={source.url} target="_blank" rel="noreferrer">{safeHost(source.url)}</a>
              </div>
              <div className="case-metric">{source.metric}</div>
              <div className="feedback-chips">
                {source.feedback.map((item) => <span key={item}>{item}</span>)}
              </div>
              <p className="case-evidence">{source.evidence}</p>
              <p className="case-lumo-use"><Sparkles size={15} /><strong>Lumo 用法：</strong>{source.lumoUse}</p>
              <div className="tag-row">
                <Badge>{source.sourceType}</Badge>
                <Badge tone="green">可转 Evidence</Badge>
                <Badge tone="purple">可生成 Insight</Badge>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="case-columns">
        <MiniList title="演示流程" items={realCase.workflow} />
        <MiniList title="最终可列举成果" items={realCase.outputs} />
      </div>
    </section>
  );
}

function MediaLibraryStrip() {
  return (
    <section className="media-library">
      <div className="section-head">
        <div>
          <h2>多媒体资料库</h2>
          <p>已加入真实本地图片、视频、音频和文本文件，Reader 与资料库都可以引用。</p>
        </div>
        <Badge tone="blue">public/media</Badge>
      </div>
      <div className="media-grid">
        {mediaAssets.map((asset) => {
          const Icon = asset.icon;
          return (
            <article className={`media-card media-card-${asset.type}`} key={asset.type}>
              <div className="media-card-head">
                <div className="media-title">
                  <span className="media-icon-shell"><Icon size={18} /></span>
                  <div>
                    <strong>{asset.label}</strong>
                    <span>{asset.title}</span>
                  </div>
                </div>
              </div>
              <div className={`media-preview media-preview-${asset.type}`}>
                {asset.type === "image" && <img src={asset.path} alt={asset.title} />}
                {asset.type === "video" && <video src={asset.path} poster="/media/lumo-video-thumb.png" controls muted playsInline />}
                {asset.type === "audio" && (
                  <div className="media-audio-stage">
                    <span className="media-preview-chip">语音 / 播客 / 访谈</span>
                    <div className="media-waveform" aria-hidden="true">
                      {Array.from({ length: 12 }, (_, index) => <span key={`${asset.type}-${index}`} />)}
                    </div>
                    <audio src={asset.path} controls />
                  </div>
                )}
                {asset.type === "text" && (
                  <div className="media-text-stage">
                    <span className="media-preview-chip">TXT / 本地文档</span>
                    <div className="media-text-lines" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="media-text-foot">
                      <span>可导入 AI Inbox</span>
                      <span>保留原始顺序</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="media-card-body">
                <p>{asset.description}</p>
              </div>
              <div className="media-card-actions">
                <a href={asset.path} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  打开文件
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function useFilteredSources() {
  const sources = useAppStore((s) => s.sources);
  const searchQuery = useAppStore((s) => s.searchQuery);
  return useMemo(() => sources.filter((source) => source.status !== "deleted").filter((source) => sourceMatchesQuery(source, searchQuery)), [sources, searchQuery]);
}

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

function collectionVisual(collection: Collection, index: number, items: Source[]) {
  const editorial = collectionEditorialVisuals[collection.id] ?? {
    heroImage: items[0]?.snapshotImage ?? (items[0] ? (sourceThumb(items[0]) ?? "/media/lumo-real-reading-desk.jpg") : "/media/lumo-real-reading-desk.jpg"),
    label: collection.name,
    mood: collection.description,
    tone: `tone-${(index % 5) + 1}`,
  };
  const sourceImages = items.map((source) => source.snapshotImage ?? sourceThumb(source) ?? null).filter(Boolean).slice(0, 3);
  return {
    ...editorial,
    previewImages: sourceImages.length ? sourceImages : [editorial.heroImage],
  };
}

// Returns a matched image ONLY when we're certain it belongs to this source.
// If unknown → returns null. Never return a random unrelated image.
function sourceThumb(source: { id: string; type: SourceType; url?: string }): string | null {
  if (realSourceVisuals[source.id]) return realSourceVisuals[source.id].image;
  if (source.type === "video") return "/media/lumo-demo.gif";
  if (source.type === "audio") return "/media/lumo-audio-thumb.png";
  return null; // unknown → caller should show favicon or placeholder
}

function sourcePreviewData(key: string, title: string, url: string) {
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

function SourcePreview({ source }: { source: { id: string; title: string; url: string; type: SourceType; sourceName: string; snapshotImage?: string } }) {
  if (source.snapshotImage) {
    return <img className="source-thumb" src={source.snapshotImage} alt={`${source.title} 的网页快照`} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  const visual = realSourceVisuals[source.id];
  if (!visual) {
    const thumb = sourceThumb(source);
    if (thumb) {
      // Only matched types (video/audio)
      return <img className="source-thumb" src={thumb} alt={`${source.title} 的资料缩略图`} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
    }
    // No real image — show domain favicon as a neutral placeholder
    const domain = safeHost(source.url);
    return (
      <div className="source-thumb source-thumb-favicon">
        <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`} alt={domain}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <span>{domain}</span>
      </div>
    );
  }
  return (
    <div className="real-source-preview">
      <div className="real-source-image">
        <img src={visual.image} alt={`${source.title} 的真实图片`} />
      </div>
      <div className="real-source-copy">
        <span>{visual.label}</span>
        <strong>{visual.metric}</strong>
        <div>
          {visual.feedback.map((item) => <em key={item}>{item}</em>)}
        </div>
      </div>
    </div>
  );
}

function EvidencePreviewCard({ preview, compact = false }: { preview: ReturnType<typeof sourcePreviewData> extends undefined ? never : NonNullable<ReturnType<typeof sourcePreviewData>>; compact?: boolean }) {
  return (
    <div className={`evidence-preview-card ${compact ? "compact" : ""} ${preview.tone}`}>
      <div className="preview-window">
        <span />
        <span />
        <span />
      </div>
      <div className="preview-topline"><span>{preview.label}</span><small>{preview.host}</small></div>
      <div className="preview-title-row">
        <span className="preview-glyph">{preview.title.slice(0, 1)}</span>
        <strong>{preview.title}</strong>
      </div>
      <div className="preview-rows">
        {preview.rows.map((row) => <span key={row}>{row}</span>)}
      </div>
      <em>Lumo 摘要卡，不是官网截图</em>
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function suggestCollectionId(input: { title: string; sourceName?: string; purpose: Purpose; tags?: string[] }, collections: Collection[]) {
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

function collectionSources(collection: Collection, sources: Source[]) {
  return collection.sourceIds.map((id) => sources.find((source) => source.id === id)).filter((source): source is Source => Boolean(source));
}

function sourceStatusDot(source: Pick<Source, "status">) {
  if (source.status === "read" || source.status === "archived") return "read";
  return "unread";
}

function SourceList({ sources, selectedId, mode = "list" }: { sources: string[]; selectedId?: string; mode?: "list" | "grid" | "gallery" }) {
  return (
    <div className={`source-list ${mode === "grid" ? "grid-mode" : ""} ${mode === "gallery" ? "gallery-mode" : ""}`}>
      {sources.map((id) => <SourceCard key={id} sourceId={id} selected={selectedId === id} compact={mode !== "list"} gallery={mode === "gallery"} />)}
    </div>
  );
}

function SourceCard({ sourceId, compact = false, selected = false, gallery = false }: { sourceId: string; compact?: boolean; selected?: boolean; gallery?: boolean }) {
  const source = useAppStore((s) => s.sources.find((item) => item.id === sourceId));
  const markSourceAsRead = useAppStore((s) => s.markSourceAsRead);
  const markSourceAsUnread = useAppStore((s) => s.markSourceAsUnread);
  const archiveSource = useAppStore((s) => s.archiveSource);
  const deleteSource = useAppStore((s) => s.deleteSource);
  const toggleSourceFavorite = useAppStore((s) => s.toggleSourceFavorite);
  const extractClaimsFromSource = useAppStore((s) => s.extractClaimsFromSource);
  const clearClaimsFromSource = useAppStore((s) => s.clearClaimsFromSource);
  const setSelectedSource = useAppStore((s) => s.setSelectedSource);
  const addSourceToProject = useAppStore((s) => s.addSourceToProject);
  const removeSourceFromProject = useAppStore((s) => s.removeSourceFromProject);
  const notify = useAppStore((s) => s.notify);
  const projects = useAppStore((s) => s.projects);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const [toolsOpen, setToolsOpen] = useState(false);  // SourceToolsModal
  const [menuOpen, setMenuOpen] = useState(false);     // mini action dropdown
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  if (!source) return null;
  const readActive = source.status === "read";
  const projectCount = source.projectIds.length;
  const claimActive = source.claimIds.length > 0;
  const toggleReadStatus = () => {
    if (readActive) {
      markSourceAsUnread(source.id);
      notify(english ? "Marked as unread" : "已取消已读");
      return;
    }
    markSourceAsRead(source.id);
    notify(english ? "Marked as read" : "已标为已读");
  };
  const toggleClaimStatus = () => {
    if (claimActive) {
      clearClaimsFromSource(source.id);
      return;
    }
    extractClaimsFromSource(source.id);
  };
  if (gallery) {
    return (
      <article className={`source-card gallery-card ${selected ? "selected" : ""}`}>
        <span className={`status-dot ${sourceStatusDot(source)}`} title={source.status === "read" || source.status === "archived" ? "已读" : "未读"} />
        <button className="gallery-main" type="button" onClick={() => setSelectedSource(source.id)}>
          {(source.snapshotImage ?? sourceThumb(source)) ? <img src={source.snapshotImage ?? sourceThumb(source)!} alt={english ? `${source.title} preview` : `${source.title} 的资料预览`} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} /> : <div className="source-thumb source-thumb-favicon"><img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeHost(source.url))}&sz=64`} alt="" onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}} /><span>{safeHost(source.url)}</span></div>}
          <span className="gallery-domain">{safeHost(source.url)}</span>
          <div className="gallery-overlay">
            <div className="tag-row">
              <Badge tone="blue">{purposeLabel(source.purpose)}</Badge>
              <Badge>{sourceTypeLabel(source.type)}</Badge>
            </div>
            <h3>{source.title}</h3>
            <p>{source.aiReason}</p>
          </div>
        </button>
        <div className="gallery-actions">
          <Button variant="ghost" onClick={() => toggleSourceFavorite(source.id)} title={source.isFavorite ? (english ? "Remove star" : "取消星标") : (english ? "Star source" : "加入星标")}>
            <Star className={source.isFavorite ? "star-icon active" : "star-icon"} size={16} fill={source.isFavorite ? "currentColor" : "none"} />
          </Button>
          <Button
            variant="ghost"
            className={`source-action-read ${readActive ? "active" : ""}`}
            ariaPressed={readActive}
            onClick={toggleReadStatus}
            title={readActive ? (english ? "Mark unread" : "取消已读") : (english ? "Mark read" : "标为已读")}
          ><CheckCircle2 size={16} /></Button>
          <Button variant="ghost" onClick={() => setToolsOpen(true)} title={english ? "More actions" : "更多操作"}><MoreHorizontal size={16} /></Button>
        </div>
        {toolsOpen && <SourceToolsModal source={source} onClose={() => setToolsOpen(false)} />}
      </article>
    );
  }
  return (
    <article className={`source-card ${compact ? "compact" : ""} ${selected ? "selected" : ""}`}>
      <span className={`status-dot ${sourceStatusDot(source)}`} title={source.status === "read" || source.status === "archived" ? "已读" : "未读"} />
      <button className="source-main" onClick={() => setSelectedSource(source.id)}>
        <div className="source-copy">
          <h3>{source.title}</h3>
          <p>{source.summary}</p>
          <p className="ai-reason-inline"><Sparkles size={14} /> {english ? "AI decision:" : "AI 判断："}{source.aiReason}</p>
          <div className="tag-row">
            <Badge tone="blue"><Folder size={13} /> {purposeLabel(source.purpose)}</Badge>
            <Badge>{sourceTypeLabel(source.type)}</Badge>
            <Badge tone={source.triageStatus === "archive_suggested" ? "yellow" : source.triageStatus === "project_material" ? "purple" : "green"}>{triageLabel(source.triageStatus)}</Badge>
            {source.hasSnapshot && <Badge tone="green">{english ? "Snapshot" : "快照"}</Badge>}
          </div>
        </div>
        <SourcePreview source={source} />
      </button>
      <div className="source-footer">
        <div className="source-meta">
          <span><Globe2 size={15} /> {safeHost(source.url)}</span>
          <span><Folder size={15} /> {source.collectionIds.length ? (english ? "Filed" : "已分类") : (english ? "Unfiled" : "未分类")}</span>
          <span>{formatDate(source.savedAt)}</span>
          <span>{source.readingTime} {english ? "min" : "分钟"}</span>
        </div>
        <div className="source-actions">
          <Button
            className={`source-action-read ${readActive ? "active" : ""}`}
            ariaPressed={readActive}
            onClick={toggleReadStatus}
            title={readActive ? (english ? "Mark unread" : "取消已读") : (english ? "Mark read" : "标为已读")}
          ><CheckCircle2 size={15} /><span>{english ? "Read" : "已读"}</span></Button>
          <div style={{ position: "relative" }}>
            <Button
              className={`source-action-project ${projectCount > 0 ? "active" : ""}`}
              ariaPressed={projectCount > 0}
              onClick={() => setProjectPickerOpen((open) => !open)}
              title={english ? "Manage projects for this source" : "管理该资料所属的项目"}
            >
              <Box size={15} />
              <span>{projectCount > 0 ? (english ? `${projectCount} project${projectCount > 1 ? "s" : ""}` : `已入 ${projectCount} 项目`) : (english ? "Project" : "入项目")}</span>
            </Button>
            {projectPickerOpen && (
              <div className="project-picker-popover" style={{ minWidth: 200 }}>
                <p className="project-picker-label">{english ? "Add / remove from projects" : "选择要加入的项目（可多选）"}</p>
                {projects.filter((p) => p.status === "active").map((p) => {
                  const inThis = source.projectIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      className={`project-picker-item ${inThis ? "checked" : ""}`}
                      type="button"
                      onClick={() => {
                        if (inThis) {
                          removeSourceFromProject(source.id, p.id);
                          notify(english ? `Removed from ${p.name}` : `已从「${p.name}」移除`);
                        } else {
                          addSourceToProject(source.id, p.id);
                          notify(english ? `Added to ${p.name}` : `已加入「${p.name}」`);
                        }
                      }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${inThis ? "#6366f1" : "#d1d5db"}`, background: inThis ? "#6366f1" : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {inThis && <span style={{ width: 7, height: 4, borderLeft: "2px solid #fff", borderBottom: "2px solid #fff", transform: "rotate(-45deg)", marginTop: -2 }} />}
                      </span>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
                {projects.filter((p) => p.status === "active").length === 0 && (
                  <p className="project-picker-empty">{english ? "No active projects. Create one first." : "暂无活跃项目，请先创建项目。"}</p>
                )}
                <button type="button" className="project-picker-close" onClick={() => setProjectPickerOpen(false)}>
                  {english ? "Done" : "完成"}
                </button>
              </div>
            )}
          </div>
          <Button
            className={`source-action-claim ${claimActive ? "active" : ""}`}
            ariaPressed={claimActive}
            onClick={toggleClaimStatus}
            title={claimActive ? (english ? `${source.claimIds.length} claims — click to clear` : `已提炼 ${source.claimIds.length} 条观点，点击取消`) : (english ? "Extract claims" : "从资料抽取观点")}
          >
            <Lightbulb size={15} />
            <span>{english ? "Claims" : "观点"}</span>
            {claimActive && source.claimIds.length > 0 && <span className="claim-count-badge">{source.claimIds.length}</span>}
          </Button>
          <Button variant="ghost" onClick={() => { archiveSource(source.id); notify(english ? "Source archived" : "资料已归档"); }} title={english ? "Archive" : "归档"}>
            <Archive size={15} />
          </Button>
          <Button variant="ghost" onClick={() => toggleSourceFavorite(source.id)} title={source.isFavorite ? "取消星标" : "加星标"}>
            <Star className={source.isFavorite ? "star-icon active" : "star-icon"} size={15} fill={source.isFavorite ? "currentColor" : "none"} />
          </Button>
          <div style={{ position:"relative" }}>
            <Button variant="ghost" onClick={() => setMenuOpen(p => !p)} title={english ? "Delete" : "删除"}><Trash2 size={15} /></Button>
            {menuOpen && (
              <>
                <div style={{ position:"fixed", inset:0, zIndex:49 }} onClick={() => setMenuOpen(false)} />
                <div style={{ position:"absolute", right:0, bottom:"calc(100% + 6px)", background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:50, minWidth:140, overflow:"hidden" }}>
                  <button type="button" style={{ width:"100%", padding:"10px 14px", border:"none", background:"none", textAlign:"left", fontSize:13, color:"#dc2626", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}
                    onClick={() => { setMenuOpen(false); if (confirm(english ? "Delete this source?" : "确认删除这条资料？无法撤销。")) { deleteSource(source.id); notify(english ? "Deleted" : "资料已删除"); } }}>
                    <Trash2 size={14} /> {english ? "Delete permanently" : "永久删除"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {toolsOpen && <SourceToolsModal source={source} onClose={() => setToolsOpen(false)} />}
    </article>
  );
}

function SourceToolsModal({ source, onClose }: { source: Source; onClose: () => void }) {
  const updateSource = useAppStore((s) => s.updateSource);
  const addSourceToCollection = useAppStore((s) => s.addSourceToCollection);
  const archiveSource = useAppStore((s) => s.archiveSource);
  const deleteSource = useAppStore((s) => s.deleteSource);
  const setSelectedSource = useAppStore((s) => s.setSelectedSource);
  const notify = useAppStore((s) => s.notify);
  const collections = useAppStore((s) => s.collections);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const [title, setTitle] = useState(source.title);
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const recommendedCollectionId = suggestCollectionId(source, collections);
  const recommendedCollection = collections.find((collection) => collection.id === recommendedCollectionId);
  const saveMeta = () => {
    updateSource(source.id, { title });
    if (collectionId) addSourceToCollection(source.id, collectionId);
    notify(english ? "Title and collection updated" : "资料名称和分类已更新");
    onClose();
  };
  const copyCitation = async () => {
    await navigator.clipboard.writeText(`${source.title}\n${source.url}`);
    notify(english ? "Citation copied" : "引用已复制");
  };
  return (
    <Modal title={english ? "Source Options" : "资料操作"} onClose={onClose}>
      <div className="source-tools">
        <section className="tool-panel">
          <h3>{english ? "Rename & classify" : "重命名与分类"}</h3>
          <div className="form">
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
            <div className="classifier-preview compact">
              <Brain size={16} />
              <div><strong>AI 建议：{recommendedCollection?.name ?? "暂不归类"}</strong><p>基于标题、来源、用途和标签识别分类。</p></div>
              <Button onClick={() => { if (recommendedCollectionId) addSourceToCollection(source.id, recommendedCollectionId); notify("已按 AI 建议加入收藏分类"); onClose(); }}>自动添加</Button>
            </div>
            <select value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
              {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
            </select>
            <Button variant="primary" onClick={saveMeta}>{english ? "Save changes" : "保存更改"}</Button>
          </div>
        </section>
        <section className="tool-panel">
          <h3>{english ? "Original sources" : "原始出处"}</h3>
          <div className="reference-list compact">
            {(source.sourceReferences?.length ? source.sourceReferences : [{ label: source.title, url: source.url, note: english ? "Original webpage link" : "原始网页链接" }]).map((ref) => (
              <a key={ref.url} href={ref.url} target="_blank" rel="noreferrer">
                <Globe2 size={16} />
                <span><strong>{ref.label}</strong><small>{ref.note}</small></span>
                <ExternalLink size={15} />
              </a>
            ))}
          </div>
        </section>
        <section className="tool-actions">
          <Button onClick={() => setSelectedSource(source.id)}><BookOpen size={15} /> {english ? "Open reader" : "打开阅读器"}</Button>
          <Button onClick={copyCitation}><Copy size={15} /> {english ? "Copy citation" : "复制引用"}</Button>
          <Button onClick={() => window.open(source.url, "_blank", "noopener,noreferrer")}><ExternalLink size={15} /> {english ? "Open source" : "打开网页"}</Button>
          <Button onClick={() => downloadTextFile(`${safeFilename(source.title)}.md`, sourceToMarkdown(source), "text/markdown;charset=utf-8")}><Download size={15} /> Markdown</Button>
          <Button onClick={() => downloadTextFile(`${safeFilename(source.title)}.json`, JSON.stringify(source, null, 2), "application/json;charset=utf-8")}><Download size={15} /> JSON</Button>
          <Button onClick={() => { archiveSource(source.id); notify(english ? "Source archived" : "资料已归档"); onClose(); }}><Archive size={15} /> {english ? "Archive" : "归档"}</Button>
          <Button variant="danger" onClick={() => { deleteSource(source.id); notify(english ? "Source deleted" : "资料已删除"); onClose(); }}><Trash2 size={15} /> {english ? "Delete" : "删除"}</Button>
        </section>
      </div>
    </Modal>
  );
}

function AllSources({ onCapture }: { onCapture: (mode?: QuickCaptureMode) => void }) {
  const allSources = useFilteredSources();
  const [layout, setLayout] = useState<"list" | "grid" | "gallery">("list");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sourceTab, setSourceTab] = useState<"all" | "inbox" | "read">("all");
  const [triageTab, setTriageTab] = useState("must_read");
  const [swipeOpen, setSwipeOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [batchProjectPicker, setBatchProjectPicker] = useState(false);
  const addSourceToProject = useAppStore((s) => s.addSourceToProject);
  const projects = useAppStore((s) => s.projects);
  const notify = useAppStore((s) => s.notify);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const selectedSourceId = useAppStore((s) => s.selectedSourceId);

  const toggleBatchSelect = (id: string) => {
    setBatchSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // 待处理 = 还没有被归入任何项目的活跃资料（已读/未读无所谓）
  // 只有"入项目"才能让资料离开待处理，"已读"不影响
  const inboxSources = allSources.filter((source) =>
    source.projectIds.length === 0 &&
    source.status !== "archived" &&
    source.status !== "deleted"
  );
  // 归档：只有用户手动点归档才进来，读过+入项目都不等于归档
  const archivedSources = allSources.filter((source) => source.status === "archived");
  // 全部：所有活跃资料（不含已归档、已删除）
  const activeSources = allSources.filter((source) =>
    source.status !== "archived" && source.status !== "deleted"
  );
  const visibleAll = favoriteOnly ? activeSources.filter((source) => source.isFavorite) : activeSources;
  const visibleTriage = inboxSources.filter((source) => source.triageStatus === triageTab);
  const selected = visibleAll.find((source) => source.id === selectedSourceId) ?? visibleAll[0];
  const inboxCount = inboxSources.length;

  return (
    <section className="source-page">
      <div className="tabs source-primary-tabs">
        <button className={sourceTab === "all" ? "active" : ""} onClick={() => setSourceTab("all")}>
          {english ? `All (${activeSources.length})` : `全部 (${activeSources.length})`}
        </button>
        <button className={sourceTab === "inbox" ? "active" : ""} onClick={() => setSourceTab("inbox")}>
          {english ? "Pending" : "待处理"}
          {inboxCount > 0 && <span className="source-tab-count">{inboxCount}</span>}
        </button>
        <button className={sourceTab === "read" ? "active" : ""} onClick={() => setSourceTab("read")}>
          <Archive size={13} />
          {english ? `Archive (${archivedSources.length})` : `归档 (${archivedSources.length})`}
        </button>
      </div>

      {sourceTab === "inbox" && (
        <>
          <AIDecisionPanel />
          <StatGrid />
          <div className="inbox-triage-bar">
            <div className="tabs">{["must_read", "skim", "archive_suggested", "project_material"].map((item) => <button key={item} onClick={() => setTriageTab(item)} className={triageTab === item ? "active" : ""}>{triageLabel(item as never)}</button>)}</div>
            <button
              className="swipe-triage-trigger"
              type="button"
              onClick={() => setSwipeOpen(true)}
            >
              <span>↔</span> {english ? "Swipe triage" : "滑动筛选"}
            </button>
          </div>
          <SourceList sources={visibleTriage.map((source) => source.id)} />
          {swipeOpen && <SwipeTriageModal sources={inboxSources} onClose={() => setSwipeOpen(false)} />}
        </>
      )}

      {sourceTab === "all" && (
        <>
          <div className="source-page-head">
            <div>
              <h2>{english ? "All Sources" : "所有资料"}</h2>
              <p>{english ? `${visibleAll.length} items` : `共 ${visibleAll.length} 项`}</p>
            </div>
            <div className="view-switch-row">
              <button type="button" className="topbar-agent-btn"
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:99, border:"1.5px solid #c4b5fd", background:"linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)", color:"#7c3aed", fontSize:12.5, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.8)", letterSpacing:"0.01em", whiteSpace:"nowrap", transition:"all 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
                onClick={() => setAgentOpen(true)}>
                <Sparkles size={12} strokeWidth={2.5} />
                Lumo Agent
              </button>
              <button type="button"
                onClick={() => { setBatchMode(b => !b); setBatchSelected(new Set()); setBatchProjectPicker(false); }}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:99, border:`1.5px solid ${batchMode ? "#a78bfa" : "rgba(196,181,253,0.5)"}`, background: batchMode ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(180deg,#fff 0%,#f5f3ff 100%)", color: batchMode ? "#fff" : "#6b7280", fontSize:12.5, fontWeight: batchMode ? 700 : 600, cursor:"pointer", whiteSpace:"nowrap", letterSpacing:"0.01em", boxShadow: batchMode ? "0 3px 12px rgba(99,102,241,0.38), inset 0 1px 0 rgba(255,255,255,0.22)" : "0 1px 4px rgba(99,102,241,0.08), inset 0 1px 0 #fff", transition:"all 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <Box size={12} strokeWidth={2.5} />
                {batchMode ? `已选 ${batchSelected.size} 条` : "批量加入项目"}
              </button>
              <JellySwitch
                options={[
                  { id: "list", label: english ? "List" : "列表" },
                  { id: "grid", label: english ? "Grid" : "卡片墙" },
                  { id: "gallery", label: english ? "Gallery" : "画廊" },
                ]}
                value={layout}
                onChange={(v) => setLayout(v as typeof layout)}
              />
              <button
                type="button"
                className={`jelly-star-btn ${favoriteOnly ? "active" : ""}`}
                onClick={() => setFavoriteOnly((v) => !v)}
              >
                <Star size={14} fill={favoriteOnly ? "currentColor" : "none"} />
                {english ? "Starred" : "只看星标"}
              </button>
            </div>
          </div>
          <div className="filter-row">{(english ? ["Status", "Type", "Collection", "Tags", "Purpose", "Project", "Has Highlight", "Has Note", "Has Claim", "Has Evidence"] : ["状态", "类型", "主题夹", "标签", "目的", "项目", "有高亮", "有笔记", "有观点", "有证据"]).map((item) => <Badge key={item}>{item}</Badge>)}</div>
          {batchMode && (
            <div style={{ padding:"8px 0 4px", fontSize:12, color:"#6b7280" }}>
              点击下方资料卡片左上角的勾选框，或点击卡片空白处选中，选好后点「加入项目」
            </div>
          )}
          {batchMode ? (
            <div className="claims-card-grid" style={{ marginTop:8 }}>
              {visibleAll.map(source => {
                const isSelected = batchSelected.has(source.id);
                return (
                  <div key={source.id}
                    onClick={() => toggleBatchSelect(source.id)}
                    style={{ position:"relative", cursor:"pointer", borderRadius:16, border:`2px solid ${isSelected ? "#6366f1" : "#e5e7eb"}`, background: isSelected ? "#ede9fe" : "#fff", padding:12, transition:"all 0.15s" }}>
                    <div style={{ position:"absolute", top:10, right:10, width:18, height:18, borderRadius:5, border:`2px solid ${isSelected ? "#6366f1" : "#d1d5db"}`, background: isSelected ? "#6366f1" : "#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {isSelected && <span style={{ color:"#fff", fontSize:11, fontWeight:800 }}>✓</span>}
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#1f2937", paddingRight:24, lineHeight:1.4 }}>{source.title}</div>
                    <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{source.sourceName} · {formatDate(source.savedAt)}</div>
                    {source.projectIds.length > 0 && <div style={{ fontSize:10, color:"#6366f1", marginTop:3 }}>已入 {source.projectIds.length} 个项目</div>}
                  </div>
                );
              })}
            </div>
          ) : (
          <SourceList sources={visibleAll.map((source) => source.id)} selectedId={selected?.id} mode={layout} />
          )}
        </>
      )}

      {sourceTab === "read" && (
        <>
          <div className="source-page-head">
            <div>
              <h2>{english ? "Archive" : "归档"}</h2>
              <p>{english ? `${archivedSources.length} items archived or marked as read — out of your main library view` : `共 ${archivedSources.length} 项已归档或已读，不在主资料库视图中显示`}</p>
            </div>
          </div>
          <SourceList sources={archivedSources.map((source) => source.id)} />
        </>
      )}
      {agentOpen && (
        <ProGate fallback={<UpgradePrompt feature="Lumo Agent" onClose={() => setAgentOpen(false)} />}>
          <ViewErrorBoundary>
            <AgentPanel projectName={english ? "My Library" : "我的资料库"} onClose={() => setAgentOpen(false)} english={english} />
          </ViewErrorBoundary>
        </ProGate>
      )}

      {/* Floating batch action bar */}
      {batchMode && batchSelected.size > 0 && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:200, background:"#1f2937", borderRadius:14, padding:"12px 20px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 8px 32px rgba(0,0,0,0.3)", minWidth:320 }}>
          <span style={{ color:"#fff", fontSize:13, fontWeight:600 }}>已选 {batchSelected.size} 条资料</span>
          <div style={{ position:"relative" }}>
            <button type="button" onClick={() => setBatchProjectPicker(p => !p)}
              style={{ padding:"7px 16px", borderRadius:10, border:"none", background:"#6366f1", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Box size={13} /> 加入项目
            </button>
            {batchProjectPicker && (
              <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:0, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", minWidth:200, overflow:"hidden", zIndex:201 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", padding:"8px 12px 4px", margin:0, textTransform:"uppercase" }}>选择项目</p>
                {projects.filter(p => p.status === "active").map(p => (
                  <button key={p.id} type="button" className="project-picker-item"
                    onClick={() => {
                      Array.from(batchSelected).forEach(id => addSourceToProject(id, p.id));
                      notify(`已将 ${batchSelected.size} 条资料加入「${p.name}」`);
                      setBatchSelected(new Set());
                      setBatchMode(false);
                      setBatchProjectPicker(false);
                    }}>
                    <Box size={13} /> {p.name}
                  </button>
                ))}
                {projects.filter(p => p.status === "active").length === 0 && (
                  <p style={{ fontSize:12, color:"#9ca3af", padding:"8px 12px" }}>暂无活跃项目</p>
                )}
              </div>
            )}
          </div>
          <button type="button" onClick={() => { setBatchMode(false); setBatchSelected(new Set()); setBatchProjectPicker(false); }}
            style={{ padding:"7px 12px", borderRadius:10, border:"1px solid #4b5563", background:"transparent", color:"#9ca3af", fontSize:13, cursor:"pointer" }}>
            取消
          </button>
        </div>
      )}
    </section>
  );
}

function TopicsView() {
  const collections = useAppStore((s) => s.collections);
  const selectedCollectionId = useAppStore((s) => s.selectedCollectionId) ?? collections[0]?.id;
  const setSelectedCollection = useAppStore((s) => s.setSelectedCollection);
  const addSourceToProject = useAppStore((s) => s.addSourceToProject);
  const projects = useAppStore((s) => s.projects);
  const sources = useAppStore((s) => s.sources);
  const notify = useAppStore((s) => s.notify);
  const selected = collections.find((item) => item.id === selectedCollectionId);
  const selectedSources = selected ? collectionSources(selected, sources) : [];
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkProjectPicker, setBulkProjectPicker] = useState(false);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);

  return (
    <section className="collections-page">
      {/* Page header */}
      <div className="collections-header">
        <div>
          <h2>{english ? "Collections" : "主题夹"}</h2>
          <p>{english ? "Organise sources into topic folders." : "按主题把资料归入文件夹，点击查看其中的资料。"}</p>
        </div>
      </div>

      {addModalOpen && <AddSourceModal onClose={() => setAddModalOpen(false)} />}

      {/* Folder grid */}
      <div className="collection-folder-grid">
        {collections.map((collection, index) => {
          const items = collectionSources(collection, sources);
          const unreadCount = items.filter((source) => source.status !== "read").length;
          const visual = collectionVisual(collection, index, items);
          const isSelected = selected?.id === collection.id;
          return (
            <button
              className={`collection-folder-card ${visual.tone} ${isSelected ? "active" : ""}`}
              key={collection.id}
              onClick={() => setSelectedCollection(isSelected ? undefined : collection.id)}
            >
              <div className="folder-cover">
                <img src={visual.heroImage} alt={collection.name} />
                <span className="folder-icon-badge"><Folder size={14} /></span>
              </div>
              <div className="folder-body">
                <strong>{collection.name}</strong>
                <div className="folder-meta">
                  <span>{collection.sourceIds.length} {english ? "sources" : "条资料"}</span>
                  {unreadCount > 0 && <span className="folder-unread">{unreadCount} {english ? "unread" : "未读"}</span>}
                </div>
                <div className="folder-tags">
                  {collection.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="folder-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Collection contents */}
      {selected && (
        <section className="collection-contents">
          <div className="collection-contents-header">
            <div className="collection-breadcrumb">
              <Folder size={15} />
              <span>{selected.name}</span>
              <span className="breadcrumb-sep">·</span>
              <span>{selectedSources.length} 条资料</span>
            </div>
          </div>
          <div className="stats compact">
            <div className="stat"><span>资料数</span><strong>{selected.sourceIds.length}</strong></div>
            <div className="stat"><span>未读</span><strong>{selectedSources.filter((s) => s.status === "inbox" || s.status === "unread").length}</strong></div>
            <div className="stat"><span>已读</span><strong>{selectedSources.filter((s) => s.status === "read" || s.status === "archived").length}</strong></div>
            <div className="stat"><span>高亮</span><strong>{selectedSources.reduce((sum, s) => sum + s.highlightIds.length, 0)}</strong></div>
          </div>
          <SourceList sources={selected.sourceIds} mode="gallery" />
        </section>
      )}
    </section>
  );
}

function ReaderView() {
  const selectedSourceId = useAppStore((s) => s.selectedSourceId) ?? useAppStore.getState().sources[0]?.id;
  const source = useAppStore((s) => s.sources.find((item) => item.id === selectedSourceId));
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const createHighlight = useAppStore((s) => s.createHighlight);
  const createNote = useAppStore((s) => s.createNote);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const createClaimFromParagraph = useAppStore((s) => s.createClaimFromParagraph);
  const createEvidenceFromParagraph = useAppStore((s) => s.createEvidenceFromParagraph);
  const markSourceAsRead = useAppStore((s) => s.markSourceAsRead);
  const archiveSource = useAppStore((s) => s.archiveSource);
  const updateSource = useAppStore((s) => s.updateSource);
  const notify = useAppStore((s) => s.notify);
  const [noteTarget, setNoteTarget] = useState<{ paragraph: string; index: number } | undefined>();
  const [askTarget, setAskTarget] = useState<{ paragraph: string; index: number } | undefined>();
  const [listenOpen, setListenOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  // Reader background color (Morandi / eye-care palette)
  const [readerBg, setReaderBg] = useState<string>("default");
  const articleBottomRef = useRef<HTMLDivElement>(null);

  // Auto-mark as read when user scrolls to the bottom of the article
  useEffect(() => {
    if (!source || source.status === "read" || source.status === "archived") return;
    const sentinel = articleBottomRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          markSourceAsRead(source.id);
          notify(english ? "Marked as read — you reached the end" : "已自动标记已读：你已浏览到文章末尾");
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [source?.id, source?.status]);
  const allHighlights = useAppStore((s) => s.highlights);
  const allNotes = useAppStore((s) => s.notes);
  const allClaims = useAppStore((s) => s.claims);
  const allEvidence = useAppStore((s) => s.evidence);
  const highlights = useMemo(() => allHighlights.filter((item) => item.sourceId === selectedSourceId), [allHighlights, selectedSourceId]);
  const notes = useMemo(() => allNotes.filter((item) => item.sourceId === selectedSourceId), [allNotes, selectedSourceId]);
  const claims = useMemo(() => allClaims.filter((item) => item.sourceId === selectedSourceId), [allClaims, selectedSourceId]);
  const ev = useMemo(() => allEvidence.filter((item) => item.sourceId === selectedSourceId), [allEvidence, selectedSourceId]);
  const highlightByParagraph = useMemo(() => {
    const map = new Map<number, (typeof highlights)[number]>();
    highlights.forEach((item) => map.set(item.paragraphIndex, item));
    return map;
  }, [highlights]);
  if (!source) return <EmptyState text="Select a source to read." />;
  const copyParagraph = async (paragraph: string) => {
    try {
      await navigator.clipboard.writeText(paragraph);
      notify("段落已复制到剪贴板");
    } catch {
      notify("复制失败，请手动选择文本复制");
    }
  };
  const exportCurrentSource = () => {
    downloadTextFile(`${safeFilename(source.title)}.md`, sourceToMarkdown(source), "text/markdown;charset=utf-8");
    notify("当前资料已导出为 Markdown");
  };
  const toggleRead = () => {
    if (source.status === "read") {
      updateSource(source.id, { status: "unread", readingProgress: Math.min(source.readingProgress, 42) });
      notify("已取消已读状态");
      return;
    }
    markSourceAsRead(source.id);
    notify("已标为已读");
  };
  const toggleArchive = () => {
    if (source.status === "archived") {
      updateSource(source.id, { status: "unread" });
      notify("已取消归档，资料回到未读");
      return;
    }
    archiveSource(source.id);
    notify("资料已归档");
  };
  const contextScore = highlights.length + notes.length + claims.length + ev.length;
  const nextContextTip = highlights.length === 0
    ? (english ? "Highlight the most valuable passage first." : "先高亮一段最能代表这篇资料价值的内容。")
    : claims.length === 0
      ? (english ? "You have highlights — now convert key judgements to claims." : "已经有高亮了，下一步把判断性内容转成观点。")
      : ev.length === 0
        ? (english ? "Claims exist — add one piece of evidence to support them." : "观点已经出现，建议补一条能支撑它的证据。")
        : (english ? "This source has a reusable evidence chain — ready for an output draft." : "这篇资料已经形成可复用证据链，可以加入成果草稿。");

  // Morandi / eye-care background palette
  const READER_BG_PALETTE = [
    { id:"default",  label:"默认白",  bg:"#ffffff",  text:"#1a1a2e" },
    { id:"cream",    label:"暖奶白",  bg:"#fef9f0",  text:"#2d2018" },
    { id:"sage",     label:"莫兰迪绿", bg:"#edf2ed",  text:"#1a2a1e" },
    { id:"mist",     label:"雾霾蓝",  bg:"#eef2f6",  text:"#1a2030" },
    { id:"lavender", label:"淡薰衣草", bg:"#f4f0f8",  text:"#1e1530" },
    { id:"sand",     label:"沙漠米",  bg:"#f7f3ec",  text:"#2a2010" },
    { id:"slate",    label:"护眼灰",  bg:"#f0f2f0",  text:"#1a2018" },
  ];
  const bgEntry = READER_BG_PALETTE.find(b => b.id === readerBg) ?? READER_BG_PALETTE[0];

  return (
    <>
      <section className="reader-shell" style={{ background: bgEntry.bg, transition:"background 0.28s" }}>
        <article className="reader" style={{ background: "transparent", color: bgEntry.text }}>
          <div className="reader-meta">
            <Badge tone="blue">{source.sourceName}</Badge><Badge>{purposeLabel(source.purpose)}</Badge><Badge tone="green">{source.snapshotStatus === "saved" ? "Snapshot saved" : source.snapshotStatus}</Badge>
          </div>
          <h2>{source.title}</h2>
          <div className="meta-line"><span>{source.url}</span><span>{formatDate(source.savedAt)}</span><span>{source.readingTime} min</span><span>{source.readingProgress}% read</span></div>
          <div className="reader-toolbar">
            <button className={`button secondary reader-tool reader-tool-read ${source.status === "read" ? "active" : ""}`} onClick={toggleRead} type="button" aria-pressed={source.status === "read"}>
              <CheckCircle2 size={16} /> {source.status === "read" ? "已读" : "标为已读"}
            </button>
            <button className={`button secondary reader-tool reader-tool-archive ${source.status === "archived" ? "active" : ""}`} onClick={toggleArchive} type="button" aria-pressed={source.status === "archived"}>
              <Archive size={16} /> {source.status === "archived" ? "已归档" : "归档"}
            </button>
            <button className={`button secondary reader-tool reader-tool-listen ${listenOpen ? "active" : ""}`} onClick={() => setListenOpen((open) => !open)} type="button" aria-pressed={listenOpen}>
              <Clock size={16} /> 收听
            </button>
            <button className={`button secondary reader-tool reader-tool-share ${shareOpen ? "active" : ""}`} onClick={() => setShareOpen((open) => !open)} type="button" aria-pressed={shareOpen}>
              <Share2 size={16} /> 分享
            </button>
            <button className={`button secondary reader-tool reader-tool-export ${exportOpen ? "active" : ""}`} onClick={() => setExportOpen((open) => !open)} type="button" aria-pressed={exportOpen}>
              <FileOutput size={16} /> {english ? "Export" : "导出"}
            </button>
            <button className="button reader-tool immersive-btn" onClick={() => setImmersive(true)} type="button" title={english ? "Enter immersive reading" : "进入沉浸式阅读"}>
              <Monitor size={16} /> {english ? "Focus" : "沉浸阅读"}
            </button>
            {/* Background color palette */}
            <div style={{ display:"flex", alignItems:"center", gap:5, marginLeft:"auto", padding:"0 4px" }}>
              <span style={{ fontSize:11, color:"var(--text-muted)", flexShrink:0 }}>背景</span>
              {READER_BG_PALETTE.map(b => (
                <button key={b.id} type="button" title={b.label}
                  onClick={() => setReaderBg(b.id)}
                  style={{
                    width:18, height:18, borderRadius:"50%", border: readerBg === b.id ? "2.5px solid var(--accent)" : "1.5px solid rgba(0,0,0,0.15)",
                    background:b.bg, cursor:"pointer", flexShrink:0, padding:0,
                    boxShadow: readerBg === b.id ? "0 0 0 2px var(--app-bg), 0 0 0 4px var(--accent)" : "0 1px 3px rgba(0,0,0,0.1)",
                    transition:"all 0.15s",
                  }} />
              ))}
            </div>
          </div>
          <SourceReferenceBox source={source} />
          <OriginalSnapshot source={source} />
          <section className="summary-box">
            <h3>{english ? "AI Summary" : "AI 摘要"}</h3>
            <p>{source.summary}</p>
            <ul>{source.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
            <p><strong>{english ? "Reading tip: " : "阅读建议："}</strong>{source.readingRecommendation}</p>
          </section>
          <section className="analysis-box">
            <div className="analysis-stat-grid">
              {[
                { icon: Highlighter, label: english ? "Highlights" : "高亮", value: highlights.length, color: "#d97706", bg: "#fef3c7" },
                { icon: MessageSquare, label: english ? "Notes" : "笔记", value: notes.length, color: "#7c3aed", bg: "#f5f3ff" },
                { icon: Lightbulb, label: english ? "Claims" : "观点", value: claims.length, color: "#16a34a", bg: "#f0fdf4" },
                { icon: ShieldCheck, label: english ? "Evidence" : "证据", value: ev.length, color: "#2563eb", bg: "#eff6ff" },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="analysis-stat-item" style={{ background: bg }}>
                  <span style={{ color }}><Icon size={16} /></span>
                  <strong style={{ color }}>{value}</strong>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </section>
          <ReaderMediaBlock source={source} />
          <div className="article-body">
            {source.content.map((paragraph, index) => {
              const highlight = highlightByParagraph.get(index);
              return (
              <div key={paragraph} className={`paragraph ${highlight ? `highlighted highlight-${highlight.color}` : ""}`}>
                <div className="paragraph-top">
                  <span className="paragraph-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="paragraph-kind">{paragraph.includes("出处：") ? "出处" : paragraph.includes("Lumo 可抽取") ? "可抽取" : "段落"}</span>
                  {highlight && (
                    <span className={`highlight-label ${highlight.color}`}>
                      已高亮
                      <button
                        type="button"
                        className="highlight-label-remove"
                        onClick={(e) => { e.stopPropagation(); createHighlight(source.id, index); }}
                        title={english ? "Remove highlight" : "取消高亮"}
                      >×</button>
                    </span>
                  )}
                </div>
                <p>{paragraph}</p>
                <div className="paragraph-actions">
                  <Button onClick={() => createHighlight(source.id, index)}><Highlighter size={15} /> {highlight ? "取消高亮" : "高亮"}</Button>
                  <Button onClick={() => setNoteTarget({ paragraph, index })}>添加笔记</Button>
                  <Button onClick={() => createClaimFromParagraph(source.id, index)}>创建观点</Button>
                  <Button onClick={() => createEvidenceFromParagraph(source.id, index)}>创建证据</Button>
                  <Button onClick={() => setAskTarget({ paragraph, index })}>问 Lumo</Button>
                  <Button onClick={() => copyParagraph(paragraph)}><Copy size={15} /></Button>
                </div>
              </div>
              );
            })}
          </div>
          {/* Scroll sentinel — triggers auto-read when visible */}
          <div ref={articleBottomRef} className="article-read-sentinel" aria-hidden />
        </article>
        <aside className="inspector reader-context-panel">
          <div className="ctx-header">
            <span className="ctx-title">{english ? "Context" : "阅读脉络"}</span>
            {contextScore > 0 && <span className="ctx-badge">{contextScore} {english ? "items" : "条"}</span>}
          </div>

          <div className="ctx-stats-grid">
            {([
              { label: english ? "Highlights" : "高亮", count: highlights.length, id: "ctx-highlights", icon: Highlighter, color: "#d97706", bg: "#fef3c7", preview: highlights.slice(0, 2).map((h) => h.text) },
              { label: english ? "Notes" : "笔记", count: notes.length, id: "ctx-notes", icon: MessageSquare, color: "#7c3aed", bg: "#f5f3ff", preview: notes.slice(0, 2).map((n) => n.content) },
              { label: english ? "Claims" : "观点", count: claims.length, id: "ctx-claims", icon: Lightbulb, color: "#16a34a", bg: "#f0fdf4", preview: claims.slice(0, 2).map((c) => c.text) },
              { label: english ? "Evidence" : "证据", count: ev.length, id: "ctx-evidence", icon: ShieldCheck, color: "#2563eb", bg: "#eff6ff", preview: ev.slice(0, 2).map((e) => e.text) },
            ] as { label: string; count: number; id: string; icon: typeof Lightbulb; color: string; bg: string; preview: string[] }[]).map(({ label, count, id, icon: Icon, color, bg, preview }) => (
              <div key={id} className="ctx-stat-wrap">
                <button
                  className={`ctx-stat-btn ${count > 0 ? "has-content" : ""}`}
                  style={{ "--stat-color": color, "--stat-bg": bg } as React.CSSProperties}
                  type="button"
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  <span className="ctx-stat-icon"><Icon size={14} /></span>
                  <strong>{count}</strong>
                  <small>{label}</small>
                </button>
                {count > 0 && (
                  <div className="ctx-stat-tooltip">
                    <b>{label} · {count} {english ? "items" : "条"}</b>
                    {preview.map((text, i) => <p key={i}>{text.slice(0, 48)}{text.length > 48 ? "…" : ""}</p>)}
                    <span>{english ? "Click to jump ↓" : "点击跳转 ↓"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="ctx-sections">
            <CtxSection id="ctx-highlights" title={english ? "Highlights" : "高亮片段"} color="#d97706" items={highlights.map((h) => h.text)} />
            <CtxSection id="ctx-notes" title={english ? "Notes" : "笔记"} color="#7c3aed" items={notes.map((n) => n.content)} />
            <CtxSection id="ctx-claims" title={english ? "Claims" : "已形成观点"} color="#16a34a" items={claims.map((c) => c.text)} />
            <CtxSection id="ctx-evidence" title={english ? "Evidence" : "可引用证据"} color="#2563eb" items={ev.map((e) => e.text)} />
          </div>
        </aside>
      </section>
      {noteTarget && (
        <NoteModal
          paragraph={noteTarget.paragraph}
          onClose={() => setNoteTarget(undefined)}
          onSave={(content) => {
            createNote(source.id, noteTarget.index, content);
            setNoteTarget(undefined);
          }}
        />
      )}
      {askTarget && <AskLumoModal paragraph={askTarget.paragraph} sourceTitle={source.title} sourceUrl={source.url} onClose={() => setAskTarget(undefined)} />}
      {listenOpen && <ListenSourceModal source={source} onClose={() => setListenOpen(false)} />}
      {shareOpen && <ShareSourceModal source={source} onClose={() => setShareOpen(false)} />}
      {exportOpen && <ExportSourceModal source={source} onClose={() => setExportOpen(false)} onQuickExport={exportCurrentSource} />}
      {immersive && (
        <ImmersiveReader
          source={source}
          highlights={highlights}
          notes={notes}
          onHighlight={(idx, color, start, end) => createHighlight(source.id, idx, color, start, end)}
          onNote={(idx, text, attachments) => createNote(source.id, idx, text, attachments)}
          onDeleteNote={(id) => deleteNote(id)}
          onClose={() => setImmersive(false)}
        />
      )}
    </>
  );
}

// ── Immersive Reader ──────────────────────────────────────
type ImmersiveHighlight = { paragraphIndex: number; color: string; startOffset?: number; endOffset?: number };

const HL_COLORS: Array<{ id: HighlightColor; bg: string; mark: string }> = [
  { id: "yellow",  bg: "#fef9c3", mark: "#fef08a" },
  { id: "green",   bg: "#dcfce7", mark: "#bbf7d0" },
  { id: "blue",    bg: "#dbeafe", mark: "#bfdbfe" },
  { id: "purple",  bg: "#ede9fe", mark: "#ddd6fe" },
  { id: "red",     bg: "#fee2e2", mark: "#fecaca" },
  { id: "pink",    bg: "#fce7f3", mark: "#fbcfe8" },
  { id: "orange",  bg: "#ffedd5", mark: "#fed7aa" },
];

function getMarkColor(id: string): string {
  return HL_COLORS.find((c) => c.id === id)?.mark ?? "#fef08a";
}
function getBgColor(id: string): string {
  return HL_COLORS.find((c) => c.id === id)?.bg ?? "#fef9c3";
}

/** Split paragraph text into before / mark / after segments for inline rendering */
function renderInlinePara(text: string, rangeHighlights: ImmersiveHighlight[]) {
  if (!rangeHighlights.length) return <p>{text}</p>;
  // Build non-overlapping sorted segments
  const segments: Array<{ start: number; end: number; color: string }> = rangeHighlights
    .filter((h) => h.startOffset !== undefined && h.endOffset !== undefined)
    .map((h) => ({ start: h.startOffset!, end: h.endOffset!, color: h.color }))
    .sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const seg of segments) {
    if (seg.start > cursor) parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, seg.start)}</span>);
    parts.push(<mark key={`m-${seg.start}`} className="hl-mark" style={{ background: getMarkColor(seg.color) }}>{text.slice(seg.start, seg.end)}</mark>);
    cursor = seg.end;
  }
  if (cursor < text.length) parts.push(<span key={`t-end`}>{text.slice(cursor)}</span>);
  return <p>{parts}</p>;
}

interface MindMapNode {
  id: string; text: string; parentId: string | null;
  bold?: boolean; underline?: boolean;
  fontColor?: string; bgColor?: string; borderColor?: string;
  shape?: "rounded" | "pill" | "sharp";
}

function ImmersiveReader({ source, highlights, notes, onHighlight, onNote, onDeleteNote, onClose }: {
  source: Source;
  highlights: ImmersiveHighlight[];
  notes: { id: string; paragraphIndex?: number; content: string; createdAt?: string; attachments?: Array<{ type: "image"|"audio"|"video"; dataUrl: string; name: string }> }[];
  onHighlight: (idx: number, color: HighlightColor, startOffset?: number, endOffset?: number) => void;
  onNote: (idx: number, text: string, attachments?: Array<{ type: "image"|"audio"|"video"; dataUrl: string; name: string }>) => void;
  onDeleteNote: (id: string) => void;
  onClose: () => void;
}) {
  const [activeTool, setActiveTool] = useState<"highlight" | "note" | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [highlightColor, setHighlightColor] = useState<HighlightColor>("yellow");
  const [noteIdx, setNoteIdx] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteAttachments, setNoteAttachments] = useState<Array<{ type: "image" | "audio" | "video"; dataUrl: string; name: string }>>([]);
  const [fontSize, setFontSize] = useState(17);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  // Morandi / eye-care background palette for immersive reader
  const IMMERSIVE_BG = [
    { id:"default",  label:"纯白",    bg:"#ffffff", text:"#0f172a" },
    { id:"cream",    label:"暖奶白",  bg:"#fef9f0", text:"#2d2018" },
    { id:"sage",     label:"莫兰迪绿",bg:"#edf2ed", text:"#1a2a1e" },
    { id:"mist",     label:"雾霾蓝",  bg:"#eef2f6", text:"#1a2030" },
    { id:"lavender", label:"淡薰衣草",bg:"#f4f0f8", text:"#1e1530" },
    { id:"sand",     label:"沙漠米",  bg:"#f7f3ec", text:"#2a2010" },
    { id:"eye",      label:"护眼绿",  bg:"#e8f0e8", text:"#1a2a1e" },
  ] as const;
  const [immersiveBg, setImmersiveBg] = useState<string>("default");
  const bgEntry = IMMERSIVE_BG.find(b => b.id === immersiveBg) ?? IMMERSIVE_BG[0];
  // Resizable split
  const [splitPct, setSplitPct] = useState(65);
  const splitDragRef = useRef<{ startX: number; startPct: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [rightTab, setRightTab] = useState<"notes" | "mindmap" | "chat">("notes");
  const [mmNodes, setMmNodes] = useState<MindMapNode[]>([]);
  const [mmInitedFor, setMmInitedFor] = useState("");
  const [mmEditId, setMmEditId] = useState<string | null>(null);
  const [mmEditText, setMmEditText] = useState("");
  const [mmSelectedId, setMmSelectedId] = useState<string | null>(null);
  const [mmFullscreen, setMmFullscreen] = useState(false);
  const [mmBranchStyle, setMmBranchStyle] = useState<"bezier" | "straight" | "elbow">("bezier");
  const mmEditDivRef = useRef<HTMLDivElement | null>(null);
  const [mmDragPos, setMmDragPos] = useState<Record<string, { x: number; y: number }>>({});
  const mmDragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const imgInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleMediaFile = (file: File, type: "image" | "audio" | "video") => {
    const reader = new FileReader();
    reader.onload = () => {
      setNoteAttachments((prev) => [...prev, { type, dataUrl: String(reader.result), name: file.name }]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (i: number) => setNoteAttachments((prev) => prev.filter((_, idx) => idx !== i));

  // Map paragraphIndex → list of highlights (supports multiple ranges per paragraph)
  const highlightsByPara = useMemo(() => {
    const map = new Map<number, ImmersiveHighlight[]>();
    for (const h of highlights) {
      const list = map.get(h.paragraphIndex) ?? [];
      list.push(h);
      map.set(h.paragraphIndex, list);
    }
    return map;
  }, [highlights]);

  const noteMap = new Map(notes.filter((n) => n.paragraphIndex !== undefined).map((n) => [n.paragraphIndex as number, n.content]));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // Init mind map nodes from source keyPoints when switching to mindmap tab
  useEffect(() => {
    if (rightTab === "mindmap" && mmInitedFor !== source.id) {
      const nodes: MindMapNode[] = [
        { id: "root", text: source.title, parentId: null },
        ...source.keyPoints.slice(0, 8).map((kp, i) => ({ id: `kp-${i}`, text: kp, parentId: "root" })),
      ];
      setMmNodes(nodes);
      setMmInitedFor(source.id);
      setMmEditId(null);
    }
  }, [rightTab, source.id]);

  /** Detect text selection and return paragraph index + offsets, or null */
  const getTextSelection = (): { idx: number; start: number; end: number } | null => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const selRange = sel.getRangeAt(0);
    const selectedText = sel.toString();
    if (!selectedText.trim()) return null;
    // Walk up to find .immersive-para
    let node: Node | null = selRange.startContainer;
    while (node) {
      if (node instanceof Element && node.classList.contains("immersive-para")) {
        const idxStr = (node as HTMLElement).dataset.paraIdx;
        if (idxStr === undefined) return null;
        const idx = parseInt(idxStr);
        // Calculate char offset from start of <p>
        const pEl = node.querySelector("p");
        if (!pEl) return null;
        const beforeRange = document.createRange();
        beforeRange.setStart(pEl, 0);
        beforeRange.setEnd(selRange.startContainer, selRange.startOffset);
        const start = beforeRange.toString().length;
        const end = start + selectedText.length;
        return { idx, start, end };
      }
      node = node.parentNode;
    }
    return null;
  };

  const handleParaMouseUp = (idx: number) => {
    if (activeTool !== "highlight") return;
    const rangeSel = getTextSelection();
    if (rangeSel && rangeSel.idx === idx) {
      // Inline / range highlight
      onHighlight(rangeSel.idx, highlightColor, rangeSel.start, rangeSel.end);
      window.getSelection()?.removeAllRanges();
    } else {
      // Whole-paragraph highlight (click with no selection)
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        onHighlight(idx, highlightColor);
      }
    }
  };

  const handleParaClick = (idx: number) => {
    if (activeTool === "note") { setNoteIdx(idx); setNoteText(noteMap.get(idx) ?? ""); }
  };

  const saveNote = () => {
    if (noteIdx !== null && noteText.trim()) {
      onNote(noteIdx, noteText.trim(), noteAttachments.length > 0 ? noteAttachments : undefined);
      setNoteIdx(null);
      setNoteText("");
      setNoteAttachments([]);
    }
  };

  // Sort notes by paragraph order for display
  const orderedNotes = useMemo(() =>
    notes
      .filter((n) => n.paragraphIndex !== undefined)
      .sort((a, b) => (a.paragraphIndex ?? 0) - (b.paragraphIndex ?? 0)),
  [notes]);

  return (
    <div className="immersive-overlay">
      {/* Top bar */}
      <div className="immersive-topbar">
        <div className="immersive-title">
          <Monitor size={16} />
          <span>{source.title}</span>
        </div>
        <div className="immersive-tools">
          {/* Highlight tool */}
          <div className={`immersive-tool-group ${activeTool === "highlight" ? "active" : ""}`}>
            <button type="button" className="immersive-tool" onClick={() => setActiveTool(activeTool === "highlight" ? null : "highlight")} title="高亮">
              <Highlighter size={16} />
            </button>
            {activeTool === "highlight" && (
              <div className="immersive-color-picker">
                {HL_COLORS.map(({ id, mark }) => (
                  <button key={id} type="button" className={`color-dot ${highlightColor === id ? "active" : ""}`} style={{ background: mark }} onClick={() => setHighlightColor(id)} title={id} />
                ))}
              </div>
            )}
          </div>
          <button type="button" className={`immersive-tool ${activeTool === "note" ? "active" : ""}`} onClick={() => setActiveTool(activeTool === "note" ? null : "note")} title="添加批注">
            <MessageSquare size={16} />
          </button>
          <div className="immersive-separator" />
          <button type="button" className="immersive-tool" onClick={() => setFontSize((s) => Math.max(13, s - 1))} title="缩小字体">A-</button>
          <button type="button" className="immersive-tool" onClick={() => setFontSize((s) => Math.min(24, s + 1))} title="放大字体">A+</button>
          <div className="immersive-separator" />
          <button type="button" className="immersive-close" onClick={onClose} title="退出 (Esc)">
            <X size={18} /> 退出
          </button>
        </div>
      </div>

      {/* Tool hint */}
      {activeTool && (
        <div className="immersive-hint">
          {activeTool === "highlight" && <><Highlighter size={13} /> 选中文字高亮片段，或点击段落整段高亮</>}
          {activeTool === "note" && <><MessageSquare size={13} /> 点击段落在右侧添加批注</>}
        </div>
      )}

      {/* Scroll progress bar */}
      <div className="immersive-progress-bar">
        <span style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Main body: article (left) + notes panel (right) */}
      <div className="immersive-body">
        {/* Left: article scroll */}
        <div
          className="immersive-scroll"
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const pct = el.scrollHeight <= el.clientHeight ? 100
              : Math.min(100, Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100));
            setScrollProgress(pct);
          }}
        >
          <article className="immersive-article" style={{ fontSize }}>
            <h1>{source.title}</h1>
            <div className="immersive-meta">
              <span>{source.sourceName}</span>
              <span>{source.readingTime} 分钟</span>
              <a href={source.url} target="_blank" rel="noreferrer">{safeHost(source.url)}</a>
            </div>
            <div className="immersive-paragraphs">
              {source.content.map((para, idx) => {
                const paraHighlights = highlightsByPara.get(idx) ?? [];
                const paraHl = paraHighlights.find((h) => h.startOffset === undefined);
                const rangeHls = paraHighlights.filter((h) => h.startOffset !== undefined);
                const hasNote = noteMap.has(idx);
                const isNoteTarget = noteIdx === idx;
                return (
                  <div
                    key={idx}
                    data-para-idx={idx}
                    className={`immersive-para ${activeTool ? "tool-cursor" : ""} ${paraHl ? `hl-${paraHl.color}` : ""} ${isNoteTarget ? "note-targeted" : ""}`}
                    onMouseUp={() => handleParaMouseUp(idx)}
                    onClick={() => handleParaClick(idx)}
                  >
                    {rangeHls.length > 0 ? renderInlinePara(para, rangeHls) : <p>{para}</p>}
                    {hasNote && (
                      <span className="para-note-dot" title="有批注" onClick={(e) => { e.stopPropagation(); setNoteIdx(idx); setNoteText(noteMap.get(idx) ?? ""); }}>
                        <MessageSquare size={11} />
                      </span>
                    )}
                    {paraHl && <span className="hl-strip" style={{ background: getBgColor(paraHl.color) }} />}
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        {/* Right: tabbed panel — Notes / Mind Map / Lumo Chat */}
        <aside className="immersive-notes-panel">
          {/* Tab switcher */}
          <div className="immersive-right-tabs">
            <button className={rightTab === "notes" ? "active" : ""} onClick={() => setRightTab("notes")}><MessageSquare size={13} /> 批注{orderedNotes.length > 0 ? ` · ${orderedNotes.length}` : ""}</button>
            <button className={rightTab === "mindmap" ? "active" : ""} onClick={() => setRightTab("mindmap")}><GitBranch size={13} /> 思维导图</button>
            <button className={rightTab === "chat" ? "active" : ""} onClick={() => setRightTab("chat")}><img src="/media/lumo-app-icon-new.svg" width={14} height={14} style={{borderRadius:4}} alt="" /> Lumo 问答</button>
          </div>

          {/* ── Notes Tab ── */}
          {rightTab === "notes" && <>
            {noteIdx !== null && (
              <div className="immersive-note-compose">
                <div className="immersive-note-para-preview">
                  {source.content[noteIdx]?.slice(0, 60)}…
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="写下你的批注…"
                  autoFocus
                  className="immersive-note-textarea"
                />
                {noteAttachments.length > 0 && (
                  <div className="note-attachments-preview">
                    {noteAttachments.map((att, i) => (
                      <div key={i} className="note-att-item">
                        {att.type === "image" && <img src={att.dataUrl} alt={att.name} onClick={() => setLightboxSrc(att.dataUrl)} style={{ cursor: "zoom-in" }} />}
                        {att.type === "audio" && <audio src={att.dataUrl} controls />}
                        {att.type === "video" && <video src={att.dataUrl} controls />}
                        <button type="button" className="note-att-remove" onClick={() => removeAttachment(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="note-media-row">
                  <button type="button" className="note-media-btn" onClick={() => imgInputRef.current?.click()}><ImageIcon size={13} /> 图片</button>
                  <button type="button" className="note-media-btn" onClick={() => audioInputRef.current?.click()}><Mic size={13} /> 音频</button>
                  <button type="button" className="note-media-btn" onClick={() => videoInputRef.current?.click()}><Video size={13} /> 视频</button>
                  <input ref={imgInputRef} type="file" accept="image/*" className="visually-hidden" onChange={(e) => e.target.files?.[0] && handleMediaFile(e.target.files[0], "image")} />
                  <input ref={audioInputRef} type="file" accept="audio/*" className="visually-hidden" onChange={(e) => e.target.files?.[0] && handleMediaFile(e.target.files[0], "audio")} />
                  <input ref={videoInputRef} type="file" accept="video/*" className="visually-hidden" onChange={(e) => e.target.files?.[0] && handleMediaFile(e.target.files[0], "video")} />
                  <span style={{ flex: 1 }} />
                  <button type="button" onClick={() => { setNoteIdx(null); setNoteAttachments([]); }}>取消</button>
                  <button type="button" className="primary" onClick={saveNote}>保存</button>
                </div>
              </div>
            )}
            {orderedNotes.length === 0 && noteIdx === null && (
              <div className="immersive-notes-empty">
                <MessageSquare size={22} />
                <p>点击工具栏批注图标，再点击段落添加批注</p>
              </div>
            )}
            <div className="immersive-notes-list">
              {orderedNotes.map((note) => (
                <div key={note.id} className={`immersive-note-card ${noteIdx === note.paragraphIndex ? "active" : ""}`}>
                  <div className="immersive-note-card-para">{source.content[note.paragraphIndex ?? 0]?.slice(0, 48)}…</div>
                  <p className="immersive-note-card-content" onClick={() => { setRightTab("notes"); setNoteIdx(note.paragraphIndex ?? null); setNoteText(note.content); setNoteAttachments(note.attachments ?? []); }}>{note.content}</p>
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="note-card-attachments">
                      {note.attachments.map((att, j) => (
                        att.type === "image"
                          ? <img key={j} src={att.dataUrl} alt={att.name} className="note-card-att-thumb" onClick={(e) => { e.stopPropagation(); setLightboxSrc(att.dataUrl); }} style={{ cursor: "zoom-in" }} />
                          : <span key={j} className="note-card-att-icon">{att.type === "audio" ? "🎵" : "🎬"}</span>
                      ))}
                    </div>
                  )}
                  <div className="immersive-note-card-footer">
                    <time className="immersive-note-card-time">{note.createdAt?.slice(0, 10)}</time>
                    <button type="button" className="note-card-delete-btn" title="删除批注" onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* ── Mind Map Tab ── */}
          {rightTab === "mindmap" && (() => {
            const NW = 148, RW = 164, HG = 54, VG = 10;
            const LH = 15, VPAD = 10, HPAD = 16; // line-height, vertical/horizontal padding
            // Per-node height: dynamic based on text length
            function calcNH(text: string, nw: number, fs: number): number {
              const cpLine = Math.max(2, Math.floor((nw - HPAD) / fs));
              const lines = Math.max(1, Math.ceil((text || "节点").length / cpLine));
              return Math.max(32, lines * LH + VPAD);
            }
            const nodeW = (id: string) => id === "root" ? RW : NW;
            const nodeFS = (id: string) => id === "root" ? 11 : 10;
            // Build heights (use mmEditText for the node being edited so layout updates live)
            const nH = new Map<string, number>();
            mmNodes.forEach(n => {
              const text = n.id === mmEditId ? mmEditText : n.text;
              nH.set(n.id, calcNH(text, nodeW(n.id), nodeFS(n.id)));
            });
            // Children map (preserves insertion order = vertical order)
            const kidsOf = new Map<string | null, string[]>();
            mmNodes.forEach(n => {
              if (!kidsOf.has(n.parentId)) kidsOf.set(n.parentId, []);
              kidsOf.get(n.parentId)!.push(n.id);
            });
            function stH(id: string): number {
              const ks = kidsOf.get(id) ?? [];
              const selfH = nH.get(id) ?? 32;
              if (!ks.length) return selfH;
              return Math.max(selfH, ks.reduce((s, k) => s + stH(k) + VG, -VG));
            }
            const pos = new Map<string, [number,number,number,number]>();
            function place(id: string, x: number, y: number) {
              const ks = kidsOf.get(id) ?? [];
              const sth = stH(id);
              const w = nodeW(id);
              const h = nH.get(id) ?? 32;
              pos.set(id, [x, y + (sth - h) / 2, w, h]);
              let cy = y;
              ks.forEach(kid => { const ks2 = stH(kid); place(kid, x + w + HG, cy); cy += ks2 + VG; });
            }
            (kidsOf.get(null) ?? []).forEach(r => place(r, 0, 0));
            let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
            pos.forEach(([x, y, w, h]) => { mnX = Math.min(mnX, x); mnY = Math.min(mnY, y); mxX = Math.max(mxX, x + w + 28); mxY = Math.max(mxY, y + h + 8); });
            const pad = 16;
            const vb = `${mnX-pad} ${mnY-pad} ${mxX-mnX+pad*2} ${mxY-mnY+pad*2}`;

            function addChild(pid: string) {
              const nid = `mm-${Date.now()}`;
              setMmNodes(p => [...p, { id: nid, text: "", parentId: pid }]);
              setMmEditId(nid); setMmEditText("");
            }
            function addSibling(id: string) {
              const node = mmNodes.find(n => n.id === id);
              if (!node?.parentId) return;
              const nid = `mm-${Date.now()}`;
              setMmNodes(prev => {
                // Find last descendant index, insert sibling after subtree
                const desc = new Set<string>([id]);
                let changed = true;
                while (changed) { changed = false; prev.forEach(n => { if (n.parentId && desc.has(n.parentId) && !desc.has(n.id)) { desc.add(n.id); changed = true; } }); }
                let insertAt = prev.findIndex(n => n.id === id);
                prev.forEach((n, i) => { if (desc.has(n.id)) insertAt = Math.max(insertAt, i); });
                const r = [...prev]; r.splice(insertAt + 1, 0, { id: nid, text: "", parentId: node.parentId! }); return r;
              });
              setMmEditId(nid); setMmEditText("");
            }
            function delNode(id: string) {
              setMmNodes(prev => {
                const del = new Set<string>();
                const q = [id];
                while (q.length) { const cur = q.shift()!; del.add(cur); prev.forEach(n => { if (n.parentId === cur) q.push(n.id); }); }
                return prev.filter(n => !del.has(n.id));
              });
            }
            function saveEdit(next?: "child" | "sibling") {
              const text = mmEditText.trim() || "节点";
              const eid = mmEditId;
              setMmNodes(p => p.map(n => n.id === eid ? { ...n, text } : n));
              setMmEditId(null);
              if (eid && next === "child") setTimeout(() => addChild(eid), 10);
              if (eid && next === "sibling") setTimeout(() => addSibling(eid), 10);
            }

            // Format helpers
            const selectedNode = mmNodes.find(n => n.id === mmSelectedId);
            function updateFmt<K extends keyof MindMapNode>(key: K, val: MindMapNode[K]) {
              if (!mmSelectedId) return;
              setMmNodes(p => p.map(n => n.id === mmSelectedId ? { ...n, [key]: val } : n));
            }
            function toggleFmt(key: "bold" | "underline") {
              if (!selectedNode) return;
              updateFmt(key, !selectedNode[key]);
            }
            function nodeRx(n: MindMapNode) {
              return n.shape === "pill" ? "15" : n.shape === "sharp" ? "0" : "7";
            }
            function edgePath(x1: number, y1: number, x2: number, y2: number) {
              const mx = (x1 + x2) / 2;
              switch (mmBranchStyle) {
                case "straight": return `M${x1} ${y1} L${x2} ${y2}`;
                case "elbow": return `M${x1} ${y1} H${mx} V${y2} H${x2}`;
                default: return `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}`;
              }
            }

            // Formatting toolbar (shown when a node is selected)
            const fmtToolbar = selectedNode ? (
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderBottom:"1px solid var(--border)", flexShrink:0, flexWrap:"wrap", background:"var(--toolbar-gradient)", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                {/* 样式组 */}
                <div style={{ display:"flex", gap:3, background:"var(--surface-soft)", borderRadius:7, padding:2 }}>
                  <button type="button" onClick={() => toggleFmt("bold")} title="加粗"
                    style={{ padding:"3px 8px", borderRadius:5, border:"none", background:selectedNode.bold ? "var(--pill-active-bg)" : "transparent", color:selectedNode.bold ? "var(--pill-active-text)" : "var(--text-muted)", fontWeight:700, fontSize:12.5, cursor:"pointer", transition:"all 0.15s" }}>
                    B
                  </button>
                  <button type="button" onClick={() => toggleFmt("underline")} title="下划线"
                    style={{ padding:"3px 8px", borderRadius:5, border:"none", background:selectedNode.underline ? "var(--pill-active-bg)" : "transparent", color:selectedNode.underline ? "var(--pill-active-text)" : "var(--text-muted)", textDecoration:"underline", fontSize:12.5, cursor:"pointer", transition:"all 0.15s" }}>
                    U
                  </button>
                </div>

                <div style={{ width:1, height:18, background:"var(--border)" }} />

                {/* 颜色组 */}
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <label style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer" }} title="字色">
                    <span style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", borderBottom:`2.5px solid ${selectedNode.fontColor ?? "var(--text-primary)"}`, lineHeight:1.2, paddingBottom:1 }}>A</span>
                    <input type="color" value={selectedNode.fontColor ?? "#374151"} onChange={e => updateFmt("fontColor", e.target.value)}
                      style={{ width:18, height:10, border:"1px solid var(--border)", borderRadius:3, padding:0, cursor:"pointer" }} />
                  </label>
                  <label style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer" }} title="背景">
                    <span style={{ fontSize:9, color:"var(--text-muted)", fontWeight:600 }}>底色</span>
                    <input type="color" value={selectedNode.bgColor ?? "#f8fafc"} onChange={e => updateFmt("bgColor", e.target.value)}
                      style={{ width:18, height:10, border:"1px solid var(--border)", borderRadius:3, padding:0, cursor:"pointer" }} />
                  </label>
                  <label style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer" }} title="边框">
                    <span style={{ fontSize:9, color:"var(--text-muted)", fontWeight:600 }}>边框</span>
                    <input type="color" value={selectedNode.borderColor ?? "#e2e8f0"} onChange={e => updateFmt("borderColor", e.target.value)}
                      style={{ width:18, height:10, border:"1px solid var(--border)", borderRadius:3, padding:0, cursor:"pointer" }} />
                  </label>
                </div>

                <div style={{ width:1, height:18, background:"var(--border)" }} />

                {/* 形状 & 连线 */}
                <div style={{ display:"flex", gap:5 }}>
                  <select value={selectedNode.shape ?? "rounded"} onChange={e => updateFmt("shape", e.target.value as MindMapNode["shape"])}
                    style={{ fontSize:11, padding:"3px 8px 3px 7px", borderRadius:7, border:"1.5px solid var(--pill-border)", background:"var(--pill-bg)", color:"var(--pill-text)", cursor:"pointer", outline:"none" }}>
                    <option value="rounded">圆角</option>
                    <option value="pill">胶囊</option>
                    <option value="sharp">直角</option>
                  </select>
                  <select value={mmBranchStyle} onChange={e => setMmBranchStyle(e.target.value as typeof mmBranchStyle)}
                    style={{ fontSize:11, padding:"3px 8px 3px 7px", borderRadius:7, border:"1.5px solid var(--pill-border)", background:"var(--pill-bg)", color:"var(--pill-text)", cursor:"pointer", outline:"none" }}>
                    <option value="bezier">曲线</option>
                    <option value="straight">直线</option>
                    <option value="elbow">折线</option>
                  </select>
                </div>

                {/* 删除当前节点 */}
                <button type="button" onClick={() => { if (mmSelectedId && mmSelectedId !== "root") { delNode(mmSelectedId); setMmSelectedId(null); } }}
                  style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:7, border:"1.5px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.07)", color:"#ef4444", fontSize:11, fontWeight:600, cursor:"pointer", transition:"all 0.13s" }}>
                  删除节点
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderBottom:"1px solid var(--border)", flexShrink:0, background:"var(--toolbar-gradient)" }}>
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>点击节点可编辑格式</span>
              </div>
            );

            const svgEl = (
              <svg width="100%" height="100%" viewBox={vb} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}
                tabIndex={0}
                onKeyDown={e => {
                  if (mmEditId) return;
                  if ((e.key === "Delete" || e.key === "Backspace") && mmSelectedId && mmSelectedId !== "root") {
                    e.preventDefault();
                    delNode(mmSelectedId);
                    setMmSelectedId(null);
                  }
                }}
              >
                {mmNodes.map(n => {
                  if (!n.parentId) return null;
                  const pp = pos.get(n.parentId), cp = pos.get(n.id);
                  if (!pp || !cp) return null;
                  const [px,py,pw,ph] = pp; const [cx,cy,,ch2] = cp;
                  const x1=px+pw, y1=py+ph/2, x2=cx, y2=cy+ch2/2;
                  return <path key={`e${n.id}`} d={edgePath(x1,y1,x2,y2)} fill="none" stroke={n.borderColor ?? "#c4b5fd"} strokeWidth="1.5"/>;
                })}
                {mmNodes.map(n => {
                  const p = pos.get(n.id); if (!p) return null;
                  const [nx,ny,nw,nh] = p;
                  const isRoot = !n.parentId;
                  const editing = mmEditId === n.id;
                  const selected = mmSelectedId === n.id;
                  const fs = nodeFS(n.id);
                  const fill = n.bgColor ?? (isRoot ? "#ede9fe" : "#f8fafc");
                  const stroke = selected ? "#6366f1" : (n.borderColor ?? (isRoot ? "#a78bfa" : "#e2e8f0"));
                  const rx = nodeRx(n);
                  return (
                    <g key={n.id}
                      style={{ transform: mmDragPos[n.id] ? `translate(${mmDragPos[n.id].x}px,${mmDragPos[n.id].y}px)` : undefined, cursor: "default" }}
                      onPointerDown={(e) => {
                        if (mmEditId === n.id) return;
                        e.stopPropagation();
                        (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
                        const orig = mmDragPos[n.id] ?? { x: 0, y: 0 };
                        mmDragRef.current = { id: n.id, startX: e.clientX, startY: e.clientY, origX: orig.x, origY: orig.y };
                      }}
                      onPointerMove={(e) => {
                        if (!mmDragRef.current || mmDragRef.current.id !== n.id) return;
                        e.stopPropagation();
                        const svgEl = (e.currentTarget as SVGGElement).ownerSVGElement;
                        const scale = svgEl ? (parseFloat((svgEl.getAttribute("viewBox") ?? "0 0 300 300").split(" ")[2]) / (svgEl.clientWidth || 300)) : 1;
                        const dx = (e.clientX - mmDragRef.current.startX) * scale;
                        const dy = (e.clientY - mmDragRef.current.startY) * scale;
                        setMmDragPos(p => ({ ...p, [n.id]: { x: mmDragRef.current!.origX + dx, y: mmDragRef.current!.origY + dy } }));
                      }}
                      onPointerUp={() => { mmDragRef.current = null; }}
                      onClick={() => { setMmSelectedId(n.id); if (!editing) { setMmEditId(n.id); setMmEditText(n.text); } }}>
                      <rect x={nx} y={ny} width={nw} height={nh} rx={rx}
                        fill={fill} stroke={stroke}
                        strokeWidth={selected ? 2.5 : isRoot ? 2 : 1.5}
                        style={{ cursor: mmDragRef.current?.id === n.id ? "grabbing" : "grab" }} />
                      {editing ? (
                        <foreignObject x={nx+3} y={ny+3} width={nw-6} height={nh-6}>
                          {/* @ts-ignore */}
                          <div xmlns="http://www.w3.org/1999/xhtml"
                            ref={(el) => { if (el && mmEditId === n.id) { mmEditDivRef.current = el; el.focus(); const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); sel?.removeAllRanges(); sel?.addRange(range); } }}
                            contentEditable suppressContentEditableWarning
                            dangerouslySetInnerHTML={{ __html: mmEditText }}
                            onInput={(e: React.FormEvent<HTMLDivElement>) => setMmEditText((e.target as HTMLDivElement).innerHTML)}
                            onBlur={() => saveEdit()}
                            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                              if (e.key === "Tab") { e.preventDefault(); saveEdit("child"); }
                              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit("sibling"); }
                              if (e.key === "Escape") { e.preventDefault(); setMmEditId(null); }
                              if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); document.execCommand("bold"); }
                              if ((e.ctrlKey || e.metaKey) && e.key === "u") { e.preventDefault(); document.execCommand("underline"); }
                            }}
                            style={{ width:"100%", height:"100%", border:"none", outline:"2px solid #a78bfa", borderRadius:5, padding:"4px 6px", fontSize:fs, background:"#fff", color:n.fontColor??"#3b0764", boxSizing:"border-box", lineHeight:"1.4", fontFamily:"inherit", overflowY:"auto", wordBreak:"break-all" }}
                          />
                        </foreignObject>
                      ) : (
                        <foreignObject x={nx} y={ny} width={nw} height={nh} style={{ cursor:"pointer" }}>
                          {/* @ts-ignore */}
                          <div xmlns="http://www.w3.org/1999/xhtml"
                            style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:"4px 8px", boxSizing:"border-box", fontSize:fs, color:n.fontColor??(isRoot?"#5b21b6":"#374151"), wordBreak:"break-all", textAlign:"center", lineHeight:"1.4", overflow:"hidden", cursor:"pointer" }}
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{ __html: n.text || "节点" }}
                            onClick={() => { setMmEditId(n.id); setMmEditText(n.text); }}>
                          </div>
                        </foreignObject>
                      )}
                      <g style={{ cursor:"pointer" }} onClick={e => { e.stopPropagation(); addChild(n.id); }}>
                        <circle cx={nx+nw+12} cy={ny+nh/2} r={9} fill="#ede9fe" stroke="#a78bfa" strokeWidth="1"/>
                        <text x={nx+nw+12} y={ny+nh/2} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#7c3aed" fontWeight="700">+</text>
                      </g>
                      {!isRoot && mmSelectedId === n.id && (
                        <g style={{ cursor:"pointer" }} onClick={e => { e.stopPropagation(); delNode(n.id); setMmSelectedId(null); }}>
                          <circle cx={nx+nw-4} cy={ny-5} r={7} fill="#fef2f2" stroke="#fca5a5" strokeWidth="1.5"/>
                          <text x={nx+nw-4} y={ny-5} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#ef4444" fontWeight="700">×</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            );

            const resetBtn = (
              <button type="button" className="mindmap-add-note" style={{ fontSize: 10 }}
                onClick={() => { setMmNodes([{ id: "root", text: source.title, parentId: null }, ...source.keyPoints.slice(0, 8).map((k, i) => ({ id: `kp-${i}`, text: k, parentId: "root" }))]); setMmEditId(null); }}
                title="重置为原始要点">↺ 重置</button>
            );
            const fsBtn = (
              <button type="button" className="mindmap-add-note" style={{ fontSize: 10 }}
                onClick={() => setMmFullscreen(f => !f)}>
                {mmFullscreen ? "⊠ 收起" : "⊡ 全屏"}
              </button>
            );

            if (mmFullscreen) return (
              <div style={{ position:"fixed", inset:0, zIndex:500, background:"#fafaf9", display:"flex", flexDirection:"column" }}
                onKeyDown={e => { if (e.key === "Escape" && !mmEditId) { e.stopPropagation(); setMmFullscreen(false); } }}>
                <div style={{ display:"flex", justifyContent:"flex-end", gap:4, padding:"8px 16px", borderBottom:"1px solid #e5e7eb", flexShrink:0 }}>
                  {resetBtn}{fsBtn}
                </div>
                {fmtToolbar}
                <div style={{ flex:1, minHeight:0, position:"relative" }}>{svgEl}</div>
              </div>
            );

            return (
              <div className="immersive-mindmap">
                <div style={{ display:"flex", justifyContent:"flex-end", gap:4, padding:"4px 4px 2px", flexShrink:0 }}>
                  {resetBtn}{fsBtn}
                </div>
                {fmtToolbar}
                <div style={{ flex:1, minHeight:0, position:"relative" }}>{svgEl}</div>
              </div>
            );
          })()}
          {/* ── Lumo Q&A Tab ── */}
          {rightTab === "chat" && (
            <div className="immersive-chat">
              <div className="immersive-chat-messages">
                {chatMessages.length === 0 && (
                  <div className="immersive-chat-welcome">
                    <img src="/media/lumo-app-icon-new.svg" width={44} height={44} style={{borderRadius:14, boxShadow:"0 8px 20px rgba(99,102,241,0.2)"}} alt="Lumo" />
                    <p>基于这篇文章提问，Lumo 帮你提炼要点、发现关联</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`immersive-chat-msg ${msg.role}`}>{msg.text}</div>
                ))}
              </div>
              {/* Quick question chips */}
              <div className="immersive-chat-chips">
                {["总结这篇文章", "核心观点是什么？", "有哪些可用证据？", "下一步应该做什么？"].map((q) => (
                  <button key={q} type="button" className="immersive-chat-chip" onClick={() => {
                    const answer = (() => {
                      if (q.includes("总结")) return `${source.title}：${source.summary}`;
                      if (q.includes("核心观点")) return source.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n");
                      if (q.includes("证据")) return `这篇资料已有 ${highlights.filter(h => h.startOffset === undefined).length} 段高亮，${notes.length} 条批注，可在阅读器中转成证据。`;
                      return `建议：先高亮关键段落，把判断性内容转成观点，把出处数据转成证据，再在项目图谱里整合。`;
                    })();
                    setChatMessages(prev => [...prev, { role: "user", text: q }, { role: "ai", text: answer }]);
                  }}>{q}</button>
                ))}
              </div>
              <form className="immersive-chat-input" onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                const q = chatInput.trim();
                setChatInput("");
                setChatMessages(prev => [...prev, { role: "user", text: q }, { role: "ai", text: `关于「${q}」：${source.summary} 建议结合高亮和批注进一步提炼。` }]);
              }}>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="问 Lumo 关于这篇文章…" />
                <button type="submit"><Send size={14} /></button>
              </form>
            </div>
          )}
        </aside>
      </div>
      {/* Image lightbox */}
      {lightboxSrc && (
        <div className="note-lightbox" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="批注图片" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="note-lightbox-close" onClick={() => setLightboxSrc(null)}><X size={20} /></button>
        </div>
      )}
    </div>
  );
}

function hasAnyExt(url: string, exts: string[]) {
  const clean = url.split("?")[0].toLowerCase();
  return exts.some((ext) => clean.endsWith(ext));
}

function OriginalSnapshot({ source }: { source: Source }) {
  const language = useAppStore((s) => s.language);
  const notify = useAppStore((s) => s.notify);
  const english = isEn(language);
  const previewImage = source.snapshotImage ?? sourceThumb(source) ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeHost(source.url))}&sz=64`;
  return (
    <section className="original-snapshot">
      <div className="snapshot-head">
        <div>
          <Badge tone="green">{english ? "Evidence archive" : "证据留存"}</Badge>
          <h3>{english ? "Original evidence snapshot" : "原文证据快照"}</h3>
          <p>{english ? "This is the preserved source layer: original text excerpts, visuals and origin for verification. It is not Lumo's rewritten summary." : "这里保存采集时看到的原文片段、图片和出处，用来核对原貌、追溯证据；它不是 Lumo 重新总结后的资料卡。"}</p>
        </div>
        <div className="snapshot-head-actions">
          <Button onClick={async () => { try { await navigator.clipboard.writeText(source.url); notify(english ? "Link copied" : "链接已复制"); } catch { notify("复制失败"); } }}>
            <Copy size={14} /> {english ? "Copy link" : "复制链接"}
          </Button>
          <a className="button" href={source.url} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> {english ? "Open source" : "打开原文"}
          </a>
        </div>
      </div>
      <div className="snapshot-layout">
        <div className="snapshot-visual">
          <img src={previewImage} alt={english ? `${source.title} saved source snapshot` : `${source.title} 的留存快照`} />
          <span>{safeHost(source.url)}</span>
        </div>
        <div className="snapshot-text">
          <strong>{source.title}</strong>
          {source.content.map((paragraph, index) => (
            <p key={`${source.id}-snapshot-${index}`}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function NoteModal({ paragraph, onClose, onSave }: { paragraph: string; onClose: () => void; onSave: (content: string) => void }) {
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const [content, setContent] = useState(english
    ? `Worth keeping because: ${paragraph.slice(0, 80)}${paragraph.length > 80 ? "..." : ""}`
    : `这段值得保留，因为：${paragraph.slice(0, 80)}${paragraph.length > 80 ? "..." : ""}`
  );
  return (
    <Modal title={english ? "Add Note" : "添加段落笔记"} onClose={onClose}>
      <form className="form" onSubmit={(event) => { event.preventDefault(); onSave(content); }}>
        <div className="quoted-paragraph">{paragraph}</div>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} />
        <Button type="submit" variant="primary">{english ? "Save note" : "保存笔记"}</Button>
      </form>
    </Modal>
  );
}

function AskLumoModal({ paragraph, sourceTitle, sourceUrl, onClose }: { paragraph: string; sourceTitle: string; sourceUrl: string; onClose: () => void }) {
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const recommendation = paragraph.includes("出处：")
    ? (english ? "This paragraph is mainly a source citation. Keep it as evidence origin — don't abstract it into a claim." : "这段主要承担出处说明作用，适合保留为证据来源，不建议抽象成观点。")
    : paragraph.includes("Lumo 可抽取的 Evidence")
      ? (english ? "This paragraph is close to evidence. Create evidence first, then cite the original link in your output doc." : "这段已经接近证据，应优先创建证据，并在成果文档里引用原始链接。")
      : paragraph.includes("Lumo 可抽取的 Claim") || paragraph.includes("Lumo 可抽取的 Insight")
        ? (english ? "This paragraph contains a judgement — create a claim, then support it with adjacent paragraphs or the source link." : "这段已经包含判断，适合创建观点，再用相邻段落或来源链接补证据。")
        : (english ? "Highlight this paragraph first. If it expresses a judgement, create a claim. If it provides facts or citations, create evidence." : "这段可以先高亮；如果它表达判断，就创建观点，如果它提供事实、出处或原文描述，就创建证据。");
  return (
    <Modal title={english ? "Ask Lumo" : "问 Lumo"} onClose={onClose}>
      <div className="ask-lumo">
        <div className="quoted-paragraph">{paragraph}</div>
        <div className="answer-box">
          <strong>{english ? "Recommendation for this paragraph" : "基于当前段落的建议"}</strong>
          <p>{recommendation}</p>
          <p>{english ? "Source: " : "来源资料："}{sourceTitle}</p>
          <a href={sourceUrl} target="_blank" rel="noreferrer">{english ? "Open original source" : "打开原始出处"}</a>
        </div>
      </div>
    </Modal>
  );
}

function ListenSourceModal({ source, onClose }: { source: Source; onClose: () => void }) {
  const notify = useAppStore((s) => s.notify);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const script = [
    english ? `Listening to a Lumo briefing for: ${source.title}.` : `你正在收听 ${source.title} 的 Lumo 简报。`,
    source.summary,
    english ? "Key points:" : "关键点：",
    ...source.keyPoints.map((point, index) => `${index + 1}. ${point}`),
    (english ? "Original source: " : "原始出处：") + source.url,
  ].join("\n");
  return (
    <Modal title={english ? "Listen to Briefing" : "收听资料简报"} onClose={onClose}>
      <div className="listen-panel">
        <audio src="/media/lumo-briefing.wav" controls />
        <div className="answer-box">
          <strong>{english ? "Briefing script" : "简报脚本"}</strong>
          <p>{script}</p>
        </div>
        <div className="actions">
          <Button onClick={() => { void navigator.clipboard.writeText(script); notify(english ? "Script copied" : "简报脚本已复制"); }}><Copy size={15} /> {english ? "Copy script" : "复制脚本"}</Button>
          <Button onClick={() => downloadTextFile(`${safeFilename(source.title)}-briefing.txt`, script)}><Download size={15} /> {english ? "Download" : "下载脚本"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ShareSourceModal({ source, onClose }: { source: Source; onClose: () => void }) {
  const notify = useAppStore((s) => s.notify);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const shareText = [
    english ? `I organized this source in Lumo: ${source.title}` : `我在 Lumo 里整理了这条资料：${source.title}`,
    (english ? "Original link: " : "原始链接：") + source.url,
    "",
    (english ? "Summary: " : "摘要：") + source.summary,
    "",
    english ? "Key points:" : "关键点：",
    ...source.keyPoints.map((point) => `- ${point}`),
  ].join("\n");
  const copy = async (content: string, message: string) => { await navigator.clipboard.writeText(content); notify(message); };
  const publishCommunityPost = useAppStore((s) => s.publishCommunityPost);
  return (
    <Modal title={english ? "Share Source" : "分享资料"} onClose={onClose}>
      <div className="share-panel">
        <div className="quoted-paragraph">{shareText}</div>
        <SocialShareGrid title={source.title} content={source.summary} url={source.url} onPublishHome={() => publishCommunityPost({ title: source.title, content: source.summary, sourceId: source.id, tags: source.tags, visibility: "public" })} />
        <div className="actions">
          <Button onClick={() => copy(source.url, english ? "Link copied" : "原始链接已复制")}><Link2 size={15} /> {english ? "Copy link" : "复制链接"}</Button>
          <Button onClick={() => copy(shareText, english ? "Share text copied" : "分享文案已复制")}><Copy size={15} /> {english ? "Copy text" : "复制分享文案"}</Button>
          <Button onClick={() => downloadTextFile(`${safeFilename(source.title)}-share.md`, shareText, "text/markdown;charset=utf-8")}><Download size={15} /> {english ? "Download card" : "下载分享卡片"}</Button>
          <Button onClick={() => window.open(source.url, "_blank", "noopener,noreferrer")}><ExternalLink size={15} /> {english ? "Open source" : "打开原网页"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ExportSourceModal({ source, onClose, onQuickExport }: { source: Source; onClose: () => void; onQuickExport: () => void }) {
  const notify = useAppStore((s) => s.notify);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const exportAndClose = async (message: string, action: () => void | Promise<void>) => {
    try { await action(); notify(message); onClose(); } catch { notify(english ? "Export failed, please retry" : "导出失败，请稍后重试"); }
  };
  return (
    <Modal title={english ? "Export Source" : "导出资料"} onClose={onClose}>
      <div className="export-panel">
        <p>{english ? "Choose export format. All formats include title, URL, summary, key points and content." : "选择导出格式。所有格式都会保留标题、原始链接、摘要、关键点和正文片段。"}</p>
        <div className="tool-actions export-format-grid">
          <Button variant="primary" onClick={() => void exportAndClose(english ? "Markdown downloaded" : "Markdown 已下载", onQuickExport)}><Download size={15} /> Markdown</Button>
          <Button onClick={() => void exportAndClose(english ? "JSON downloaded" : "JSON 已下载", () => downloadTextFile(`${safeFilename(source.title)}.json`, JSON.stringify(source, null, 2), "application/json;charset=utf-8"))}><Download size={15} /> JSON</Button>
          <Button onClick={() => void exportAndClose(english ? "Word downloaded" : "Word 已下载", () => exportSourceWord(source))}><Download size={15} /> Word</Button>
          <Button onClick={() => void exportAndClose(english ? "PDF downloaded" : "PDF 已下载", () => exportSourceVisual(source, "pdf"))}><Download size={15} /> PDF</Button>
          <Button onClick={() => void exportAndClose(english ? "SVG downloaded" : "SVG 已下载", () => exportSourceVisual(source, "svg"))}><Download size={15} /> SVG</Button>
          <Button onClick={() => void exportAndClose(english ? "PNG downloaded" : "PNG 已下载", () => exportSourceVisual(source, "png"))}><Download size={15} /> PNG</Button>
          <Button onClick={() => void exportAndClose(english ? "JPG downloaded" : "JPG 已下载", () => exportSourceVisual(source, "jpg"))}><Download size={15} /> JPG</Button>
          <Button onClick={() => void exportAndClose(english ? "TXT downloaded" : "纯文本已下载", () => downloadTextFile(`${safeFilename(source.title)}.txt`, sourceToPlainText(source)))}><Download size={15} /> TXT</Button>
          <Button onClick={() => void exportAndClose(english ? "Citation downloaded" : "引用文件已下载", () => downloadTextFile(`${safeFilename(source.title)}-citation.md`, `> ${source.summary}\n\n${english ? "Source" : "出处"}：[${source.title}](${source.url})`, "text/markdown;charset=utf-8"))}><Download size={15} /> {english ? "Citation" : "引用卡"}</Button>
        </div>
        <small>{english ? "PDF/PNG/JPG export as shareable visual reports. Word exports as an editable .doc." : "PDF/PNG/JPG 会导出为可分享的视觉报告，Word 会导出为可继续编辑的 .doc 文档。"}</small>
      </div>
    </Modal>
  );
}

function SourceReferenceBox({ source }: { source: { title: string; url: string; sourceReferences?: Array<{ label: string; url: string; note: string }> } }) {
  const refs = source.sourceReferences?.length
    ? source.sourceReferences
    : [{ label: source.title, url: source.url, note: "原始资料链接，Lumo 会在生成观点、证据和成果时保留出处。" }];
  return (
    <section className="source-reference-box">
      <div>
        <h3>资料出处</h3>
        <p>以下链接是本篇阅读材料的原始出处，生成观点和证据时会一并保留。</p>
      </div>
      <div className="reference-list">
        {refs.map((ref) => (
          <a key={ref.url} href={ref.url} target="_blank" rel="noreferrer">
            <Globe2 size={16} />
            <span><strong>{ref.label}</strong><small>{ref.note}</small></span>
            <ChevronRight size={16} />
          </a>
        ))}
      </div>
    </section>
  );
}

function ReaderMediaBlock({ source }: { source: Source }) {
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const visual = realSourceVisuals[source.id];
  const previewImage = source.snapshotImage ?? sourceThumb(source) ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeHost(source.url))}&sz=64`;
  const mediaTitle = english
    ? source.type === "video"
      ? "AI-extracted video context"
      : source.type === "audio"
        ? "AI-extracted audio context"
        : source.type === "image"
          ? "AI-extracted visual material"
          : "AI-extracted article material"
    : source.type === "video"
      ? "AI 提炼的视频资料"
      : source.type === "audio"
        ? "AI 提炼的音频 / 访谈资料"
        : source.type === "image"
          ? "AI 提炼的图片资料"
          : "AI 提炼的文章图文资料";
  const mediaDescription = english
    ? source.type === "video"
      ? "Lumo turns the source video into a reusable context card: cover, origin, topic tags and summary cues. It is a processed view, not the preserved source snapshot."
      : source.type === "audio"
        ? "Lumo extracts the interview/audio context into source, theme and reusable summary cues. The playable briefing still lives in Listen."
        : "Lumo turns the original material into a processed reading card: summary, topic tags, visual cues and reusable angles. Use the snapshot below when you need the source record."
    : source.type === "video"
      ? "Lumo 把原视频加工成可整理的资料卡：封面、出处、主题标签和摘要线索。它是提炼视图，不是原文快照。"
      : source.type === "audio"
        ? "Lumo 把音频 / 访谈加工成来源、主题和可复用摘要线索；真正的播放简报仍放在“收听”功能里。"
        : "Lumo 把原始资料加工成便于理解和复用的阅读卡：摘要、主题标签、配图线索和可转成观点的内容。需要核对原貌时看下方原文快照。";
  const roleItems = english
    ? [
        { title: "Processed by AI", detail: "Summary, themes and reusable angles." },
        { title: "For creation", detail: "Turn material into claims, notes and outputs faster." },
      ]
    : [
        { title: "AI 加工层", detail: "摘要、主题标签和可复用表达。" },
        { title: "用于整理创作", detail: "更快转成观点、笔记和成果。" },
      ];
  return (
    <section className={`reader-media matched-media type-${source.type}`}>
      <div className="matched-media-head">
        <div>
          <Badge tone={source.type === "video" ? "purple" : source.type === "audio" ? "green" : "blue"}>{english ? `${source.type} material` : sourceTypeLabel(source.type)}</Badge>
          <h3>{mediaTitle}</h3>
          <p>{mediaDescription}</p>
        </div>
        <a href={source.url} target="_blank" rel="noreferrer">{english ? "Open original" : "打开原始出处"} <ExternalLink size={14} /></a>
      </div>
      <div className="matched-media-layout">
        <div className="matched-media-visual">
          <img src={previewImage} alt={english ? `${source.title} extracted material` : `${source.title} 的提炼资料`} />
          {(source.type === "video" || source.type === "audio") && <span className="media-type-pill">{source.type === "video" ? <Video size={15} /> : <Volume2 size={15} />} {english ? "Source media" : "原站资料"}</span>}
        </div>
        <div className="matched-media-copy">
          <span>{visual?.label ?? safeHost(source.url)}</span>
          <strong>{source.title}</strong>
          <p>{source.summary}</p>
          <div className="material-role-grid">
            {roleItems.map((item) => (
              <span key={item.title}><strong>{item.title}</strong><small>{item.detail}</small></span>
            ))}
          </div>
          <div className="feedback-chips">
            {(visual?.feedback ?? source.relatedTopics.slice(0, 3)).map((item) => <em key={item}>{item}</em>)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Swipe Triage ────────────────────────────────────────
function SwipeTriageModal({ sources, onClose }: { sources: Source[]; onClose: () => void }) {
  const projects = useAppStore((s) => s.projects);
  const addSourceToProject = useAppStore((s) => s.addSourceToProject);
  const archiveSource = useAppStore((s) => s.archiveSource);
  const notify = useAppStore((s) => s.notify);
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id ?? "");
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef(0);
  const isDragging = useRef(false);

  const current = sources[index];
  const done = index >= sources.length;
  const swipeThreshold = 90;

  const advance = (dir: "left" | "right") => {
    setAnimDir(dir);
    setTimeout(() => {
      setAnimDir(null);
      setDrag(0);
      setIndex((i) => i + 1);
    }, 300);
  };

  const handleSkip = () => { advance("left"); };
  const handleKeep = () => {
    if (current && targetProjectId) {
      addSourceToProject(current.id, targetProjectId);
      notify(`已加入项目：${projects.find((p) => p.id === targetProjectId)?.name ?? ""}`);
    }
    advance("right");
  };

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setDrag(e.clientX - dragStart.current);
  };
  const onPointerUp = () => {
    isDragging.current = false;
    if (drag > swipeThreshold) handleKeep();
    else if (drag < -swipeThreshold) handleSkip();
    else setDrag(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleKeep();
      if (e.key === "ArrowLeft") handleSkip();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, targetProjectId]);

  const rotation = Math.min(12, Math.max(-12, drag / 12));
  const keepOpacity = Math.min(1, Math.max(0, drag / 80));
  const skipOpacity = Math.min(1, Math.max(0, -drag / 80));

  return (
    <div className="swipe-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="swipe-panel">
        <div className="swipe-header">
          <div>
            <h3>滑动筛选</h3>
            <p>右滑加入项目，左滑暂不需要</p>
          </div>
          <div className="swipe-project-select">
            <span>加入：</span>
            <select value={targetProjectId} onChange={(e) => setTargetProjectId(e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={onClose} type="button" className="swipe-close"><X size={18} /></button>
        </div>

        <div className="swipe-progress">
          <span>{index + 1} / {sources.length}</span>
          <div className="swipe-progress-bar"><span style={{ width: `${(index / sources.length) * 100}%` }} /></div>
        </div>

        {done ? (
          <div className="swipe-done">
            <CheckCircle2 size={48} />
            <strong>全部筛完了！</strong>
            <p>已从 {sources.length} 条资料中完成快速判断。</p>
            <button className="swipe-done-btn" type="button" onClick={onClose}>返回资料库</button>
          </div>
        ) : (
          <>
            <div className="swipe-card-area">
              {/* Next card (background) */}
              {sources[index + 1] && (
                <div className="swipe-card swipe-card-next">
                  <div className="swipe-card-img">
                    <img src={sources[index + 1].snapshotImage ?? sourceThumb(sources[index + 1]) ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeHost(sources[index + 1].url))}&sz=64`} alt="" />
                  </div>
                </div>
              )}
              {/* Current card */}
              <div
                ref={cardRef}
                className={`swipe-card swipe-card-current ${animDir ? `animate-${animDir}` : ""}`}
                style={{ transform: animDir ? undefined : `translateX(${drag}px) rotate(${rotation}deg)` }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                {/* Swipe indicators */}
                <div className="swipe-indicator skip" style={{ opacity: skipOpacity }}>
                  <X size={28} />暂不需要
                </div>
                <div className="swipe-indicator keep" style={{ opacity: keepOpacity }}>
                  <CheckCircle2 size={28} />加入项目
                </div>

                <div className="swipe-card-img">
                  <img src={current.snapshotImage ?? sourceThumb(current) ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeHost(current.url))}&sz=64`} alt={current.title} />
                  <span className="swipe-card-domain">{safeHost(current.url)}</span>
                </div>
                <div className="swipe-card-body">
                  <div className="swipe-card-tags">
                    <Badge tone="blue">{purposeLabel(current.purpose)}</Badge>
                    <Badge>{sourceTypeLabel(current.type)}</Badge>
                  </div>
                  <h4>{current.title}</h4>
                  <p>{current.summary}</p>
                  {current.keyPoints?.length > 0 && (
                    <ul className="swipe-key-points">
                      {current.keyPoints.slice(0, 3).map((pt) => <li key={pt}>{pt}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="swipe-actions">
              <button className="swipe-btn skip" type="button" onClick={handleSkip} title="← 暂不需要">
                <span className="swipe-btn-icon"><X size={20} /></span>
                <span className="swipe-btn-label">暂不需要</span>
              </button>
              <div className="swipe-actions-hint">
                <span>← 滑动 →</span>
              </div>
              <button className="swipe-btn keep" type="button" onClick={handleKeep} title="→ 加入项目">
                <span className="swipe-btn-icon"><CheckCircle2 size={20} /></span>
                <span className="swipe-btn-label">加入项目</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function JellySwitch({ options, value, onChange }: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 4, width: 60, ready: false });

  useEffect(() => {
    const idx = options.findIndex((o) => o.id === value);
    const btn = btnRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setPill({ left: bRect.left - cRect.left, width: bRect.width, ready: true });
  }, [value, options]);

  return (
    <div ref={containerRef} className="jelly-switch-v2">
      {pill.ready && (
        <span
          className="jelly-pill-v2"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((opt, i) => (
        <button
          key={opt.id}
          ref={(el) => { btnRefs.current[i] = el; }}
          className={value === opt.id ? "active" : ""}
          onClick={() => onChange(opt.id)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MiniList({ id, title, items }: { id?: string; title: string; items: string[] }) {
  return (
    <div id={id} className="mini-list">
      <h4>{title}</h4>
      {items.length
        ? items.slice(0, 4).map((item, i) => (
            <p key={item}><b className="mini-list-num">{i + 1}</b>{item}</p>
          ))
        : <span>暂无内容</span>}
    </div>
  );
}

function CtxSection({ id, title, color, items }: { id: string; title: string; color: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div id={id} className="ctx-section" style={{ "--ctx-color": color } as React.CSSProperties}>
      <div className="ctx-section-head">
        <span className="ctx-section-dot" />
        <strong>{title}</strong>
        <span className="ctx-section-count">{items.length}</span>
      </div>
      {items.slice(0, 3).map((text, i) => (
        <p key={i} className="ctx-section-item">
          <span className="ctx-section-num">{i + 1}</span>
          {text.slice(0, 80)}{text.length > 80 ? "…" : ""}
        </p>
      ))}
    </div>
  );
}

function ProjectsView() {
  const projects = useAppStore((s) => s.projects);
  const sources = useAppStore((s) => s.sources);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const language = useAppStore((s) => s.language);
  const notify = useAppStore((s) => s.notify);
  const english = isEn(language);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "size">("recent");

  const filteredProjects = useMemo(() => {
    let list = projects.filter(p => p.status !== "archived");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.goal?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q)));
    }
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "size") list = [...list].sort((a, b) => (b.sourceIds.length + b.claimIds.length) - (a.sourceIds.length + a.claimIds.length));
    return list;
  }, [projects, searchQuery, sortBy]);

  const selected = filteredProjects.find((item) => item.id === selectedProjectId) ?? projects.find(p => p.id === selectedProjectId) ?? projects[0];
  const { isPro } = usePlan();
  const FREE_PROJECT_LIMIT = 3;
  const canCreateProject = isPro || projects.length < FREE_PROJECT_LIMIT;
  return (
    <section className="projects-page">
      <div className="project-console">
        <div>
          <Badge tone="blue">{english ? "User Workspaces" : "用户项目空间"}</Badge>
          <h2>{english ? "Independent project spaces" : "创建并切换独立项目空间"}</h2>
          <p>{english ? "Each project keeps its own sources, claims, evidence, insights and deliverables." : "每个项目独立保存资料、观点、证据、洞察和成果。先选中一个项目，再把资料加入当前工作区。"}</p>
        </div>
        <Button variant="primary"
          onClick={() => canCreateProject ? setCreateOpen(true) : notify(`免费版最多 ${FREE_PROJECT_LIMIT} 个项目，升级 Pro 可无限新建`)}
          title={!canCreateProject ? `免费版限 ${FREE_PROJECT_LIMIT} 个项目，升级 Pro 解锁无限` : undefined}
        >
          <Plus size={16} /> {english ? "New Project" : "新建项目空间"}
          {!isPro && projects.length >= FREE_PROJECT_LIMIT - 1 && <ProBadge />}
        </Button>
      </div>

      {/* Search + sort bar */}
      {projects.length > 2 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <label style={{ display:"flex", alignItems:"center", gap:7, flex:1, background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"7px 12px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <Search size={14} color="#9ca3af" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={`搜索 ${projects.length} 个项目…`}
              style={{ border:"none", outline:"none", fontSize:13, color:"#111827", background:"transparent", flex:1 }} />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:0, display:"flex" }}>
                <X size={13} />
              </button>
            )}
          </label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding:"6px 28px 6px 12px", borderRadius:99,
              border:"1.5px solid rgba(196,181,253,0.5)",
              fontSize:12.5, fontWeight:600, color:"#6b7280",
              background:"linear-gradient(180deg,#ffffff 0%,#f5f3ff 100%)",
              cursor:"pointer", outline:"none", letterSpacing:"0.01em",
              boxShadow:"0 1px 4px rgba(99,102,241,0.08), inset 0 1px 0 #fff",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat:"no-repeat", backgroundPosition:"right 9px center",
              transition:"all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
            <option value="recent">最近</option>
            <option value="name">名称</option>
            <option value="size">资料数</option>
          </select>
          {searchQuery && (
            <span style={{ fontSize:12, color:"#9ca3af", flexShrink:0 }}>{filteredProjects.length} / {projects.length}</span>
          )}
        </div>
      )}

      <div className="project-switcher">
        {filteredProjects.length === 0 && searchQuery ? (
          <div style={{ padding:"24px 0", textAlign:"center", color:"#9ca3af", fontSize:13, gridColumn:"1/-1" }}>
            没有匹配「{searchQuery}」的项目
          </div>
        ) : filteredProjects.map((project) => {
          const unread = sources.filter(s => project.sourceIds.includes(s.id) && (s.status === "inbox" || s.status === "unread")).length;
          return (
          <div key={project.id} className="project-card-wrapper">
            {/* Main card */}
            <button
              className={`project-switcher-card ${selected?.id === project.id ? "active" : ""}`}
              onClick={() => setSelectedProject(project.id)}
              type="button"
            >
              <strong>{project.name}</strong>
              <span>{project.sourceIds.length} {english ? "sources" : "资料"} · {project.claimIds.length} {english ? "claims" : "观点"} · {project.insightIds.length} {english ? "insights" : "洞察"}</span>
              {unread > 0 && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:99, background:"#fee2e2", color:"#dc2626", fontWeight:700, marginTop:4, alignSelf:"flex-start" }}>{unread} 未读</span>}
            </button>
            {/* Trash icon — top-right, visible on hover */}
            <button type="button" className="project-card-del-btn"
              onClick={e => { e.stopPropagation(); setConfirmDeleteId(project.id); }}
              title="删除项目">
              <Trash2 size={12} />
            </button>
          </div>
          );
        })}
      </div>
      {selected && (
        <div className="project-workspace-bar">
          <span className="project-workspace-name"><Box size={14} />{selected.name}</span>
        </div>
      )}
      {selected ? <ProjectWorkspace projectId={selected.id} /> : <EmptyProjectState language={language} />}
      {createOpen && <CreateProjectModal onClose={() => setCreateOpen(false)} />}

      {/* ── Delete project confirmation modal ──────────────────── */}
      {confirmDeleteId && (() => {
        const target = projects.find(p => p.id === confirmDeleteId);
        if (!target) return null;
        return (
          <div style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(10,8,20,0.6)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}
            onClick={() => setConfirmDeleteId(undefined)}>
            <div style={{ background:"#fff", borderRadius:24, width:"min(420px,92vw)", boxShadow:"0 40px 100px rgba(0,0,0,0.28)", overflow:"hidden" }}
              onClick={e => e.stopPropagation()}>
              {/* Icon header */}
              <div style={{ background:"linear-gradient(135deg,#fff5f5,#fff1f2)", padding:"32px 28px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#fecaca,#fca5a5)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(239,68,68,0.28)" }}>
                  <Trash2 size={26} color="#dc2626" />
                </div>
                <div style={{ textAlign:"center" }}>
                  <h3 style={{ margin:"0 0 4px", fontSize:18, fontWeight:800, color:"#111827" }}>删除项目</h3>
                  <p style={{ margin:0, fontSize:13, color:"#6b7280" }}>此操作不可撤销</p>
                </div>
              </div>

              {/* Project info */}
              <div style={{ padding:"16px 28px", borderTop:"1px solid #fef2f2", borderBottom:"1px solid #f3f4f6", background:"#fafafa" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:6 }}>「{target.name}」</div>
                <div style={{ display:"flex", gap:16, fontSize:12, color:"#9ca3af" }}>
                  <span>{target.sourceIds.length} 资料</span>
                  <span>{target.claimIds.length} 观点</span>
                  <span>{target.evidenceIds.length} 证据</span>
                  <span>{target.insightIds.length} 洞察</span>
                </div>
                <p style={{ margin:"10px 0 0", fontSize:12.5, color:"#ef4444", lineHeight:1.6 }}>
                  删除后，项目空间及所有关联的观点、证据、洞察将被移除。资料本体仍保留在资料库中。
                </p>
              </div>

              {/* Actions */}
              <div style={{ padding:"20px 28px", display:"flex", gap:10 }}>
                <button type="button"
                  onClick={() => setConfirmDeleteId(undefined)}
                  style={{ flex:1, padding:"11px", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#f9fafb", color:"#374151", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                  取消
                </button>
                <button type="button"
                  onClick={() => { deleteProject(confirmDeleteId); setConfirmDeleteId(undefined); }}
                  style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(239,68,68,0.35)" }}>
                  确认删除
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const createProject = useAppStore((s) => s.createProject);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const [name, setName] = useState(english ? "Product launch research" : "我的产品研究项目");
  const [goal, setGoal] = useState(english ? "Collect evidence, compare options, and produce a decision-ready brief." : "收集证据、比较方案，并输出可以决策的研究结论。");
  const [questions, setQuestions] = useState(english ? "What problem are we solving?\nWhich sources are trustworthy?\nWhat should we ship first?" : "这个项目要解决什么问题？\n哪些资料可以作为可信证据？\n最终要输出什么成果？");
  const [tags, setTags] = useState(english ? "research, product, workspace" : "研究, 产品, 工作区");
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createProject({
      name,
      goal,
      description: english ? "A user-created independent Lumo project workspace." : "用户创建的独立 Lumo 项目空间。",
      keyQuestions: questions.split("\n"),
      tags: tags.split(/[，,]/),
    });
    onClose();
  };
  return (
    <Modal title={english ? "Create Project Workspace" : "新建项目空间"} onClose={onClose}>
      <form className="project-create-form" onSubmit={handleSubmit}>
        <label>
          <span>{english ? "Project name" : "项目名称"}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={english ? "e.g. Market research for Lumo Pro" : "例如：Lumo Pro 商业化调研"} autoFocus />
        </label>
        <label>
          <span>{english ? "Goal" : "项目目标"}</span>
          <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={3} placeholder={english ? "What decision should this workspace support?" : "这个项目空间要帮助你做出什么决策？"} />
        </label>
        <label>
          <span>{english ? "Key questions" : "关键问题"}</span>
          <textarea value={questions} onChange={(event) => setQuestions(event.target.value)} rows={4} placeholder={english ? "One question per line" : "每行一个问题"} />
        </label>
        <label>
          <span>{english ? "Tags" : "标签"}</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={english ? "research, product" : "研究, 产品"} />
        </label>
        <div className="project-create-actions">
          <Button variant="ghost" onClick={onClose}>{english ? "Cancel" : "取消"}</Button>
          <Button variant="primary" type="submit"><Plus size={16} /> {english ? "Create" : "创建项目"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EmptyProjectState({ language }: { language: AppLanguage }) {
  const english = isEn(language);
  return (
    <div className="panel empty-project-state">
      <Badge tone="yellow">{english ? "Empty Workspace" : "空项目空间"}</Badge>
      <h3>{english ? "Create a project, then add sources to it." : "先创建项目，再把资料加入这里。"}</h3>
      <p>{english ? "Use the New Project button above. After selecting a project, go to the library and click Add to project on any source." : "点击上方“新建项目空间”。选中项目后，到资料库点击资料卡片上的“入项目”，内容会进入当前项目而不是 demo。"}</p>
    </div>
  );
}

// ── Agent Panel ───────────────────────────────────────────
// Extracted to src/components/AgentPanel.tsx

function ProjectWorkspace({ projectId }: { projectId: string }) {
  const project = useAppStore((s) => s.projects.find((item) => item.id === projectId));
  const language = useAppStore((s) => s.language);
  const allSources = useAppStore((s) => s.sources);
  const allClaims = useAppStore((s) => s.claims);
  const allEvidence = useAppStore((s) => s.evidence);
  const allInsights = useAppStore((s) => s.insights);
  const allDeliverables = useAppStore((s) => s.deliverables);
  const allNotes = useAppStore((s) => s.notes);
  const sources = useMemo(() => allSources.filter((item) => project?.sourceIds.includes(item.id)), [allSources, project]);
  const claims = useMemo(() => allClaims.filter((item) => project?.claimIds.includes(item.id) || item.projectId === projectId), [allClaims, project, projectId]);
  const evidence = useMemo(() => allEvidence.filter((item) => project?.evidenceIds.includes(item.id) || item.projectId === projectId), [allEvidence, project, projectId]);
  const insights = useMemo(() => allInsights.filter((item) => project?.insightIds.includes(item.id) || item.projectId === projectId), [allInsights, project, projectId]);
  const deliverables = useMemo(() => allDeliverables.filter((item) => project?.deliverableIds.includes(item.id) || item.projectId === projectId), [allDeliverables, project, projectId]);
  const notes = useMemo(() => allNotes.filter((note) => sources.some((source) => source.id === note.sourceId)), [allNotes, sources]);
  const generateInsightsForProject = useAppStore((s) => s.generateInsightsForProject);
  const generateDeliverable = useAppStore((s) => s.generateDeliverable);
  const appendToDeliverable = useAppStore((s) => s.appendToDeliverable);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const notify = useAppStore((s) => s.notify);
  const addManualCheckpoint = useAppStore((s) => s.addManualCheckpoint);
  const rollbackToCheckpoint = useAppStore((s) => s.rollbackToCheckpoint);
  const timelineRaw = useAppStore((s) => s.projectTimeline[projectId]);
  const timeline = useMemo(() => timelineRaw ?? [], [timelineRaw]);
  const [tab, setTab] = useState("graph");
  const [checkpointNote, setCheckpointNote] = useState("");
  const [addingCheckpoint, setAddingCheckpoint] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<NonNullable<import("./types").TimelineEntry["snapshot"]> | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  // Each undo snapshot captures the project state BEFORE a rollback so "撤回" can restore it
  const [undoSnapshots, setUndoSnapshots] = useState<Array<NonNullable<import("./types").TimelineEntry["snapshot"]>>>([]);
  const inspirations = useAppStore((s) => s.inspirations);
  const [editInspirationId, setEditInspirationId] = useState<string | null>(null);
  const [inspirationEditorOpen, setInspirationEditorOpen] = useState(false);
  // Derived timeline: merge store entries + project data
  const derivedTimeline = useMemo(() => {
    const entries: Array<{ id:string; type:string; title:string; description:string; timestamp:string; snapshot?:{ sourceCount:number; claimCount:number; evidenceCount:number; insightCount:number }; userNote?:string }> = [];
    sources.forEach(s => entries.push({ id:`src-${s.id}`, type:"source_added", title:"加入资料", description:`《${s.title}》`, timestamp: s.savedAt ?? new Date().toISOString() }));
    allClaims.filter(c => c.projectId === projectId).forEach(c => entries.push({ id:`cl-${c.id}`, type:"claim_extracted", title:"提炼观点", description:c.text.slice(0,60)+(c.text.length>60?"…":""), timestamp:c.createdAt }));
    allEvidence.filter(e => e.projectId === projectId).forEach(e => entries.push({ id:`ev-${e.id}`, type:"evidence_added", title:"保存证据", description:e.text.slice(0,60)+(e.text.length>60?"…":""), timestamp:e.createdAt }));
    allInsights.filter(i => i.projectId === projectId).forEach(i => entries.push({ id:`in-${i.id}`, type:"insight_generated", title:"一键洞察", description:i.title, timestamp: new Date().toISOString() }));
    allDeliverables.filter(d => d.projectId === projectId).forEach(d => entries.push({ id:`del-${d.id}`, type:"deliverable_created", title:"生成成果文档", description:d.title, timestamp:d.createdAt }));
    timeline.forEach(t => entries.push(t));
    return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [sources, allClaims, allEvidence, allInsights, allDeliverables, timeline, projectId, project]);
  const english = isEn(language);
  const tabLabels = english
    ? [["overview", "Overview"], ["graph", "Knowledge Graph"], ["sources", "Sources"], ["claims", "Claims"], ["evidence", "Evidence"], ["insights", "Insights"], ["matrix", "Charts & Tables"], ["inspiration", "Inspiration"], ["timeline", "Timeline"]]
    : [["overview", "概览"], ["graph", "知识图谱"], ["sources", "资料"], ["claims", "观点"], ["evidence", "证据"], ["insights", "洞察"], ["matrix", "图表"], ["inspiration", "灵感"], ["timeline", "时间线"]];
  const statsLabels = english ? ["Sources", "Claims", "Evidence", "Insights", "Deliverables"] : ["资料", "观点", "证据", "洞察", "成果"];
  const isEmptyProject = sources.length === 0 && claims.length === 0 && evidence.length === 0 && insights.length === 0 && deliverables.length === 0;
  if (!project) return null;
  const [agentOpen, setAgentOpen] = useState(false);

  return (
    <div className={`panel project-workspace ${tab === "graph" ? "graph-mode" : ""}`}>
      <div className="section-head">
        <div><h2>{project.name}</h2><p>{project.goal}</p></div>
        <div className="project-head-actions">
          <div className="btn-tooltip-wrap">
            <Button onClick={() => generateInsightsForProject(project.id)}><Brain size={16} /> {english ? "Insights" : "一键洞察"}</Button>
            <div className="btn-tooltip">
              <strong>一键洞察 — 做"二阶提炼"</strong>
              <p>当你积累了多条观点后，AI 跨资料综合找规律。比如：</p>
              <p><em>"这批产品都在用社交压力驱动留存，而不是功能价值"</em></p>
              <p>单条资料给不了你的结论，需要综合才能看到。建议观点 5 条以上再用。</p>
            </div>
          </div>
          {claims.length > 0 && (
            <div className="btn-tooltip-wrap">
              <Button
                variant="primary"
                onClick={() => { generateDeliverable("research_brief", project.id); setTab("deliverables"); }}
              >
                <Sparkles size={16} /> {english ? "Quick Draft" : "一键整理成果"}
              </Button>
              <div className="btn-tooltip btn-tooltip-right">
                <strong>一键整理成果 — "输出打包"</strong>
                <p>研究结束后，让 AI 写一份完整的研究简报/竞品分析/PRD。</p>
                <p>格式清晰，可以直接发给老板或粘贴进文档。</p>
                <p style={{ marginTop:8, color:"#a78bfa", fontSize:11 }}>💡 先一键洞察再用效果更好</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {isEmptyProject && <div className="project-empty-guide">
        <Badge tone="yellow">{english ? "Independent Space Created" : "独立空间已创建"}</Badge>
        <strong>{english ? "No project content yet" : "这里还没有项目内容"}</strong>
        <p>{english ? "Go to Library, choose a source, and click Project. Lumo will add it to the currently selected project so highlights, claims, evidence, insights, and outputs stay isolated here." : "到资料库选择资料并点击“入项目”，Lumo 会把资料加入当前选中的项目。之后高亮、观点、证据、洞察和成果都会在这个项目下独立沉淀。"}</p>
      </div>}
      {tab !== "graph" && (() => {
        const readCount = sources.filter(s => s.status === "read" || s.status === "archived").length;
        const unreadCount = sources.filter(s => s.status === "inbox" || s.status === "unread").length;
        const hlCount = sources.reduce((n, s) => n + (s.highlightIds?.length ?? 0), 0);
        const statItems = english
          ? [["Sources", sources.length], ["Read", readCount], ["Unread", unreadCount], ["Highlights", hlCount], ["Claims", claims.length], ["Evidence", evidence.length], ["Insights", insights.length], ["Outputs", deliverables.length]]
          : [["资料", sources.length], ["已读", readCount], ["未读", unreadCount], ["高亮", hlCount], ["观点", claims.length], ["证据", evidence.length], ["洞察", insights.length], ["成果", deliverables.length]];
        return (
          <div className="stats compact">
            {statItems.map(([label, value]) => (
              <div className="stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        );
      })()}
      <div className="tabs">{tabLabels.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
      {tab === "overview" && <div className="overview-grid"><MiniList title={english ? "Key Questions" : "关键问题"} items={project.keyQuestions} /><MiniList title={english ? "Core Sources" : "核心资料"} items={sources.map((s) => s.title)} /><MiniList title={english ? "Key Claims" : "关键观点"} items={claims.map((c) => c.text)} /><MiniList title={english ? "Key Evidence" : "关键证据"} items={evidence.map((e) => e.text)} /><MiniList title={english ? "Key Insights" : "关键洞察"} items={insights.map((i) => i.title)} /><MiniList title={english ? "Next Steps" : "下一步建议"} items={english ? ["Generate a PRD", "Validate high-confidence claims", "Export the evidence list"] : ["生成 PRD", "验证高置信观点", "导出证据列表"]} /></div>}
      {tab === "graph" && <OntologyMap project={project} sources={sources} notes={notes} claims={claims} evidence={evidence} insights={insights} deliverables={deliverables} language={language} />}
      {tab === "sources" && <SourceList sources={sources.map((source) => source.id)} />}
      {tab === "claims" && (
        <div style={{ padding:"0 0 16px" }}>
          <div className="claims-card-grid">
            {claims.map(item => {
              const src = sources.find(s => s.id === item.sourceId);
              const claimBg = item.confidence === "high" ? "var(--card-bg-high)" : item.confidence === "medium" ? "var(--card-bg-medium)" : "var(--card-bg-low)";
              const claimBorder = item.confidence === "high" ? "var(--card-border-high)" : item.confidence === "medium" ? "var(--card-border-medium)" : "var(--card-border-low)";
              const confLabel = (k: string) => ({ high:"高置信", medium:"中置信", low:"低置信" }[k] ?? k);
              return (
                <article key={item.id} className="claim-card"
                  style={{ borderLeft:`3px solid ${claimBorder}`, background:claimBg }}>
                  <div className="claim-card-top">
                    <ConfidenceBadge confidence={item.confidence} />
                    {item.tags?.includes("agent") && <span className="agent-generated-badge" style={{ fontSize:10 }}><Sparkles size={8} /> Agent</span>}
                  </div>
                  <p className="claim-card-text">{item.text}</p>
                  {src && <p className="claim-card-source">《{src.title.slice(0,28)}{src.title.length>28?"…":""}》</p>}
                  <p className="claim-card-meta">{formatDate(item.createdAt)}</p>
                  <div className="claim-card-actions">
                    <button type="button" onClick={() => { appendToDeliverable(projectId, "💡 观点", item.text, sources.find(s=>s.id===item.sourceId)?.title); setActiveView("deliverables"); }}>加入成果</button>
                    <button type="button" onClick={() => notify("已转为洞察候选")}>转为洞察</button>
                    <AddToGraphBtn projectId={item.projectId} />
                  </div>
                </article>
              );
            })}
          </div>
          {claims.length === 0 && <p style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"32px 0" }}>暂无观点 — 在阅读器提炼或用 Lumo Agent 快读</p>}
        </div>
      )}
      {tab === "evidence" && (
        <div style={{ padding:"0 0 16px" }}>
          <div className="claims-card-grid">
            {evidence.map(item => (
              <article key={item.id} className="claim-card"
                style={{ borderLeft:"3px solid var(--card-border-evidence)", background:"var(--card-bg-evidence)" }}>
                <div className="claim-card-top">
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, background:"#dcfce7", color:"#166534", fontWeight:700, display:"inline-flex", alignItems:"center", gap:3 }}>
                    <ShieldCheck size={9} /> 证据
                  </span>
                  <span className="ev-type-tag" data-tooltip={EVIDENCE_TYPE_TIPS[item.type] ?? item.type}>{item.type}</span>
                  {(item as { tagIds?: string[] }).tagIds?.includes("agent") && <span className="agent-generated-badge" style={{ fontSize:10 }}><Sparkles size={8} /> Agent</span>}
                </div>
                <p className="claim-card-text">{item.text}</p>
                <p className="claim-card-source">{item.sourceTitle}</p>
                <p className="claim-card-meta">{formatDate(item.createdAt)}</p>
                <div className="claim-card-actions">
                  <button type="button" onClick={() => { void navigator.clipboard.writeText(`${item.text}\n出处：${item.originalUrl}`); notify("引用已复制"); }}>复制引用</button>
                  <button type="button" onClick={() => notify("已关联观点")}>关联观点</button>
                  <AddToGraphBtn projectId={item.projectId} />
                </div>
              </article>
            ))}
          </div>
          {evidence.length === 0 && <p style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"32px 0" }}>暂无证据 — 在阅读器高亮段落后转为证据</p>}
        </div>
      )}
      {tab === "insights" && (() => {
        const updateInsight = useAppStore.getState().updateInsight;
        // Format snake_case type to readable label
        const fmtType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const priorityCfg = {
          high:   { label:"High",   bg:"#fef2f2", color:"#dc2626", border:"rgba(239,68,68,0.22)" },
          medium: { label:"Medium", bg:"#fffbeb", color:"#d97706", border:"rgba(245,158,11,0.22)" },
          low:    { label:"Low",    bg:"#f8fafc", color:"#64748b", border:"rgba(100,116,139,0.2)" },
        };

        const InsightCard = ({ item }: { item: typeof insights[0] }) => {
          const [expanded, setExpanded] = useState(false);
          const [editing, setEditing] = useState(false);
          const [editTitle, setEditTitle] = useState(item.title);
          const [editContent, setEditContent] = useState(item.content);
          const saveEdit = () => { updateInsight(item.id, { title: editTitle.trim() || item.title, content: editContent.trim() || item.content }); setEditing(false); };
          const pc = priorityCfg[item.priority as keyof typeof priorityCfg] ?? priorityCfg.low;
          return (
            <article className="insight-card-v2">
              {/* Tag row */}
              <div className="insight-tag-row">
                <span className="insight-type-tag">{fmtType(item.type)}</span>
                <span className="insight-priority-tag" style={{ background: pc.bg, color: pc.color, borderColor: pc.border }}>
                  {pc.label}
                </span>
                <button type="button" className="insight-edit-btn"
                  onClick={() => { setEditing(e => !e); setEditTitle(item.title); setEditContent(item.content); }}>
                  <PenLine size={9} /> {editing ? "取消" : "编辑"}
                </button>
              </div>

              {/* Body */}
              {editing ? (
                <div className="insight-edit-form">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="insight-edit-input" placeholder="洞察标题" />
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} className="insight-edit-textarea" />
                  <div style={{ display:"flex", gap:6 }}>
                    <button type="button" onClick={saveEdit} className="insight-save-btn">保存</button>
                    <button type="button" onClick={() => setEditing(false)} className="insight-cancel-btn">取消</button>
                  </div>
                </div>
              ) : (
                <div className="insight-body">
                  <p className="insight-title">{item.title}</p>
                  <p className="insight-content" style={{ WebkitLineClamp: expanded ? undefined : 3, overflow: expanded ? "visible" : "hidden" }}>
                    {item.content}
                  </p>
                  {item.content.length > 120 && (
                    <button type="button" className="insight-expand-btn" onClick={() => setExpanded(!expanded)}>
                      {expanded ? "收起" : "展开全部"}
                    </button>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="insight-footer">
                <span className="insight-meta">{item.claimIds.length} 条观点 · {item.evidenceIds.length} 条证据</span>
                <div className="insight-actions">
                  <button type="button" onClick={() => { appendToDeliverable(projectId, "🔮 洞察", `${item.title}\n${item.content}`); setActiveView("deliverables"); }}>加入成果</button>
                  <AddToGraphBtn projectId={item.projectId} />
                </div>
              </div>
            </article>
          );
        };
        return (
          <div style={{ padding:"0 0 16px" }}>
            <div className="claims-card-grid">
              {insights.map(item => <InsightCard key={item.id} item={item} />)}
            </div>
            {insights.length === 0 && <p style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"32px 0" }}>暂无洞察 — 点击「一键洞察」自动综合观点</p>}
          </div>
        );
      })()}
      {tab === "deliverables" && (
        <div className="deliverables-inline-list">
          {deliverables.map((item) => (
            <div key={item.id} className="deliverable-inline-card">
              <div className="deliverable-inline-head">
                <span style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:99, background:'#ede9fe', color:'#6d28d9', fontSize:11, fontWeight:700 }}>{deliverableIcon(item.type)}{deliverableLabel(item.type)}</span>
                    <DeliverableOriginBadge origin={item.origin} />
                <strong>{item.title}</strong>
              </div>
              <RichDocument content={item.content} />
            </div>
          ))}
        </div>
      )}
      {tab === "matrix" && (() => {
        // Collect all images from project sources: snapshot + og:image
        const sourceImages = sources.flatMap(s => {
          const imgs: { src: string; title: string; url: string; host: string }[] = [];
          if (s.snapshotImage) imgs.push({ src: s.snapshotImage, title: s.title, url: s.url, host: safeHost(s.url) });
          return imgs;
        });

        return (
          <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

            {/* Image gallery from source articles */}
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                <FileText size={14} color="#6366f1" />
                原文图片 ({sourceImages.length} 张)
                <span style={{ fontSize:11, color:"#9ca3af", fontWeight:400, marginLeft:4 }}>来自各项目资料的截图与配图</span>
              </div>
              {sourceImages.length === 0 ? (
                <div style={{ padding:"32px 0", textAlign:"center", color:"#9ca3af", fontSize:13, background:"#f8fafc", borderRadius:14, border:"1px dashed #e5e7eb" }}>
                  暂无原文图片 — 用 Chrome 插件采集资料时会自动截图保存
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
                  {sourceImages.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noreferrer"
                      style={{ borderRadius:14, overflow:"hidden", border:"1px solid #e5e7eb", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", textDecoration:"none", display:"block", transition:"transform 0.15s, box-shadow 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow="0 6px 20px rgba(0,0,0,0.1)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform="none"; (e.currentTarget as HTMLAnchorElement).style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"; }}>
                      <div style={{ aspectRatio:"16/9", overflow:"hidden", background:"#f3f4f6" }}>
                        <img src={img.src} alt={img.title}
                          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                          onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.background="#f3f4f6"; (e.target as HTMLImageElement).style.display="none"; }} />
                      </div>
                      <div style={{ padding:"10px 12px" }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#1f2937", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.4 }}>{img.title}</div>
                        <div style={{ fontSize:10, color:"#9ca3af", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                          <Globe2 size={9} />{img.host}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Competitive matrix table */}
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                <BarChart2 size={14} color="#6366f1" />
                竞品对比表
              </div>
              <Matrix />
            </div>
          </div>
        );
      })()}
      {tab === "inspiration" && (() => {
        const projectInspirations = inspirations;
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>
                灵感笔记 <span style={{ fontSize:11, fontWeight:400, color:"#9ca3af", marginLeft:6 }}>{projectInspirations.length} 条</span>
              </div>
              <button type="button" onClick={() => { setEditInspirationId(null); setInspirationEditorOpen(true); }}
                style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#111827", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <PenLine size={12} /> 新建灵感
              </button>
            </div>
            {projectInspirations.length === 0 ? (
              <div style={{ padding:"40px 0", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
                <PenLine size={28} style={{ opacity:0.3, margin:"0 auto 12px", display:"block" }} />
                <div>在这里记录研究过程中的灵感和想法</div>
                <div style={{ fontSize:12, marginTop:4 }}>支持图片、视频、富文本格式</div>
              </div>
            ) : (
              <div className="claims-card-grid">
                {projectInspirations.map(item => (
                  <article key={item.id} style={{ background:"#fff", border:"1px solid #e5e7eb", borderTop:"3px solid #8b5cf6", borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", flexDirection:"column", gap:8, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}
                    onClick={() => { setEditInspirationId(item.id); setInspirationEditorOpen(true); }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, padding:"1px 7px", borderRadius:99, background:"#f5f3ff", color:"#6d28d9", fontWeight:700 }}>灵感</span>
                      <span style={{ fontSize:11, color:"#9ca3af", marginLeft:"auto" }}>{formatDate(item.updatedAt)}</span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{item.title}</div>
                    <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.5 }}>{item.content.replace(/<[^>]*>/g," ").slice(0,100)}</div>
                    <div style={{ display:"flex", gap:6, marginTop:2 }}>
                      <button type="button" onClick={e => { e.stopPropagation(); setEditInspirationId(item.id); setInspirationEditorOpen(true); }}
                        style={{ padding:"3px 10px", borderRadius:7, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:11, cursor:"pointer" }}>编辑</button>
                      <button type="button" onClick={e => { e.stopPropagation(); useAppStore.getState().deleteInspiration(item.id); }}
                        style={{ padding:"3px 10px", borderRadius:7, border:"1px solid #fee2e2", background:"#fff", color:"#dc2626", fontSize:11, cursor:"pointer" }}>删除</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      })()}
      {tab === "timeline" && (() => {
        const TYPE_CFG: Record<string, { color:string; label:string }> = {
          source_added:        { color:"#6366f1", label:"资料" },
          claim_extracted:     { color:"#d97706", label:"观点" },
          evidence_added:      { color:"#16a34a", label:"证据" },
          insight_generated:   { color:"#7c3aed", label:"洞察" },
          deliverable_created: { color:"#2563eb", label:"成果" },
          agent_run:           { color:"#6366f1", label:"Agent" },
          manual_checkpoint:   { color:"#111827", label:"断点" },
        };

        // ── Rollback helpers ──────────────────────────────────────────────────

        // Snapshot of current project state (for undo)
        const captureCurrentSnapshot = (): NonNullable<import("./types").TimelineEntry["snapshot"]> => ({
          sourceCount: sources.length, claimCount: claims.length,
          evidenceCount: evidence.length, insightCount: insights.length,
          sourceIds: sources.map(s => s.id), claimIds: claims.map(c => c.id),
          evidenceIds: evidence.map(e => e.id), insightIds: insights.map(i => i.id),
        });

        // Compute what the project state should be at timeline index `targetIdx`.
        // derivedTimeline[0] = newest, derivedTimeline[N-1] = oldest.
        // Rollback to targetIdx = keep entries at targetIdx..N-1, remove 0..targetIdx-1.
        const computeSnapshotAt = (targetIdx: number): NonNullable<import("./types").TimelineEntry["snapshot"]> => {
          // Use stored snapshot for manual_checkpoint entries when available
          const entry = derivedTimeline[targetIdx];
          if (entry?.snapshot && 'sourceIds' in entry.snapshot) {
            return entry.snapshot as NonNullable<import("./types").TimelineEntry["snapshot"]>;
          }
          // Otherwise compute by subtracting entities introduced in newer entries (0..targetIdx-1)
          const removeSrc = new Set<string>();
          const removeCl  = new Set<string>();
          const removeEv  = new Set<string>();
          const removeIn  = new Set<string>();
          for (const e of derivedTimeline.slice(0, targetIdx)) {
            if (e.id.startsWith("src-")) removeSrc.add(e.id.slice(4));
            else if (e.id.startsWith("cl-")) removeCl.add(e.id.slice(3));
            else if (e.id.startsWith("ev-")) removeEv.add(e.id.slice(3));
            else if (e.id.startsWith("in-")) removeIn.add(e.id.slice(3));
          }
          const srcIds = sources.filter(s => !removeSrc.has(s.id)).map(s => s.id);
          const clIds  = claims.filter(c => !removeCl.has(c.id)).map(c => c.id);
          const evIds  = evidence.filter(e => !removeEv.has(e.id)).map(e => e.id);
          const inIds  = insights.filter(i => !removeIn.has(i.id)).map(i => i.id);
          return { sourceCount: srcIds.length, claimCount: clIds.length, evidenceCount: evIds.length, insightCount: inIds.length, sourceIds: srcIds, claimIds: clIds, evidenceIds: evIds, insightIds: inIds };
        };

        // Perform rollback: save undo snapshot, apply, update UI
        const doRollbackTo = (entryId: string, idx: number) => {
          const prev = captureCurrentSnapshot();
          const next = computeSnapshotAt(idx);
          setUndoSnapshots(s => [...s, prev]);
          rollbackToCheckpoint(projectId, next);
          setSelectedEntryId(entryId);
          notify(`已回朔至第 ${idx + 1} 步，可点「撤回」还原`);
        };

        // Undo last rollback
        const doUndo = () => {
          if (undoSnapshots.length === 0) return;
          const prev = undoSnapshots[undoSnapshots.length - 1];
          setUndoSnapshots(s => s.slice(0, -1));
          rollbackToCheckpoint(projectId, prev);
          // Move selection one step forward (less rolled-back)
          const newIdx = selectedIndex > 0 ? selectedIndex - 1 : -1;
          setSelectedEntryId(newIdx >= 0 ? derivedTimeline[newIdx]?.id ?? null : null);
          notify("已撤回上一步回朔");
        };

        // Restore to original (before any rollbacks)
        const doRestore = () => {
          if (undoSnapshots.length > 0) {
            rollbackToCheckpoint(projectId, undoSnapshots[0]);
            setUndoSnapshots([]);
            notify("已复原至最初版本");
          }
          setSelectedEntryId(null);
        };

        // ── Visual state ─────────────────────────────────────────────────────
        const selectedIndex = selectedEntryId ? derivedTimeline.findIndex(e => e.id === selectedEntryId) : -1;
        const isRolledBack  = selectedIndex !== -1;

        return (
          <div>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:14, borderBottom:"1.5px solid #f3f4f6", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14, fontWeight:800, color:"#111827", letterSpacing:"-0.01em" }}>研究记录</span>
                <span style={{ fontSize:11, color:"#9ca3af", fontWeight:500, padding:"1px 7px", borderRadius:99, background:"#f3f4f6" }}>{derivedTimeline.length} 条</span>
                {isRolledBack && (
                  <span style={{ fontSize:11, fontWeight:700, color:"#7c3aed", padding:"2px 10px", borderRadius:99, background:"linear-gradient(135deg,#f5f3ff,#ede9fe)", border:"1px solid #c4b5fd", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed", display:"inline-block" }} />
                    已回朔 {selectedIndex + 1}/{derivedTimeline.length} 步
                  </span>
                )}
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                {undoSnapshots.length > 0 && (
                  <button type="button" onClick={doRestore}
                    style={{ padding:"5px 13px", borderRadius:99, border:"1.5px solid #fca5a5", background:"#fff5f5", color:"#dc2626", fontSize:11.5, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                    ↺ 复原
                  </button>
                )}
                <button type="button" onClick={() => setAddingCheckpoint(v => !v)}
                  style={{ padding:"5px 13px", borderRadius:99, border:`1.5px solid ${addingCheckpoint ? "#6366f1" : "#e5e7eb"}`, background: addingCheckpoint ? "#f5f3ff" : "#fff", color: addingCheckpoint ? "#6366f1" : "#374151", fontSize:11.5, fontWeight:600, cursor:"pointer" }}>
                  {addingCheckpoint ? "取消" : "存档当前进度"}
                </button>
              </div>
            </div>

            {/* Checkpoint form */}
            {addingCheckpoint && (
              <div style={{ background:"linear-gradient(135deg,#f8f7ff,#faf5ff)", border:"1.5px solid #ddd6fe", borderRadius:14, padding:"14px 16px", marginBottom:18, display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:11.5, color:"#6b7280", fontWeight:500 }}>当前快照：{sources.length} 资料 · {claims.length} 观点 · {evidence.length} 证据 · {insights.length} 洞察</div>
                <textarea value={checkpointNote} onChange={e => setCheckpointNote(e.target.value)} rows={3} placeholder="记录当前思路、待验证假设、下一步计划…"
                  style={{ padding:"10px 12px", borderRadius:9, border:"1.5px solid #ddd6fe", fontSize:13, lineHeight:1.6, resize:"vertical", outline:"none", background:"#fff", fontFamily:"inherit" }} />
                <div style={{ display:"flex", gap:8 }}>
                  <button type="button" onClick={() => { addManualCheckpoint(projectId, checkpointNote); setCheckpointNote(""); setAddingCheckpoint(false); }}
                    style={{ padding:"6px 16px", borderRadius:99, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>保存断点</button>
                  <button type="button" onClick={() => setAddingCheckpoint(false)}
                    style={{ padding:"6px 13px", borderRadius:99, border:"1px solid #e5e7eb", background:"#fff", color:"#6b7280", fontSize:12, cursor:"pointer" }}>取消</button>
                </div>
              </div>
            )}

            {/* ── Timeline list ─────────────────────────────────────────── */}
            {derivedTimeline.length === 0 ? (
              <div style={{ textAlign:"center", padding:"56px 0", color:"#9ca3af", fontSize:13 }}>
                向项目加入资料后，操作记录会出现在这里
              </div>
            ) : (
              <div style={{ position:"relative", paddingLeft:36 }}>
                {/* Rail */}
                <div style={{ position:"absolute", left:11, top:8, bottom:8, width:2, background:"linear-gradient(to bottom, #e0e7ff, #e5e7eb 60%, #f3f4f6)", borderRadius:2 }} />

                {derivedTimeline.map((entry, i) => {
                  const cfg = TYPE_CFG[entry.type] ?? TYPE_CFG.source_added;
                  const isCheckpoint = entry.type === "manual_checkpoint";
                  const snap = entry.snapshot && 'sourceIds' in entry.snapshot ? entry.snapshot as NonNullable<import("./types").TimelineEntry["snapshot"]> : null;
                  const isGrayed   = isRolledBack && i < selectedIndex;
                  const isSelected = isRolledBack && i === selectedIndex;

                  // Per-type card theming
                  const THEMES: Record<string, { bg:string; border:string; badgeBg:string }> = {
                    source_added:        { bg:"#fafbff", border:"#c4b5fd", badgeBg:"#ede9fe" },
                    claim_extracted:     { bg:"#fffdf5", border:"#fcd34d", badgeBg:"#fef3c7" },
                    evidence_added:      { bg:"#f9fdf9", border:"#86efac", badgeBg:"#dcfce7" },
                    insight_generated:   { bg:"#fdf8ff", border:"#d8b4fe", badgeBg:"#f3e8ff" },
                    deliverable_created: { bg:"#f8fbff", border:"#93c5fd", badgeBg:"#dbeafe" },
                    agent_run:           { bg:"#fafbff", border:"#c4b5fd", badgeBg:"#ede9fe" },
                    manual_checkpoint:   { bg:"#111827", border:"#374151", badgeBg:"#374151" },
                  };
                  const theme = THEMES[entry.type] ?? THEMES.source_added;
                  const isDark = isCheckpoint;

                  return (
                    <div key={entry.id} style={{ position:"relative", marginBottom:10, opacity: isGrayed ? 0.28 : 1, transition:"opacity 0.2s", pointerEvents: isGrayed ? "none" : "auto" }}>

                      {/* Dot */}
                      <div style={{
                        position:"absolute", left:-30, top:13,
                        width:14, height:14, borderRadius:"50%",
                        background: isGrayed ? "#e5e7eb" : (isCheckpoint ? "#111827" : cfg.color),
                        boxShadow: isSelected
                          ? `0 0 0 3px ${cfg.color}33, 0 0 0 6px ${cfg.color}11, 0 0 0 8px #fff`
                          : `0 0 0 3px #fff, 0 1px 4px ${cfg.color}44`,
                        zIndex:1, transition:"all 0.2s",
                      }} />

                      {/* Card */}
                      <div style={{
                        background: isSelected ? "#faf5ff" : (isGrayed ? "#fafafa" : theme.bg),
                        border:`1.5px solid ${isSelected ? "#a78bfa" : theme.border}`,
                        borderLeft: `3px solid ${isGrayed ? "#e5e7eb" : (isSelected ? "#7c3aed" : cfg.color)}`,
                        borderRadius:10, padding:"11px 14px",
                        boxShadow: isSelected
                          ? "0 4px 18px rgba(124,58,237,0.14)"
                          : isGrayed ? "none"
                          : "0 1px 6px rgba(0,0,0,0.055)",
                        transition:"all 0.18s",
                      }}>
                        {/* Title row */}
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{
                            fontSize:10, padding:"2px 7px", borderRadius:4, flexShrink:0,
                            background: isDark ? "#374151" : theme.badgeBg,
                            color: isDark ? "#e5e7eb" : cfg.color,
                            fontWeight:700, letterSpacing:"0.04em",
                          }}>{cfg.label}</span>
                          <span style={{ fontSize:12.5, color: isDark ? "#f1f5f9" : "#111827", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>
                            {entry.description}
                          </span>
                          <span style={{ fontSize:10.5, color: isDark ? "#94a3b8" : "#c4c4c4", flexShrink:0 }}>{formatDate(entry.timestamp)}</span>
                        </div>

                        {/* User note */}
                        {entry.userNote && (
                          <div style={{ marginTop:7, fontSize:11.5, color: isDark ? "#cbd5e1" : "#4b5563", lineHeight:1.6, borderLeft:`2px solid ${isDark ? "#374151" : "#e5e7eb"}`, paddingLeft:9, fontStyle:"italic" }}>
                            {entry.userNote}
                          </div>
                        )}

                        {/* Snapshot stat */}
                        {snap && (
                          <div style={{ marginTop:5, fontSize:10.5, color: isDark ? "#94a3b8" : "#a8a8a8", display:"flex", gap:10 }}>
                            <span>资料 {snap.sourceCount}</span>
                            <span>观点 {snap.claimCount}</span>
                            <span>证据 {snap.evidenceCount}</span>
                            <span>洞察 {snap.insightCount}</span>
                          </div>
                        )}

                        {/* Action row — LEFT aligned */}
                        <div style={{ marginTop:7, display:"flex", alignItems:"center", gap:6 }}>
                          {isSelected ? (
                            <>
                              <span style={{ fontSize:10.5, color:"#7c3aed", fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                                <span style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed", display:"inline-block" }} />
                                已回朔至此
                              </span>
                              <button type="button" onClick={doUndo}
                                style={{ fontSize:10.5, padding:"2px 10px", borderRadius:99, border:"1.5px solid #a78bfa", background:"#f5f3ff", color:"#7c3aed", fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:3 }}>
                                ↩ 撤回
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => doRollbackTo(entry.id, i)}
                              style={{ fontSize:11, padding:"3px 12px", borderRadius:99, border:"1.5px solid #c4b5fd", background:"#f5f3ff", color:"#7c3aed", fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4, transition:"all 0.13s", flexShrink:0 }}
                              onMouseEnter={e => { e.currentTarget.style.background="#ede9fe"; e.currentTarget.style.borderColor="#a78bfa"; e.currentTarget.style.boxShadow="0 2px 8px rgba(124,58,237,0.18)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background="#f5f3ff"; e.currentTarget.style.borderColor="#c4b5fd"; e.currentTarget.style.boxShadow="none"; }}>
                              ↩ 回朔到此
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

type GraphNodeType = "project" | "source" | "note" | "claim" | "evidence" | "insight" | "deliverable";
type GraphNode = { id: string; type: GraphNodeType; title: string; subtitle: string; x: number; y: number };
type GraphEdge = { from: string; to: string; label: string };
type NodeAttachment = { id: string; type: "image" | "video" | "audio" | "pdf" | "link"; url: string; name: string };

const graphTypeLabels: Record<AppLanguage, Record<GraphNodeType, string>> = {
  zh: {
    project: "项目",
    source: "资料",
    note: "笔记",
    claim: "观点",
    evidence: "证据",
    insight: "洞察",
    deliverable: "成果",
  },
  en: {
    project: "Project",
    source: "Source",
    note: "Note",
    claim: "Claim",
    evidence: "Evidence",
    insight: "Insight",
    deliverable: "Output",
  },
};

const graphCanvas = { width: 1280, height: 760 };
const graphNodeSize = { width: 190, height: 86 };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function graphToVisualDocument(project: Project, nodes: GraphNode[], edges: GraphEdge[], language: AppLanguage): VisualExportDocument {
  const width = 1440;
  const height = 980;
  const offsetX = 80;
  const offsetY = 150;
  const typeLabel = graphTypeLabels[language];
  const colorMap: Record<GraphNodeType, { fill: string; stroke: string; accent: string }> = {
    project: { fill: "#ecfeff", stroke: "#67e8f9", accent: "#0891b2" },
    source: { fill: "#eff6ff", stroke: "#93c5fd", accent: "#2563eb" },
    note: { fill: "#fefce8", stroke: "#fde68a", accent: "#ca8a04" },
    claim: { fill: "#f0fdf4", stroke: "#86efac", accent: "#16a34a" },
    evidence: { fill: "#fff7ed", stroke: "#fdba74", accent: "#ea580c" },
    insight: { fill: "#f5f3ff", stroke: "#c4b5fd", accent: "#7c3aed" },
    deliverable: { fill: "#fdf2f8", stroke: "#f9a8d4", accent: "#db2777" },
  };
  const parts: string[] = [];
  parts.push(`<rect width="${width}" height="${height}" fill="#f8fbff"/><circle cx="1240" cy="130" r="260" fill="#dbeafe" opacity="0.72"/><circle cx="150" cy="900" r="210" fill="#dcfce7" opacity="0.58"/>`);
  parts.push(`<text x="${offsetX}" y="72" fill="#7c3aed" font-size="22" font-weight="800" letter-spacing="3" font-family="Arial, 'PingFang SC', sans-serif">LUMO KNOWLEDGE GRAPH</text>`);
  parts.push(appendSvgText(wrapVisualText(project.name, 38, 2), offsetX, 132, 48, 56, "#0f172a", 860));
  edges.forEach((edge) => {
    const from = nodes.find((node) => node.id === edge.from);
    const to = nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const startX = offsetX + from.x + graphNodeSize.width;
    const startY = offsetY + from.y + graphNodeSize.height / 2;
    const endX = offsetX + to.x;
    const endY = offsetY + to.y + graphNodeSize.height / 2;
    const curve = Math.max(70, Math.abs(endX - startX) * 0.42);
    parts.push(`<path d="M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}" fill="none" stroke="#94a3b8" stroke-width="2.5" opacity="0.72"/>`);
    parts.push(`<text x="${(startX + endX) / 2 - 26}" y="${(startY + endY) / 2 - 8}" fill="#64748b" font-size="14" font-weight="700" font-family="Arial, 'PingFang SC', sans-serif">${escapeXml(edge.label)}</text>`);
  });
  nodes.forEach((node) => {
    const colors = colorMap[node.type];
    const x = offsetX + node.x;
    const y = offsetY + node.y;
    parts.push(`<rect x="${x}" y="${y}" width="${graphNodeSize.width}" height="${graphNodeSize.height}" rx="18" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2"/>`);
    parts.push(`<rect x="${x + 14}" y="${y + 12}" width="52" height="22" rx="11" fill="${colors.accent}" opacity="0.92"/>`);
    parts.push(`<text x="${x + 40}" y="${y + 28}" fill="#ffffff" font-size="12" font-weight="800" text-anchor="middle" font-family="Arial, 'PingFang SC', sans-serif">${escapeXml(typeLabel[node.type])}</text>`);
    parts.push(appendSvgText(wrapVisualText(node.title, 23, 2), x + 14, y + 55, 16, 20, "#0f172a", 780));
    parts.push(`<text x="${x + 14}" y="${y + 76}" fill="#64748b" font-size="12" font-weight="640" font-family="Arial, 'PingFang SC', sans-serif">${escapeXml(wrapVisualText(node.subtitle, 24, 1)[0])}</text>`);
  });
  parts.push(`<text x="${offsetX}" y="${height - 42}" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">Generated by Lumo · ${escapeXml(new Date().toLocaleString())}</text>`);
  return { width, height, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>` };
}

function OntologyMap({ project, sources, notes, claims, evidence, insights, deliverables, language }: { project: Project; sources: Source[]; notes: Note[]; claims: Claim[]; evidence: Evidence[]; insights: Insight[]; deliverables: Deliverable[]; language: AppLanguage }) {
  const storageKey = `lumo-graph-${project.id}`;
  const notify = useAppStore((s) => s.notify);
  const english = isEn(language);
  const graphTypeLabel = graphTypeLabels[language];
  const graphRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, NodeAttachment[]>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number }>();
  const [pendingUrl, setPendingUrl] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const generated = useMemo(() => buildGraph(project, sources, notes, claims, evidence, insights, deliverables, language), [project, sources, notes, claims, evidence, insights, deliverables, language]);
  const nodes = useMemo(
    () => generated.nodes.map((node) => ({ ...node, ...(positions[node.id] ?? {}), title: labels[node.id] ?? node.title })),
    [generated.nodes, positions, labels],
  );
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) { setPositions({}); setLabels({}); setAttachments({}); return; }
      const parsed = JSON.parse(raw) as { positions?: Record<string, { x: number; y: number }>; labels?: Record<string, string>; attachments?: Record<string, NodeAttachment[]> };
      setPositions(parsed.positions ?? {});
      setLabels(parsed.labels ?? {});
      setAttachments(parsed.attachments ?? {});
    } catch {
      setPositions({}); setLabels({}); setAttachments({});
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ positions, labels, attachments }));
  }, [storageKey, positions, labels, attachments]);

  const addFileAttachment = (file: File, nodeId: string) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isImage = /^(jpg|jpeg|png|gif|webp|svg)$/.test(ext);
    const isVideo = /^(mp4|webm|mov|m4v)$/.test(ext);
    const isAudio = /^(mp3|wav|m4a|aac|ogg|flac)$/.test(ext);
    const type: NodeAttachment["type"] = isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : ext === "pdf" ? "pdf" : "link";
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const att: NodeAttachment = { id: `att${Date.now()}`, type: "image", url: reader.result as string, name: file.name };
        setAttachments((prev) => ({ ...prev, [nodeId]: [...(prev[nodeId] ?? []), att] }));
        notify(english ? "Image attached to node" : "图片已附加到节点");
      };
      reader.readAsDataURL(file);
    } else {
      const url = URL.createObjectURL(file);
      const att: NodeAttachment = { id: `att${Date.now()}`, type, url, name: file.name };
      setAttachments((prev) => ({ ...prev, [nodeId]: [...(prev[nodeId] ?? []), att] }));
      notify(english ? `${type} file attached` : `${file.name} 已附加到节点`);
    }
  };

  const addLinkAttachment = (nodeId: string, url: string) => {
    if (!url.trim()) return;
    const att: NodeAttachment = { id: `att${Date.now()}`, type: "link", url: url.trim(), name: url.trim().replace(/^https?:\/\//, "").slice(0, 40) };
    setAttachments((prev) => ({ ...prev, [nodeId]: [...(prev[nodeId] ?? []), att] }));
    setPendingUrl("");
    notify(english ? "Link attached to node" : "链接已附加到节点");
  };

  const removeAttachment = (nodeId: string, attId: string) => {
    setAttachments((prev) => ({ ...prev, [nodeId]: (prev[nodeId] ?? []).filter((a) => a.id !== attId) }));
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, node: GraphNode) => {
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedNodeId(node.id);
    const scaleX = graphCanvas.width / rect.width;
    const scaleY = graphCanvas.height / rect.height;
    setDragging({
      id: node.id,
      offsetX: event.clientX * scaleX - rect.left * scaleX - node.x,
      offsetY: event.clientY * scaleY - rect.top * scaleY - node.y,
    });
  };

  const moveNode = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = graphCanvas.width / rect.width;
    const scaleY = graphCanvas.height / rect.height;
    const nextX = event.clientX * scaleX - rect.left * scaleX - dragging.offsetX;
    const nextY = event.clientY * scaleY - rect.top * scaleY - dragging.offsetY;
    setPositions((current) => ({
      ...current,
      [dragging.id]: {
        x: clamp(nextX, 18, graphCanvas.width - graphNodeSize.width - 18),
        y: clamp(nextY, 18, graphCanvas.height - graphNodeSize.height - 18),
      },
    }));
  };

  const resetLayout = () => {
    setPositions({});
    setLabels({});
    setSelectedNodeId(undefined);
    notify(english ? "Graph layout reset" : "图谱已恢复自动排布");
  };

  const exportGraph = async (format: "json" | VisualExportFormat) => {
    try {
      if (format === "json") {
        downloadTextFile(`${safeFilename(project.name)}-knowledge-graph.json`, JSON.stringify({ project: project.name, nodes, edges: generated.edges }, null, 2), "application/json;charset=utf-8");
      } else {
        await exportVisualDocument(`${safeFilename(project.name)}-knowledge-graph`, graphToVisualDocument(project, nodes, generated.edges, language), format);
      }
      notify(english ? `Knowledge graph ${format.toUpperCase()} exported` : `动态图谱 ${format.toUpperCase()} 已导出`);
    } catch {
      notify(english ? "Graph export failed" : "图谱导出失败，请稍后重试");
    }
  };

  return (
    <section className="ontology-map">
      <div className="ontology-head">
        <div>
          <Badge tone="purple"><Brain size={14} /> {english ? "Live Knowledge Graph" : "动态知识图谱"}</Badge>
          <h3>{english ? "Editable project relationship map" : "可编辑的项目关系图谱"}</h3>
          <p>{english ? "Nodes are generated from this project. Drag to reorganize, select a node to rename it, and Lumo saves the layout in this browser." : "节点由项目资料动态生成。拖动节点可以重排结构，选中节点可以改标题；布局会自动保存在本机浏览器里。"}</p>
        </div>
        <div className="graph-toolbar">
          <Button onClick={resetLayout}>{english ? "Auto layout" : "自动排布"}</Button>
          <div className="graph-export-group">
            <span className="graph-export-label"><Download size={14} /> {english ? "Export" : "导出"}</span>
            <div className="graph-export-options">
              {(["svg", "png", "jpg", "pdf", "json"] as const).map((fmt) => (
                <button key={fmt} type="button" onClick={() => void exportGraph(fmt)}>{fmt.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="graph-workbench">
        <div className="graph-canvas-wrap">
          <div className="graph-canvas" ref={graphRef} onPointerMove={moveNode} onPointerUp={() => setDragging(undefined)} onPointerLeave={() => setDragging(undefined)}>
            <svg className="graph-edges" viewBox={`0 0 ${graphCanvas.width} ${graphCanvas.height}`} preserveAspectRatio="none">
              {generated.edges.map((edge) => {
                const from = nodes.find((node) => node.id === edge.from);
                const to = nodes.find((node) => node.id === edge.to);
                if (!from || !to) return null;
                const startX = from.x + graphNodeSize.width;
                const startY = from.y + graphNodeSize.height / 2;
                const endX = to.x;
                const endY = to.y + graphNodeSize.height / 2;
                const curve = Math.max(70, Math.abs(endX - startX) * 0.42);
                return <path key={`${edge.from}-${edge.to}-${edge.label}`} d={`M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`} />;
              })}
            </svg>
            {nodes.map((node) => {
              const nodeAtts = attachments[node.id] ?? [];
              const firstImage = nodeAtts.find((a) => a.type === "image");
              return (
                <button
                  className={`graph-node ${node.type} ${selectedNodeId === node.id ? "selected" : ""} ${firstImage ? "has-image" : ""}`}
                  key={node.id}
                  style={{ left: node.x, top: node.y }}
                  onPointerDown={(event) => startDrag(event, node)}
                  onClick={() => setSelectedNodeId(node.id)}
                  title={english ? "Drag to move this node" : "拖动移动节点"}
                >
                  {firstImage && (
                    <div className="node-img-thumb">
                      <img src={firstImage.url} alt={firstImage.name} />
                      {nodeAtts.filter((a) => a.type === "image").length > 1 && (
                        <span className="node-img-count">+{nodeAtts.filter((a) => a.type === "image").length - 1}</span>
                      )}
                    </div>
                  )}
                  <span>{graphTypeLabel[node.type]}</span>
                  <strong>{node.title}</strong>
                  <small>{node.subtitle}</small>
                  {nodeAtts.length > 0 && !firstImage && (
                    <span className="node-attach-badge">{nodeAtts.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <aside className="graph-inspector">
          <h4>{english ? "Node Editor" : "节点编辑"}</h4>
          {selectedNode ? (
            <>
              <Badge tone="blue">{graphTypeLabel[selectedNode.type]}</Badge>
              <label>
                {english ? "Node title" : "节点标题"}
                <textarea value={selectedNode.title} onChange={(event) => setLabels((current) => ({ ...current, [selectedNode.id]: event.target.value }))} rows={3} />
              </label>
              <div className="graph-position">
                <span>X {Math.round(selectedNode.x)}</span>
                <span>Y {Math.round(selectedNode.y)}</span>
              </div>

              <div className="node-attach-section">
                <div className="node-attach-head">
                  <strong>{english ? "Attachments" : "附件"}</strong>
                  <span className="node-attach-hint">{english ? "Image · Video · Audio · PDF · Link" : "图片 · 视频 · 音频 · PDF · 链接"}</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.mp4,.webm,.mov"
                  className="visually-hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && selectedNodeId) addFileAttachment(file, selectedNodeId);
                    event.target.value = "";
                  }}
                />

                {(attachments[selectedNode.id] ?? []).map((att) => (
                  <div key={att.id} className="node-attach-item">
                    {att.type === "image" && (
                      <img
                        src={att.url} alt={att.name} className="node-attach-preview"
                        style={{ cursor: "zoom-in" }}
                        onClick={() => setLightboxSrc(att.url)}
                      />
                    )}
                    {att.type === "video" && <video src={att.url} className="node-attach-preview" controls />}
                    {att.type === "audio" && <audio src={att.url} controls className="node-attach-audio" />}
                    {(att.type === "pdf" || att.type === "link") && (
                      <a className="node-attach-link" href={att.url} target="_blank" rel="noreferrer">
                        <ExternalLink size={12} />{att.name}
                      </a>
                    )}
                    <button className="node-attach-remove" type="button" onClick={() => removeAttachment(selectedNode.id, att.id)} title={english ? "Remove" : "删除"}>
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <button className="node-attach-upload" type="button" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> {english ? "Upload file" : "上传文件"}
                </button>

                <div className="node-attach-url-row">
                  <input
                    value={pendingUrl}
                    onChange={(event) => setPendingUrl(event.target.value)}
                    placeholder={english ? "Paste a link URL…" : "粘贴链接地址…"}
                    onKeyDown={(event) => { if (event.key === "Enter" && selectedNodeId) addLinkAttachment(selectedNodeId, pendingUrl); }}
                  />
                  <button type="button" onClick={() => selectedNodeId && addLinkAttachment(selectedNodeId, pendingUrl)}>
                    <Link2 size={13} />
                  </button>
                </div>
              </div>

              <Button onClick={() => { void navigator.clipboard.writeText(selectedNode.title); notify(english ? "Node title copied" : "节点标题已复制"); }}><Copy size={15} /> {english ? "Copy Node" : "复制节点"}</Button>
            </>
          ) : (
            <p>{english ? "Select any node to rename, attach media, or copy it. Hold and drag a node to move it." : "点击任意节点后，可改标题、上传图片/视频/PDF、粘贴链接。按住节点拖动即可移动位置。"}</p>
          )}
          <div className="graph-legend">
            {Object.entries(graphTypeLabel).map(([type, label]) => <span key={type} className={`legend-dot ${type}`}>{label}</span>)}
          </div>
        </aside>
      </div>
    </section>
  );
}

function buildGraph(project: Project, sources: Source[], notes: Note[], claims: Claim[], evidence: Evidence[], insights: Insight[], deliverables: Deliverable[], language: AppLanguage) {
  const english = isEn(language);
  const sourceNodes = sources.slice(0, 4).map((source, index): GraphNode => ({
    id: `source-${source.id}`,
    type: "source",
    title: source.title,
    subtitle: english ? source.type : sourceTypeLabel(source.type),
    x: 270,
    y: 92 + index * 130,
  }));
  const noteNodes = notes.slice(0, 2).map((note, index): GraphNode => ({
    id: `note-${note.id}`,
    type: "note",
    title: note.content,
    subtitle: english ? "Reading note" : "阅读笔记",
    x: 525,
    y: 130 + index * 148,
  }));
  const claimNodes = claims.slice(0, 3).map((claim, index): GraphNode => ({
    id: `claim-${claim.id}`,
    type: "claim",
    title: `${index + 1}. ${claim.text}`,
    subtitle: claim.evidenceIds.length > 0
      ? (english ? `${claim.evidenceIds.length} evidence` : `${claim.evidenceIds.length} 条证据`)
      : (english ? "no evidence yet" : "暂无证据"),
    x: 760,
    y: 120 + index * 152,
  }));
  const evidenceNodes = evidence.slice(0, 3).map((item, index): GraphNode => ({
    id: `evidence-${item.id}`,
    type: "evidence",
    title: item.text,
    subtitle: item.type,
    x: 525,
    y: 462 + index * 92,
  }));
  const insightNodes = insights.slice(0, 2).map((insight, index): GraphNode => ({
    id: `insight-${insight.id}`,
    type: "insight",
    title: insight.title,
    subtitle: `${insight.priority} priority`,
    x: 1015,
    y: 180 + index * 170,
  }));
  const deliverableNodes = deliverables.slice(0, 2).map((item, index): GraphNode => ({
    id: `deliverable-${item.id}`,
    type: "deliverable",
    title: item.title,
    subtitle: deliverableLabel(item.type),
    x: 1015,
    y: 560 + index * 104,
  }));
  const rawNodes: GraphNode[] = [
    { id: `project-${project.id}`, type: "project", title: project.name, subtitle: project.goal, x: 42, y: 300 },
    ...sourceNodes,
    ...noteNodes,
    ...claimNodes,
    ...evidenceNodes,
    ...insightNodes,
    ...deliverableNodes,
  ];
  // Collision spreading: push nodes apart within each column
  const NODE_W = 195; const NODE_H = 114; const GAP = 16;
  const nodes = (() => {
    const result = rawNodes.map((n) => ({ ...n }));
    let changed = true; let passes = 0;
    while (changed && passes++ < 20) {
      changed = false;
      for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
          const a = result[i]; const b = result[j];
          const dx = Math.abs(a.x - b.x); const dy = Math.abs(a.y - b.y);
          if (dx < NODE_W + GAP && dy < NODE_H + GAP) {
            // Same column — push b down
            if (dx < NODE_W) {
              const overlap = NODE_H + GAP - dy;
              if (a.y <= b.y) { b.y += overlap; } else { a.y += overlap; }
              changed = true;
            }
          }
        }
      }
    }
    return result;
  })();
  const root = `project-${project.id}`;
  const sourceEdges = sourceNodes.slice(0, 4).map((node) => ({ from: root, to: node.id, label: english ? "contains" : "包含资料" }));
  const noteEdges = noteNodes.map((node, index) => ({ from: sourceNodes[index]?.id ?? sourceNodes[0]?.id ?? root, to: node.id, label: english ? "creates note" : "产生笔记" }));
  const evidenceEdges = evidenceNodes.map((node, index) => ({ from: sourceNodes[index]?.id ?? sourceNodes[0]?.id ?? root, to: node.id, label: english ? "supports" : "提供证据" }));
  const claimEdges = claimNodes.map((node, index) => ({ from: evidenceNodes[index]?.id ?? noteNodes[index]?.id ?? sourceNodes[index]?.id ?? root, to: node.id, label: english ? "forms claim" : "形成观点" }));
  const insightEdges = insightNodes.map((node, index) => ({ from: claimNodes[index]?.id ?? claimNodes[0]?.id ?? root, to: node.id, label: english ? "synthesizes" : "综合洞察" }));
  const deliverableEdges = deliverableNodes.map((node, index) => ({ from: insightNodes[index]?.id ?? insightNodes[0]?.id ?? claimNodes[0]?.id ?? root, to: node.id, label: english ? "outputs" : "输出成果" }));
  const edges: GraphEdge[] = [...sourceEdges, ...noteEdges, ...evidenceEdges, ...claimEdges, ...insightEdges, ...deliverableEdges].filter((edge) => edge.from && edge.to);
  return { nodes, edges };
}

// Matrix extracted to src/components/Matrix.tsx

function CardList({ items }: { items: Array<[string, string]> }) {
  const notify = useAppStore((s) => s.notify);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  // Map raw evidence type values to readable labels
  const typeLabel = (val: string) => {
    const map: Record<string, [string, string]> = {
      quote:         ["引用", "Quote"],
      data:          ["数据", "Data"],
      example:       ["案例", "Example"],
      user_feedback: ["用户反馈", "User feedback"],
      feature:       ["功能点", "Feature"],
      other:         ["其他", "Other"],
      high:          ["高置信", "High"],
      medium:        ["中置信", "Medium"],
      low:           ["低置信", "Low"],
    };
    const entry = map[val];
    if (entry) return english ? entry[1] : entry[0];
    return val;
  };
  return (
    <div className="card-grid">
      {items.map(([title, body]) => (
        <article className="simple-card" key={title}>
          <Badge tone="neutral">{typeLabel(body)}</Badge>
          <h3>{title}</h3>
          <div className="actions">
            <Button onClick={() => { void navigator.clipboard.writeText(`${title}\n${body}`); notify(english ? "Copied" : "内容已复制"); }}>{english ? "Copy" : "复制"}</Button>
            <Button onClick={() => notify(english ? "Added to draft" : "已加入当前成果草稿")}>{english ? "Add to output" : "加入成果"}</Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function HighlightsView() {
  const highlights = useAppStore((s) => s.highlights);
  const convertHighlightToClaim = useAppStore((s) => s.convertHighlightToClaim);
  const convertHighlightToEvidence = useAppStore((s) => s.convertHighlightToEvidence);
  const notify = useAppStore((s) => s.notify);
  return <Library title="高亮">{highlights.map((item) => <article className="simple-card" key={item.id}><Badge tone={item.color === "yellow" ? "yellow" : "blue"}>{item.color}</Badge><h3>{item.text}</h3><p>原文段落 {item.paragraphIndex + 1} · {formatDate(item.createdAt)}</p><div className="actions"><Button onClick={() => convertHighlightToClaim(item.id)}>转为观点</Button><Button onClick={() => convertHighlightToEvidence(item.id)}>转为证据</Button><Button onClick={() => { void navigator.clipboard.writeText(item.text); notify("高亮内容已复制"); }}>复制</Button></div></article>)}</Library>;
}

function NotesView() {
  const notes = useAppStore((s) => s.notes);
  const sources = useAppStore((s) => s.sources);
  const convertNoteToClaim = useAppStore((s) => s.convertNoteToClaim);
  const publishCommunityPost = useAppStore((s) => s.publishCommunityPost);
  const notify = useAppStore((s) => s.notify);
  return <Library title="笔记">{notes.map((item) => {
    const source = sources.find((sourceItem) => sourceItem.id === item.sourceId);
    const shareTitle = source ? `${source.title} · 笔记` : "Lumo 笔记";
    return (
      <article className="simple-card note-share-card" key={item.id}>
        <Badge tone="blue">可分享笔记</Badge>
        <h3>{item.content}</h3>
        <p>{source?.title ?? "未知资料"} · 段落 {(item.paragraphIndex ?? 0) + 1} · {formatDate(item.createdAt)}</p>
        <SocialShareGrid
          compact
          title={shareTitle}
          content={item.content}
          url={source?.url}
          onPublishHome={() => publishCommunityPost({ title: shareTitle, content: item.content, noteId: item.id, sourceId: source?.id, tags: item.tagIds.length ? item.tagIds : ["笔记"], visibility: "public" })}
        />
        <div className="actions">
          <Button onClick={() => convertNoteToClaim(item.id)}>转为观点</Button>
          <Button onClick={() => notify("笔记已加入当前项目")}>加入项目</Button>
          <Button onClick={() => { void navigator.clipboard.writeText(item.content); notify("笔记已复制"); }}>复制</Button>
        </div>
      </article>
    );
  })}</Library>;
}

function ClaimsView() {
  const claims = useAppStore((s) => s.claims);
  const evidence = useAppStore((s) => s.evidence);
  const projects = useAppStore((s) => s.projects);
  const sources = useAppStore((s) => s.sources);
  const notify = useAppStore((s) => s.notify);
  const appendToDeliverable = useAppStore((s) => s.appendToDeliverable);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);

  const [search, setSearch] = useState("");
  const [filterConfidence, setFilterConfidence] = useState("all");
  // Expanded project IDs — default: first project open
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const first = projects[0]?.id;
    return first ? new Set([first]) : new Set(["__none__"]);
  });

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredClaims = useMemo(() => claims.filter(c => {
    if (search && !c.text.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterConfidence !== "all" && c.confidence !== filterConfidence) return false;
    return true;
  }), [claims, search, filterConfidence]);

  const filteredEvidence = useMemo(() => evidence.filter(e => {
    if (search && !e.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [evidence, search]);

  // Build project groups: active projects + unassigned
  const projectGroups = useMemo(() => {
    const groups: Array<{ id: string; name: string; claims: typeof filteredClaims; evidence: typeof filteredEvidence; isProject: boolean }> = [];
    projects.filter(p => p.status === "active").forEach(p => {
      const pc = filteredClaims.filter(c => c.projectId === p.id);
      const pe = filteredEvidence.filter(e => e.projectId === p.id);
      if (pc.length + pe.length > 0) groups.push({ id: p.id, name: p.name, claims: pc, evidence: pe, isProject: true });
    });
    const unassignedClaims = filteredClaims.filter(c => !c.projectId || !projects.find(p => p.id === c.projectId));
    const unassignedEvidence = filteredEvidence.filter(e => !e.projectId || !projects.find(p => p.id === e.projectId));
    if (unassignedClaims.length + unassignedEvidence.length > 0) {
      groups.push({ id: "__none__", name: "未归入项目", claims: unassignedClaims, evidence: unassignedEvidence, isProject: false });
    }
    return groups;
  }, [filteredClaims, filteredEvidence, projects]);

  const confLabel = (k: string) => ({ high:"高置信", medium:"中置信", low:"低置信" }[k] ?? k);
  const totalItems = filteredClaims.length + filteredEvidence.length;

  return (
    <section className="claims-page content">
      {/* Toolbar */}
      <div className="claims-toolbar">
        <div className="claims-toolbar-left">
          <div>
            <h2 className="claims-title">{english ? "Research Findings" : "研究成果"}</h2>
            <span className="claims-count">{filteredClaims.length} 条观点 · {filteredEvidence.length} 条证据</span>
          </div>
        </div>
        <div className="claims-toolbar-right">
          <label className="claims-search-wrap">
            <Search size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索观点、证据…" className="claims-search-input" />
          </label>
          <label className="claims-filter-chip">
            <Lightbulb size={12} />
            <select value={filterConfidence} onChange={e => setFilterConfidence(e.target.value)} className="claims-filter-select">
              <option value="all">所有置信度</option>
              <option value="high">高置信</option>
              <option value="medium">中置信</option>
              <option value="low">低置信</option>
            </select>
          </label>
          {(search || filterConfidence !== "all") && (
            <button type="button" className="claims-clear-btn" onClick={() => { setSearch(""); setFilterConfidence("all"); }}>
              <X size={12} /> 清除
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {totalItems === 0 && (
        <div style={{ padding:"48px 0", textAlign:"center", color:"#9ca3af", fontSize:14 }}>
          {claims.length === 0 ? "还没有观点或证据 — 在阅读器高亮段落，或用 Lumo Agent 快读自动提炼" : "没有匹配内容"}
        </div>
      )}

      {/* Project accordion */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {projectGroups.map(group => {
          const isOpen = expanded.has(group.id);
          return (
            <div key={group.id} style={{ border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden", background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
              {/* Project header — click to expand/collapse */}
              <button type="button"
                onClick={() => toggle(group.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 18px", background: isOpen ? "#f5f3ff" : "#fff", border:"none", cursor:"pointer", textAlign:"left", transition:"background 0.15s" }}>
                <div style={{ width:32, height:32, borderRadius:10, background: group.isProject ? "linear-gradient(135deg,#a78bfa,#6366f1)" : "#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {group.isProject ? <Box size={15} color="#fff" /> : <Archive size={15} color="#9ca3af" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color: isOpen ? "#4f46e5" : "#1f2937" }}>{group.name}</div>
                  <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>
                    {group.claims.length > 0 && `${group.claims.length} 条观点`}
                    {group.claims.length > 0 && group.evidence.length > 0 && " · "}
                    {group.evidence.length > 0 && `${group.evidence.length} 条证据`}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {group.claims.length > 0 && (
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:"#fef9c3", color:"#92400e", fontWeight:700 }}>
                      <Lightbulb size={10} style={{ display:"inline", verticalAlign:"middle" }} /> {group.claims.length}
                    </span>
                  )}
                  {group.evidence.length > 0 && (
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:"#dcfce7", color:"#166534", fontWeight:700 }}>
                      <ShieldCheck size={10} style={{ display:"inline", verticalAlign:"middle" }} /> {group.evidence.length}
                    </span>
                  )}
                  <ChevronDown size={16} color="#9ca3af" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition:"transform 0.2s", flexShrink:0 }} />
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding:"12px 18px 16px", borderTop:"1px solid #e5e7eb", display:"flex", flexDirection:"column", gap:16 }}>
                  {/* Claims section */}
                  {group.claims.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:800, color:"#92400e", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
                        <Lightbulb size={11} /> 观点
                      </div>
                      <div className="claims-card-grid">
                        {group.claims.map(item => {
                          const src = sources.find(s => s.id === item.sourceId);
                          const claimBg = item.confidence === "high" ? "var(--card-bg-high)" : item.confidence === "medium" ? "var(--card-bg-medium)" : "var(--card-bg-low)";
                          const claimBorder = item.confidence === "high" ? "var(--card-border-high)" : item.confidence === "medium" ? "var(--card-border-medium)" : "var(--card-border-low)";
                          return (
                            <article key={item.id} className="claim-card"
                              style={{ borderLeft:`3px solid ${claimBorder}`, background:claimBg }}>
                              <div className="claim-card-top">
                                <ConfidenceBadge confidence={item.confidence} />
                                {item.tags?.includes("agent") && (
                                  <span className="agent-generated-badge" style={{ fontSize:10 }}><Sparkles size={8} /> Agent</span>
                                )}
                              </div>
                              <p className="claim-card-text">{item.text}</p>
                              {src && <p className="claim-card-source">《{src.title.slice(0,28)}{src.title.length>28?"…":""}》</p>}
                              <p className="claim-card-meta">{formatDate(item.createdAt)}</p>
                              <div className="claim-card-actions">
                                <button type="button" onClick={() => { appendToDeliverable(item.projectId || selectedProjectId || "", "💡 观点", item.text, sources.find(s=>s.id===item.sourceId)?.title); setActiveView("deliverables"); }}>加入成果</button>
                                <button type="button" onClick={() => notify("已转为洞察候选")}>转为洞察</button>
                                <AddToGraphBtn projectId={item.projectId} />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Evidence section */}
                  {group.evidence.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:800, color:"#166534", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
                        <ShieldCheck size={11} /> 证据
                      </div>
                      <div className="claims-card-grid">
                        {group.evidence.map(item => (
                          <article key={item.id} className="claim-card"
                            style={{ borderLeft:"3px solid var(--card-border-evidence)", background:"var(--card-bg-evidence)" }}>
                            <div className="claim-card-top">
                              <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, background:"#dcfce7", color:"#166534", fontWeight:700, display:"inline-flex", alignItems:"center", gap:3 }}>
                                <ShieldCheck size={9} /> 证据
                              </span>
                              <span className="ev-type-tag" data-tooltip={EVIDENCE_TYPE_TIPS[item.type] ?? item.type}>{item.type}</span>
                              {(item as { tagIds?: string[] }).tagIds?.includes("agent") && (
                                <span className="agent-generated-badge" style={{ fontSize:10 }}><Sparkles size={8} /> Agent</span>
                              )}
                            </div>
                            <p className="claim-card-text">{item.text}</p>
                            <p className="claim-card-source">{item.sourceTitle}</p>
                            <p className="claim-card-meta">{formatDate(item.createdAt)}</p>
                            <div className="claim-card-actions">
                              <button type="button" onClick={() => { void navigator.clipboard.writeText(`${item.text}\n出处：${item.originalUrl}`); notify("引用已复制"); }}>复制引用</button>
                              <button type="button" onClick={() => notify("已关联观点")}>关联观点</button>
                              <AddToGraphBtn projectId={item.projectId} />
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function KnowledgeModelExplainer() {
  return (
    <section className="knowledge-model">
      <div>
        <strong>观点 Claim</strong>
        <p>来自单条资料或段落的可复用判断，适合进入项目材料和成果草稿。</p>
      </div>
      <div>
        <strong>证据 Evidence</strong>
        <p>原文、链接、截图或事实出处，用来支撑观点，必须保留来源。</p>
      </div>
      <div>
        <strong>洞察 Insight</strong>
        <p>跨多条观点和证据综合后的判断，通常用于策略、产品机会或风险。</p>
      </div>
    </section>
  );
}

function EvidenceView() {
  const evidence = useAppStore((s) => s.evidence);
  const notify = useAppStore((s) => s.notify);
  return <Library title="证据">{evidence.map((item) => <article className="simple-card" key={item.id}><Badge tone="green">{item.type}</Badge>{(item as { tagIds?: string[] }).tagIds?.includes("agent") && <span className="agent-generated-badge"><Wand2 size={9} /> Lumo Agent</span>}<h3>{item.text}</h3><p>{item.sourceTitle} · {item.confidence}</p><a className="source-link" href={item.originalUrl} target="_blank" rel="noreferrer"><Globe2 size={15} /> 原始出处：{safeHost(item.originalUrl)}</a><div className="actions"><Button onClick={() => { void navigator.clipboard.writeText(`${item.text}\n出处：${item.originalUrl}`); notify("证据引用已复制"); }}>复制引用</Button><Button onClick={() => notify("证据已关联到当前观点候选")}>关联观点</Button><Button onClick={() => notify("证据已标记为高可靠")}>标记可靠</Button></div></article>)}</Library>;
}

function InsightsView() {
  const insights = useAppStore((s) => s.insights);
  const claims = useAppStore((s) => s.claims);
  const notify = useAppStore((s) => s.notify);
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <Library title="洞察">
      <KnowledgeModelExplainer />
      {insights.map((item) => {
        const isExpanded = expanded === item.id;
        const relatedClaims = claims.filter(c => item.claimIds.includes(c.id));
        return (
          <article className="simple-card insight-card" key={item.id} style={{ overflow:"hidden" }}>
            <div className="card-top">
              <Badge tone={item.priority === "high" ? "purple" : "blue"}>
                {item.type}
              </Badge>
              <Badge tone={item.priority === "high" ? "red" : item.priority === "medium" ? "yellow" : "neutral"}>
                {item.priority === "high" ? "High" : item.priority === "medium" ? "Medium" : "Low"}
              </Badge>
            </div>
            <h3 style={{ fontSize:15, lineHeight:1.4, margin:0 }}>{item.title}</h3>
            <p style={{
              fontSize:13, color:"#6b7280", lineHeight:1.6, margin:0,
              display:"-webkit-box", WebkitLineClamp: isExpanded ? undefined : 3,
              WebkitBoxOrient:"vertical", overflow: isExpanded ? "visible" : "hidden",
            }}>
              {item.content}
            </p>
            {item.content.length > 120 && (
              <button type="button" onClick={() => setExpanded(isExpanded ? null : item.id)}
                style={{ background:"none", border:"none", color:"#6366f1", fontSize:12, fontWeight:600, cursor:"pointer", padding:0, textAlign:"left" }}>
                {isExpanded ? "收起" : "展开全文"}
              </button>
            )}
            {relatedClaims.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:4 }}>
                {relatedClaims.slice(0,2).map(c => (
                  <span key={c.id} style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:"#ede9fe", color:"#6d28d9", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {c.text.slice(0,30)}{c.text.length>30?"…":""}
                  </span>
                ))}
                {relatedClaims.length > 2 && <span style={{ fontSize:11, color:"#9ca3af" }}>+{relatedClaims.length-2}</span>}
              </div>
            )}
            <div className="insight-meta" style={{ fontSize:12, color:"#9ca3af", display:"flex", gap:10 }}>
              <span>{item.claimIds.length} 条观点 · {item.evidenceIds.length} 条证据</span>
            </div>
            <div className="actions" style={{ gap:6 }}>
              <Button onClick={() => notify("洞察已加入成果草稿")}>加入成果</Button>
              <Button onClick={() => notify("洞察已转为需求候选")}>转为需求</Button>
              <AddToGraphBtn projectId={item.projectId} />
            </div>
          </article>
        );
      })}
    </Library>
  );
}

function DeliverablesView() {
  const deliverables = useAppStore((s) => s.deliverables);
  const projects = useAppStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const generateDeliverable = useAppStore((s) => s.generateDeliverable);
  const deleteDeliverable = useAppStore((s) => s.deleteDeliverable);
  const updateDeliverable = useAppStore((s) => s.updateDeliverable);
  const notify = useAppStore((s) => s.notify);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  const [shareModalItem, setShareModalItem] = useState<{ id: string; title: string; url: string } | null>(null);
  const [regenLoadingId, setRegenLoadingId] = useState<string | null>(null);

  const handleRegen = async (item: typeof deliverables[0]) => {
    const project = projects.find(p => p.id === item.projectId);
    if (!project) return;
    setRegenLoadingId(item.id);
    try {
      const projectSources  = useAppStore.getState().sources.filter(s => project.sourceIds.includes(s.id));
      const projectClaims   = useAppStore.getState().claims.filter(c => c.projectId === project.id || project.claimIds.includes(c.id));
      const projectEvidence = useAppStore.getState().evidence.filter(e => e.projectId === project.id || project.evidenceIds.includes(e.id));
      const projectInsights = useAppStore.getState().insights.filter(i => i.projectId === project.id || project.insightIds.includes(i.id));
      const content = await aiService.generateDeliverableContent({
        type: item.type,
        projectName: project.name,
        projectGoal: project.goal,
        sources:  projectSources.map(s => s.title),
        claims:   projectClaims.map(c => c.text),
        evidence: projectEvidence.map(e => e.text),
        insights: projectInsights.map(i => `${i.title}：${i.content}`),
      });
      updateDeliverable(item.id, content);
      notify("重新生成完成");
    } catch {
      // fallback: call the store action which uses mock if no API key
      generateDeliverable(item.type, item.projectId);
      notify("已重新生成（离线模式）");
    } finally {
      setRegenLoadingId(null);
    }
  };
  const [filterType, setFilterType] = useState<string>("all");
  const [filterOrigin, setFilterOrigin] = useState<"all" | "ai" | "manual">("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [editInspirationId, setEditInspirationId] = useState<string | null>(null);
  const [inspirationEditorOpen, setInspirationEditorOpen] = useState(false);
  const inspirations = useAppStore((s) => s.inspirations);

  const exportDeliverable = async (item: typeof deliverables[0], fmt: string) => {
    const base = safeFilename(item.title);
    try {
      if (fmt === "md") {
        downloadTextFile(`${base}.md`, item.content, "text/markdown;charset=utf-8");
        notify("Markdown 已下载");
      } else if (fmt === "html") {
        downloadTextFile(`${base}.html`, buildDeliverableHtml(item.title, item.content), "text/html;charset=utf-8");
        notify("HTML 已下载");
      } else if (fmt === "doc") {
        downloadTextFile(`${base}.doc`, buildDeliverableHtml(item.title, item.content), "application/msword;charset=utf-8");
        notify("Word 文档已下载");
      } else if (fmt === "pdf") {
        const w = window.open("", "_blank");
        if (w) { w.document.write(buildDeliverableHtml(item.title, item.content)); w.document.close(); setTimeout(() => w.print(), 350); }
        notify("已在新标签页打开，请在浏览器另存为 PDF");
      } else if (fmt === "png" || fmt === "jpg") {
        notify(`正在生成 ${fmt.toUpperCase()}…`);
        const visual = deliverableToVisualDoc(item.title, item.content);
        const blob = await rasterizeSvg(visual, fmt === "png" ? "image/png" : "image/jpeg");
        downloadBlob(`${base}.${fmt}`, blob);
        notify(`${fmt.toUpperCase()} 已下载`);
      }
    } catch { notify("导出失败，请重试"); }
  };

  // Apply filters
  const filteredDeliverables = useMemo(() => deliverables.filter(d => {
    if (filterType !== "all" && d.type !== filterType) return false;
    if (filterOrigin !== "all" && (d.origin ?? "ai") !== filterOrigin) return false;
    if (filterProject !== "all" && d.projectId !== filterProject) return false;
    return true;
  }), [deliverables, filterType, filterOrigin, filterProject]);

  // Group filtered by project
  const grouped = projects.map((project) => ({
    project,
    items: filteredDeliverables.filter((d) => d.projectId === project.id),
  })).filter((g) => g.items.length > 0);
  const ungrouped = filteredDeliverables.filter((d) => !projects.some((p) => p.id === d.projectId));
  const activeProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  return (
    <section className="content deliverables-page">
      {/* ── Filter toolbar ───────────────────────────────────────────── */}
      <div className="dl-toolbar">
        {/* Header row: title + active badge + clear */}
        <div className="dl-toolbar-head">
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span className="dl-toolbar-title">成果</span>
            <span className="dl-toolbar-count">{deliverables.length} 份</span>
            {filterType !== "all" && (
              <span className="dl-active-badge">
                {deliverableIcon(filterType as DeliverableType)} {deliverableLabel(filterType as DeliverableType)}
              </span>
            )}
          </div>
          {(filterType !== "all" || filterOrigin !== "all" || filterProject !== "all") && (
            <button type="button" className="dl-clear-btn"
              onClick={() => { setFilterType("all"); setFilterOrigin("all"); setFilterProject("all"); }}>
              <X size={11} /> 清除筛选
            </button>
          )}
        </div>

        {/* Scrollable type strip */}
        <div className="dl-type-scroll-wrap">
          <div className="dl-type-scroll">
            {["all", ...deliverableTypes].map(t => (
              <button key={t} type="button"
                className={`dl-type-pill ${filterType === t ? "active" : ""}`}
                onClick={() => setFilterType(t)}>
                {t === "all" ? "全部" : <>{deliverableIcon(t as DeliverableType)}<span>{deliverableLabel(t as DeliverableType)}</span></>}
              </button>
            ))}
          </div>
          {/* Right fade */}
          <div className="dl-type-fade" />
        </div>

        {/* Bottom row: origin + project */}
        <div className="dl-toolbar-bottom">
          <div className="dl-origin-group">
            {(["all","ai","manual"] as const).map(o => (
              <button key={o} type="button"
                className={`dl-origin-pill ${filterOrigin === o ? "active" : ""}`}
                onClick={() => setFilterOrigin(o === filterOrigin ? "all" : o)}>
                {o === "all" ? "所有来源" : o === "ai" ? "AI 生成" : "手动笔记"}
              </button>
            ))}
          </div>
          <div className="dl-toolbar-sep" />
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className={`dl-project-select ${filterProject !== "all" ? "active" : ""}`}>
            <option value="all">所有项目</option>
            {projects.filter(p => p.status !== "archived").map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state for deliverables */}
      {deliverables.length === 0 && (
        <div className="deliverables-empty">
          <FileOutput size={36} />
          <strong>还没有成果</strong>
          <p>在上方选择成果类型，Lumo 会从当前项目的观点和证据生成报告。</p>
        </div>
      )}
      {deliverables.length > 0 && filteredDeliverables.length === 0 && (
        <div className="deliverables-empty">
          <FileOutput size={28} />
          <strong>没有符合筛选条件的成果</strong>
          <button type="button" onClick={() => { setFilterType("all"); setFilterOrigin("all"); setFilterProject("all"); }} style={{ fontSize:13, color:"#6366f1", background:"none", border:"none", cursor:"pointer" }}>清除筛选</button>
        </div>
      )}
      {grouped.map(({ project, items }) => (
        <section key={project.id} className="deliverables-group">
          <div className="deliverables-group-header">
            <button
              className="deliverables-group-title"
              type="button"
              onClick={() => { setSelectedProject(project.id); }}
            >
              <Box size={14} />
              <span>{project.name}</span>
            </button>
            <span className="deliverables-group-count">{items.length} 份成果</span>
          </div>
          <div className="deliverables-card-grid">
            {items.map((item) => (
              <article key={item.id} className={`deliverable-card ${expandedId === item.id ? "expanded" : ""}`} style={{ position:"relative" }}>
                {/* ── Regen loading overlay ── */}
                {regenLoadingId === item.id && (
                  <div className="dc-regen-overlay">
                    <div className="dc-regen-spinner" />
                    <span style={{ color:"#fff", fontSize:14, fontWeight:700, marginTop:4 }}>Lumo 正在生成</span>
                    <span style={{ color:"rgba(255,255,255,0.65)", fontSize:12 }}>请耐心等待…</span>
                  </div>
                )}
                <div className="deliverable-card-top" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <div className="deliverable-card-meta">
                    <span style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:99, background:'#ede9fe', color:'#6d28d9', fontSize:11, fontWeight:700 }}>{deliverableIcon(item.type)}{deliverableLabel(item.type)}</span>
                    <DeliverableOriginBadge origin={item.origin} />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  {expandedId !== item.id && (
                    <p className="deliverable-card-preview">
                      {item.content.replace(/[#*`>|\-]/g, "").trim().slice(0, 120)}…
                    </p>
                  )}
                  <button type="button" className="dc-card-delete" onClick={e => { e.stopPropagation(); deleteDeliverable(item.id); }} title="删除此成果">
                    <Trash2 size={13} />
                  </button>
                </div>
                {expandedId === item.id && (
                  <div className="deliverable-card-body">
                    {editingId === item.id ? (
                      <div className="deliverable-edit-area">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={20}
                          className="deliverable-textarea"
                          autoFocus
                        />
                        <div className="deliverable-edit-actions">
                          <button type="button" onClick={() => setEditingId(null)}>取消</button>
                          <button type="button" className="primary" onClick={() => { updateDeliverable(item.id, editContent); setEditingId(null); notify("成果已保存"); }}>保存</button>
                        </div>
                      </div>
                    ) : (
                      <RichDocument content={item.content} />
                    )}
                  </div>
                )}
                <div className="deliverable-card-actions">
                  <div className="dc-actions-left">
                    {expandedId === item.id && editingId !== item.id && (
                      <button type="button" className="dc-action-btn" onClick={() => { setEditingId(item.id); setEditContent(item.content); }}>
                        ✏️ 编辑
                      </button>
                    )}
                    {/* Export dropdown */}
                    <div style={{ position: "relative" }}>
                      <button type="button" className="dc-action-btn"
                        onClick={() => setExportMenuId(exportMenuId === item.id ? null : item.id)}>
                        <Download size={13} /> 导出 <ChevronDown size={10} style={{ marginLeft: 1 }} />
                      </button>
                      {exportMenuId === item.id && (
                        <>
                          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setExportMenuId(null)} />
                          <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 100, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.13)", minWidth: 140, overflow: "hidden" }}>
                            {([
                              { label: "Markdown", fmt: "md" },
                              { label: "HTML", fmt: "html" },
                              { label: "Word (.doc)", fmt: "doc" },
                              { label: "PDF", fmt: "pdf" },
                              { label: "PNG 图片", fmt: "png" },
                              { label: "JPG 图片", fmt: "jpg" },
                            ] as const).map(({ label, fmt }) => (
                              <button key={fmt} type="button" className="dc-export-option"
                                onClick={() => { void exportDeliverable(item, fmt); setExportMenuId(null); }}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <button type="button" className="dc-action-btn" title="生成分享链接与二维码"
                      onClick={() => {
                        const html = buildDeliverableHtml(item.title, item.content);
                        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        setShareModalItem({ id: item.id, title: item.title, url });
                      }}>
                      <Share2 size={13} /> 分享链接
                    </button>
                  </div>
                  <div className="dc-actions-right">
                    <button type="button" className="dc-action-btn regen"
                      disabled={regenLoadingId === item.id}
                      onClick={() => handleRegen(item)}>
                      {regenLoadingId === item.id ? "生成中…" : "重新生成"}
                    </button>
                    <button type="button" className="dc-action-btn" onClick={() => { const { setActiveView, setSelectedProject } = useAppStore.getState(); setSelectedProject(item.projectId); setActiveView("projects"); notify("已前往项目图谱"); }} title="查看知识图谱">
                      <Network size={13} /> 图谱
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Ungrouped */}
      {ungrouped.length > 0 && (
        <section className="deliverables-group">
          <div className="deliverables-group-header">
            <span className="deliverables-group-title"><FileOutput size={14} /><span>其他成果</span></span>
          </div>
          <div className="deliverables-card-grid">
            {ungrouped.map((item) => (
              <article key={item.id} className="deliverable-card">
                <div className="deliverable-card-top">
                  <div className="deliverable-card-meta">
                    <span style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:99, background:'#ede9fe', color:'#6d28d9', fontSize:11, fontWeight:700 }}>{deliverableIcon(item.type)}{deliverableLabel(item.type)}</span>
                    <DeliverableOriginBadge origin={item.origin} />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <button type="button" className="dc-card-delete" onClick={e => { e.stopPropagation(); deleteDeliverable(item.id); }} title="删除此成果">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="deliverable-card-actions">
                  <div className="dc-actions-left">
                    <div style={{ position: "relative" }}>
                      <button type="button" className="dc-action-btn"
                        onClick={() => setExportMenuId(exportMenuId === item.id ? null : item.id)}>
                        <Download size={13} /> 导出 <ChevronDown size={10} style={{ marginLeft: 1 }} />
                      </button>
                      {exportMenuId === item.id && (
                        <>
                          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setExportMenuId(null)} />
                          <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 100, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.13)", minWidth: 140, overflow: "hidden" }}>
                            {([
                              { label: "Markdown", fmt: "md" },
                              { label: "HTML", fmt: "html" },
                              { label: "Word (.doc)", fmt: "doc" },
                              { label: "PDF", fmt: "pdf" },
                              { label: "PNG 图片", fmt: "png" },
                              { label: "JPG 图片", fmt: "jpg" },
                            ] as const).map(({ label, fmt }) => (
                              <button key={fmt} type="button" className="dc-export-option"
                                onClick={() => { void exportDeliverable(item, fmt); setExportMenuId(null); }}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="dc-actions-right" />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {inspirationEditorOpen && (
        <InspirationModal
          editId={editInspirationId ?? undefined}
          onClose={() => setInspirationEditorOpen(false)}
        />
      )}

      {/* ── Share link modal ─────────────────────────────────────────── */}
      {shareModalItem && (
        <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(15,15,20,0.5)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => { URL.revokeObjectURL(shareModalItem.url); setShareModalItem(null); }}>
          <div style={{ background:"#fff", borderRadius:22, width:"min(420px,94vw)", boxShadow:"0 32px 80px rgba(0,0,0,0.22)", overflow:"hidden" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:"#111827" }}>分享链接</div>
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:3, maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{shareModalItem.title}</div>
              </div>
              <button type="button" onClick={() => { URL.revokeObjectURL(shareModalItem.url); setShareModalItem(null); }}
                style={{ width:28, height:28, borderRadius:8, border:"none", background:"#f3f4f6", color:"#6b7280", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding:"20px 22px" }}>
              {/* QR Code */}
              <div style={{ display:"flex", gap:18, alignItems:"flex-start" }}>
                <div style={{ flexShrink:0, width:136, height:136, borderRadius:14, overflow:"hidden", border:"1.5px solid #f3f4f6", background:"#fafafa", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=8&color=111827&data=${encodeURIComponent(shareModalItem.url)}`}
                    alt="QR Code" width={130} height={130}
                    style={{ display:"block" }}
                  />
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                  <p style={{ margin:0, fontSize:12.5, color:"#4b5563", lineHeight:1.6 }}>
                    扫描二维码或复制链接，在浏览器中打开此成果预览页。
                  </p>
                  {/* Link copy row */}
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <input readOnly value={shareModalItem.url}
                      style={{ flex:1, padding:"7px 10px", borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:11, color:"#6b7280", background:"#f9fafb", outline:"none", overflow:"hidden", textOverflow:"ellipsis" }}
                      onFocus={e => e.target.select()} />
                    <button type="button"
                      onClick={() => { void navigator.clipboard.writeText(shareModalItem.url); notify("链接已复制"); }}
                      style={{ padding:"7px 14px", borderRadius:9, border:"none", background:"#111827", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                      复制
                    </button>
                  </div>
                  <button type="button"
                    onClick={() => window.open(shareModalItem.url, "_blank")}
                    style={{ padding:"7px 14px", borderRadius:9, border:"1.5px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5, justifyContent:"center" }}>
                    <Share2 size={13} /> 在新标签页打开
                  </button>
                </div>
              </div>

              <p style={{ margin:"14px 0 0", fontSize:11, color:"#c4c4c4", lineHeight:1.5 }}>
                * 链接为本地临时预览地址，仅在当前浏览器会话中有效。
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── 灵感编辑器 ──────────────────────────────────────────────────────────────
function InspirationModal({ editId, onClose }: { editId?: string; onClose: () => void }) {
  const saveInspiration = useAppStore((s) => s.saveInspiration);
  const deleteInspiration = useAppStore((s) => s.deleteInspiration);
  const existing = useAppStore((s) => s.inspirations.find(i => i.id === editId));
  const notify = useAppStore((s) => s.notify);
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [saved, setSaved] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      if (existing?.content) editorRef.current.innerHTML = existing.content;
      else setTimeout(() => editorRef.current?.focus(), 100);
    }
  }, []);

  const insertMedia = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      editorRef.current?.focus();
      if (file.type.startsWith("image/")) {
        document.execCommand("insertHTML", false, `<img src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      } else if (file.type.startsWith("video/")) {
        document.execCommand("insertHTML", false, `<video src="${url}" controls style="max-width:100%;border-radius:8px;margin:8px 0;"></video>`);
      }
    };
    reader.readAsDataURL(file);
  };

  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val ?? ""); editorRef.current?.focus(); };

  const save = () => {
    const content = editorRef.current?.innerHTML ?? "";
    if (!content.replace(/<[^>]*>/g,"").trim() && !title.trim()) { notify("请先写点内容再保存"); return; }
    saveInspiration(editId ?? null, title, content);
    setSaved(true);
    setTimeout(onClose, 500);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(15,15,20,0.6)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:18, width:"min(800px,96vw)", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,0.22)", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 20px", borderBottom:"1px solid #f3f4f6" }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="灵感标题（可选）…"
            style={{ flex:1, border:"none", outline:"none", fontSize:17, fontWeight:700, color:"#111827", background:"transparent" }} />
          <button type="button" onClick={save}
            style={{ padding:"7px 18px", borderRadius:9, border:"none", background: saved ? "#16a34a" : "#111827", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", transition:"background 0.2s" }}>
            {saved ? "已保存 ✓" : "保存"}
          </button>
          {editId && (
            <button type="button" onClick={() => { deleteInspiration(editId); onClose(); }}
              style={{ padding:"7px 12px", borderRadius:9, border:"1px solid #fee2e2", background:"#fff", color:"#dc2626", fontSize:12, cursor:"pointer" }}>
              删除
            </button>
          )}
          <button type="button" onClick={onClose}
            style={{ width:32, height:32, borderRadius:8, border:"none", background:"#f3f4f6", color:"#6b7280", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display:"flex", alignItems:"center", gap:1, padding:"6px 14px", borderBottom:"1px solid #f3f4f6", flexWrap:"wrap", background:"#fafafa" }}>
          {([
            { label:"B", cmd:"bold", style:{ fontWeight:800 } as React.CSSProperties, title:"加粗 Ctrl+B" },
            { label:"I", cmd:"italic", style:{ fontStyle:"italic" } as React.CSSProperties, title:"斜体 Ctrl+I" },
            { label:"U", cmd:"underline", style:{ textDecoration:"underline" } as React.CSSProperties, title:"下划线 Ctrl+U" },
            { label:"S̶", cmd:"strikeThrough", style:{} as React.CSSProperties, title:"删除线" },
          ] as const).map(t => (
            <button key={t.cmd} type="button" title={t.title}
              onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
              style={{ minWidth:32, height:28, borderRadius:5, border:"none", background:"transparent", cursor:"pointer", fontSize:13, ...t.style, color:"#374151", padding:"0 6px" }}
              onMouseEnter={e => (e.currentTarget.style.background="#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
              {t.label}
            </button>
          ))}
          <div style={{ width:1, height:18, background:"#e5e7eb", margin:"0 4px" }} />
          {([
            { label:"H1", block:"h1" }, { label:"H2", block:"h2" }, { label:"H3", block:"h3" }, { label:"正文", block:"p" }
          ] as const).map(t => (
            <button key={t.block} type="button"
              onMouseDown={e => { e.preventDefault(); exec("formatBlock", t.block); }}
              style={{ minWidth:32, height:28, borderRadius:5, border:"none", background:"transparent", cursor:"pointer", fontSize:12, color:"#374151", padding:"0 6px", fontWeight:600 }}
              onMouseEnter={e => (e.currentTarget.style.background="#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
              {t.label}
            </button>
          ))}
          <div style={{ width:1, height:18, background:"#e5e7eb", margin:"0 4px" }} />
          {([
            { label:"≡", cmd:"insertUnorderedList", title:"无序列表" },
            { label:"1.", cmd:"insertOrderedList", title:"有序列表" },
          ] as const).map(t => (
            <button key={t.cmd} type="button" title={t.title}
              onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
              style={{ minWidth:32, height:28, borderRadius:5, border:"none", background:"transparent", cursor:"pointer", fontSize:13, color:"#374151", padding:"0 6px" }}
              onMouseEnter={e => (e.currentTarget.style.background="#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
              {t.label}
            </button>
          ))}
          <div style={{ width:1, height:18, background:"#e5e7eb", margin:"0 4px" }} />
          {([
            { label:"左", cmd:"justifyLeft" }, { label:"中", cmd:"justifyCenter" }, { label:"右", cmd:"justifyRight" },
          ] as const).map(t => (
            <button key={t.cmd} type="button"
              onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
              style={{ minWidth:28, height:28, borderRadius:5, border:"none", background:"transparent", cursor:"pointer", fontSize:12, color:"#374151", padding:"0 4px" }}
              onMouseEnter={e => (e.currentTarget.style.background="#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
              {t.label}
            </button>
          ))}
          <div style={{ width:1, height:18, background:"#e5e7eb", margin:"0 4px" }} />
          {/* Image upload */}
          <button type="button" title="插入图片" onClick={() => imgInputRef.current?.click()}
            style={{ minWidth:32, height:28, borderRadius:5, border:"none", background:"transparent", cursor:"pointer", fontSize:12, color:"#374151", padding:"0 6px", display:"flex", alignItems:"center", gap:3 }}
            onMouseEnter={e => (e.currentTarget.style.background="#e5e7eb")}
            onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
            <ImageIcon size={13} /> 图片
          </button>
          <input ref={imgInputRef} type="file" accept="image/*" style={{ display:"none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) insertMedia(f); e.target.value=""; }} />
          {/* Video upload */}
          <button type="button" title="插入视频" onClick={() => videoInputRef.current?.click()}
            style={{ minWidth:32, height:28, borderRadius:5, border:"none", background:"transparent", cursor:"pointer", fontSize:12, color:"#374151", padding:"0 6px", display:"flex", alignItems:"center", gap:3 }}
            onMouseEnter={e => (e.currentTarget.style.background="#e5e7eb")}
            onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
            <Film size={13} /> 视频
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" style={{ display:"none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) insertMedia(f); e.target.value=""; }} />
          <div style={{ marginLeft:"auto", fontSize:11, color:"#9ca3af", display:"flex", gap:12 }}>
            <span>Ctrl+B 加粗</span><span>Ctrl+I 斜体</span><span>Ctrl+S 保存</span>
          </div>
        </div>

        {/* Editor area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          style={{ flex:1, padding:"28px 32px", fontSize:15, lineHeight:1.9, color:"#1f2937", outline:"none", overflowY:"auto", minHeight:320, fontFamily:"inherit" }}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } }}
        />
      </div>
    </div>
  );
}

// ── Login Modal ────────────────────────────────────────────────────────────
function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const signInProfile = useAppStore((s) => s.signInProfile);
  const notify = useAppStore((s) => s.notify);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"input" | "sent" | "local">("input");
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { signInWithEmail } = await import("./services/supabaseService");
      const { error } = await signInWithEmail(email.trim());
      if (error) throw new Error(error);
      setStep("sent");
    } catch {
      // Supabase not configured or failed → fall back to local auth
      signInProfile({ email: email.trim(), displayName: name.trim() || undefined });
      notify(english ? "Signed in locally (no Supabase configured)" : "已本地登录（未配置云同步）");
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const continueLocal = () => {
    setStep("local");
    if (name.trim()) signInProfile({ email: "local@lumo.app", displayName: name.trim() });
    else signInProfile({ email: "local@lumo.app", displayName: "Lumo 用户" });
    notify(english ? "Continuing in local mode" : "已进入本地模式");
    onSuccess();
  };

  return (
    <div className="agent-panel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:20, padding:"36px 32px", maxWidth:400, width:"90%", boxShadow:"0 24px 80px rgba(0,0,0,0.18)", display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
        {/* Brand */}
        <img src="/media/lumo-app-icon-new.svg" width={52} height={52} style={{ borderRadius:14, marginBottom:14, boxShadow:"0 8px 24px rgba(99,102,241,0.2)" }} alt="Lumo" />
        <h2 style={{ margin:"0 0 6px", fontSize:20, fontWeight:800 }}>{english ? "Welcome to Lumo" : "欢迎使用 Lumo"}</h2>
        <p style={{ margin:"0 0 24px", fontSize:13, color:"#6b7280", textAlign:"center", lineHeight:1.5 }}>
          {english ? "Sign in to sync your research across devices" : "登录后可跨设备同步你的研究数据"}
        </p>

        {step === "sent" ? (
          <div style={{ textAlign:"center", padding:"16px 0" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📬</div>
            <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700 }}>{english ? "Check your email" : "请查收邮件"}</h3>
            <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.6 }}>
              {english ? `We sent a login link to ${email}. Click the link to sign in.` : `已向 ${email} 发送登录链接，点击链接即可登录。`}
            </p>
            <button onClick={onClose} style={{ marginTop:20, padding:"8px 24px", borderRadius:10, border:"none", background:"#6366f1", color:"#fff", fontWeight:700, cursor:"pointer" }}>
              {english ? "Got it" : "知道了"}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleMagicLink} style={{ width:"100%", display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{english ? "Email" : "邮箱"}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  style={{ padding:"10px 12px", borderRadius:10, border:"1.5px solid #e5e7eb", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }}
                  onFocus={e => e.target.style.borderColor = "#a78bfa"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{english ? "Display name (optional)" : "昵称（可选）"}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={english ? "Your name" : "你的名字"}
                  style={{ padding:"10px 12px", borderRadius:10, border:"1.5px solid #e5e7eb", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }}
                  onFocus={e => e.target.style.borderColor = "#a78bfa"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
              <button type="submit" disabled={loading || !email.trim()}
                style={{ padding:"11px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#a78bfa,#6366f1)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", opacity:(!email.trim() || loading) ? 0.6 : 1 }}>
                {loading ? (english ? "Sending…" : "发送中…") : (english ? "Send login link" : "发送登录链接")}
              </button>
            </form>

            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0", width:"100%" }}>
              <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
              <span style={{ fontSize:12, color:"#9ca3af" }}>{english ? "or" : "或"}</span>
              <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
            </div>

            <button onClick={continueLocal} style={{ width:"100%", padding:"10px", borderRadius:10, border:"1.5px solid #e5e7eb", background:"#fff", color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer" }}>
              {english ? "Continue in local mode (no sync)" : "以本地模式使用（不同步）"}
            </button>
            <p style={{ margin:"12px 0 0", fontSize:11, color:"#9ca3af", textAlign:"center", lineHeight:1.5 }}>
              {english ? "Local mode: data stays in this browser only" : "本地模式：数据仅保存在当前浏览器，不会上传"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileView() {
  const profile = useAppStore((s) => s.userProfile);
  const sources = useAppStore((s) => s.sources);
  const notes = useAppStore((s) => s.notes);
  const projects = useAppStore((s) => s.projects);
  const signOutProfile = useAppStore((s) => s.signOutProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const notify = useAppStore((s) => s.notify);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [draft, setDraft] = useState({
    displayName: profile.displayName,
    bio: profile.bio,
    role: profile.role,
    location: profile.location,
    website: profile.website ?? "",
    plan: profile.plan,
  });
  const saveDraft = () => { updateProfile(draft); notify("个人资料已保存"); };
  const handleAvatarFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: String(reader.result) });
    reader.onerror = () => notify("头像读取失败，请换一张图片");
    reader.readAsDataURL(file);
  };
  const activeSourceCount = sources.filter((source) => source.status !== "deleted").length;
  const planName: Record<string, string> = {
    starter: "Starter 免费", pro: "Pro 专业版", studio: "Studio 创作版",
    team: "Team 协作版", enterprise: "Enterprise 企业版",
  };
  const stats = [
    { label: "收藏资料", value: activeSourceCount },
    { label: "阅读笔记", value: notes.length },
    { label: "研究项目", value: projects.length },
  ];
  return (
    <section className="content profile-page">
      <section className="profile-hero panel">
        <div className="profile-hero-glow" />
        <div className="profile-hero-main">
          <div className="profile-avatar-col">
            <AvatarBubble name={profile.displayName} avatar={profile.avatar} size="lg" />
            <input ref={avatarInputRef} className="visually-hidden" type="file" accept="image/*" onChange={(event) => handleAvatarFile(event.currentTarget.files?.[0])} />
            <button className="profile-avatar-btn" onClick={() => avatarInputRef.current?.click()} type="button">
              <Upload size={13} /> 更换头像
            </button>
          </div>
          <div className="profile-hero-body">
            <div className="profile-badge-row">
              <Badge tone={profile.isAuthenticated ? "green" : "yellow"}>{profile.isAuthenticated ? "已登录" : "本地模式"}</Badge>
              <Badge tone="blue">{planName[profile.plan]}</Badge>
            </div>
            <h2 className="profile-name">{profile.displayName}</h2>
            {profile.role && <p className="profile-role">{profile.role}</p>}
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stat-row">
              {stats.map((item) => (
                <div key={item.label} className="profile-stat-item">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="profile-edit-grid">
        {/* Account card — login/logout state */}
        <article className="panel profile-account-card">
          <div className="profile-card-header">
            <ShieldCheck size={20} />
            <div>
              <h3>账号</h3>
              <p>{profile.isAuthenticated ? "已通过邮箱登录，数据可云同步" : "本地模式，数据仅保存在当前浏览器"}</p>
            </div>
          </div>
          {profile.isAuthenticated ? (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px", borderRadius:10, background:"#f0fdf4", border:"1px solid #86efac" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"#22c55e", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:14 }}>{profile.displayName[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:"#166534" }}>{profile.displayName}</div>
                  <div style={{ fontSize:11, color:"#16a34a" }}>{profile.email}</div>
                </div>
                <Badge tone="green">已登录</Badge>
              </div>
              <div className="profile-account-actions">
                <Button onClick={() => setLogoutConfirm(true)}>
                  <LogOut size={13} /> 退出登录
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ padding:"12px", borderRadius:10, background:"#fffbeb", border:"1px solid #fde68a", fontSize:13, color:"#92400e", lineHeight:1.5 }}>
                当前为本地模式。登录后可开启跨设备云同步，数据不会丢失。
              </div>
              <div className="profile-account-actions">
                <Button variant="primary" onClick={() => setLoginOpen(true)}>
                  <LogIn size={13} /> 登录 / 注册
                </Button>
              </div>
            </div>
          )}
        </article>

        <article className="panel profile-edit-card">
          <div className="profile-card-header">
            <UserCircle size={20} />
            <div>
              <h3>个人资料</h3>
              <p>显示在侧边栏和资料页的基本信息。</p>
            </div>
          </div>
          <div className="pf-grid">
            <div className="pf-field">
              <label className="pf-label"><User size={13} /> 昵称</label>
              <input className="pf-input" value={draft.displayName} onChange={e => setDraft({...draft, displayName: e.target.value})} placeholder="你的名字" />
            </div>
            <div className="pf-field">
              <label className="pf-label"><Briefcase size={13} /> 身份 / 职业</label>
              <input className="pf-input" value={draft.role} onChange={e => setDraft({...draft, role: e.target.value})} placeholder="产品经理 / 研究员 / ..." />
            </div>
            <div className="pf-field">
              <label className="pf-label"><MapPin size={13} /> 城市 / 地区</label>
              <input className="pf-input" value={draft.location} onChange={e => setDraft({...draft, location: e.target.value})} placeholder="上海 / 北京 / ..." />
            </div>
            <div className="pf-field">
              <label className="pf-label"><Globe2 size={13} /> 个人网站</label>
              <input className="pf-input" value={draft.website} onChange={e => setDraft({...draft, website: e.target.value})} placeholder="https://..." type="url" />
            </div>
            <div className="pf-field pf-field-wide">
              <label className="pf-label"><Sparkles size={13} /> 订阅方案</label>
              <div className="pf-plan-cards">
                {(["starter","pro","studio"] as const).map(p => {
                  const labels: Record<string, [string, string]> = {
                    starter: ["Starter", "免费 · 基础功能"],
                    pro: ["Pro", "¥49/月 · 全功能"],
                    studio: ["Studio", "¥99/月 · 全功能+协作"],
                  };
                  return (
                    <button key={p} type="button"
                      className={`pf-plan-card ${draft.plan === p ? "active" : ""}`}
                      onClick={() => setDraft({...draft, plan: p})}>
                      <strong>{labels[p][0]}</strong>
                      <span>{labels[p][1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pf-field pf-field-wide">
              <label className="pf-label"><MessageSquare size={13} /> 个人简介</label>
              <textarea className="pf-input pf-textarea" value={draft.bio} onChange={e => setDraft({...draft, bio: e.target.value})} rows={3} placeholder="用 Lumo 收集资料，沉淀笔记…" />
            </div>
          </div>
          <div className="actions"><Button variant="primary" onClick={saveDraft}>保存资料</Button></div>
        </article>
      </section>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onSuccess={() => setLoginOpen(false)} />}
      {logoutConfirm && (
        <div className="agent-panel-overlay" onClick={e => e.target === e.currentTarget && setLogoutConfirm(false)}>
          <div style={{ background:"#fff", borderRadius:16, padding:"28px 32px", maxWidth:360, width:"90%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize:28, marginBottom:10 }}>👋</div>
            <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700 }}>确认退出登录？</h3>
            <p style={{ margin:"0 0 20px", fontSize:13, color:"#6b7280", lineHeight:1.6 }}>退出后本地数据不受影响，仅断开云同步。下次用同邮箱登录即可恢复。</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={() => setLogoutConfirm(false)}
                style={{ padding:"8px 20px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontWeight:600, cursor:"pointer" }}>取消</button>
              <button onClick={() => { signOutProfile(); setLogoutConfirm(false); }}
                style={{ padding:"8px 20px", borderRadius:8, border:"none", background:"#ef4444", color:"#fff", fontWeight:700, cursor:"pointer" }}>确认退出</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
function RichDocument({ content }: { content: string }) {
  const blocks = parseRichDocument(content);
  return (
    <div className="rich-doc">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h1": return <h4 key={index}>{block.text}</h4>;
          case "h2": return <h5 key={index}>{block.text}</h5>;
          case "hr": return <hr key={index} className="rich-divider" />;
          case "image": return <img key={index} src={block.src} alt={block.alt} className="rich-image" />;
          case "blockquote": return <blockquote key={index} className="rich-quote">{renderInlineMarkdown(block.text)}</blockquote>;
          case "table": return <RichTable key={index} rows={block.rows} />;
          case "list": return <ul key={index}>{block.items.map((item) => <li key={item}>{renderInlineMarkdown(item)}</li>)}</ul>;
          case "numbered": return <ol key={index}>{block.items.map((item) => <li key={item}>{renderInlineMarkdown(item)}</li>)}</ol>;
          default: return <p key={index}>{renderInlineMarkdown(block.text)}</p>;
        }
      })}
    </div>
  );
}

type RichBlock =
  | { type: "h1" | "h2" | "p"; text: string }
  | { type: "hr" }
  | { type: "image"; src: string; alt: string }
  | { type: "blockquote"; text: string }
  | { type: "list" | "numbered"; items: string[] }
  | { type: "table"; rows: string[][] };

function parseRichDocument(content: string): RichBlock[] {
  const lines = content.split("\n").map((line) => line.trimEnd());
  const blocks: RichBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    if (/^---+$/.test(line)) { blocks.push({ type: "hr" }); index += 1; continue; }
    if (line.startsWith("### ")) { blocks.push({ type: "h2", text: line.replace(/^###\s+/, "") }); index += 1; continue; }
    if (line.startsWith("## ")) { blocks.push({ type: "h2", text: line.replace(/^##\s+/, "") }); index += 1; continue; }
    if (line.startsWith("# ")) { blocks.push({ type: "h1", text: line.replace(/^#\s+/, "") }); index += 1; continue; }
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) { blocks.push({ type: "image", alt: imgMatch[1], src: imgMatch[2] }); index += 1; continue; }
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const row = lines[index].trim().split("|").map((cell) => cell.trim()).filter(Boolean);
        if (!row.every((cell) => /^[-: ]+$/.test(cell))) rows.push(row);
        index += 1;
      }
      if (rows.length) blocks.push({ type: "table", rows });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "numbered", items });
      continue;
    }
    blocks.push({ type: "p", text: line });
    index += 1;
  }
  return blocks;
}
function RichTable({ rows }: { rows: string[][] }) {
  if (!rows.length) return null;
  const [head, ...body] = rows;
  return (
    <table className="rich-table">
      <thead><tr>{head.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
      <tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{renderInlineMarkdown(cell)}</td>)}</tr>)}</tbody>
    </table>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Split on links, bold, italic, code
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    const key = `${index}-${part.slice(0, 8)}`;
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) return <a key={key} href={linkMatch[2]} target="_blank" rel="noreferrer">{linkMatch[1]}</a>;
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) return <strong key={key}>{boldMatch[1]}</strong>;
    const italicMatch = part.match(/^\*([^*]+)\*$/);
    if (italicMatch) return <em key={key}>{italicMatch[1]}</em>;
    const codeMatch = part.match(/^`([^`]+)`$/);
    if (codeMatch) return <code key={key} className="inline-code">{codeMatch[1]}</code>;
    return <span key={key}>{part}</span>;
  });
}

function ReviewView() {
  const sources = useAppStore((s) => s.sources);
  const setSelectedSource = useAppStore((s) => s.setSelectedSource);
  const addSourceToProject = useAppStore((s) => s.addSourceToProject);
  const archiveSource = useAppStore((s) => s.archiveSource);
  const generateInsightsForProject = useAppStore((s) => s.generateInsightsForProject);
  const projectId = useAppStore((s) => s.selectedProjectId) ?? useAppStore.getState().projects[0]?.id;
  const groups = ["7 天前收藏", "30 天前收藏", "被遗忘但有价值", "最近重新相关", "关联活跃项目"];
  return <section className="content">{groups.map((group, index) => <div className="review-group" key={group}><h2>{group}</h2><div className="card-grid">{sources.slice(index, index + 3).map((source) => <article className="simple-card" key={`${group}-${source.id}`}><h3>{source.title}</h3><p>原始目的：{purposeLabel(source.purpose)}。Lumo 建议重新查看，因为它可以支持当前研究。</p><div className="actions"><Button onClick={() => setSelectedSource(source.id)}>重新阅读</Button><Button onClick={() => projectId && addSourceToProject(source.id, projectId)}>加入项目</Button><Button onClick={() => projectId && generateInsightsForProject(projectId)}>创建洞察</Button><Button onClick={() => archiveSource(source.id)}>归档</Button></div></article>)}</div></div>)}</section>;
}

function TagsPurposeView() {
  const sources = useAppStore((s) => s.sources);
  const claims = useAppStore((s) => s.claims);
  const evidence = useAppStore((s) => s.evidence);
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = Array.from(new Set(sources.flatMap((source) => source.tags)));
  const taggedSources = activeTag ? sources.filter((s) => s.tags.includes(activeTag)) : [];
  const taggedClaims = activeTag ? claims.filter((c) => c.tags?.includes(activeTag)) : [];
  const taggedEvidence = activeTag ? evidence.filter((e) => e.sourceTitle?.toLowerCase().includes(activeTag.toLowerCase())) : [];
  return (
    <section className="content">
      <div className="section-head"><div><h2>{english ? "Tags" : "标签"}</h2><p>{english ? "Click a tag to see all related items." : "点击标签查看关联资料、观点和证据。"}</p></div></div>
      <div className="tag-cloud">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`tag-filter-chip ${activeTag === tag ? "active" : ""}`}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
          >
            #{tag} <span>{sources.filter((s) => s.tags.includes(tag)).length}</span>
          </button>
        ))}
      </div>
      {activeTag && (
        <div className="tag-results">
          <h3>#{activeTag}</h3>
          {taggedSources.length > 0 && (
            <div className="tag-result-group">
              <strong>{english ? "Sources" : "资料"} ({taggedSources.length})</strong>
              <div className="tag-result-list">{taggedSources.map((s) => <div key={s.id} className="tag-result-item"><Globe2 size={13} />{s.title}</div>)}</div>
            </div>
          )}
          {taggedClaims.length > 0 && (
            <div className="tag-result-group">
              <strong>{english ? "Claims" : "观点"} ({taggedClaims.length})</strong>
              <div className="tag-result-list">{taggedClaims.map((c) => <div key={c.id} className="tag-result-item"><Lightbulb size={13} />{c.text}</div>)}</div>
            </div>
          )}
          {taggedEvidence.length > 0 && (
            <div className="tag-result-group">
              <strong>{english ? "Evidence" : "证据"} ({taggedEvidence.length})</strong>
              <div className="tag-result-list">{taggedEvidence.map((e) => <div key={e.id} className="tag-result-item"><ShieldCheck size={13} />{e.text}</div>)}</div>
            </div>
          )}
          {taggedSources.length === 0 && taggedClaims.length === 0 && taggedEvidence.length === 0 && (
            <p className="tag-empty">{english ? "No items with this tag yet." : "还没有带这个标签的内容。"}</p>
          )}
        </div>
      )}
    </section>
  );
}

function ImportExportView() {
  const notify = useAppStore((s) => s.notify);
  const addSource = useAppStore((s) => s.addSource);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState("尚未导入插件采集记录。");
  const importExtensionFile = async (file?: File) => {
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { clips?: ExtensionClip[] } | ExtensionClip[];
      const clips = Array.isArray(parsed) ? parsed : parsed.clips ?? [];
      if (!clips.length) {
        setImportResult("没有识别到 clips 数组，请确认使用的是 Lumo 插件导出的 JSON。");
        notify("导入失败：未找到插件采集记录");
        return;
      }
      clips.slice(0, 80).forEach((clip) => addSource(extensionClipToSourcePayload(clip)));
      useAppStore.getState().setActiveView("sources");
      setImportResult(`已导入 ${clips.length} 条插件采集记录，截图、链接和正文片段已进入资料库。`);
      notify(`已导入 ${clips.length} 条插件采集记录`);
    } catch {
      setImportResult("JSON 解析失败，请重新从插件弹窗导出。");
      notify("导入失败：JSON 格式不正确");
    }
  };
  const imports = [
    {
      label: "Chrome 插件 JSON",
      description: "选择插件弹窗导出的 JSON，真实网页截图、链接、选中文本和正文片段会直接进入资料库。",
      actionLabel: "选择 JSON",
      onClick: () => importInputRef.current?.click(),
    },
    {
      label: "CSV 模板",
      description: "下载可填写的 CSV 模板，用于批量导入标题、链接、类型和用途。",
      actionLabel: "下载模板",
      onClick: () => downloadTextFile("lumo-import-template.csv", "title,url,type,purpose,note\n示例资料,https://example.com,article,later_reading,导入说明\n", "text/csv;charset=utf-8"),
    },
    {
      label: "Markdown 模板",
      description: "下载 Markdown 导入样例，适合从笔记整理后再导入 Lumo。",
      actionLabel: "下载模板",
      onClick: () => downloadTextFile("lumo-import-template.md", "# 示例资料\n\n来源：https://example.com\n\n正文片段...\n", "text/markdown;charset=utf-8"),
    },
  ] as const;
  const exports = [
    { label: "JSON 全量包", description: "导出资料、观点、证据、洞察与成果的完整结构。", actionLabel: "导出 JSON", onClick: () => exportSourceBundle(useAppStore.getState()) },
    { label: "Markdown 文档", description: "导出适合文档协作的 Markdown 资料合集。", actionLabel: "导出 Markdown", onClick: () => exportSourcesMarkdown(useAppStore.getState()) },
    { label: "CSV 清单", description: "导出可在表格中继续处理的资料清单。", actionLabel: "导出 CSV", onClick: () => exportSourcesCsv(useAppStore.getState()) },
    { label: "Word 全量文档", description: "导出可在 Microsoft Word / WPS 中继续编辑的资料库文档。", actionLabel: "导出 Word", onClick: () => exportSourcesWord(useAppStore.getState()) },
    { label: "PDF 视觉报告", description: "把资料库概览导出为可直接发送或归档的 PDF 报告。", actionLabel: "导出 PDF", onClick: () => exportSourcesVisual(useAppStore.getState(), "pdf") },
    { label: "SVG 视觉报告", description: "导出矢量版资料库概览，适合继续放进设计工具或网页。", actionLabel: "导出 SVG", onClick: () => exportSourcesVisual(useAppStore.getState(), "svg") },
    { label: "PNG 图片报告", description: "导出高清 PNG 概览图，适合放进汇报和聊天工具。", actionLabel: "导出 PNG", onClick: () => exportSourcesVisual(useAppStore.getState(), "png") },
    { label: "JPG 图片报告", description: "导出体积更小的 JPG 概览图，适合快速分享。", actionLabel: "导出 JPG", onClick: () => exportSourcesVisual(useAppStore.getState(), "jpg") },
    { label: "插件安装说明", description: "下载浏览器插件安装和快捷键说明文档。", actionLabel: "下载说明", onClick: () => downloadTextFile("lumo-extension-install.md", extensionInstallGuide()) },
  ] as const;
  return (
    <section className="content import-export-page">
      <section className="panel import-export-panel">
        <div className="section-head import-export-head">
          <div>
            <h2>导入</h2>
            <p>把插件采集记录或模板内容批量送入资料库。</p>
          </div>
        </div>
        <div className="import-status">
          <Plug size={16} />
          <span>{importResult}</span>
        </div>
        <input
          ref={importInputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void importExtensionFile(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <div className="import-export-grid">
          {imports.map((item) => (
            <Integration
              key={item.label}
              label={item.label}
              description={item.description}
              actionLabel={item.actionLabel}
              variant="import"
              onClick={item.onClick}
            />
          ))}
        </div>
      </section>
      <section className="panel import-export-panel">
        <div className="section-head import-export-head">
          <div>
            <h2>导出</h2>
            <p>按不同格式快速导出，便于协作、迁移和归档。</p>
          </div>
        </div>
        <div className="import-export-grid">
          {exports.map((item) => (
            <Integration
              key={item.label}
              label={item.label}
              description={item.description}
              actionLabel={item.actionLabel}
              variant="export"
              onClick={() => {
                void Promise.resolve(item.onClick()).then(() => {
                  notify(`${item.label} 已开始下载`);
                }).catch(() => {
                  notify(`${item.label} 导出失败，请稍后重试`);
                });
              }}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function Integration({ label, description, actionLabel, onClick, variant = "import" }: { label: string; description: string; actionLabel: string; onClick: () => void; variant?: "import" | "export" }) {
  return (
    <article className={`integration integration-${variant}`}>
      <div className="integration-copy">
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <Button className="integration-action" onClick={onClick}><Download size={15} /> {actionLabel}</Button>
    </article>
  );
}

function CommercialModelSection({ english }: { english: boolean }) {
  const currentPlan = useAppStore((s) => s.userProfile.plan);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const notify = useAppStore((s) => s.notify);
  const recommended = lumoPricingPlans.find((plan) => plan.featured) ?? lumoPricingPlans[1];

  const switchPlan = (planId: string) => {
    updateProfile({ plan: planId as typeof currentPlan });
    const planName = lumoPricingPlans.find((p) => p.id === planId)?.[english ? "nameEn" : "name"] ?? planId;
    notify(english ? `Switched to ${planName} — beta access granted` : `已切换到 ${planName}，内测阶段已开放全部权限`);
  };

  return (
    <section className="commercial-model">

      <div className="pricing-grid">
        {lumoPricingPlans.map((plan) => {
          const isActive = currentPlan === plan.id;
          return (
            <article key={plan.id} className={`pricing-card plan-${plan.id} ${plan.featured ? "featured" : ""} ${isActive ? "plan-active" : ""}`}>
              <div className="pricing-card-head">
                <Badge tone={plan.tone}>{english ? plan.badgeEn : plan.badge}</Badge>
                {plan.featured && <span className="recommended-pill">{english ? "Recommended" : "建议主推"}</span>}
                {isActive && <span className="active-plan-pill">{english ? "Current" : "当前"}</span>}
              </div>
              <h4>{english ? plan.nameEn : plan.name}</h4>
              <div className="pricing-price"><strong>{plan.price}</strong><span>{english ? plan.periodEn : plan.period}</span></div>
              <p>{english ? plan.descriptionEn : plan.description}</p>
              <div className="pricing-target"><strong>{english ? "Best for" : "适合人群"}</strong><span>{english ? plan.targetEn : plan.target}</span></div>
              <div className="pricing-limits">
                {(english ? plan.limitsEn : plan.limits).map((item) => <span key={item}>{item}</span>)}
              </div>
              <ul>
                {(english ? plan.featuresEn : plan.features).map((feature) => (
                  <li key={feature}><CheckCircle2 size={15} /> {feature}</li>
                ))}
              </ul>
              <button
                className={`pricing-cta ${isActive ? "active" : ""}`}
                onClick={() => switchPlan(plan.id)}
                type="button"
              >
                {isActive
                  ? (english ? "✓ Current plan" : "✓ 当前方案")
                  : (english ? plan.ctaEn : plan.cta)}
              </button>
            </article>
          );
        })}
      </div>

      <div className="credits-addon-section">
        <div className="credits-addon-header">
          <div>
            <Badge tone="purple"><Sparkles size={14} /> {english ? "AI Credits Add-on" : "AI Credits 加购"}</Badge>
            <h3>{english ? "Need more AI power?" : "额度用完了？随时加购"}</h3>
            <p>{english ? "Top up your AI credits at any time. Credits never expire and work across all AI features." : "随时补充 AI 额度，不过期，用于摘要、观点提取、证据判断和成果生成。"}</p>
          </div>
        </div>
        <div className="credits-pack-grid">
          {[
            { credits: "1,000", price: "¥19", priceEn: "¥19", unit: english ? "credits" : "次", badge: english ? "Starter pack" : "基础包", tone: "blue" as const },
            { credits: "5,000", price: "¥85", priceEn: "¥85", unit: english ? "credits" : "次", badge: english ? "Save 10%" : "省 10%", tone: "green" as const },
            { credits: "20,000", price: "¥299", priceEn: "¥299", unit: english ? "credits" : "次", badge: english ? "Best value" : "最划算", tone: "purple" as const },
          ].map((pack) => (
            <div key={pack.credits} className="credits-pack-card">
              <Badge tone={pack.tone}>{pack.badge}</Badge>
              <div className="credits-pack-amount">
                <strong>{pack.credits}</strong>
                <span>{pack.unit}</span>
              </div>
              <div className="credits-pack-price">{pack.price}</div>
              <button
                className="credits-pack-btn"
                type="button"
                onClick={() => notify(english ? `${pack.credits} credits pack added — beta: free during testing` : `已添加 ${pack.credits} 次 AI 额度，内测期间免费使用`)}
              >
                {english ? "Add to plan" : "加购"}
              </button>
            </div>
          ))}
        </div>
        <p className="credits-note">
          <Lightbulb size={13} />
          {english ? "1 credit = 1 AI action (summary, claim extraction, evidence scoring, or deliverable generation). Subscription credits reset monthly; purchased credits never expire." : "1 次 = 1 个 AI 操作（摘要、观点提取、证据评分或成果生成）。订阅额度每月重置，加购额度永久有效。"}
        </p>
      </div>

    </section>
  );
}

// ── Supabase Settings Section ─────────────────────────────
function SupabaseSettingsSection({ english, notify }: { english: boolean; notify: (msg: string) => void }) {
  const { url: initUrl, anonKey: initKey } = supabaseService.getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(initUrl);
  const [sbKey, setSbKey] = useState(initKey);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [upgradeDismissed, setUpgradeDismissed] = useState(false);
  const allSources = useAppStore((s) => s.sources);
  const allHighlights = useAppStore((s) => s.highlights);
  const allNotes = useAppStore((s) => s.notes);
  const allClaims = useAppStore((s) => s.claims);
  const allEvidence = useAppStore((s) => s.evidence);
  const allInsights = useAppStore((s) => s.insights);
  const allDeliverables = useAppStore((s) => s.deliverables);
  const allProjects = useAppStore((s) => s.projects);
  const allCollections = useAppStore((s) => s.collections);

  useEffect(() => {
    supabaseService.getCurrentUser().then((u) => setUser(u));
  }, []);

  const saveConfig = () => {
    supabaseService.setSupabaseConfig(sbUrl.trim(), sbKey.trim());
    notify(english ? "Supabase config saved — please sign in." : "Supabase 配置已保存，请登录账号");
  };

  const handleSignIn = async () => {
    const { error } = await supabaseService.signInWithEmail(loginEmail.trim());
    if (error) notify(`❌ ${error}`);
    else notify(english ? "Magic link sent — check your email" : "已发送登录链接，请检查邮箱");
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await supabaseService.syncToSupabase({ sources: allSources, highlights: allHighlights, notes: allNotes, claims: allClaims, evidence: allEvidence, insights: allInsights, deliverables: allDeliverables, projects: allProjects, collections: allCollections });
      notify(english ? "✓ Synced to Supabase" : "✓ 已同步到 Supabase");
    } catch (e) {
      notify(`❌ Sync failed: ${(e as Error).message}`);
    } finally { setSyncing(false); }
  };

  return (
    <div className="settings-ai-key">
      <div className="settings-ai-key-row">
        <CloudSun size={18} />
        <div className="settings-ai-key-body">
          <strong>{english ? "Supabase Cloud Sync" : "Supabase 云同步"} <ProBadge /></strong>
          <small>{english ? "Real-time cross-device sync. Create a free project at supabase.com." : "跨设备实时同步。在 supabase.com 免费创建项目。"}</small>
        </div>
      </div>
      <ProGate fallback={upgradeDismissed ? null : <UpgradePrompt feature="Supabase 云同步" onClose={() => setUpgradeDismissed(true)} />}>
        <div className="settings-ai-key-input-row">
          <input type="text" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} placeholder="https://xxxx.supabase.co" className="settings-api-key-input" />
        </div>
        <div className="settings-ai-key-input-row">
          <input type="password" value={sbKey} onChange={(e) => setSbKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." className="settings-api-key-input" />
          <button type="button" className="settings-api-key-save primary" onClick={saveConfig}>{english ? "Save" : "保存"}</button>
        </div>
        {supabaseService.isSupabaseConfigured() && !user && (
          <div className="settings-ai-key-input-row">
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder={english ? "your@email.com" : "your@email.com"} className="settings-api-key-input" />
            <button type="button" className="settings-api-key-save primary" onClick={handleSignIn}>{english ? "Sign in" : "登录"}</button>
          </div>
        )}
        {user ? (
          <div className="settings-sb-row">
            <span className="settings-ai-status connected">✓ {user.email}</span>
            <button type="button" className="settings-api-key-save" onClick={handleSync} disabled={syncing}>{syncing ? "同步中…" : (english ? "Sync now" : "立即同步")}</button>
            <button type="button" className="settings-api-key-save" onClick={() => { supabaseService.signOut(); setUser(null); }}>{english ? "Sign out" : "退出登录"}</button>
          </div>
        ) : (
          <span className="settings-ai-status">
            {supabaseService.isSupabaseConfigured() ? (english ? "Configured — sign in to sync" : "已配置，登录后即可同步") : (english ? "Not configured — " : "未配置 — ")}
            {!supabaseService.isSupabaseConfigured() && <a href="https://supabase.com" target="_blank" rel="noreferrer">{english ? "Get started →" : "免费开始 →"}</a>}
          </span>
        )}
        <small style={{ color: "var(--text-muted)", fontSize: 11 }}>{english ? "Run supabase/schema.sql in your Supabase SQL editor first." : "首次使用请先在 Supabase SQL 编辑器里运行 supabase/schema.sql"}</small>
      </ProGate>
    </div>
  );
}

function SettingsView() {
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const notify = useAppStore((s) => s.notify);
  const english = isEn(language);

  // AI key state
  const [apiKey, setApiKeyState] = useState(() => aiService.getApiKey());
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const saveApiKey = () => {
    aiService.setApiKey(apiKey.trim());
    notify(english ? "API key saved" : "API Key 已保存");
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h2>{english ? "Settings" : "设置"}</h2>
        <p>{english ? "Preferences and tools — saved locally in this browser." : "偏好与工具配置，保存在当前浏览器。"}</p>
      </div>

      {/* AI Configuration */}
      <div className="settings-group">
        <p className="settings-group-label">{english ? "AI · DeepSeek" : "AI 配置 · DeepSeek"}</p>
        <div className="settings-ai-key">
          <div className="settings-ai-key-row">
            <Cpu size={18} />
            <div className="settings-ai-key-body">
              <strong>{english ? "DeepSeek API Key" : "DeepSeek API Key"}</strong>
              <small>{english ? "Powers real AI summaries, claim extraction and insight generation." : "接入后 AI 摘要、观点提取、洞察生成都将使用真实模型"}</small>
            </div>
          </div>
          <div className="settings-ai-key-input-row">
            <input
              type={apiKeyVisible ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="sk-..."
              className="settings-api-key-input"
            />
            <button type="button" className="settings-api-key-toggle" onClick={() => setApiKeyVisible((v) => !v)}>
              {apiKeyVisible ? "隐藏" : "显示"}
            </button>
            <button type="button" className="settings-api-key-save primary" onClick={saveApiKey}>
              {english ? "Save" : "保存"}
            </button>
          </div>
          {aiService.hasApiKey() ? (
            <span className="settings-ai-status connected">✓ {english ? "Connected" : "已连接"}</span>
          ) : (
            <span className="settings-ai-status">
              {english ? "Not configured — " : "未配置 — "}
              <a href="https://platform.deepseek.com" target="_blank" rel="noreferrer">{english ? "Get API key →" : "获取 API Key →"}</a>
            </span>
          )}
        </div>
      </div>

      {/* Supabase Cloud Sync */}
      <div className="settings-group">
        <p className="settings-group-label">{english ? "Cloud Sync · Supabase" : "云同步 · Supabase"}</p>
        <SupabaseSettingsSection english={english} notify={useAppStore.getState().notify} />
      </div>

      <div className="settings-group">
        <p className="settings-group-label">{english ? "Account & Data" : "账号与数据"}</p>
        <div className="settings-list">
          <button className="settings-row" onClick={() => setActiveView("profile")} type="button">
            <span className="settings-row-icon"><UserCircle size={18} /></span>
            <span className="settings-row-body">
              <strong>{english ? "Profile" : "个人中心"}</strong>
              <small>{english ? "Name, avatar, bio and plan" : "账号、头像、昵称和套餐信息"}</small>
            </span>
            <ChevronRight size={16} />
          </button>
          <button className="settings-row" onClick={() => setActiveView("import_export")} type="button">
            <span className="settings-row-icon"><Share2 size={18} /></span>
            <span className="settings-row-body">
              <strong>{english ? "Import / Export" : "导入/导出"}</strong>
              <small>{english ? "Backup, import CSV or migrate data" : "备份资料、导入 CSV 或迁移数据"}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="settings-group">
        <p className="settings-group-label">{english ? "Language" : "界面语言"}</p>
        <div className="settings-list">
          {(["zh", "en"] as AppLanguage[]).map((item) => (
            <button key={item} className={`settings-row ${language === item ? "active" : ""}`} onClick={() => setLanguage(item)} type="button">
              <span className="settings-row-icon"><Globe2 size={18} /></span>
              <span className="settings-row-body">
                <strong>{item === "zh" ? (english ? "Chinese" : "中文") : "English"}</strong>
                <small>{item === "zh" ? (english ? "Chinese product interface" : "中文产品界面") : "English product shell"}</small>
              </span>
              {language === item && <CheckCircle2 size={16} className="settings-check" />}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <p className="settings-group-label">{english ? "Theme" : "主题颜色"}</p>
        <div className="settings-theme-row">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button key={option.id} className={`settings-theme-btn ${themeMode === option.id ? "active" : ""} ${option.id}`} onClick={() => setThemeMode(option.id)} type="button">
                <span className="settings-theme-swatch"><Icon size={17} /></span>
                <strong>{english ? option.id : option.label}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-group">
        <p className="settings-group-label">{english ? "Chrome Extension" : "Chrome 插件"}</p>
        <div className="settings-extension-block">
          <div className="ext-steps">
            {(english ? [
              ["Open Chrome", <><code>chrome://extensions</code></>],
              ["Enable Developer Mode", "toggle top-right corner"],
              ["Click \"Load unpacked\"", "load the extension folder"],
              ["Select the", <><code>extension/</code> folder in this project</>],
            ] : [
              ["打开 Chrome", <><code>chrome://extensions</code></>],
              ["开启开发者模式", "右上角开关"],
              ["点击「加载已解压的扩展程序」", ""],
              ["选择项目里的", <><code>extension/</code> 文件夹</>],
            ] as [string, React.ReactNode][]).map(([title, detail], i) => (
              <div className="ext-step" key={i}>
                <span className="ext-step-num">{i + 1}</span>
                <span className="ext-step-body"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
              </div>
            ))}
          </div>
          <div className="ext-shortcuts">
            <p className="ext-shortcuts-label">{english ? "Shortcuts on any webpage" : "任意网页快捷键"}</p>
            <div className="ext-shortcut-grid">
              {[
                { keys: "⌘ Shift S", desc: english ? "Save link" : "保存链接" },
                { keys: "⌘ Shift A", desc: english ? "Article snapshot" : "文章快照" },
                { keys: "⌘ Shift X", desc: english ? "Screenshot" : "截图" },
                { keys: "⌘ Shift V", desc: english ? "Video timestamp" : "视频时间点" },
              ].map((item) => (
                <div className="ext-shortcut-row" key={item.keys}>
                  <kbd>{item.keys}</kbd>
                  <span>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CommercialModelSection english={english} />
    </div>
  );
}

function extensionInstallGuide() {
  return [
    "# Lumo Chrome 插件加载方式",
    "",
    "1. 打开 Chrome，进入 chrome://extensions",
    "2. 打开右上角“开发者模式”",
    "3. 点击“加载已解压的扩展程序”",
    "4. 选择本项目里的 extension 文件夹",
    "5. 在任意网页使用快捷键：",
    "   - Ctrl/Command + Shift + S：保存当前链接",
    "   - Ctrl/Command + Shift + A：保存文章图文快照",
    "   - Ctrl/Command + Shift + X：保存当前可视区域截图",
    "   - Ctrl/Command + Shift + V：保存视频时间点",
    "",
    "插件使用 chrome.tabs.captureVisibleTab 捕获当前标签页真实可视区域，不再使用演示占位图。",
  ].join("\n");
}

const LIBRARY_EMPTY_HINTS: Record<string, { icon: string; hint: string }> = {
  "高亮": { icon: "✏️", hint: "在阅读器里选中文字或点击段落，用高亮工具标记关键内容。" },
  "Highlights": { icon: "✏️", hint: "Open the Reader, select text or click a paragraph, then use the highlight tool." },
  "笔记": { icon: "📝", hint: "在阅读器中点击段落旁边的批注图标，或进入沉浸式阅读添加笔记。" },
  "Notes": { icon: "📝", hint: "Click the note icon next to any paragraph in the Reader, or use Immersive Reading." },
  "观点": { icon: "💡", hint: "在阅读器中点击「创建观点」，或让 AI 自动从高亮段落中提取。" },
  "Claims": { icon: "💡", hint: "Click 'Create claim' on any paragraph in the Reader, or let AI extract them." },
  "证据": { icon: "🛡️", hint: "在阅读器中点击「创建证据」，把出处、原文或数据保存下来。" },
  "Evidence": { icon: "🛡️", hint: "Click 'Create evidence' on a paragraph in the Reader to save a source or fact." },
  "洞察": { icon: "🔮", hint: "在项目工作台点击「一键洞察」，Lumo 会综合观点和证据生成跨资料判断。" },
  "Insights": { icon: "🔮", hint: "Click 'Insights' in the Project workspace to synthesize across claims and evidence." },
};

function Library({ title, children }: { title: string; children: React.ReactNode }) {
  const isEmpty = !children || (Array.isArray(children) && children.every((c) => !c));
  const emptyHint = LIBRARY_EMPTY_HINTS[title];
  return (
    <section className="content">
      <div className="section-head"><div><h2>{title}</h2><p>在 Lumo 中搜索、整理并复用结构化知识。</p></div></div>
      {isEmpty && emptyHint ? (
        <div className="library-empty-state">
          <span className="library-empty-icon">{emptyHint.icon}</span>
          <strong>还没有{title}</strong>
          <p>{emptyHint.hint}</p>
        </div>
      ) : (
        <div className="card-grid">{children}</div>
      )}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <section className="empty">{text}</section>;
}

export default function App() {
  return <AppShell />;
}
