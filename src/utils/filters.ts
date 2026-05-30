import type { Source } from "../types";

export const sourceMatchesQuery = (source: Source, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    source.title,
    source.summary,
    source.sourceName,
    source.content.join(" "),
    source.tags.join(" "),
    source.keyPoints.join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
};
