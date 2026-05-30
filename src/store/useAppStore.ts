import { create } from "zustand";
import { claims, collections, deliverables, entities, evidence, highlights, insights, notes, projects, sources } from "../data/mockData";
import type {
  ActiveView,
  Claim,
  Collection,
  DeliverableType,
  Evidence,
  HighlightColor,
  Insight,
  Note,
  Project,
  Source,
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
  activeView: ActiveView;
  selectedSourceId?: string;
  selectedCollectionId?: string;
  selectedProjectId?: string;
  selectedClaimId?: string;
  searchQuery: string;
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
  addSourceToProject: (sourceId: string, projectId: string) => void;
  removeSourceFromProject: (sourceId: string, projectId: string) => void;
  createHighlight: (sourceId: string, paragraphIndex: number, color?: HighlightColor) => void;
  deleteHighlight: (highlightId: string) => void;
  convertHighlightToClaim: (highlightId: string) => void;
  convertHighlightToEvidence: (highlightId: string) => void;
  createNote: (sourceId: string, paragraphIndex: number, content: string) => void;
  deleteNote: (noteId: string) => void;
  convertNoteToClaim: (noteId: string) => void;
  extractClaimsFromSource: (sourceId: string) => void;
  createClaimFromParagraph: (sourceId: string, paragraphIndex: number) => void;
  createEvidenceFromParagraph: (sourceId: string, paragraphIndex: number) => void;
  linkEvidenceToClaim: (evidenceId: string, claimId: string) => void;
  generateInsightsForProject: (projectId: string) => void;
  generateDeliverable: (type: DeliverableType, projectId: string) => void;
  setActiveView: (view: ActiveView) => void;
  setSelectedSource: (id?: string) => void;
  setSelectedCollection: (id?: string) => void;
  setSelectedProject: (id?: string) => void;
  setSelectedClaim: (id?: string) => void;
  setSearchQuery: (query: string) => void;
  notify: (message: string) => void;
  clearToast: () => void;
};

const stamp = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

export const useAppStore = create<AppState>((set, get) => ({
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
  activeView: "inbox",
  selectedSourceId: sources[0].id,
  selectedCollectionId: collections[0].id,
  selectedProjectId: projects[0].id,
  searchQuery: "",
  addSource: (payload) => {
    const source: Source = {
      id: uid("s"),
      title: payload.title ?? "未命名资料",
      url: payload.url ?? "/media/lumo-research-note.txt",
      sourceName: payload.sourceName ?? "手动收藏",
      sourceReferences: payload.sourceReferences ?? [{ label: payload.sourceName ?? "手动收藏", url: payload.url ?? "/media/lumo-research-note.txt", note: "手动添加或快捷采集的资料来源。" }],
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
      hasSnapshot: true,
      snapshotStatus: "saved",
      summary: generateMockSummary(payload),
      aiReason: "新收藏的资料。Lumo 建议先判断它是否支持当前项目，再决定精读或归档。",
      readingRecommendation: "先看 AI 摘要，再高亮一段可作为证据的内容。",
      keyPoints: ["新资料已进入收件箱", "可能成为项目素材", "可立即抽取观点"],
      relatedTopics: ["AI Inbox", "Capture", "Project research"],
      content: payload.content ?? [
        "这条新资料已进入 Lumo AI 收件箱，等待稍后阅读和整理。",
        "Lumo 可以对资料进行摘要、分类、高亮、笔记，并把段落转成观点或证据。",
        "下一步可以把它加入收藏夹或活跃研究项目。",
      ],
      claimIds: [],
      evidenceIds: [],
      highlightIds: [],
      noteIds: [],
      entityIds: [],
    };
    set((state) => ({ sources: [source, ...state.sources], selectedSourceId: source.id, activeView: "reader", toast: "资料已加入 AI 收件箱" }));
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
  createCollection: (name, description) => set((state) => ({ collections: [{ id: uid("c"), name, description, sourceIds: [], tags: [], createdAt: stamp(), updatedAt: stamp() }, ...state.collections], toast: "收藏夹已创建" })),
  addSourceToCollection: (sourceId, collectionId) =>
    set((state) => ({
      sources: state.sources.map((source) => (source.id === sourceId ? { ...source, collectionIds: Array.from(new Set([...source.collectionIds, collectionId])) } : source)),
      collections: state.collections.map((collection) => (collection.id === collectionId ? { ...collection, sourceIds: Array.from(new Set([...collection.sourceIds, sourceId])) } : collection)),
      toast: "资料已加入收藏夹",
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
      toast: "收藏夹已转为项目",
    }));
  },
  addSourceToProject: (sourceId, projectId) =>
    set((state) => ({
      sources: state.sources.map((source) => (source.id === sourceId ? { ...source, projectIds: Array.from(new Set([...source.projectIds, projectId])) } : source)),
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, sourceIds: Array.from(new Set([...project.sourceIds, sourceId])) } : project)),
      toast: "资料已加入项目",
    })),
  removeSourceFromProject: (sourceId, projectId) =>
    set((state) => ({
      sources: state.sources.map((source) => (source.id === sourceId ? { ...source, projectIds: source.projectIds.filter((id) => id !== projectId) } : source)),
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, sourceIds: project.sourceIds.filter((id) => id !== sourceId) } : project)),
    })),
  createHighlight: (sourceId, paragraphIndex, color = "yellow") => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    const existing = get().highlights.find((item) => item.sourceId === sourceId && item.paragraphIndex === paragraphIndex);
    if (existing) {
      set({ toast: "这段已经高亮显示" });
      return;
    }
    const highlight = { id: uid("h"), sourceId, text: source.content[paragraphIndex], paragraphIndex, color, noteIds: [], tagIds: ["new"], createdAt: stamp() };
    set((state) => ({
      highlights: [highlight, ...state.highlights],
      sources: state.sources.map((item) => (item.id === sourceId ? { ...item, highlightIds: [highlight.id, ...item.highlightIds] } : item)),
      toast: "段落已高亮",
    }));
  },
  deleteHighlight: (highlightId) => set((state) => ({ highlights: state.highlights.filter((item) => item.id !== highlightId) })),
  convertHighlightToClaim: (highlightId) => {
    const highlight = get().highlights.find((item) => item.id === highlightId);
    const source = highlight && get().sources.find((item) => item.id === highlight.sourceId);
    if (!highlight || !source) return;
    const claim = { ...generateMockClaimFromParagraph(source, highlight.paragraphIndex), text: highlight.text };
    set((state) => ({ claims: [claim, ...state.claims], toast: "高亮已转为观点" }));
  },
  convertHighlightToEvidence: (highlightId) => {
    const highlight = get().highlights.find((item) => item.id === highlightId);
    const source = highlight && get().sources.find((item) => item.id === highlight.sourceId);
    if (!highlight || !source) return;
    const item = { ...generateMockEvidenceFromParagraph(source, highlight.paragraphIndex), text: highlight.text };
    set((state) => ({ evidence: [item, ...state.evidence], toast: "高亮已转为证据" }));
  },
  createNote: (sourceId, paragraphIndex, content) => {
    const note = { id: uid("n"), sourceId, paragraphIndex, content, tagIds: ["note"], createdAt: stamp() };
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
    const claim = { ...generateMockClaimFromParagraph(source, note.paragraphIndex ?? 0), text: note.content };
    set((state) => ({ claims: [claim, ...state.claims], toast: "笔记已转为观点" }));
  },
  extractClaimsFromSource: (sourceId) => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    const newClaims = generateMockClaimsFromSource(source);
    set((state) => ({ claims: [...newClaims, ...state.claims], toast: "已从资料中抽取观点" }));
  },
  createClaimFromParagraph: (sourceId, paragraphIndex) => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    const claim = generateMockClaimFromParagraph(source, paragraphIndex);
    set((state) => ({
      claims: [claim, ...state.claims],
      sources: state.sources.map((item) => (item.id === sourceId ? { ...item, claimIds: [claim.id, ...item.claimIds] } : item)),
      toast: "观点已创建，并保留原文出处",
    }));
  },
  createEvidenceFromParagraph: (sourceId, paragraphIndex) => {
    const source = get().sources.find((item) => item.id === sourceId);
    if (!source) return;
    const item = generateMockEvidenceFromParagraph(source, paragraphIndex);
    set((state) => ({
      evidence: [item, ...state.evidence],
      sources: state.sources.map((sourceItem) => (sourceItem.id === sourceId ? { ...sourceItem, evidenceIds: [item.id, ...sourceItem.evidenceIds] } : sourceItem)),
      toast: "证据已创建，并关联原始链接",
    }));
  },
  linkEvidenceToClaim: (evidenceId, claimId) =>
    set((state) => ({
      evidence: state.evidence.map((item) => (item.id === evidenceId ? { ...item, claimId } : item)),
      claims: state.claims.map((claim) => (claim.id === claimId ? { ...claim, evidenceIds: Array.from(new Set([...claim.evidenceIds, evidenceId])) } : claim)),
    })),
  generateInsightsForProject: (projectId) => {
    const project = get().projects.find((item) => item.id === projectId);
    if (!project) return;
    const projectClaims = get().claims.filter((claim) => claim.projectId === project.id || project.claimIds.includes(claim.id));
    const projectEvidence = get().evidence.filter((item) => item.projectId === project.id || project.evidenceIds.includes(item.id));
    const newInsights = generateMockInsights(project, projectClaims, projectEvidence);
    set((state) => ({
      insights: [...newInsights, ...state.insights],
      projects: state.projects.map((item) => (item.id === project.id ? { ...item, insightIds: Array.from(new Set([...item.insightIds, ...newInsights.map((insight) => insight.id)])) } : item)),
      toast: "洞察已生成",
    }));
  },
  generateDeliverable: (type, projectId) => {
    const project = get().projects.find((item) => item.id === projectId);
    if (!project) return;
    const projectSources = get().sources.filter((source) => project.sourceIds.includes(source.id));
    const projectClaims = get().claims.filter((claim) => claim.projectId === project.id || project.claimIds.includes(claim.id));
    const projectEvidence = get().evidence.filter((item) => item.projectId === project.id || project.evidenceIds.includes(item.id));
    const projectInsights = get().insights.filter((insight) => insight.projectId === project.id || project.insightIds.includes(insight.id));
    const deliverable = generateMockDeliverable(type, project, projectSources, projectClaims, projectEvidence, projectInsights);
    set((state) => ({
      deliverables: [deliverable, ...state.deliverables],
      projects: state.projects.map((item) => (item.id === project.id ? { ...item, deliverableIds: [deliverable.id, ...item.deliverableIds] } : item)),
      activeView: "deliverables",
      toast: "成果文档已生成",
    }));
  },
  setActiveView: (view) => set({ activeView: view }),
  setSelectedSource: (id) => set({ selectedSourceId: id, activeView: id ? "reader" : get().activeView }),
  setSelectedCollection: (id) => set({ selectedCollectionId: id }),
  setSelectedProject: (id) => set({ selectedProjectId: id, activeView: "projects" }),
  setSelectedClaim: (id) => set({ selectedClaimId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  notify: (message) => set({ toast: message }),
  clearToast: () => set({ toast: undefined }),
}));
