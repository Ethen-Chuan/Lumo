export type SourceType = "article" | "video" | "audio" | "pdf" | "webpage" | "note" | "image" | "newsletter";
export type SourceStatus = "inbox" | "unread" | "read" | "archived" | "deleted";
export type TriageStatus = "must_read" | "skim" | "archive_suggested" | "project_material";
export type Purpose =
  | "later_reading"
  | "project_research"
  | "competitor_analysis"
  | "writing_material"
  | "interview_prep"
  | "learning"
  | "task_reference"
  | "inspiration";
export type HighlightColor = "yellow" | "green" | "blue" | "purple" | "red" | "pink" | "orange";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type Confidence = "high" | "medium" | "low";
export type EvidenceType =
  | "quote"
  | "data"
  | "example"
  | "user_feedback"
  | "feature"
  | "pricing"
  | "market_signal"
  | "method"
  | "definition";
export type EntityType = "company" | "product" | "person" | "technology" | "metric" | "event" | "concept" | "method";
export type InsightType =
  | "user_pain"
  | "product_opportunity"
  | "feature_idea"
  | "market_trend"
  | "risk"
  | "competitor_gap"
  | "requirement_hypothesis"
  | "content_angle"
  | "learning_summary";
export type Priority = "high" | "medium" | "low";
export type DeliverableType =
  | "prd"
  | "competitive_analysis"
  | "weekly_report"
  | "interview_material"
  | "article_outline"
  | "research_brief"
  | "content_script";

export type SocialPlatform = "wechat" | "redbook" | "douyin" | "qq" | "weibo" | "bilibili" | "x" | "other";
export type TeamMemberRole = "owner" | "editor" | "viewer";
export type LumoPaletteId = "deepsea" | "mint" | "berry" | "starlight" | "sunset" | "aurora" | "cloud" | "amber";
export type LumoExpressionId = "curious" | "focused" | "spark" | "love" | "digesting" | "calm";
export type LumoTraitKey = "curiosity" | "rigor" | "synthesis" | "collaboration" | "output";
export type CapsuleVisibility = "public" | "followers" | "collaborators";
export type OntologyRelationType =
  | "captured_from"
  | "contains"
  | "about"
  | "supports"
  | "refutes"
  | "synthesizes"
  | "used_in"
  | "cites"
  | "learns_from"
  | "evolves_from";

export type ActiveView =
  | "inbox"
  | "sources"
  | "collections"
  | "projects"
  | "reader"
  | "highlights"
  | "notes"
  | "claims"
  | "evidence"
  | "insights"
  | "deliverables"
  | "review"
  | "tags"
  | "import_export"
  | "profile"
  | "community"
  | "settings";

export interface LumoUserProfile {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio: string;
  role: string;
  location: string;
  plan: "starter" | "pro" | "studio" | "team" | "enterprise";
  lumoName: string;
  lumoMood: string;
  lumoPalette?: LumoPaletteId;
  lumoExpression?: LumoExpressionId;
  website?: string;
  socialLinks: Partial<Record<SocialPlatform, string>>;
  isAuthenticated: boolean;
  joinedAt: string;
  lastLoginAt?: string;
}

export interface KnowledgeCapsule {
  id: string;
  title: string;
  summary: string;
  coverImage?: string;
  sourceId?: string;
  sourceUrl?: string;
  claimIds?: string[];
  evidenceIds?: string[];
  scenarioTags: string[];
  confidence: Confidence;
  stance: "support" | "neutral" | "question";
  reusableFor: string[];
  visibility: CapsuleVisibility;
  createdAt: string;
}

export interface OntologyEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: OntologyRelationType;
  strength?: number;
  note?: string;
  createdAt: string;
}

export interface LumoCommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  noteId?: string;
  sourceId?: string;
  coverImage?: string;
  previewImages?: string[];
  tags: string[];
  visibility: "public" | "followers" | "private";
  likes: number;
  comments: number;
  visits: number;
  capsule?: KnowledgeCapsule;
  lumoPalette?: LumoPaletteId;
  lumoExpression?: LumoExpressionId;
  growthStage?: "sprout" | "bloom" | "orbit";
  trustScore?: number;
  specialties?: string[];
  createdAt: string;
}

export interface LumoVisitor {
  id: string;
  visitorName: string;
  visitorAvatar?: string;
  visitorPalette?: LumoPaletteId;
  action: string;
  target: string;
  exchangeType?: "visit" | "gift" | "citation" | "exchange" | "challenge";
  capsuleId?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  projectId: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  status: "active" | "invited";
  avatar?: string;
  joinedAt: string;
  lastActiveAt?: string;
}

export interface Source {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  sourceReferences?: Array<{
    label: string;
    url: string;
    note: string;
  }>;
  snapshotImage?: string;
  capturedText?: string;
  captureMode?: "manual" | "link" | "article_snapshot" | "image_snapshot" | "video_timestamp";
  type: SourceType;
  status: SourceStatus;
  triageStatus: TriageStatus;
  purpose: Purpose;
  collectionIds: string[];
  projectIds: string[];
  tags: string[];
  isFavorite?: boolean;
  savedAt: string;
  updatedAt: string;
  readingTime: number;
  readingProgress: number;
  hasSnapshot: boolean;
  snapshotStatus: "saved" | "pending" | "failed" | "not_supported";
  summary: string;
  aiReason: string;
  readingRecommendation: string;
  keyPoints: string[];
  relatedTopics: string[];
  content: string[];
  claimIds: string[];
  evidenceIds: string[];
  highlightIds: string[];
  noteIds: string[];
  entityIds: string[];
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  sourceIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Highlight {
  id: string;
  sourceId: string;
  text: string;
  paragraphIndex: number;
  color: HighlightColor;
  startOffset?: number;
  endOffset?: number;
  noteIds: string[];
  tagIds: string[];
  createdAt: string;
}

export interface NoteAttachment {
  type: "image" | "audio" | "video";
  dataUrl: string;
  name: string;
}

export interface Note {
  id: string;
  sourceId: string;
  highlightId?: string;
  paragraphIndex?: number;
  content: string;
  attachments?: NoteAttachment[];
  tagIds: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  keyQuestions: string[];
  status: ProjectStatus;
  sourceIds: string[];
  claimIds: string[];
  evidenceIds: string[];
  insightIds: string[];
  deliverableIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  text: string;
  sourceId: string;
  projectId?: string;
  evidenceIds: string[];
  entityIds: string[];
  tags: string[];
  confidence: Confidence;
  createdAt: string;
}

export interface Evidence {
  id: string;
  sourceId: string;
  claimId?: string;
  projectId?: string;
  text: string;
  originalUrl: string;
  sourceTitle: string;
  type: EvidenceType;
  confidence: Confidence;
  createdAt: string;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  sourceIds: string[];
}

export interface Insight {
  id: string;
  title: string;
  content: string;
  type: InsightType;
  priority: Priority;
  projectId?: string;
  claimIds: string[];
  evidenceIds: string[];
  suggestedDeliverables: DeliverableType[];
  createdAt: string;
}

export interface Inspiration {
  id: string;
  title: string;
  content: string; // HTML from contentEditable
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface TimelineEntry {
  id: string;
  projectId: string;
  type: "source_added" | "claim_extracted" | "evidence_added" | "insight_generated" | "deliverable_created" | "agent_run" | "manual_checkpoint" | "note_added" | "source_archived";
  title: string;
  description: string;
  timestamp: string;
  userNote?: string;
  snapshot?: {
    sourceCount: number;
    claimCount: number;
    evidenceCount: number;
    insightCount: number;
    sourceIds: string[];
    claimIds: string[];
    evidenceIds: string[];
    insightIds: string[];
  };
}

export interface Deliverable {
  id: string;
  title: string;
  type: DeliverableType;
  projectId: string;
  content: string;
  sourceIds: string[];
  claimIds: string[];
  evidenceIds: string[];
  insightIds: string[];
  createdAt: string;
  /** "ai" = Lumo AI 一键生成，"manual" = 手动「加入成果」积累 */
  origin?: "ai" | "manual";
}
