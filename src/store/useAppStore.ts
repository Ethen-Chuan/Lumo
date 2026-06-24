import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { claims, collections, deliverables, entities, evidence, highlights, insights, notes, projects, sources } from "../data/mockData";
import * as aiService from "../services/aiService";

/** Check localStorage usage and return bytes used */
export function getStorageUsageBytes(): number {
  try {
    let total = 0;
    for (const key of Object.keys(localStorage)) {
      total += (localStorage.getItem(key)?.length ?? 0) * 2; // UTF-16 = 2 bytes per char
    }
    return total;
  } catch { return 0; }
}
export const STORAGE_WARN_BYTES = 3.5 * 1024 * 1024; // warn at 3.5MB
export const STORAGE_MAX_BYTES  = 4.8 * 1024 * 1024; // ~5MB browser limit
import type {
  ActiveView,
  Claim,
  Collection,
  DeliverableType,
  Evidence,
  HighlightColor,
  Insight,
  LumoCommunityPost,
  LumoUserProfile,
  LumoVisitor,
  Note,
  Project,
  SocialPlatform,
  Source,
  TeamMember,
  TeamMemberRole,
} from "../types";
import {
  generateMockClaimFromParagraph,
  generateMockClaimsFromSource,
  generateMockDeliverable,
  generateMockEvidenceFromParagraph,
  generateMockInsights,
  generateMockProjectFromCollection,
  generateMockSummary,
} from "../utils/mockAi";

// ── Context-aware local AI reason (no API key required) ───────────────────
function inferAiReason(title: string, url: string, type: string, purpose: string): string {
  const t = title.toLowerCase();
  const domain = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  if (t.includes("duolingo") || t.includes("streak") || t.includes("habit") || t.includes("留存") || t.includes("retention"))
    return "涉及用户留存与习惯养成机制，建议提炼核心激励设计作为项目观点。";
  if (t.includes("product") || t.includes("产品") || t.includes("feature") || t.includes("功能"))
    return "产品功能相关资料，建议精读后提炼用户需求与设计决策观点。";
  if (t.includes("growth") || t.includes("增长") || t.includes("viral") || t.includes("acquisition"))
    return "增长策略相关内容，建议标注为项目素材，提炼核心驱动因素。";
  if (t.includes("ai") || t.includes("gpt") || t.includes("llm") || t.includes("模型") || t.includes("intelligence") || t.includes("agent"))
    return "AI 技术/产品内容，建议提炼功能特性和应用场景观点。";
  if (t.includes("market") || t.includes("竞品") || t.includes("competitor") || t.includes("analysis") || t.includes("分析"))
    return "竞品/市场资料，建议加入竞品分析项目并提炼差异化要点。";
  if (t.includes("case") || t.includes("案例") || t.includes("study") || t.includes("研究"))
    return "案例研究类资料，建议精读后用于支撑项目核心结论。";
  if (t.includes("report") || t.includes("报告") || t.includes("survey") || t.includes("data") || t.includes("数据"))
    return "数据报告，建议提炼关键指标和趋势数据作为项目证据。";
  if (t.includes("startup") || t.includes("创业") || t.includes("founder") || t.includes("business") || t.includes("商业"))
    return "商业/创业相关，建议提炼商业模式和关键决策逻辑。";
  if (t.includes("user") || t.includes("用户") || t.includes("customer") || t.includes("客户") || t.includes("ux"))
    return "用户研究相关，建议提炼用户痛点和核心需求洞察。";
  if (t.includes("notion") || t.includes("linear") || t.includes("figma") || t.includes("slack") || t.includes("stripe"))
    return "知名产品案例，建议提炼产品决策逻辑作为竞品参考。";
  if (domain.includes("medium") || domain.includes("substack") || domain.includes("blog"))
    return "博客/专栏文章，建议精读并高亮关键段落转为研究观点。";
  if (domain.includes("github")) return "技术资料，建议归档到技术主题夹，提炼核心实现方案。";
  if (domain.includes("youtube") || domain.includes("youtu")) return "视频资料，建议标记关键时间点，浏览后加入相关项目。";
  if (domain.includes("twitter") || domain.includes("x.com") || domain.includes("linkedin"))
    return "社交内容，略读后提炼有价值的观点归档即可。";
  if (type === "pdf")   return "PDF 文档，建议精读后提炼核心论点和关键数据。";
  if (type === "video") return "视频资料，建议标记关键时间点作为参考素材。";
  if (type === "note")  return "笔记类资料，建议整理后关联到当前活跃项目。";
  if (purpose === "project_research") return "项目研究素材，建议精读后直接加入当前活跃项目。";
  return "建议先看摘要，再高亮 1-2 段关键内容加入项目。";
}

export type ThemeMode = "light" | "dark" | "warm" | "mint";
export type NavPlacement = "left" | "top" | "right" | "bottom";
export type AppLanguage = "zh" | "en";

type CreateProjectPayload = {
  name: string;
  description?: string;
  goal: string;
  keyQuestions?: string[];
  tags?: string[];
};

type AppState = {
  sources: Source[];
  collections: Collection[];
  projects: Project[];
  highlights: typeof highlights;
  notes: Note[];
  claims: Claim[];
  evidence: Evidence[];
  entities: typeof entities;
  insights: Insight[];
  deliverables: typeof deliverables;
  userProfile: LumoUserProfile;
  communityPosts: LumoCommunityPost[];
  lumoVisitors: LumoVisitor[];
  projectTimeline: Record<string, import("../types").TimelineEntry[]>;
  inspirations: import("../types").Inspiration[];
  teamMembers: TeamMember[];
  activeView: ActiveView;
  selectedSourceId?: string;
  selectedCollectionId?: string;
  selectedProjectId?: string;
  selectedClaimId?: string;
  searchQuery: string;
  themeMode: ThemeMode;
  navPlacement: NavPlacement;
  language: AppLanguage;
  toast?: string;
  addSource: (payload: Partial<Source>) => void;
  updateSource: (id: string, patch: Partial<Source>) => void;
  archiveSource: (id: string) => void;
  deleteSource: (id: string) => void;
  toggleSourceFavorite: (id: string) => void;
  markSourceAsRead: (id: string) => void;
  markSourceAsUnread: (id: string) => void;
  updateReadingProgress: (id: string, readingProgress: number) => void;
  createCollection: (name: string, description: string) => void;
  addSourceToCollection: (sourceId: string, collectionId: string) => void;
  removeSourceFromCollection: (sourceId: string, collectionId: string) => void;
  convertCollectionToProject: (collectionId: string, goal?: string) => void;
  createProject: (payload: CreateProjectPayload) => void;
  addSourceToProject: (sourceId: string, projectId: string) => void;
  removeSourceFromProject: (sourceId: string, projectId: string) => void;
  createHighlight: (sourceId: string, paragraphIndex: number, color?: HighlightColor, startOffset?: number, endOffset?: number) => void;
  deleteHighlight: (highlightId: string) => void;
  convertHighlightToClaim: (highlightId: string) => void;
  convertHighlightToEvidence: (highlightId: string) => void;
  createNote: (sourceId: string, paragraphIndex: number, content: string, attachments?: import("../types").NoteAttachment[]) => void;
  deleteNote: (noteId: string) => void;
  convertNoteToClaim: (noteId: string) => void;
  extractClaimsFromSource: (sourceId: string) => void;
  clearClaimsFromSource: (sourceId: string) => void;
  createClaimFromParagraph: (sourceId: string, paragraphIndex: number) => void;
  createEvidenceFromParagraph: (sourceId: string, paragraphIndex: number) => void;
  linkEvidenceToClaim: (evidenceId: string, claimId: string) => void;
  generateInsightsForProject: (projectId: string) => void;
  generateDeliverable: (type: DeliverableType, projectId: string) => void;
  updateDeliverable: (id: string, content: string) => void;
  appendToDeliverable: (projectId: string, label: string, text: string, sourceTitle?: string) => void;
  updateInsight: (id: string, patch: { title?: string; content?: string }) => void;
  deleteInsight: (insightId: string) => void;
  createInsightFromAnnotation: (noteText: string, sourceTitle: string, projectId: string) => void;
  deleteDeliverable: (deliverableId: string) => void;
  deleteProject: (projectId: string) => void;
  addTimelineEntry: (entry: Omit<import("../types").TimelineEntry, "id">) => void;
  addManualCheckpoint: (projectId: string, note: string) => void;
  rollbackToCheckpoint: (projectId: string, snapshot: NonNullable<import("../types").TimelineEntry["snapshot"]>) => void;
  saveInspiration: (id: string | null, title: string, content: string) => void;
  deleteInspiration: (id: string) => void;
  setActiveView: (view: ActiveView) => void;
  setSelectedSource: (id?: string) => void;
  setSelectedCollection: (id?: string) => void;
  setSelectedProject: (id?: string) => void;
  setSelectedClaim: (id?: string) => void;
  setSearchQuery: (query: string) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setNavPlacement: (placement: NavPlacement) => void;
  setLanguage: (language: AppLanguage) => void;
  signInProfile: (payload: { email: string; displayName?: string }) => void;
  signOutProfile: () => void;
  updateProfile: (patch: Partial<LumoUserProfile>) => void;
  connectSocialPlatform: (platform: SocialPlatform, handle: string) => void;
  inviteTeamMember: (payload: { projectId: string; email: string; name?: string; role: TeamMemberRole }) => void;
  updateTeamMemberRole: (memberId: string, role: TeamMemberRole) => void;
  removeTeamMember: (memberId: string) => void;
  publishCommunityPost: (payload: { title: string; content: string; noteId?: string; sourceId?: string; tags?: string[]; visibility?: LumoCommunityPost["visibility"] }) => void;
  reactToCommunityPost: (postId: string, liked?: boolean) => void;
  addLumoVisit: (payload: { visitorName: string; visitorAvatar?: string; action: string; target: string; postId?: string }) => void;
  notify: (message: string) => void;
  clearToast: () => void;
};

export const stamp = () => new Date().toISOString();
export const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 9)}`;
const sourceProjectId = (source: Source, selectedProjectId?: string) => source.projectIds[0] ?? selectedProjectId;
const defaultProfile: LumoUserProfile = {
  id: "u_local_owner",
  displayName: "Sunjingjun",
  email: "",
  bio: "用 Lumo 收集资料、沉淀笔记，并把知识变成可分享的作品。",
  role: "独立研究者 / 产品创作者",
  location: "China",
  plan: "pro",
  lumoName: "Lumo",
  lumoMood: "正在整理今天的知识花园",
  socialLinks: {},
  isAuthenticated: false,
  joinedAt: stamp(),
};

const initialCommunityPosts: LumoCommunityPost[] = [
  {
    id: "homepost1",
    authorId: "mentor_lumo",
    authorName: "Lumo 策展员",
    title: "如何把一篇文章变成可复用知识卡？",
    content: "先保留原文链接，再抽取关键观点，最后补一条可验证证据。公开分享时建议带上出处和自己的判断。",
    tags: ["知识卡", "证据链", "公开笔记"],
    visibility: "public",
    likes: 36,
    comments: 8,
    visits: 128,
    createdAt: stamp(),
  },
  {
    id: "homepost2",
    authorId: "creator_lumo",
    authorName: "产品研究 Lumo",
    title: "我的访客会先看什么？",
    content: "Lumo 之家可以展示个人资料、精选笔记、最近项目和宠物状态。访客进入后可以点赞、留言、拜访对方的 Lumo。",
    tags: ["Lumo之家", "访客", "社群"],
    visibility: "public",
    likes: 22,
    comments: 5,
    visits: 74,
    createdAt: stamp(),
  },
];

const initialLumoVisitors: LumoVisitor[] = [
  { id: "visit1", visitorName: "Mia 的 Lumo", action: "送来一颗灵感糖", target: "个人主页", createdAt: stamp() },
  { id: "visit2", visitorName: "Noah 的 Lumo", action: "收藏了你的公开笔记", target: "知识卡片", createdAt: stamp() },
  { id: "visit3", visitorName: "Ava 的 Lumo", action: "给你的项目图谱点亮星标", target: "Lumo之家", createdAt: stamp() },
];
const initialTeamMembers: TeamMember[] = [
  { id: "tm_owner", projectId: projects[0]?.id ?? "p1", name: "Sunjingjun", email: "owner@lumo.local", role: "owner", status: "active", joinedAt: stamp(), lastActiveAt: stamp() },
  { id: "tm_demo_pm", projectId: projects[0]?.id ?? "p1", name: "产品合作者", email: "pm@lumo.local", role: "editor", status: "active", joinedAt: stamp(), lastActiveAt: stamp() },
  { id: "tm_demo_viewer", projectId: projects[0]?.id ?? "p1", name: "只读评审", email: "review@lumo.local", role: "viewer", status: "invited", joinedAt: stamp() },
];
const themeModes: ThemeMode[] = ["light", "dark", "warm", "mint"];
const navPlacements: NavPlacement[] = ["left", "top", "right", "bottom"];
const languages: AppLanguage[] = ["zh", "en"];
const initialThemeMode = (): ThemeMode => {
  if (typeof localStorage === "undefined") return "light";
  const saved = localStorage.getItem("lumo-theme-mode");
  return themeModes.includes(saved as ThemeMode) ? (saved as ThemeMode) : "light";
};
const initialNavPlacement = (): NavPlacement => {
  return "left";
};
const initialLanguage = (): AppLanguage => {
  if (typeof localStorage === "undefined") return "zh";
  const saved = localStorage.getItem("lumo-language");
  return languages.includes(saved as AppLanguage) ? (saved as AppLanguage) : "zh";
};

export const useAppStore = create<AppState>()(persist((set, get) => ({
  sources,
  collections,
  projects,
  highlights,
  notes,
  claims,
  evidence,
  entities,
  insights,
  deliverables,
  userProfile: defaultProfile,
  communityPosts: initialCommunityPosts,
  lumoVisitors: initialLumoVisitors,
  projectTimeline: {},
  inspirations: [],
  teamMembers: initialTeamMembers,
  activeView: "sources",
  selectedSourceId: sources[0].id,
  selectedCollectionId: collections[0].id,
  selectedProjectId: projects[0].id,
  searchQuery: "",
  themeMode: initialThemeMode(),
  navPlacement: initialNavPlacement(),
  language: initialLanguage(),
  addSource: (payload) => {
    const source: Source = {
      id: uid("s"),
      title: payload.title ?? "未命名资料",
      url: payload.url ?? "/media/lumo-research-note.txt",
      sourceName: payload.sourceName ?? "手动收藏",
      sourceReferences: payload.sourceReferences ?? [{ label: payload.sourceName ?? "手动收藏", url: payload.url ?? "/media/lumo-research-note.txt", note: "手动添加或快捷采集的资料来源。" }],
      snapshotImage: payload.snapshotImage,
      capturedText: payload.capturedText,
      captureMode: payload.captureMode ?? "manual",
      type: payload.type ?? "article",
      status: "inbox",
      triageStatus: payload.triageStatus ?? "must_read",
      purpose: payload.purpose ?? "later_reading",
      collectionIds: payload.collectionIds ?? [],
      projectIds: [],
      tags: payload.tags ?? ["new", "capture"],
      isFavorite: payload.isFavorite ?? false,
      savedAt: stamp(),
      updatedAt: stamp(),
      readingTime: payload.readingTime ?? 8,
      readingProgress: 0,
      hasSnapshot: payload.hasSnapshot ?? true,
      snapshotStatus: payload.snapshotStatus ?? "saved",
      summary: generateMockSummary(payload),
      // Context-aware local reason — will be replaced by real AI if key is configured
      aiReason: inferAiReason(
        payload.title ?? "",
        payload.url ?? "",
        payload.type ?? "article",
        payload.purpose ?? "later_reading",
      ),
      readingRecommendation: "先看 AI 摘要，再高亮一段可作为证据的内容。",
      keyPoints: ["新资料已进入收件箱", "可能成为项目素材", "可立即抽取观点"],
      relatedTopics: ["AI Inbox", "Capture", "Project research"],
      content: payload.content ?? [
        "这条新资料已进入 Lumo AI 收件箱，等待稍后阅读和整理。",
        "Lumo 可以对资料进行摘要、分类、高亮、笔记，并把段落转成观点或证据。",
        "下一步可以把它加入主题夹或活跃研究项目。",
      ],
      claimIds: [],
      evidenceIds: [],
      highlightIds: [],
      noteIds: [],
      entityIds: [],
    };
    const targetCollectionIds = source.collectionIds;
    const updatedAt = stamp();
    set((state) => ({
      sources: [source, ...state.sources],
      collections: state.collections.map((collection) => (
        targetCollectionIds.includes(collection.id)
          ? {
            ...collection,
            sourceIds: Array.from(new Set([source.id, ...collection.sourceIds])),
            updatedAt,
          }
          : collection
      )),
      selectedSourceId: source.id,
      activeView: "sources",
      toast: "资料已保存，AI 正在分析…",
    }));

    // ── Async DeepSeek triage (replaces local reason with real AI judgment) ──
    if (aiService.hasApiKey()) {
      const { id: sourceId, title, url, content } = source;
      aiService.triageSource({
        title,
        url,
        summary: (content?.[0] ?? "").slice(0, 200),
      }).then(({ triageStatus, aiReason }) => {
        get().updateSource(sourceId, { triageStatus, aiReason });
      }).catch(() => { /* silent — local reason stays */ });
    }
  },
  updateSource: (id, patch) => set((state) => ({ sources: state.sources.map((source) => (source.id === id ? { ...source, ...patch, updatedAt: stamp() } : source)) })),
  archiveSource: (id) => get().updateSource(id, { status: "archived" }),
  deleteSource: (id) => get().updateSource(id, { status: "deleted" }),
  toggleSourceFavorite: (id) => {
    const source = get().sources.find((item) => item.id === id);
    get().updateSource(id, { isFavorite: !source?.isFavorite });
    set({ toast: source?.isFavorite ? "已取消收藏" : "已加入星标收藏" });
  },
  markSourceAsRead: (id) => get().updateSource(id, { status: "read", readingProgress: 100 }),
  markSourceAsUnread: (id) => get().updateSource(id, { status: "unread", readingProgress: 0 }),
  updateReadingProgress: (id, readingProgress) => get().updateSource(id, { readingProgress }),
  createCollection: (name, description) => set((state) => ({ collections: [{ id: uid("c"), name, description, sourceIds: [], tags: [], createdAt: stamp(), updatedAt: stamp() }, ...state.collections], toast: "主题夹已创建" })),
  addSourceToCollection: (sourceId, collectionId) =>
    set((state) => ({
      sources: state.sources.map((source) => (source.id === sourceId ? { ...source, collectionIds: Array.from(new Set([...source.collectionIds, collectionId])) } : source)),
      collections: state.collections.map((collection) => (collection.id === collectionId ? { ...collection, sourceIds: Array.from(new Set([...collection.sourceIds, sourceId])) } : collection)),
      toast: "资料已加入主题夹",
    })),
  removeSourceFromCollection: (sourceId, collectionId) =>
    set((state) => ({
      sources: state.sources.map((source) => (source.id === sourceId ? { ...source, collectionIds: source.collectionIds.filter((id) => id !== collectionId) } : source)),
      collections: state.collections.map((collection) => (collection.id === collectionId ? { ...collection, sourceIds: collection.sourceIds.filter((id) => id !== sourceId) } : collection)),
    })),
  convertCollectionToProject: (collectionId, goal) => {
    const collection = get().collections.find((item) => item.id === collectionId);
    if (!collection) return;
    const projectSources = get().sources.filter((source) => collection.sourceIds.includes(source.id));
    const project = { ...generateMockProjectFromCollection(collection, projectSources), goal: goal || `从 ${collection.name} 创建研究成果。` };
    const newClaims = projectSources.flatMap(generateMockClaimsFromSource).map((claim) => ({ ...claim, projectId: project.id }));
    const newInsights = generateMockInsights({ ...project, claimIds: newClaims.map((claim) => claim.id) }, newClaims, []);
    set((state) => ({
      projects: [{ ...project, claimIds: newClaims.map((claim) => claim.id), insightIds: newInsights.map((insight) => insight.id) }, ...state.projects],
      sources: state.sources.map((source) => (collection.sourceIds.includes(source.id) ? { ...source, projectIds: Array.from(new Set([...source.projectIds, project.id])) } : source)),
      claims: [...newClaims, ...state.claims],
      insights: [...newInsights, ...state.insights],
      selectedProjectId: project.id,
      activeView: "projects",
      toast: "主题夹已转为项目",
    }));
  },
  createProject: (payload) => {
    const name = payload.name.trim() || "我的新项目";
    const english = get().language === "en";
    const project: Project = {
      id: uid("p"),
      name,
      description: payload.description?.trim() || "个人创建的独立项目空间。",
      goal: payload.goal.trim() || `整理「${name}」相关资料，并沉淀观点、证据、洞察和成果。`,
      keyQuestions: payload.keyQuestions?.map((item) => item.trim()).filter(Boolean).slice(0, 8) ?? ["这个项目要解决什么问题？", "哪些资料可以作为证据？", "最后要输出什么成果？"],
      status: "active",
      sourceIds: [],
      claimIds: [],
      evidenceIds: [],
      insightIds: [],
      deliverableIds: [],
      tags: payload.tags?.map((item) => item.trim()).filter(Boolean) ?? ["personal-workspace"],
      createdAt: stamp(),
      updatedAt: stamp(),
    };
    set((state) => ({
      projects: [project, ...state.projects],
      selectedProjectId: project.id,
      activeView: "projects",
      toast: english ? "Project workspace created" : "已创建独立项目空间",
    }));
  },
  addSourceToProject: (sourceId, projectId) => {
    set((state) => ({
      sources: state.sources.map((s) =>
        s.id === sourceId ? { ...s, projectIds: Array.from(new Set([...s.projectIds, projectId])), status: s.status === "archived" ? "archived" : "read", readingProgress: Math.max(s.readingProgress ?? 0, 100), updatedAt: new Date().toISOString() } : s
      ),
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, sourceIds: Array.from(new Set([...project.sourceIds, sourceId])) } : project)),
      toast: state.language === "en" ? "Source added to project · marked as read" : "资料已加入项目 · 自动标记已读",
    }));
  },
  removeSourceFromProject: (sourceId, projectId) => {
    set((state) => ({
      sources: state.sources.map((source) =>
        source.id === sourceId
          ? { ...source, projectIds: source.projectIds.filter((id) => id !== projectId) }
          : source
      ),
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, sourceIds: project.sourceIds.filter((id) => id !== sourceId) }
          : project
      ),
      toast: state.language === "en" ? "Removed from project · back in Pending" : "已移出项目 · 回到待处理",
    }));
  },
  createHighlight: (sourceId, paragraphIndex, color = "yellow", startOffset, endOffset) => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    const existing = get().highlights.find((item) => item.sourceId === sourceId && item.paragraphIndex === paragraphIndex && item.startOffset === startOffset && item.endOffset === endOffset);
    if (existing) {
      set((state) => ({
        highlights: state.highlights.filter((item) => item.id !== existing.id),
        sources: state.sources.map((item) => (item.id === sourceId ? { ...item, highlightIds: item.highlightIds.filter((id) => id !== existing.id) } : item)),
        toast: "已取消这段高亮",
      }));
      return;
    }
    const text = (startOffset !== undefined && endOffset !== undefined)
      ? source.content[paragraphIndex].slice(startOffset, endOffset)
      : source.content[paragraphIndex];
    const highlight = { id: uid("h"), sourceId, text, paragraphIndex, color, startOffset, endOffset, noteIds: [], tagIds: ["new"], createdAt: stamp() };
    set((state) => ({
      highlights: [highlight, ...state.highlights],
      sources: state.sources.map((item) => (item.id === sourceId ? { ...item, highlightIds: [highlight.id, ...item.highlightIds] } : item)),
      toast: startOffset !== undefined ? "文本已高亮" : "段落已高亮",
    }));
  },
  deleteHighlight: (highlightId) => set((state) => ({
    highlights: state.highlights.filter((item) => item.id !== highlightId),
    sources: state.sources.map((source) => ({ ...source, highlightIds: source.highlightIds.filter((id) => id !== highlightId) })),
  })),
  convertHighlightToClaim: (highlightId) => {
    const highlight = get().highlights.find((item) => item.id === highlightId);
    const source = highlight && get().sources.find((item) => item.id === highlight.sourceId);
    if (!highlight || !source) return;
    const projectId = sourceProjectId(source, get().selectedProjectId);
    const claim = { ...generateMockClaimFromParagraph(source, highlight.paragraphIndex), text: highlight.text, projectId };
    set((state) => ({
      claims: [claim, ...state.claims],
      sources: state.sources.map((item) => (item.id === source.id ? { ...item, claimIds: Array.from(new Set([claim.id, ...item.claimIds])) } : item)),
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, sourceIds: Array.from(new Set([...project.sourceIds, source.id])), claimIds: Array.from(new Set([claim.id, ...project.claimIds])) } : project)),
      toast: "高亮已转为观点，并自动归档到项目图谱",
    }));
  },
  convertHighlightToEvidence: (highlightId) => {
    const highlight = get().highlights.find((item) => item.id === highlightId);
    const source = highlight && get().sources.find((item) => item.id === highlight.sourceId);
    if (!highlight || !source) return;
    const projectId = sourceProjectId(source, get().selectedProjectId);
    const item = { ...generateMockEvidenceFromParagraph(source, highlight.paragraphIndex), text: highlight.text, projectId };
    set((state) => ({
      evidence: [item, ...state.evidence],
      sources: state.sources.map((sourceItem) => (sourceItem.id === source.id ? { ...sourceItem, evidenceIds: Array.from(new Set([item.id, ...sourceItem.evidenceIds])) } : sourceItem)),
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, sourceIds: Array.from(new Set([...project.sourceIds, source.id])), evidenceIds: Array.from(new Set([item.id, ...project.evidenceIds])) } : project)),
      toast: "高亮已转为证据，并自动关联原始出处",
    }));
  },
  createNote: (sourceId, paragraphIndex, content, attachments) => {
    const note = { id: uid("n"), sourceId, paragraphIndex, content, attachments, tagIds: ["note"], createdAt: stamp() };
    set((state) => ({
      notes: [note, ...state.notes],
      sources: state.sources.map((source) => (source.id === sourceId ? { ...source, noteIds: [note.id, ...source.noteIds] } : source)),
      toast: "笔记已添加",
    }));
  },
  deleteNote: (noteId) => set((state) => ({ notes: state.notes.filter((note) => note.id !== noteId) })),
  convertNoteToClaim: (noteId) => {
    const note = get().notes.find((item) => item.id === noteId);
    const source = note && get().sources.find((item) => item.id === note.sourceId);
    if (!note || !source) return;
    const projectId = sourceProjectId(source, get().selectedProjectId);
    const claim = { ...generateMockClaimFromParagraph(source, note.paragraphIndex ?? 0), text: note.content, projectId };
    set((state) => ({
      claims: [claim, ...state.claims],
      sources: state.sources.map((item) => (item.id === source.id ? { ...item, claimIds: Array.from(new Set([claim.id, ...item.claimIds])) } : item)),
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, sourceIds: Array.from(new Set([...project.sourceIds, source.id])), claimIds: Array.from(new Set([claim.id, ...project.claimIds])) } : project)),
      toast: "笔记已转为观点，并进入项目图谱",
    }));
  },
  extractClaimsFromSource: (sourceId) => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    const projectId = sourceProjectId(source, get().selectedProjectId);

    const commitClaims = (rawClaims: Array<{ text: string; confidence: string }>) => {
      const newClaims = rawClaims.map(({ text, confidence }) => ({
        id: uid("cl"),
        text,
        sourceId,
        projectId,
        evidenceIds: [],
        entityIds: source.entityIds.slice(0, 2),
        tags: ["ai-generated", source.purpose],
        confidence: (["high","medium","low"].includes(confidence) ? confidence : "medium") as "high"|"medium"|"low",
        claimIds: [],
        createdAt: stamp(),
      }));
      const claimIds = newClaims.map(c => c.id);
      set((state) => ({
        claims: [...newClaims as never[], ...state.claims],
        sources: state.sources.map((item) => item.id === sourceId ? { ...item, claimIds: Array.from(new Set([...claimIds, ...item.claimIds])) } : item),
        projects: state.projects.map((p) => p.id === projectId ? { ...p, sourceIds: Array.from(new Set([...p.sourceIds, sourceId])), claimIds: Array.from(new Set([...claimIds, ...p.claimIds])) } : p),
        toast: `已提炼 ${newClaims.length} 条观点`,
      }));
    };

    // Use real AI if API key is configured, otherwise fall back to mock
    import("../services/aiService").then(({ hasApiKey, aiExtractClaims }) => {
      if (hasApiKey()) {
        set({ toast: "AI 正在提炼观点…" });
        aiExtractClaims({ title: source.title, content: source.content })
          .then(commitClaims)
          .catch((err) => {
            set({ toast: `AI 提炼失败（${(err as Error).message}），已用本地规则代替` });
            commitClaims(generateMockClaimsFromSource(source));
          });
      } else {
        commitClaims(generateMockClaimsFromSource(source));
      }
    });
  },
  clearClaimsFromSource: (sourceId) => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    set((state) => {
      const claimIdsBySource = state.claims.filter((claim) => claim.sourceId === sourceId).map((claim) => claim.id);
      const clearIds = new Set([...source.claimIds, ...claimIdsBySource]);
      if (!clearIds.size) {
        return {
          sources: state.sources.map((item) => (item.id === sourceId ? { ...item, claimIds: [] } : item)),
          toast: "当前资料没有可取消的观点",
        };
      }
      return {
        claims: state.claims.filter((claim) => !clearIds.has(claim.id)),
        evidence: state.evidence.map((item) => (item.claimId && clearIds.has(item.claimId) ? { ...item, claimId: undefined } : item)),
        sources: state.sources.map((item) => ({
          ...item,
          claimIds: item.id === sourceId ? [] : item.claimIds.filter((id) => !clearIds.has(id)),
        })),
        projects: state.projects.map((project) => ({
          ...project,
          claimIds: project.claimIds.filter((id) => !clearIds.has(id)),
        })),
        insights: state.insights.map((insight) => ({
          ...insight,
          claimIds: insight.claimIds.filter((id) => !clearIds.has(id)),
        })),
        deliverables: state.deliverables.map((deliverable) => ({
          ...deliverable,
          claimIds: deliverable.claimIds.filter((id) => !clearIds.has(id)),
        })),
        toast: "该资料的观点已取消",
      };
    });
  },
  createClaimFromParagraph: (sourceId, paragraphIndex) => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    const projectId = sourceProjectId(source, get().selectedProjectId);
    const claim = { ...generateMockClaimFromParagraph(source, paragraphIndex), projectId };
    set((state) => ({
      claims: [claim, ...state.claims],
      sources: state.sources.map((item) => (item.id === sourceId ? { ...item, claimIds: Array.from(new Set([claim.id, ...item.claimIds])) } : item)),
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, sourceIds: Array.from(new Set([...project.sourceIds, sourceId])), claimIds: Array.from(new Set([claim.id, ...project.claimIds])) } : project)),
      toast: "观点已创建，并自动归档到项目图谱",
    }));
  },
  createEvidenceFromParagraph: (sourceId, paragraphIndex) => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    const projectId = sourceProjectId(source, get().selectedProjectId);
    const item = { ...generateMockEvidenceFromParagraph(source, paragraphIndex), projectId };
    set((state) => ({
      evidence: [item, ...state.evidence],
      sources: state.sources.map((sourceItem) => (sourceItem.id === sourceId ? { ...sourceItem, evidenceIds: Array.from(new Set([item.id, ...sourceItem.evidenceIds])) } : sourceItem)),
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, sourceIds: Array.from(new Set([...project.sourceIds, sourceId])), evidenceIds: Array.from(new Set([item.id, ...project.evidenceIds])) } : project)),
      toast: "证据已创建，并自动关联原始链接与项目",
    }));
  },
  linkEvidenceToClaim: (evidenceId, claimId) =>
    set((state) => ({
      evidence: state.evidence.map((item) => (item.id === evidenceId ? { ...item, claimId } : item)),
      claims: state.claims.map((claim) => (claim.id === claimId ? { ...claim, evidenceIds: Array.from(new Set([...claim.evidenceIds, evidenceId])) } : claim)),
    })),
  generateInsightsForProject: async (projectId) => {
    const project = get().projects.find((item) => item.id === projectId);
    if (!project) return;
    const projectClaims = get().claims.filter((claim) => claim.projectId === project.id || project.claimIds.includes(claim.id));
    const projectEvidence = get().evidence.filter((item) => item.projectId === project.id || project.evidenceIds.includes(item.id));

    // Use real AI if API key is configured, otherwise fall back to mock
    if (aiService.hasApiKey()) {
      try {
        const aiInsights = await aiService.generateInsights({
          projectName: project.name,
          projectGoal: project.goal,
          claims: projectClaims.map((c) => c.text),
          evidence: projectEvidence.map((e) => e.text),
        });
        const newInsights = aiInsights.map((ins) => ({
          id: uid("i"),
          projectId: project.id,
          title: ins.title,
          content: ins.content,
          type: "cross_source" as const,
          priority: ins.priority,
          claimIds: projectClaims.slice(0, 2).map((c) => c.id),
          evidenceIds: projectEvidence.slice(0, 2).map((e) => e.id),
          suggestedDeliverables: ["research_brief"] as import("../types").DeliverableType[],
          createdAt: stamp(),
        }));
        set(((state: AppState) => ({
          insights: [...(newInsights as unknown as import("../types").Insight[]), ...state.insights],
          projects: state.projects.map((item) => item.id === project.id ? { ...item, insightIds: Array.from(new Set([...item.insightIds, ...newInsights.map((i) => i.id)])) } : item),
          toast: `AI 已生成 ${newInsights.length} 条洞察`,
        })) as (state: AppState) => Partial<AppState>);
        return;
      } catch (err) {
        console.warn("[Lumo AI] generateInsights failed, falling back to mock:", err);
      }
    }
    // Mock fallback
    const newInsights = generateMockInsights(project, projectClaims, projectEvidence);
    set((state) => ({
      insights: [...newInsights, ...state.insights],
      projects: state.projects.map((item) => (item.id === project.id ? { ...item, insightIds: Array.from(new Set([...item.insightIds, ...newInsights.map((insight) => insight.id)])) } : item)),
      toast: "洞察已生成",
    }));
    get().addTimelineEntry({ projectId, type: "insight_generated", title: "生成洞察", description: `从观点中综合生成 ${newInsights.length} 条洞察`, timestamp: stamp() });
  },
  generateDeliverable: async (type, projectId) => {
    const project = get().projects.find((item) => item.id === projectId);
    if (!project) return;
    const projectSources = get().sources.filter((source) => project.sourceIds.includes(source.id));
    const projectClaims = get().claims.filter((claim) => claim.projectId === project.id || project.claimIds.includes(claim.id));
    const projectEvidence = get().evidence.filter((item) => item.projectId === project.id || project.evidenceIds.includes(item.id));
    const projectInsights = get().insights.filter((insight) => insight.projectId === project.id || project.insightIds.includes(insight.id));
    if (aiService.hasApiKey()) {
      try {
        const content = await aiService.generateDeliverableContent({
          type,
          projectName: project.name,
          projectGoal: project.goal,
          sources: projectSources.map((s) => s.title),
          claims: projectClaims.map((c) => c.text),
          evidence: projectEvidence.map((e) => e.text),
          insights: projectInsights.map((i) => `${i.title}：${i.content}`),
        });
        const d = { id: uid("d"), projectId, type: type as import("../types").DeliverableType, title: `${project.name} · ${type}`, content, createdAt: stamp(), sourceIds: project.sourceIds, claimIds: project.claimIds, evidenceIds: project.evidenceIds, insightIds: project.insightIds, origin: "ai" as const };
        set((state) => ({
          deliverables: [d, ...state.deliverables],
          projects: state.projects.map((item) => item.id === project.id ? { ...item, deliverableIds: [d.id, ...item.deliverableIds] } : item),
          activeView: "deliverables",
          toast: "AI 已生成成果文档",
        }));
        get().addTimelineEntry({ projectId, type: "deliverable_created", title: "生成成果文档", description: `AI 生成了${type === "research_brief" ? "研究简报" : type}`, timestamp: stamp() });
        return;
      } catch (err) {
        console.warn("[Lumo AI] generateDeliverable failed, falling back to mock:", err);
      }
    }
    const deliverable = generateMockDeliverable(type, project, projectSources, projectClaims, projectEvidence, projectInsights);
    set((state) => ({
      deliverables: [deliverable, ...state.deliverables],
      projects: state.projects.map((item) => (item.id === project.id ? { ...item, deliverableIds: [deliverable.id, ...item.deliverableIds] } : item)),
      activeView: "deliverables",
      toast: "成果文档已生成",
    }));
  },
  addTimelineEntry: (entry) => set(state => {
    const id = uid("tl");
    const fullEntry = { ...entry, id };
    const prev = state.projectTimeline[entry.projectId] ?? [];
    return { projectTimeline: { ...state.projectTimeline, [entry.projectId]: [fullEntry, ...prev].slice(0, 100) } };
  }),
  addManualCheckpoint: (projectId, note) => {
    const state = get();
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    const pSources = state.sources.filter(s => project.sourceIds.includes(s.id));
    const pClaims = state.claims.filter(c => c.projectId === projectId || project.claimIds.includes(c.id));
    const pEvidence = state.evidence.filter(e => e.projectId === projectId || project.evidenceIds.includes(e.id));
    const pInsights = state.insights.filter(i => i.projectId === projectId || project.insightIds.includes(i.id));
    const id = uid("tl");
    const entry: import("../types").TimelineEntry = {
      id, projectId,
      type: "manual_checkpoint",
      title: "手动存档",
      description: note || "用户手动保存的思路断点",
      timestamp: stamp(),
      userNote: note,
      snapshot: {
        sourceCount: pSources.length, claimCount: pClaims.length,
        evidenceCount: pEvidence.length, insightCount: pInsights.length,
        sourceIds: pSources.map(s => s.id),
        claimIds: pClaims.map(c => c.id),
        evidenceIds: pEvidence.map(e => e.id),
        insightIds: pInsights.map(i => i.id),
      },
    };
    const prev = state.projectTimeline[projectId] ?? [];
    set({ projectTimeline: { ...state.projectTimeline, [projectId]: [entry, ...prev].slice(0, 100) }, toast: "思路断点已保存，包含完整版本快照" });
  },
  rollbackToCheckpoint: (projectId, snapshot) => {
    set(state => ({
      projects: state.projects.map(p => p.id !== projectId ? p : {
        ...p,
        sourceIds: p.sourceIds.filter(id => snapshot.sourceIds.includes(id)),
        claimIds: p.claimIds.filter(id => snapshot.claimIds.includes(id)),
        evidenceIds: p.evidenceIds.filter(id => snapshot.evidenceIds.includes(id)),
        insightIds: p.insightIds.filter(id => snapshot.insightIds.includes(id)),
      }),
      claims: state.claims.map(c => c.projectId === projectId && !snapshot.claimIds.includes(c.id) ? { ...c, projectId: "" } : c),
      evidence: state.evidence.map(e => e.projectId === projectId && !snapshot.evidenceIds.includes(e.id) ? { ...e, projectId: "" } : e),
      insights: state.insights.map(i => i.projectId === projectId && !snapshot.insightIds.includes(i.id) ? { ...i, projectId: "" } : i),
      sources: state.sources.map(s => !snapshot.sourceIds.includes(s.id) && s.projectIds.includes(projectId) ? { ...s, projectIds: s.projectIds.filter(id => id !== projectId) } : s),
      toast: "已回滚到此版本快照",
    }));
  },
  saveInspiration: (id, title, content) => set(state => {
    const now = stamp();
    if (id) {
      return { inspirations: state.inspirations.map(i => i.id === id ? { ...i, title: title || "无标题灵感", content, updatedAt: now } : i) };
    }
    const newItem: import("../types").Inspiration = { id: uid("ins"), title: title || "无标题灵感", content, createdAt: now, updatedAt: now, tags: [] };
    return { inspirations: [newItem, ...state.inspirations], toast: "灵感已保存" };
  }),
  deleteInspiration: (id) => set(state => ({ inspirations: state.inspirations.filter(i => i.id !== id) })),
  setActiveView: (view) => set({ activeView: view }),
  updateInsight: (id, patch) => set((state) => ({
    insights: state.insights.map((i) => i.id === id ? { ...i, ...patch } : i),
    toast: "洞察已更新",
  })),
  deleteInsight: (insightId) => set((state) => ({
    insights: state.insights.filter((i) => i.id !== insightId),
    projects: state.projects.map((p) => ({ ...p, insightIds: p.insightIds.filter((id) => id !== insightId) })),
    toast: "洞察已删除",
  })),
  createInsightFromAnnotation: (noteText, sourceTitle, projectId) => {
    if (!noteText.trim() || !projectId) return;
    const newInsight: import("../types").Insight = {
      id: uid("ins"),
      title: noteText.length > 60 ? noteText.slice(0, 58) + "…" : noteText,
      content: `批注来源：《${sourceTitle}》\n\n${noteText}`,
      type: "learning_summary",
      priority: "medium",
      projectId,
      claimIds: [],
      evidenceIds: [],
      suggestedDeliverables: [],
      createdAt: stamp(),
    };
    set((state) => ({
      insights: [newInsight, ...state.insights],
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, insightIds: Array.from(new Set([newInsight.id, ...p.insightIds])) }
          : p
      ),
      toast: "批注已保存为洞察 ✨",
    }));
  },
  updateDeliverable: (id, content) => set((state) => ({
    deliverables: state.deliverables.map((d) => d.id === id ? { ...d, content } : d),
  })),
  appendToDeliverable: (projectId, label, text, sourceTitle) => {
    const state = get();
    const project = state.projects.find(p => p.id === projectId);
    if (!project) { state.notify("请先选择或创建一个项目"); return; }
    const newEntry = `\n\n### ${label}\n${text}${sourceTitle ? `\n\n> 来源：${sourceTitle}` : ""}`;
    // Find the most recent deliverable for this project (any type)
    const existing = state.deliverables
      .filter(d => d.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (existing) {
      set(s => ({
        deliverables: s.deliverables.map(d => d.id === existing.id ? { ...d, content: d.content + newEntry } : d),
        toast: `已追加到「${existing.title}」`,
      }));
    } else {
      const newDeliverable = {
        id: uid("del"),
        projectId,
        type: "research_brief" as const,
        title: `${project.name} · 研究草稿`,
        content: `# ${project.name} · 研究草稿\n\n*通过「加入成果」逐步积累的研究内容*${newEntry}`,
        createdAt: stamp(),
        updatedAt: stamp(),
        origin: "manual" as const,
      };
      set(s => ({
        deliverables: [newDeliverable as never, ...s.deliverables],
        projects: s.projects.map(p => p.id === projectId ? { ...p, deliverableIds: [newDeliverable.id, ...p.deliverableIds] } : p),
        toast: "已新建研究草稿并加入内容",
      }));
    }
  },
  deleteDeliverable: (deliverableId) => set((state) => ({
    deliverables: state.deliverables.filter((d) => d.id !== deliverableId),
    projects: state.projects.map((p) => ({ ...p, deliverableIds: p.deliverableIds.filter((id) => id !== deliverableId) })),
    toast: "成果已删除",
  })),
  deleteProject: (projectId) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== projectId),
    sources: state.sources.map((s) => ({ ...s, projectIds: s.projectIds.filter((id) => id !== projectId) })),
    claims: state.claims.map((c) => ({ ...c, projectId: c.projectId === projectId ? undefined : c.projectId })),
    evidence: state.evidence.map((e) => ({ ...e, projectId: e.projectId === projectId ? undefined : e.projectId })),
    insights: state.insights.filter((i) => i.projectId !== projectId),
    deliverables: state.deliverables.filter((d) => d.projectId !== projectId),
    selectedProjectId: state.selectedProjectId === projectId ? state.projects.find((p) => p.id !== projectId)?.id : state.selectedProjectId,
    toast: "项目已删除",
  })),
  setSelectedSource: (id) => set({ selectedSourceId: id, activeView: id ? "reader" : get().activeView }),
  setSelectedCollection: (id) => set({ selectedCollectionId: id }),
  setSelectedProject: (id) => set({ selectedProjectId: id, activeView: "projects" }),
  setSelectedClaim: (id) => set({ selectedClaimId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setThemeMode: (themeMode) => set((state) => ({ themeMode, toast: state.language === "en" ? `Theme switched to ${themeLabel(themeMode, "en")}` : `已切换为${themeLabel(themeMode)}模式` })),
  setNavPlacement: () => set((state) => ({
    navPlacement: "left",
    toast: state.language === "en" ? "Navigation is fixed to the left sidebar" : "菜单已固定在左侧栏",
  })),
  setLanguage: (language) => set({ language, toast: language === "en" ? "Switched to English" : "已切换为中文" }),
  signInProfile: (payload) => set((state) => {
    const displayName = payload.displayName?.trim() || state.userProfile.displayName || payload.email.split("@")[0] || "Lumo 用户";
    return {
      userProfile: {
        ...state.userProfile,
        displayName,
        email: payload.email.trim(),
        isAuthenticated: true,
        lastLoginAt: stamp(),
      },
      toast: state.language === "en" ? "Signed in locally" : "已登录，本机将保留你的个人资料",
    };
  }),
  signOutProfile: () => set((state) => ({
    userProfile: { ...state.userProfile, isAuthenticated: false, lastLoginAt: stamp() },
    toast: state.language === "en" ? "Signed out locally" : "已退出本机账号演示",
  })),
  updateProfile: (patch) => set((state) => ({
    userProfile: { ...state.userProfile, ...patch },
    toast: state.language === "en" ? "Profile saved" : "个人资料已保存",
  })),
  connectSocialPlatform: (platform, handle) => set((state) => ({
    userProfile: { ...state.userProfile, socialLinks: { ...state.userProfile.socialLinks, [platform]: handle.trim() } },
    toast: state.language === "en" ? "Social profile connected" : "社交账号已记录",
  })),
  inviteTeamMember: (payload) => set((state) => {
    const email = payload.email.trim().toLowerCase();
    if (!email) return { toast: state.language === "en" ? "Enter an email first" : "请先输入成员邮箱" };
    const exists = state.teamMembers.some((member) => member.projectId === payload.projectId && member.email.toLowerCase() === email);
    if (exists) return { toast: state.language === "en" ? "This member is already in the project" : "这个成员已经在该项目里" };
    const member: TeamMember = {
      id: uid("tm"),
      projectId: payload.projectId,
      name: payload.name?.trim() || email.split("@")[0] || "新成员",
      email,
      role: payload.role,
      status: "invited",
      joinedAt: stamp(),
    };
    return {
      teamMembers: [member, ...state.teamMembers],
      toast: state.language === "en" ? "Collaboration invite created" : "已生成协作邀请",
    };
  }),
  updateTeamMemberRole: (memberId, role) => set((state) => ({
    teamMembers: state.teamMembers.map((member) => (member.id === memberId ? { ...member, role } : member)),
    toast: state.language === "en" ? "Member role updated" : "成员权限已更新",
  })),
  removeTeamMember: (memberId) => set((state) => ({
    teamMembers: state.teamMembers.filter((member) => member.id !== memberId),
    toast: state.language === "en" ? "Member removed" : "成员已移除",
  })),
  publishCommunityPost: (payload) => set((state) => {
    const post: LumoCommunityPost = {
      id: uid("post"),
      authorId: state.userProfile.id,
      authorName: state.userProfile.displayName,
      authorAvatar: state.userProfile.avatar,
      title: payload.title.trim() || "未命名公开笔记",
      content: payload.content.trim() || "这是一条从 Lumo 分享出来的知识内容。",
      noteId: payload.noteId,
      sourceId: payload.sourceId,
      tags: payload.tags?.map((item) => item.trim()).filter(Boolean).slice(0, 8) ?? ["Lumo之家"],
      visibility: payload.visibility ?? "public",
      likes: 0,
      comments: 0,
      visits: 0,
      createdAt: stamp(),
    };
    return {
      communityPosts: [post, ...state.communityPosts],
      activeView: "community",
      toast: state.language === "en" ? "Shared to Lumo Home" : "已分享到 Lumo 之家",
    };
  }),
  reactToCommunityPost: (postId, liked = true) => set((state) => ({
    communityPosts: state.communityPosts.map((post) => (post.id === postId ? { ...post, likes: Math.max(0, post.likes + (liked ? 1 : -1)) } : post)),
    toast: liked ? (state.language === "en" ? "Liked" : "已点赞") : (state.language === "en" ? "Like removed" : "已取消点赞"),
  })),
  addLumoVisit: (payload) => set((state) => ({
    lumoVisitors: [{ id: uid("visit"), visitorName: payload.visitorName, visitorAvatar: payload.visitorAvatar, action: payload.action, target: payload.target, createdAt: stamp() }, ...state.lumoVisitors].slice(0, 24),
    communityPosts: state.communityPosts.map((post, index) => (payload.postId ? post.id === payload.postId : index === 0) ? { ...post, visits: post.visits + 1 } : post),
    toast: state.language === "en" ? "A Lumo visitor arrived" : "新的 Lumo 访客已记录",
  })),
  notify: (message) => set({ toast: message }),
  clearToast: () => set({ toast: undefined }),
}), {
  name: "lumo-user-workspace-v1",
  storage: createJSONStorage(() => localStorage),
  version: 4,
  migrate: (persistedState) => {
    const state = persistedState as Partial<AppState>;
    // v4: restore rich deliverables from initial mock data
    return { ...state, navPlacement: "left", deliverables };
  },
  partialize: (state) => ({
    sources: state.sources,
    collections: state.collections,
    projects: state.projects,
    highlights: state.highlights,
    notes: state.notes,
    claims: state.claims,
    evidence: state.evidence,
    entities: state.entities,
    insights: state.insights,
    deliverables: state.deliverables,
    userProfile: state.userProfile,
    communityPosts: state.communityPosts,
    lumoVisitors: state.lumoVisitors,
    teamMembers: state.teamMembers,
    selectedSourceId: state.selectedSourceId,
    selectedCollectionId: state.selectedCollectionId,
    selectedProjectId: state.selectedProjectId,
    selectedClaimId: state.selectedClaimId,
    themeMode: state.themeMode,
    navPlacement: state.navPlacement,
    language: state.language,
  }),
}));

function themeLabel(themeMode: ThemeMode, language: AppLanguage = "zh") {
  const labels: Record<ThemeMode, string> = {
    light: "明亮",
    dark: "夜晚",
    warm: "暖白",
    mint: "薄荷",
  };
  const labelsEn: Record<ThemeMode, string> = {
    light: "Light",
    dark: "Dark",
    warm: "Warm",
    mint: "Mint",
  };
  return language === "en" ? labelsEn[themeMode] : labels[themeMode];
}

function navPlacementLabel(navPlacement: NavPlacement, language: AppLanguage = "zh") {
  const labels: Record<NavPlacement, string> = {
    left: "左侧栏",
    top: "顶部栏",
    right: "右侧栏",
    bottom: "底部栏",
  };
  const labelsEn: Record<NavPlacement, string> = {
    left: "the left sidebar",
    top: "the top bar",
    right: "the right sidebar",
    bottom: "the bottom dock",
  };
  return language === "en" ? labelsEn[navPlacement] : labels[navPlacement];
}
