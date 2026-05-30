import {
  Archive,
  BookOpen,
  Box,
  Brain,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  FileOutput,
  Folder,
  Globe2,
  Highlighter,
  Image as ImageIcon,
  Inbox,
  Keyboard,
  Lightbulb,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Share2,
  Sparkles,
  Star,
  Tags,
  Trash2,
  Video,
  Volume2,
  FileText,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { realCase } from "./data/realCase";
import { useAppStore } from "./store/useAppStore";
import type { ActiveView, DeliverableType, Purpose, SourceType } from "./types";
import { deliverableLabel, formatDate, purposeLabel, sourceTypeLabel, triageLabel } from "./utils/format";
import { sourceMatchesQuery } from "./utils/filters";

const nav: Array<{ id: ActiveView; label: string; icon: typeof Inbox }> = [
  { id: "inbox", label: "AI 收件箱", icon: Inbox },
  { id: "sources", label: "全部资料", icon: BookOpen },
  { id: "collections", label: "收藏夹", icon: Folder },
  { id: "projects", label: "项目空间", icon: Box },
  { id: "reader", label: "阅读器", icon: BookOpen },
  { id: "highlights", label: "高亮", icon: Highlighter },
  { id: "notes", label: "笔记", icon: MessageSquare },
  { id: "claims", label: "观点", icon: CheckCircle2 },
  { id: "evidence", label: "证据", icon: Archive },
  { id: "insights", label: "洞察", icon: Lightbulb },
  { id: "deliverables", label: "成果文档", icon: FileOutput },
  { id: "review", label: "知识回访", icon: Clock },
  { id: "tags", label: "标签", icon: Tags },
  { id: "import_export", label: "导入 / 导出", icon: Share2 },
  { id: "settings", label: "设置", icon: Settings },
];

const sourceTypes: SourceType[] = ["article", "webpage", "video", "audio", "pdf", "note", "image", "newsletter"];
const purposes: Purpose[] = ["later_reading", "project_research", "competitor_analysis", "writing_material", "interview_prep", "learning", "task_reference", "inspiration"];
const deliverableTypes: DeliverableType[] = ["prd", "competitive_analysis", "weekly_report", "interview_material", "article_outline"];
type QuickCaptureMode = "link" | "article_snapshot" | "image_snapshot" | "video_timestamp";
const shortcutCards: Array<{ keys: string; title: string; description: string; mode?: QuickCaptureMode }> = [
  { keys: "⌘ / Ctrl + K", title: "全局搜索", description: "快速查找资料、标签、观点、证据。" },
  { keys: "⌘ / Ctrl + Shift + S", title: "快速收藏当前链接", description: "模拟浏览器插件一键保存当前网页。", mode: "link" },
  { keys: "⌘ / Ctrl + Shift + A", title: "保存文章图文快照", description: "保存标题、URL、摘要、封面图和正文片段。", mode: "article_snapshot" },
  { keys: "⌘ / Ctrl + Shift + X", title: "保存网页截图", description: "保存图片区域、页面截图、来源链接和说明。", mode: "image_snapshot" },
  { keys: "⌘ / Ctrl + Shift + V", title: "收藏视频时间点", description: "保存视频链接、时间点、截图和笔记。", mode: "video_timestamp" },
  { keys: "?", title: "查看快捷键", description: "打开 Lumo 快捷搜集说明。" },
];
const mediaAssets = [
  { type: "image", label: "图片资料", title: "Lumo 智能卡片列表", path: "/media/lumo-card-ui-generated.png", icon: ImageIcon, description: "Image-2 生成的高质感资料卡片视觉，用作图片资料和列表缩略图。" },
  { type: "video", label: "视频资料", title: "收藏到成果流程演示", path: "/media/lumo-demo.mp4", fallback: "/media/lumo-demo.gif", icon: Video, description: "视频样例：动态展示从收藏到成果的流转。" },
  { type: "audio", label: "音频资料", title: "Lumo 研究简报音频", path: "/media/lumo-briefing.wav", icon: Volume2, description: "音频样例：访谈、播客、会议或语音备忘。" },
  { type: "text", label: "文本资料", title: "Lumo 研究样例文本", path: "/media/lumo-research-note.txt", icon: FileText, description: "文本样例：可导入 AI Inbox 的本地研究资料。" },
] as const;

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "green" | "purple" | "yellow" | "red" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Button({ children, onClick, variant = "secondary", type = "button" }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; type?: "button" | "submit" }) {
  return <button className={`button ${variant}`} onClick={onClick} type={type}>{children}</button>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </div>
        {children}
      </section>
    </div>
  );
}

function AppShell() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);
  const notify = useAppStore((s) => s.notify);
  const [addOpen, setAddOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [quickMode, setQuickMode] = useState<QuickCaptureMode>("link");
  const searchRef = useRef<HTMLInputElement>(null);
  const page = nav.find((item) => item.id === activeView);

  const openQuickCapture = (mode: QuickCaptureMode = "link") => {
    setQuickMode(mode);
    setQuickOpen(true);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
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

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><img src="/media/lumo-app-icon.svg" alt="Lumo" /><span>Lumo</span></div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`nav-item ${activeView === item.id ? "active" : ""}`} onClick={() => setActiveView(item.id)}>
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="account">
          <strong>Lumo</strong>
          <span>Demo User</span>
        <Badge tone="blue">免费方案</Badge>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{page?.label ?? "Lumo"}</h1>
            <p>{pageDescription(activeView)}</p>
          </div>
          <label className="search">
            <Search size={17} />
            <input ref={searchRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="搜索资料、笔记、观点、证据..." />
          </label>
          <Button onClick={() => setAddOpen(true)} variant="primary"><Plus size={16} /> 添加资料</Button>
          <Button onClick={() => openQuickCapture("link")}><Sparkles size={16} /> 快速收藏</Button>
          <Button onClick={() => notify("当前演示可生成成果文档，真实文件导出接口已预留")}><FileOutput size={16} /> 导出</Button>
        </header>
        <ViewRouter onCapture={openQuickCapture} />
      </main>
      {addOpen && <AddSourceModal onClose={() => setAddOpen(false)} />}
      {quickOpen && <QuickCaptureModal initialMode={quickMode} onClose={() => setQuickOpen(false)} />}
      {shortcutOpen && <ShortcutModal onCapture={openQuickCapture} onClose={() => setShortcutOpen(false)} />}
      {toast && <button className="toast" onClick={clearToast}>{toast}</button>}
    </div>
  );
}

function pageDescription(view: ActiveView) {
  const descriptions: Record<ActiveView, string> = {
    inbox: "让 Lumo 判断哪些资料值得你先看。",
    sources: "搜索、筛选、预览并整理所有收藏资料。",
    collections: "Cubox 式收藏夹，并支持一键转为研究项目。",
    projects: "把资料转成观点、证据、洞察和成果的研究工作台。",
    reader: "清爽阅读体验，支持摘要、高亮、笔记和结构化处理。",
    highlights: "集中管理高亮，并转换为可复用证据。",
    notes: "集中管理阅读笔记，便于回访、转换和项目复用。",
    claims: "从资料和高亮中抽取出的可复用观点。",
    evidence: "支撑观点和成果文档的原文证据。",
    insights: "基于多资料、观点和证据生成的跨资料判断。",
    deliverables: "生成 PRD、竞品分析、周报、面试素材和文章大纲。",
    review: "重新激活旧资料，避免收藏后遗忘。",
    tags: "查看标签、收藏目的和资料分布。",
    import_export: "迁移、分享和导出入口，本轮先做展示。",
    settings: "本地演示设置和 MVP 信息。",
  };
  return descriptions[view];
}

function ViewRouter({ onCapture }: { onCapture: (mode?: QuickCaptureMode) => void }) {
  const activeView = useAppStore((s) => s.activeView);
  if (activeView === "inbox") return <AIInbox onCapture={onCapture} />;
  if (activeView === "sources") return <AllSources />;
  if (activeView === "collections") return <CollectionsView />;
  if (activeView === "projects") return <ProjectsView />;
  if (activeView === "reader") return <ReaderView />;
  if (activeView === "highlights") return <HighlightsView />;
  if (activeView === "notes") return <NotesView />;
  if (activeView === "claims") return <ClaimsView />;
  if (activeView === "evidence") return <EvidenceView />;
  if (activeView === "insights") return <InsightsView />;
  if (activeView === "deliverables") return <DeliverablesView />;
  if (activeView === "review") return <ReviewView />;
  if (activeView === "tags") return <TagsPurposeView />;
  if (activeView === "import_export") return <ImportExportView />;
  return <SettingsView />;
}

function AddSourceModal({ onClose }: { onClose: () => void }) {
  const addSource = useAppStore((s) => s.addSource);
  const [type, setType] = useState<SourceType>("article");
  const [purpose, setPurpose] = useState<Purpose>("later_reading");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addSource({
      title: String(form.get("title")),
      url: String(form.get("url")),
      sourceName: String(form.get("sourceName")),
      type,
      purpose,
      tags: String(form.get("tags")).split(",").map((tag) => tag.trim()).filter(Boolean),
    });
    onClose();
  };
  return (
    <Modal title="添加资料" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <input name="title" placeholder="资料标题" defaultValue="新的 AI 阅读器产品笔记" required />
        <input name="url" placeholder="URL" defaultValue="https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser" required />
        <input name="sourceName" placeholder="来源名称" defaultValue="手动收藏" />
        <div className="form-grid">
          <select value={type} onChange={(event) => setType(event.target.value as SourceType)}>{sourceTypes.map((item) => <option key={item} value={item}>{sourceTypeLabel(item)}</option>)}</select>
          <select value={purpose} onChange={(event) => setPurpose(event.target.value as Purpose)}>{purposes.map((item) => <option key={item} value={item}>{purposeLabel(item)}</option>)}</select>
        </div>
        <input name="tags" placeholder="标签，用英文逗号分隔" defaultValue="ai-reader, capture" />
        <Button type="submit" variant="primary"><Plus size={16} /> 保存到 AI 收件箱</Button>
      </form>
    </Modal>
  );
}

function QuickCaptureModal({ initialMode, onClose }: { initialMode: QuickCaptureMode; onClose: () => void }) {
  const addSource = useAppStore((s) => s.addSource);
  const [mode, setMode] = useState<QuickCaptureMode>(initialMode);
  const [purpose, setPurpose] = useState<Purpose>("project_research");
  const preset = capturePreset(mode);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title"));
    const url = String(form.get("url"));
    const note = String(form.get("note"));
    addSource({
      title,
      url,
      sourceName: preset.sourceName,
      sourceReferences: [{ label: preset.sourceName, url, note: preset.referenceNote }],
      type: preset.type,
      purpose,
      triageStatus: mode === "video_timestamp" ? "project_material" : "must_read",
      tags: [preset.tag, "quick-capture", purpose.replace("_", "-")],
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
    <Modal title="快速搜集" onClose={onClose}>
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
          <input name="title" placeholder="自动识别标题" defaultValue={preset.title} required />
          <input name="url" placeholder="当前网页 / 视频链接" defaultValue={preset.url} required />
          <div className="form-grid">
            <select value={purpose} onChange={(event) => setPurpose(event.target.value as Purpose)}>
              {purposes.map((item) => <option key={item} value={item}>{purposeLabel(item)}</option>)}
            </select>
            <input name="note" placeholder="补一句收藏原因，可选" defaultValue={preset.note} />
          </div>
          <div className="snapshot-checklist">
            {preset.checklist.map((item) => <span key={item}><CheckCircle2 size={14} /> {item}</span>)}
          </div>
          <Button type="submit" variant="primary"><Camera size={16} /> 保存到 AI 收件箱</Button>
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
      title: "CeraVe 官方产品页：保湿洁面核心卖点",
      url: "https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
      note: "保存官方页面，后续拆卖点和证据。",
      sourceName: "Lumo 快捷收藏",
      type: "webpage" as SourceType,
      tag: "link",
      referenceNote: "快捷收藏当前网页，保留页面标题、URL 和保存目的。",
      image: "/media/cleanser-source-official.png",
      icon: Link2,
      description: "保存当前网页 URL、标题和收藏目的。",
      snapshotText: "模拟浏览器插件读取当前页面标题、URL、站点和保存时间。",
      checklist: ["标题", "URL", "站点", "收藏目的"],
    },
    article_snapshot: {
      label: "文章图文快照",
      shortcut: "⌘ / Ctrl + Shift + A",
      title: "保湿洁面产品调研：成分证据与卖点拆解",
      url: "https://incidecoder.com/products/cerave-hydrating-cleanser-2",
      note: "保存正文片段、封面图和成分证据。",
      sourceName: "文章快照",
      type: "article" as SourceType,
      tag: "article-snapshot",
      referenceNote: "文章快照保留原文链接、封面图、正文片段和 AI 摘要。",
      image: "/media/cleanser-source-inci.png",
      icon: FileText,
      description: "保存标题、正文摘要、封面图、原文链接和快照状态。",
      snapshotText: "模拟生成文章快照：包含封面图、正文片段、AI Summary 和可引用原文。",
      checklist: ["封面图", "正文片段", "AI 摘要", "网页快照"],
    },
    image_snapshot: {
      label: "图文快照",
      shortcut: "工具栏点击",
      title: "洗面奶竞品货架截图与价格对比",
      url: "https://www.target.com/p/-/A-13977968",
      note: "保存货架图、价格和竞品位置。",
      sourceName: "图文快照",
      type: "image" as SourceType,
      tag: "image-snapshot",
      referenceNote: "网页截图保留可见图片区域、页面链接、说明和标签。",
      image: "/media/cleanser-source-target.png",
      icon: ImageIcon,
      description: "保存页面截图、图片说明、来源链接和标签。",
      snapshotText: "模拟截取网页视觉区域：货架、价格、相邻竞品和可见文字说明。",
      checklist: ["页面截图", "图片说明", "来源链接", "标签"],
    },
    video_timestamp: {
      label: "视频时间点",
      shortcut: "⌘ / Ctrl + Shift + V",
      title: "洗面奶测评视频：02:14 讲到清洁后不紧绷",
      url: "https://www.youtube.com/watch?v=demo&t=134s",
      note: "保存视频时间点和一句观察。",
      sourceName: "视频时间点",
      type: "video" as SourceType,
      tag: "video-timestamp",
      referenceNote: "视频时间点保留原视频链接、播放秒数、截图和备注。",
      image: "/media/lumo-video-thumb.png",
      icon: Video,
      description: "保存视频 URL、当前播放时间、截图和备注。",
      snapshotText: "模拟视频收藏：记录 02:14 时间点、视频截图、标题和一句备注。",
      checklist: ["视频链接", "时间点", "截图", "备注"],
    },
  };
  return presets[mode];
}

function StatGrid() {
  const sources = useAppStore((s) => s.sources);
  const stats = [
    ["新增资料", sources.filter((item) => item.status === "inbox").length],
    ["必须阅读", sources.filter((item) => item.triageStatus === "must_read").length],
    ["项目素材", sources.filter((item) => item.triageStatus === "project_material").length],
    ["建议归档", sources.filter((item) => item.triageStatus === "archive_suggested").length],
  ];
  return <div className="stats">{stats.map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function AIInbox({ onCapture }: { onCapture: (mode?: QuickCaptureMode) => void }) {
  const [tab, setTab] = useState("must_read");
  const sources = useFilteredSources().filter((source) => source.status === "inbox" && source.triageStatus === tab);
  return (
    <section className="content">
      <MediaLibraryStrip />
      <RealCasePanel />
      <ShortcutCapturePanel onCapture={onCapture} />
      <StatGrid />
      <div className="tabs">{["must_read", "skim", "archive_suggested", "project_material"].map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}>{triageLabel(item as never)}</button>)}</div>
      <SourceList sources={sources.map((source) => source.id)} />
    </section>
  );
}

function ShortcutCapturePanel({ onCapture }: { onCapture: (mode?: QuickCaptureMode) => void }) {
  return (
    <section className="shortcut-panel">
      <div className="section-head">
        <div>
          <Badge tone="blue">快捷搜集</Badge>
          <h2>看网页、读文章、看视频时一键保存</h2>
          <p>当前 MVP 模拟浏览器插件能力：可以快速保存链接、文章图文快照、网页截图和视频时间点，并自动进入资料卡片流。</p>
        </div>
        <Badge><Keyboard size={14} /> 按 ? 查看全部快捷键</Badge>
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
              <EvidencePreviewCard preview={cleanserPreviewData(`case-${index + 1}`, source.product, source.url) ?? cleanserPreviewData("s1", source.product, source.url)!} />
            </div>
            <div>
              <div className="case-source-head">
                <h3>{source.product}</h3>
                <a href={source.url} target="_blank" rel="noreferrer">{safeHost(source.url)}</a>
              </div>
              <p className="case-evidence">{source.evidence}</p>
              <p><strong>Lumo 用法：</strong>{source.lumoUse}</p>
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
            <article className="media-card" key={asset.type}>
              <div className="media-title"><Icon size={18} /><strong>{asset.label}</strong></div>
              <p>{asset.description}</p>
              {asset.type === "image" && <img src={asset.path} alt={asset.title} />}
              {asset.type === "video" && <video src={asset.path} poster="/media/lumo-video-thumb.png" controls muted playsInline />}
              {asset.type === "audio" && <audio src={asset.path} controls />}
              {asset.type === "text" && <iframe title={asset.title} src={asset.path} />}
              <a href={asset.path} target="_blank" rel="noreferrer">打开文件</a>
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

function sourceThumb(source: { id: string; type: SourceType; sourceName: string }) {
  if (source.sourceName === "Lumo 快捷收藏") return "/media/cleanser-source-official.png";
  if (source.sourceName === "文章快照") return "/media/cleanser-source-inci.png";
  if (source.sourceName === "图文快照") return "/media/cleanser-source-target.png";
  if (source.sourceName === "视频时间点") return "/media/lumo-video-thumb.png";
  if (source.id === "s1" || source.id === "s2") return "/media/cleanser-source-official.png";
  if (source.id === "s3") return "/media/cleanser-source-ulta.png";
  if (source.id === "s4") return "/media/cleanser-source-target.png";
  if (source.id === "s5") return "/media/cleanser-source-inci.png";
  if (source.type === "video") return "/media/lumo-demo.gif";
  if (source.type === "audio") return "/media/lumo-audio-thumb.png";
  if (source.type === "image") return "/media/lumo-card-ui-generated.png";
  if (source.type === "note" || source.type === "pdf" || source.type === "newsletter") return "/media/lumo-text-thumb.png";
  if (source.sourceName.toLowerCase().includes("perplexity")) return "/media/lumo-video-thumb.png";
  if (source.id === "s6") return "/media/lumo-card-ui-generated.png";
  return "/media/lumo-knowledge-board.png";
}

function cleanserPreviewData(key: string, title: string, url: string) {
  const host = safeHost(url);
  if (key === "s1" || title.includes("官方产品页")) {
    return { label: "官方来源", host, title: "CeraVe 产品页摘录", rows: ["适用肤质：normal to dry skin", "核心成分：3 种神经酰胺 + 透明质酸", "研究价值：定位与官方卖点"], tone: "blue" };
  }
  if (key === "s2" || title.includes("官方产品特性")) {
    return { label: "卖点拆解", host, title: "官方特性摘录", rows: ["无添加香精 / 非致痘", "MVE Delivery Technology", "NEA Seal of Acceptance"], tone: "purple" };
  }
  if (key === "s3" || title.includes("Ulta")) {
    return { label: "零售问答", host, title: "用户疑虑摘录", rows: ["敏感肌是否适合", "是否能卸妆", "组合肌 / 年轻用户边界"], tone: "green" };
  }
  if (key === "s4" || title.includes("Target")) {
    return { label: "货架比较", host, title: "竞品货架摘录", rows: ["同货架竞品：泡沫 / 酸类 / 敏感肌", "比较维度：价格、肤感、任务", "研究价值：竞品矩阵"], tone: "yellow" };
  }
  if (key === "s5" || title.includes("INCI")) {
    return { label: "成分证据", host, title: "第三方成分摘录", rows: ["神经酰胺支持屏障叙事", "透明质酸支持保湿叙事", "边界：不能夸大为治疗效果"], tone: "blue" };
  }
  return undefined;
}

function SourcePreview({ source }: { source: { id: string; title: string; url: string; type: SourceType; sourceName: string } }) {
  const preview = cleanserPreviewData(source.id, source.title, source.url);
  if (!preview) return <img className="source-thumb" src={sourceThumb(source)} alt={`${source.title} 缩略图`} />;
  return <EvidencePreviewCard preview={preview} compact />;
}

function EvidencePreviewCard({ preview, compact = false }: { preview: ReturnType<typeof cleanserPreviewData> extends undefined ? never : NonNullable<ReturnType<typeof cleanserPreviewData>>; compact?: boolean }) {
  return (
    <div className={`evidence-preview-card ${compact ? "compact" : ""} ${preview.tone}`}>
      <div className="preview-topline">
        <span>{preview.label}</span>
        <small>{preview.host}</small>
      </div>
      <strong>{preview.title}</strong>
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

function SourceList({ sources, selectedId }: { sources: string[]; selectedId?: string }) {
  return <div className="source-list">{sources.map((id) => <SourceCard key={id} sourceId={id} selected={selectedId === id} />)}</div>;
}

function SourceCard({ sourceId, compact = false, selected = false }: { sourceId: string; compact?: boolean; selected?: boolean }) {
  const source = useAppStore((s) => s.sources.find((item) => item.id === sourceId));
  const markSourceAsRead = useAppStore((s) => s.markSourceAsRead);
  const archiveSource = useAppStore((s) => s.archiveSource);
  const deleteSource = useAppStore((s) => s.deleteSource);
  const toggleSourceFavorite = useAppStore((s) => s.toggleSourceFavorite);
  const extractClaimsFromSource = useAppStore((s) => s.extractClaimsFromSource);
  const setSelectedSource = useAppStore((s) => s.setSelectedSource);
  const addSourceToProject = useAppStore((s) => s.addSourceToProject);
  const notify = useAppStore((s) => s.notify);
  const projects = useAppStore((s) => s.projects);
  if (!source) return null;
  return (
    <article className={`source-card ${compact ? "compact" : ""} ${selected ? "selected" : ""}`}>
      <span className="unread-dot" />
      <button className="source-main" onClick={() => setSelectedSource(source.id)}>
        <div className="source-copy">
          <h3>{source.title}</h3>
          <p>{source.summary}</p>
          <div className="tag-row">
            <Badge tone="blue"><Folder size={13} /> {purposeLabel(source.purpose)}</Badge>
            <Badge>{sourceTypeLabel(source.type)}</Badge>
            <Badge tone={source.triageStatus === "archive_suggested" ? "yellow" : source.triageStatus === "project_material" ? "purple" : "green"}>{triageLabel(source.triageStatus)}</Badge>
            {source.hasSnapshot && <Badge tone="green">快照</Badge>}
          </div>
        </div>
        <SourcePreview source={source} />
      </button>
      <div className="source-footer">
        <div className="source-meta">
          <span><Globe2 size={15} /> {safeHost(source.url)}</span>
          <span><Folder size={15} /> {source.collectionIds.length ? "已分类" : "未分类"}</span>
          <span>{formatDate(source.savedAt)}</span>
          <span>{source.readingTime} 分钟</span>
        </div>
        <div className="source-actions">
          <Button onClick={() => markSourceAsRead(source.id)}>已读</Button>
          <Button onClick={() => projects[0] && addSourceToProject(source.id, projects[0].id)}>入项目</Button>
          <Button onClick={() => extractClaimsFromSource(source.id)}>观点</Button>
          <Button onClick={() => archiveSource(source.id)}><Archive size={15} /></Button>
          <Button variant="ghost" onClick={() => toggleSourceFavorite(source.id)}>
            <Star className={source.isFavorite ? "star-icon active" : "star-icon"} size={15} fill={source.isFavorite ? "currentColor" : "none"} />
          </Button>
          <Button variant="ghost" onClick={() => notify("更多操作：移动、重命名、复制链接、查看出处，已在产品流程中预留")}><MoreHorizontal size={16} /></Button>
          <Button variant="danger" onClick={() => deleteSource(source.id)}><Trash2 size={15} /></Button>
        </div>
      </div>
    </article>
  );
}

function AllSources() {
  const sources = useFilteredSources();
  const notify = useAppStore((s) => s.notify);
  const selectedSourceId = useAppStore((s) => s.selectedSourceId);
  const selected = sources.find((source) => source.id === selectedSourceId) ?? sources[0];
  return (
    <section className="source-page">
      <div className="source-page-head">
        <div>
          <h2>全部资料</h2>
          <p>共 {sources.length} 项，按智能列表样式展示。</p>
        </div>
        <div className="view-switch"><button className="active">列表</button><button onClick={() => notify("网格视图已加入交互反馈，下一步可切换为图片墙布局")}>网格</button><button onClick={() => notify("筛选器已预留：类型、来源、标签、星标和项目状态")}>筛选</button></div>
      </div>
      <div className="filter-row">{["状态", "类型", "收藏夹", "标签", "目的", "项目", "有高亮", "有笔记", "有观点", "有证据"].map((item) => <Badge key={item}>{item}</Badge>)}</div>
      <SourceList sources={sources.map((source) => source.id)} selectedId={selected?.id} />
    </section>
  );
}

function CollectionsView() {
  const collections = useAppStore((s) => s.collections);
  const selectedCollectionId = useAppStore((s) => s.selectedCollectionId) ?? collections[0]?.id;
  const setSelectedCollection = useAppStore((s) => s.setSelectedCollection);
  const convertCollectionToProject = useAppStore((s) => s.convertCollectionToProject);
  const sources = useAppStore((s) => s.sources);
  const selected = collections.find((item) => item.id === selectedCollectionId);
  return (
    <section className="split">
      <div className="card-grid narrow">{collections.map((collection) => (
        <button className={`collection-card ${selected?.id === collection.id ? "active" : ""}`} key={collection.id} onClick={() => setSelectedCollection(collection.id)}>
          <h3>{collection.name}</h3><p>{collection.description}</p>
          <div className="meta-line"><span>{collection.sourceIds.length} sources</span><span>{formatDate(collection.updatedAt)}</span></div>
        </button>
      ))}</div>
      <div className="panel">
        {selected && <>
          <div className="section-head"><div><h2>{selected.name}</h2><p>{selected.description}</p></div><Button variant="primary" onClick={() => convertCollectionToProject(selected.id, `研究 ${selected.name} 并生成可复用成果。`)}><Sparkles size={16} /> 转成项目</Button></div>
          <div className="stats compact"><div className="stat"><span>资料数</span><strong>{selected.sourceIds.length}</strong></div><div className="stat"><span>未读</span><strong>{sources.filter((s) => selected.sourceIds.includes(s.id) && s.status !== "read").length}</strong></div><div className="stat"><span>高亮</span><strong>{sources.filter((s) => selected.sourceIds.includes(s.id)).reduce((sum, s) => sum + s.highlightIds.length, 0)}</strong></div></div>
          <SourceList sources={selected.sourceIds} />
        </>}
      </div>
    </section>
  );
}

function ReaderView() {
  const selectedSourceId = useAppStore((s) => s.selectedSourceId) ?? useAppStore.getState().sources[0]?.id;
  const source = useAppStore((s) => s.sources.find((item) => item.id === selectedSourceId));
  const createHighlight = useAppStore((s) => s.createHighlight);
  const createNote = useAppStore((s) => s.createNote);
  const createClaimFromParagraph = useAppStore((s) => s.createClaimFromParagraph);
  const createEvidenceFromParagraph = useAppStore((s) => s.createEvidenceFromParagraph);
  const markSourceAsRead = useAppStore((s) => s.markSourceAsRead);
  const archiveSource = useAppStore((s) => s.archiveSource);
  const notify = useAppStore((s) => s.notify);
  const [noteTarget, setNoteTarget] = useState<{ paragraph: string; index: number } | undefined>();
  const [askTarget, setAskTarget] = useState<{ paragraph: string; index: number } | undefined>();
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
  return (
    <>
      <section className="reader-shell">
        <article className="reader">
          <div className="reader-meta">
            <Badge tone="blue">{source.sourceName}</Badge><Badge>{purposeLabel(source.purpose)}</Badge><Badge tone="green">{source.snapshotStatus === "saved" ? "Snapshot saved" : source.snapshotStatus}</Badge>
          </div>
          <h2>{source.title}</h2>
          <div className="meta-line"><span>{source.url}</span><span>{formatDate(source.savedAt)}</span><span>{source.readingTime} min</span><span>{source.readingProgress}% read</span></div>
          <div className="reader-toolbar">
            <Button onClick={() => markSourceAsRead(source.id)}>标为已读</Button>
            <Button onClick={() => archiveSource(source.id)}>归档</Button>
            <Button onClick={() => notify("已生成音频简报入口：真实版本会把本文摘要转成 TTS 音频")}><Clock size={16} /> 收听</Button>
            <Button onClick={() => notify("分享链接已准备：真实版本会创建只读分享页")}><Share2 size={16} /> 分享</Button>
            <Button onClick={() => notify("已准备导出：真实版本会导出 Markdown / PDF / Notion")}><FileOutput size={16} /> 导出</Button>
          </div>
          <SourceReferenceBox source={source} />
          <section className="summary-box">
            <h3>AI 摘要</h3>
            <p>{source.summary}</p>
            <ul>{source.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
            <p><strong>阅读建议：</strong>{source.readingRecommendation}</p>
          </section>
          <section className="analysis-box">
            <h3>Lumo 结构化分析</h3>
            <div className="analysis-grid">
              <span>观点：{claims.length}</span><span>证据：{ev.length}</span><span>实体：{source.entityIds.length}</span><span>适合成果：PRD、竞品分析</span>
            </div>
          </section>
          <ReaderMediaBlock sourceType={source.type} />
          <div className="article-body">
            {source.content.map((paragraph, index) => {
              const highlight = highlightByParagraph.get(index);
              return (
              <div key={paragraph} className={`paragraph ${highlight ? `highlighted highlight-${highlight.color}` : ""}`}>
                {highlight && <span className="highlight-label">已高亮</span>}
                <p>{paragraph}</p>
                <div className="paragraph-actions">
                  <Button onClick={() => createHighlight(source.id, index)}><Highlighter size={15} /> {highlight ? "已高亮" : "高亮"}</Button>
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
        </article>
        <aside className="inspector">
          <h3>检查器</h3>
          <MiniList title="高亮" items={highlights.map((item) => item.text)} />
          <MiniList title="笔记" items={notes.map((item) => item.content)} />
          <MiniList title="观点" items={claims.map((item) => item.text)} />
          <MiniList title="证据" items={ev.map((item) => item.text)} />
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
    </>
  );
}

function NoteModal({ paragraph, onClose, onSave }: { paragraph: string; onClose: () => void; onSave: (content: string) => void }) {
  const [content, setContent] = useState(`这段值得保留，因为：${paragraph.slice(0, 80)}${paragraph.length > 80 ? "..." : ""}`);
  return (
    <Modal title="添加段落笔记" onClose={onClose}>
      <form className="form" onSubmit={(event) => { event.preventDefault(); onSave(content); }}>
        <div className="quoted-paragraph">{paragraph}</div>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} />
        <Button type="submit" variant="primary">保存笔记</Button>
      </form>
    </Modal>
  );
}

function AskLumoModal({ paragraph, sourceTitle, sourceUrl, onClose }: { paragraph: string; sourceTitle: string; sourceUrl: string; onClose: () => void }) {
  const recommendation = paragraph.includes("出处：")
    ? "这段主要承担出处说明作用，适合保留为证据来源，不建议抽象成观点。"
    : paragraph.includes("Lumo 可抽取的 Evidence")
      ? "这段已经接近证据，应优先创建证据，并在成果文档里引用原始链接。"
      : paragraph.includes("Lumo 可抽取的 Claim") || paragraph.includes("Lumo 可抽取的 Insight")
        ? "这段已经包含判断，适合创建观点，再用相邻段落或来源链接补证据。"
        : "这段可以先高亮；如果它表达判断，就创建观点，如果它提供事实、出处或原文描述，就创建证据。";
  return (
    <Modal title="问 Lumo" onClose={onClose}>
      <div className="ask-lumo">
        <div className="quoted-paragraph">{paragraph}</div>
        <div className="answer-box">
          <strong>基于当前段落的建议</strong>
          <p>{recommendation}</p>
          <p>来源资料：{sourceTitle}</p>
          <a href={sourceUrl} target="_blank" rel="noreferrer">打开原始出处</a>
        </div>
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

function ReaderMediaBlock({ sourceType }: { sourceType: SourceType }) {
  const primary =
    mediaAssets.find((asset) => asset.type === sourceType) ??
    (sourceType === "note" || sourceType === "pdf" || sourceType === "newsletter" || sourceType === "webpage" || sourceType === "article"
      ? mediaAssets.find((asset) => asset.type === "text")
      : mediaAssets[0]);
  if (!primary) return null;
  return (
    <section className="reader-media">
      <div>
        <h3>相关媒体文件</h3>
        <p>{primary.description}</p>
      </div>
      {primary.type === "image" && <img src={primary.path} alt={primary.title} />}
      {primary.type === "video" && <video src={primary.path} poster="/media/lumo-video-thumb.png" controls muted playsInline />}
      {primary.type === "audio" && <audio src={primary.path} controls />}
      {primary.type === "text" && <iframe title={primary.title} src={primary.path} />}
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return <div className="mini-list"><h4>{title}</h4>{items.length ? items.slice(0, 3).map((item) => <p key={item}>{item}</p>) : <span>暂无内容</span>}</div>;
}

function ProjectsView() {
  const projects = useAppStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId) ?? projects[0]?.id;
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const selected = projects.find((item) => item.id === selectedProjectId);
  return (
    <section className="split project-layout">
      <div className="card-grid narrow">{projects.map((project) => (
        <button key={project.id} className={`project-card ${selected?.id === project.id ? "active" : ""}`} onClick={() => setSelectedProject(project.id)}>
          <h3>{project.name}</h3><p>{project.goal}</p>
          <div className="meta-line"><span>{project.sourceIds.length} sources</span><span>{project.claimIds.length} claims</span><span>{project.insightIds.length} insights</span></div>
        </button>
      ))}</div>
      {selected && <ProjectWorkspace projectId={selected.id} />}
    </section>
  );
}

function ProjectWorkspace({ projectId }: { projectId: string }) {
  const project = useAppStore((s) => s.projects.find((item) => item.id === projectId));
  const allSources = useAppStore((s) => s.sources);
  const allClaims = useAppStore((s) => s.claims);
  const allEvidence = useAppStore((s) => s.evidence);
  const allInsights = useAppStore((s) => s.insights);
  const allDeliverables = useAppStore((s) => s.deliverables);
  const sources = useMemo(() => allSources.filter((item) => project?.sourceIds.includes(item.id)), [allSources, project]);
  const claims = useMemo(() => allClaims.filter((item) => project?.claimIds.includes(item.id) || item.projectId === projectId), [allClaims, project, projectId]);
  const evidence = useMemo(() => allEvidence.filter((item) => project?.evidenceIds.includes(item.id) || item.projectId === projectId), [allEvidence, project, projectId]);
  const insights = useMemo(() => allInsights.filter((item) => project?.insightIds.includes(item.id) || item.projectId === projectId), [allInsights, project, projectId]);
  const deliverables = useMemo(() => allDeliverables.filter((item) => project?.deliverableIds.includes(item.id) || item.projectId === projectId), [allDeliverables, project, projectId]);
  const generateInsightsForProject = useAppStore((s) => s.generateInsightsForProject);
  const generateDeliverable = useAppStore((s) => s.generateDeliverable);
  const [tab, setTab] = useState("overview");
  if (!project) return null;
  return (
    <div className="panel project-workspace">
      <div className="section-head">
        <div><h2>{project.name}</h2><p>{project.goal}</p></div>
        <div className="actions"><Button onClick={() => generateInsightsForProject(project.id)} variant="primary"><Brain size={16} /> 生成洞察</Button><Button onClick={() => generateDeliverable("prd", project.id)}><FileOutput size={16} /> 生成成果</Button></div>
      </div>
      <div className="stats compact">{[["资料", sources.length], ["观点", claims.length], ["证据", evidence.length], ["洞察", insights.length], ["成果", deliverables.length]].map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="tabs">{[["overview", "概览"], ["sources", "资料"], ["claims", "观点"], ["evidence", "证据"], ["insights", "洞察"], ["deliverables", "成果"], ["matrix", "矩阵"], ["timeline", "时间线"]].map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
      {tab === "overview" && <div className="overview-grid"><MiniList title="关键问题" items={project.keyQuestions} /><MiniList title="核心资料" items={sources.map((s) => s.title)} /><MiniList title="关键观点" items={claims.map((c) => c.text)} /><MiniList title="关键证据" items={evidence.map((e) => e.text)} /><MiniList title="关键洞察" items={insights.map((i) => i.title)} /><MiniList title="下一步建议" items={["生成 PRD", "验证高置信观点", "导出证据列表"]} /></div>}
      {tab === "sources" && <SourceList sources={sources.map((source) => source.id)} />}
      {tab === "claims" && <CardList items={claims.map((item) => [item.text, item.confidence])} />}
      {tab === "evidence" && <CardList items={evidence.map((item) => [item.text, item.type])} />}
      {tab === "insights" && <CardList items={insights.map((item) => [item.title, item.content])} />}
      {tab === "deliverables" && <CardList items={deliverables.map((item) => [item.title, item.content])} />}
      {tab === "matrix" && <Matrix />}
      {tab === "timeline" && <CardList items={["收藏夹已创建", "观点已抽取", "洞察已生成", "成果草稿已生成"].map((item, index) => [item, `步骤 ${index + 1}`])} />}
    </div>
  );
}

function Matrix() {
  const rows = ["Cubox", "Readwise Reader", "Perplexity", "Notion", "Raindrop", "Lumo"];
  return <table className="matrix"><thead><tr>{["产品", "定位", "阅读器", "高亮 / 笔记", "搜索", "差异化", "机会"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row}><td>{row}</td><td>收藏资料工作流</td><td>清爽</td><td>支持</td><td>全文搜索</td><td>{row === "Lumo" ? "证据到成果" : "偏收藏捕获"}</td><td>{row === "Lumo" ? "掌握综合生成" : "补上项目输出链路"}</td></tr>)}</tbody></table>;
}

function CardList({ items }: { items: Array<[string, string]> }) {
  const notify = useAppStore((s) => s.notify);
  return <div className="card-grid">{items.map(([title, body]) => <article className="simple-card" key={title}><h3>{title}</h3><p>{body}</p><div className="actions"><Button onClick={() => { void navigator.clipboard.writeText(`${title}\n${body}`); notify("内容已复制"); }}>复制</Button><Button onClick={() => notify("已加入当前成果草稿")}>加入成果</Button></div></article>)}</div>;
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
  const convertNoteToClaim = useAppStore((s) => s.convertNoteToClaim);
  const notify = useAppStore((s) => s.notify);
  return <Library title="笔记">{notes.map((item) => <article className="simple-card" key={item.id}><h3>{item.content}</h3><p>段落 {item.paragraphIndex ?? 1} · {formatDate(item.createdAt)}</p><div className="actions"><Button onClick={() => convertNoteToClaim(item.id)}>转为观点</Button><Button onClick={() => notify("笔记已加入当前项目")}>加入项目</Button><Button onClick={() => { void navigator.clipboard.writeText(item.content); notify("笔记已复制"); }}>复制</Button></div></article>)}</Library>;
}

function ClaimsView() {
  const claims = useAppStore((s) => s.claims);
  const notify = useAppStore((s) => s.notify);
  return <Library title="观点">{claims.map((item) => <article className="simple-card" key={item.id}><Badge tone={item.confidence === "high" ? "green" : "yellow"}>{item.confidence}</Badge><h3>{item.text}</h3><p>{item.evidenceIds.length} 条证据 · {formatDate(item.createdAt)}</p><div className="actions"><Button onClick={() => notify(`该观点关联 ${item.evidenceIds.length} 条证据`)}>查看证据</Button><Button onClick={() => notify("已转为洞察候选")}>转为洞察</Button><Button onClick={() => notify("观点已加入成果草稿")}>加入成果</Button></div></article>)}</Library>;
}

function EvidenceView() {
  const evidence = useAppStore((s) => s.evidence);
  const notify = useAppStore((s) => s.notify);
  return <Library title="证据">{evidence.map((item) => <article className="simple-card" key={item.id}><Badge tone="green">{item.type}</Badge><h3>{item.text}</h3><p>{item.sourceTitle} · {item.confidence}</p><a className="source-link" href={item.originalUrl} target="_blank" rel="noreferrer"><Globe2 size={15} /> 原始出处：{safeHost(item.originalUrl)}</a><div className="actions"><Button onClick={() => { void navigator.clipboard.writeText(`${item.text}\n出处：${item.originalUrl}`); notify("证据引用已复制"); }}>复制引用</Button><Button onClick={() => notify("证据已关联到当前观点候选")}>关联观点</Button><Button onClick={() => notify("证据已标记为高可靠")}>标记可靠</Button></div></article>)}</Library>;
}

function InsightsView() {
  const insights = useAppStore((s) => s.insights);
  const notify = useAppStore((s) => s.notify);
  return (
    <Library title="洞察">
      {insights.map((item) => (
        <article className="simple-card insight-card" key={item.id}>
          <div className="card-top">
            <Badge tone={item.priority === "high" ? "purple" : "blue"}>{item.type}</Badge>
            <Badge tone={item.priority === "high" ? "red" : item.priority === "medium" ? "yellow" : "neutral"}>{item.priority}</Badge>
          </div>
          <h3>{item.title}</h3>
          <p>{item.content}</p>
          <div className="insight-meta">
            <span>{item.evidenceIds.length} 条证据</span>
            <span>{item.suggestedDeliverables.map(deliverableLabel).join(" / ")}</span>
          </div>
          <div className="actions">
            <Button onClick={() => notify(`该洞察引用 ${item.evidenceIds.length} 条证据`)}>查看证据</Button>
            <Button onClick={() => notify("洞察已转为需求候选")}>转为需求</Button>
            <Button onClick={() => notify("洞察已标记重要")}>标记重要</Button>
          </div>
        </article>
      ))}
    </Library>
  );
}

function DeliverablesView() {
  const deliverables = useAppStore((s) => s.deliverables);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const generateDeliverable = useAppStore((s) => s.generateDeliverable);
  const notify = useAppStore((s) => s.notify);
  return (
    <section className="content">
      <div className="section-head"><div><h2>成果生成器</h2><p>从项目里的观点、证据和洞察生成结构化输出。</p></div><div className="actions">{deliverableTypes.map((type) => <Button key={type} onClick={() => selectedProjectId && generateDeliverable(type, selectedProjectId)}>{deliverableLabel(type)}</Button>)}</div></div>
      <div className="doc-grid">{deliverables.map((item) => <article className="doc-card" key={item.id}><Badge tone="purple">{deliverableLabel(item.type)}</Badge><h3>{item.title}</h3><pre>{item.content}</pre><div className="actions"><Button onClick={() => notify("已打开预览区域，当前卡片就是可复制预览")}>打开预览</Button><Button onClick={() => { void navigator.clipboard.writeText(item.content); notify("成果内容已复制"); }}>复制</Button><Button onClick={() => notify("导出已预留：Markdown / PDF / DOCX")}>导出</Button><Button onClick={() => selectedProjectId && generateDeliverable(item.type, selectedProjectId)}>重新生成</Button></div></article>)}</div>
    </section>
  );
}

function ReviewView() {
  const sources = useAppStore((s) => s.sources);
  const setSelectedSource = useAppStore((s) => s.setSelectedSource);
  const groups = ["7 天前收藏", "30 天前收藏", "被遗忘但有价值", "最近重新相关", "关联活跃项目"];
  return <section className="content">{groups.map((group, index) => <div className="review-group" key={group}><h2>{group}</h2><div className="card-grid">{sources.slice(index, index + 3).map((source) => <article className="simple-card" key={`${group}-${source.id}`}><h3>{source.title}</h3><p>原始目的：{purposeLabel(source.purpose)}。Lumo 建议重新查看，因为它可以支持当前研究。</p><div className="actions"><Button onClick={() => setSelectedSource(source.id)}>重新阅读</Button><Button>加入项目</Button><Button>创建洞察</Button><Button>归档</Button></div></article>)}</div></div>)}</section>;
}

function TagsPurposeView() {
  const sources = useAppStore((s) => s.sources);
  const tags = Array.from(new Set(sources.flatMap((source) => source.tags)));
  return <Library title="标签与收藏目的"><div className="tag-cloud">{tags.map((tag) => <Badge key={tag} tone="blue">{tag} · {sources.filter((source) => source.tags.includes(tag)).length}</Badge>)}{purposes.map((purpose) => <Badge key={purpose} tone="purple">{purposeLabel(purpose)} · {sources.filter((source) => source.purpose === purpose).length}</Badge>)}</div></Library>;
}

function ImportExportView() {
  const imports = ["Browser Bookmarks", "Pocket", "Instapaper", "Notion", "Readwise", "CSV", "Markdown"];
  const exports = ["Markdown", "HTML", "PDF", "CSV", "JSON", "Obsidian", "Notion", "Readwise"];
  return <section className="content two-cols"><Library title="导入">{imports.map((item) => <Integration key={item} label={item} />)}</Library><Library title="导出">{exports.map((item) => <Integration key={item} label={item} />)}</Library></section>;
}

function Integration({ label }: { label: string }) {
  return <article className="integration"><strong>{label}</strong><Badge>即将支持</Badge></article>;
}

function SettingsView() {
  return <section className="panel settings"><h2>Lumo MVP 设置</h2><p>这个演示在本地运行，使用 Mock 数据和 Mock AI。真实登录、同步、导入导出、TTS、浏览器插件和真实 AI API 都已预留入口，但本轮不接入。</p></section>;
}

function Library({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="content"><div className="section-head"><div><h2>{title}</h2><p>在 Lumo 中搜索、整理并复用结构化知识。</p></div></div><div className="card-grid">{children}</div></section>;
}

function EmptyState({ text }: { text: string }) {
  return <section className="empty">{text}</section>;
}

export default function App() {
  return <AppShell />;
}
