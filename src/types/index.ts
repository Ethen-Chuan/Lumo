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
export type HighlightColor = "yellow" | "green" | "blue" | "purple" | "red";
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
  | "settings";

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
  noteIds: string[];
  tagIds: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  sourceId: string;
  highlightId?: string;
  paragraphIndex?: number;
  content: string;
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
}
