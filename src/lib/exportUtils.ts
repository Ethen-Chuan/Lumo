import { useAppStore } from "../store/useAppStore";
import type { Source } from "../types";
import { formatDate, purposeLabel, sourceTypeLabel } from "../utils/format";
import { safeFilename } from "./utils";

// ─── primitive download helpers ───────────────────────────────────────────────

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  downloadBlob(filename, new Blob([content], { type: mime }));
}

// ─── bundle / structured exports ──────────────────────────────────────────────

export function exportSourceBundle(data: ReturnType<typeof useAppStore.getState>): void {
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

export function exportSourcesMarkdown(data: ReturnType<typeof useAppStore.getState>): void {
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

export function exportSourcesCsv(data: ReturnType<typeof useAppStore.getState>): void {
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

// ─── single-source text serialisers ──────────────────────────────────────────

export function sourceToMarkdown(source: Source): string {
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

export function sourceToPlainText(source: Source): string {
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

// ─── HTML / XML escaping ──────────────────────────────────────────────────────

export function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}

export function escapeXml(value: string | number | undefined | null): string {
  return escapeHtml(value);
}

// ─── Word (.doc / HTML-based) export ─────────────────────────────────────────

function visualTextUnits(value: string): number {
  return /[^\x00-\xff]/.test(value) ? 1.08 : value === " " ? 0.38 : 0.58;
}

function wrapVisualText(text: string, maxUnits: number, maxLines = 4): string[] {
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

function lumoDocumentShell(title: string, body: string): string {
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

function sourceToDocumentBody(source: Source): string {
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

function sourcesToDocumentBody(data: ReturnType<typeof useAppStore.getState>): string {
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

export function exportSourceWord(source: Source): void {
  downloadTextFile(`${safeFilename(source.title)}.doc`, lumoDocumentShell(source.title, sourceToDocumentBody(source)), "application/msword;charset=utf-8");
}

export function exportSourcesWord(data: ReturnType<typeof useAppStore.getState>): void {
  downloadTextFile(`lumo-sources-${Date.now()}.doc`, lumoDocumentShell("Lumo 资料库导出", sourcesToDocumentBody(data)), "application/msword;charset=utf-8");
}

// ─── Visual (SVG / PNG / JPG / PDF) export ───────────────────────────────────

type VisualExportDocument = { svg: string; width: number; height: number };
export type VisualExportFormat = "svg" | "png" | "jpg" | "pdf";

function appendSvgText(lines: string[], x: number, y: number, size: number, lineHeight: number, color = "#172033", weight = 560): string {
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

function rasterizeSvg(visualDoc: VisualExportDocument, mime: "image/png" | "image/jpeg", quality = 0.94): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(new Blob([visualDoc.svg], { type: "image/svg+xml;charset=utf-8" }));
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = visualDoc.width;
      canvas.height = visualDoc.height;
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

function buildImagePdf(imageBytes: Uint8Array, imageWidth: number, imageHeight: number): Uint8Array {
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

async function exportVisualDocument(filenameBase: string, visual: VisualExportDocument, format: VisualExportFormat): Promise<void> {
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
  const buf = await jpeg.arrayBuffer();
  const pdfBytes = buildImagePdf(new Uint8Array(buf), visual.width, visual.height);
  downloadBlob(`${filenameBase}.pdf`, new Blob([buf], { type: "application/pdf" }));
}

export function exportSourceVisual(source: Source, format: VisualExportFormat): Promise<void> {
  return exportVisualDocument(safeFilename(source.title), sourceToVisualDocument(source), format);
}

export function exportSourcesVisual(data: ReturnType<typeof useAppStore.getState>, format: VisualExportFormat): Promise<void> {
  return exportVisualDocument(`lumo-sources-${Date.now()}`, sourcesToVisualDocument(data), format);
}
