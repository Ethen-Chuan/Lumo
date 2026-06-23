import { useRef } from "react";
import { Download, Copy } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { purposeLabel } from "../utils/format";
import type { AppLanguage } from "../store/useAppStore";

function isEn(language: AppLanguage) {
  return language === "en";
}

export function Matrix() {
  const language = useAppStore((s) => s.language);
  const english = isEn(language);
  const sources = useAppStore((s) => s.sources);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useAppStore((s) => s.projects);
  const notify = useAppStore((s) => s.notify);
  const project = projects.find((p) => p.id === selectedProjectId);
  const projectSources = project ? sources.filter((s) => project.sourceIds.includes(s.id)).slice(0, 8) : sources.slice(0, 6);
  const tableRef = useRef<HTMLTableElement>(null);

  const DIMS = english
    ? ["Product / Source", "Positioning", "Core feature", "Target user", "Growth mechanism", "Pricing", "Key differentiator"]
    : ["产品 / 资料", "定位", "核心功能", "目标用户", "增长机制", "定价", "差异化要点"];

  function readTableData(): string[][] {
    if (!tableRef.current) return [];
    const rows = Array.from(tableRef.current.querySelectorAll("tr"));
    return rows.map(row => Array.from(row.querySelectorAll("th, td")).map(cell => cell.textContent?.replace(/\s+/g, " ").trim() ?? ""));
  }

  function exportCSV() {
    const data = readTableData();
    const csv = data.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv, ""], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `lumo-matrix-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    notify(english ? "Exported as CSV" : "已导出 CSV，可用 Excel 打开");
  }

  function exportHTML() {
    const data = readTableData();
    if (!data.length) return;
    const [headers, ...rows] = data;
    const thCells = headers.map(h => `<th style="background:#ede9fe;color:#5b21b6;padding:8px 12px;border:1px solid #c4b5fd;font-size:12px;white-space:nowrap">${h}</th>`).join("");
    const bodyRows = rows.map((row, ri) =>
      `<tr style="background:${ri % 2 === 0 ? "#fff" : "#fafafa"}">${row.map(cell =>
        `<td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;vertical-align:top">${cell}</td>`
      ).join("")}</tr>`
    ).join("");
    const html = `<table style="border-collapse:collapse;font-family:sans-serif;width:100%"><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    void navigator.clipboard.write([
      new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([data.map(r => r.join("\t")).join("\n")], { type: "text/plain" }) })
    ]).then(() => notify(english ? "Copied as table — paste into Notion, Feishu or PPT" : "已复制为表格，可直接粘贴到 Notion、飞书、PPT"));
  }

  if (projectSources.length === 0) {
    return (
      <div className="matrix-empty">
        <p>{english ? "Add sources to this project to build a competitive matrix." : "把竞品资料加入当前项目，这里会自动生成对比矩阵。"}</p>
      </div>
    );
  }

  return (
    <div className="competitive-matrix-wrap">
      <div className="competitive-matrix-header">
        <div>
          <h3>{english ? "Competitive Analysis Matrix" : "竞品对比矩阵"}</h3>
          <p>{english ? "Based on sources in this project. Edit cells to fill in your research." : "基于当前项目资料自动生成，点击单元格可编辑填写研究结论。"}</p>
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button className="button secondary" onClick={exportCSV} title={english ? "Download as CSV (opens in Excel)" : "下载 CSV（Excel 可打开）"}>
            <Download size={13} /> CSV
          </button>
          <button className="button primary" onClick={exportHTML} title={english ? "Copy as rich table (paste into Notion / PPT)" : "复制为富文本表格（可粘贴到 Notion / PPT）"}>
            <Copy size={13} /> {english ? "Copy table" : "复制表格"}
          </button>
        </div>
      </div>
      <div className="competitive-matrix-scroll">
        <table className="matrix competitive" ref={tableRef}>
          <thead>
            <tr>
              {DIMS.map((h) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {projectSources.map((source) => (
              <tr key={source.id}>
                <td className="matrix-source-cell">
                  <strong>{source.title.slice(0, 24)}{source.title.length > 24 ? "…" : ""}</strong>
                  <small>{source.sourceName}</small>
                </td>
                <td contentEditable suppressContentEditableWarning className="matrix-editable">
                  {source.purpose ? purposeLabel(source.purpose) : "—"}
                </td>
                <td contentEditable suppressContentEditableWarning className="matrix-editable">
                  {source.summary?.slice(0, 40) ?? "—"}
                </td>
                <td contentEditable suppressContentEditableWarning className="matrix-editable">—</td>
                <td contentEditable suppressContentEditableWarning className="matrix-editable">—</td>
                <td contentEditable suppressContentEditableWarning className="matrix-editable">—</td>
                <td contentEditable suppressContentEditableWarning className="matrix-editable">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="matrix-tip">{english ? "💡 Click any cell to edit. Use Lumo Agent to auto-fill based on your sources." : "💡 点击单元格直接编辑。可用 Lumo Agent 基于资料自动填写。"}</p>
    </div>
  );
}
