import type { DeliverableType, Purpose, SourceStatus, SourceType, TriageStatus } from "../types";

export const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));

const purposeMap: Record<Purpose, string> = {
  later_reading: "稍后阅读",
  project_research: "项目研究",
  competitor_analysis: "竞品分析",
  writing_material: "写作素材",
  interview_prep: "面试准备",
  learning: "学习资料",
  task_reference: "任务参考",
  inspiration: "灵感收藏",
};

const triageMap: Record<TriageStatus, string> = {
  must_read: "必须阅读",
  skim: "快速略读",
  archive_suggested: "建议归档",
  project_material: "项目素材",
};

const deliverableMap: Record<DeliverableType, string> = {
  prd: "产品需求文档",
  competitive_analysis: "竞品分析",
  weekly_report: "研究周报",
  interview_material: "面试素材",
  article_outline: "文章大纲",
  research_brief: "研究简报",
  content_script: "内容脚本",
};

const sourceTypeMap: Record<SourceType, string> = {
  article: "文章",
  video: "视频",
  audio: "音频",
  pdf: "PDF",
  webpage: "网页",
  note: "笔记",
  image: "图片",
  newsletter: "通讯",
};

const statusMap: Record<SourceStatus, string> = {
  inbox: "收件箱",
  unread: "未读",
  read: "已读",
  archived: "已归档",
  deleted: "已删除",
};

export const purposeLabel = (purpose: Purpose) => purposeMap[purpose];
export const triageLabel = (triage: TriageStatus) => triageMap[triage];
export const deliverableLabel = (type: DeliverableType) => deliverableMap[type];
export const sourceTypeLabel = (type: SourceType) => sourceTypeMap[type];
export const statusLabel = (status: SourceStatus) => statusMap[status];
