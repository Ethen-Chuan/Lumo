# Lumo

Lumo 是一个面向产品研究、内容研究和个人知识整理的 AI 资料工作台。它希望把分散的网页、文章、视频片段和笔记，整理成一条可以追溯的研究链路：

> 收集资料 → 阅读与标注 → 提炼观点和证据 → 形成跨资料洞察 → 输出研究成果

这个仓库包含可直接运行的 Web 应用、Chrome 网页采集扩展、可选的 DeepSeek AI 能力，以及一套用于实验性云同步的 Supabase 数据结构。

## 项目解决什么问题

普通收藏夹只能保存链接，很难回答“这条资料为什么重要”“它支持了哪个判断”“最后被用在了什么成果里”。Lumo 将资料拆成可关联的研究对象：

- **Source（资料）**：文章、网页、视频、音频、PDF、图片、笔记等原始来源。
- **Highlight（高亮）**：阅读时保留的关键原文。
- **Note（笔记）**：围绕资料写下的个人理解。
- **Claim（观点）**：可以在讨论或决策中复用的判断。
- **Evidence（证据）**：支持观点的数据、事实或引用。
- **Insight（洞察）**：由多条资料、观点和证据综合形成的结论。
- **Deliverable（成果）**：研究简报、竞品分析、PRD、文章大纲或内容脚本。

## 主要能力

### 1. 资料收集与整理

- 快速保存链接、文本、图片等资料。
- 使用集合、标签、来源类型、阅读状态和用途整理资料。
- AI 收件箱用于对新资料进行阅读优先级分拣。
- 支持从 Chrome 扩展导入网页采集结果。
- 支持 JSON 全量备份与恢复。

### 2. 阅读、标注与研究沉淀

- 在阅读器中查看资料正文、摘要和关键点。
- 保存高亮、笔记、观点和证据，并保留来源关系。
- 为证据记录置信度、原始链接和所属项目。
- 将资料、观点和证据组织进具体研究项目。

### 3. AI 研究辅助

配置 DeepSeek API Key 后，可以调用真实模型完成：

- 资料摘要与关键点提取；
- 阅读优先级判断；
- 从文章中提炼 Claim；
- 围绕当前段落提问；
- 跨资料生成 Insight；
- 生成研究简报、竞品分析、PRD、文章大纲和内容脚本；
- 运行研究 Agent，在本地资料库中搜索、阅读并保存观点与证据。

没有配置 API Key 时，应用的资料管理、阅读、编辑、图谱和导出功能仍可使用；依赖模型的部分页面会使用本地示例或规则逻辑，研究 Agent 则会提示先配置 Key。

### 4. 可视化与成果输出

- 项目知识图谱、世界树、时间线和关联视图。
- 研究成果编辑与管理。
- 资料和成果可导出为 Markdown、JSON、CSV、Word、PDF、SVG、PNG、JPG、TXT 等格式。
- 图谱可导出为 JSON 或视觉文件，便于继续放入文档、汇报或设计工具。

### 5. Chrome 网页采集扩展

`extension/` 是一个无需打包即可加载的 Chrome 扩展，可在任意网页中：

- 保存当前链接；
- 保存文章图文快照；
- 截取当前标签页的可视区域；
- 保存视频时间点；
- 导出采集记录为 JSON，再导入 Lumo。

扩展的详细加载步骤见 [`extension/README.md`](extension/README.md)。

## 数据与 AI 是怎样工作的

```text
浏览器扩展 / 手动录入
          ↓
       资料库
          ↓
阅读器 → 高亮 / 笔记 → 观点 / 证据
          ↓
     洞察与项目空间
          ↓
 研究成果与多格式导出
```

默认情况下，主要业务数据由 Zustand 持久化到当前浏览器的 `localStorage`。这意味着：

- 不需要注册账号即可体验大部分功能；
- 数据默认不会自动上传到项目作者的服务器；
- 更换浏览器、清理站点数据或超出浏览器存储容量时，数据可能丢失；
- 应定期通过“导入 / 导出”页面保存 JSON 备份；
- 仓库内包含演示用的初始数据，方便第一次打开时理解完整流程。

应用会在本地存储接近浏览器容量上限时给出提醒，但它不能替代正式数据库。

## 技术架构

- React 19
- TypeScript 5
- Vite 7
- Zustand 5
- Lucide React
- OpenAI JavaScript SDK（连接 DeepSeek 的 OpenAI-compatible API）
- Supabase JavaScript SDK（可选登录和云端同步实验）
- html2canvas（部分视觉导出）

核心目录：

```text
Lumo/
├── src/
│   ├── App.tsx                 # 主应用、页面和主要交互流程
│   ├── components/             # Agent、矩阵等独立组件
│   ├── data/mockData.ts        # 首次体验使用的示例数据
│   ├── services/aiService.ts   # DeepSeek 摘要、观点、洞察与成果生成
│   ├── services/agentService.ts# 可调用本地研究工具的 Agent 循环
│   ├── services/supabaseService.ts # 可选登录与云端数据写入
│   └── store/useAppStore.ts    # 业务状态、操作方法和本地持久化
├── extension/                  # Chrome 网页采集扩展
├── supabase/schema.sql         # Supabase 表结构和 RLS 策略
├── public/media/               # 应用演示所需的静态媒体
├── vercel.json                 # Vercel SPA 部署配置
└── netlify.toml                # Netlify SPA 部署配置
```

## 本地运行

### 环境要求

- Node.js 20 或更高版本
- pnpm（可通过 Corepack 启用）

### 安装与启动

```bash
corepack enable
corepack pnpm install
corepack pnpm dev
```

打开终端显示的地址，默认通常是：

```text
http://localhost:5173/
```

### 生产构建

```bash
corepack pnpm build
corepack pnpm preview
```

构建产物位于 `dist/`。

## 环境变量

先复制示例文件：

```bash
cp .env.example .env.local
```

可选配置如下：

```dotenv
VITE_DEEPSEEK_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

这些配置也可以在应用设置页中填写。

### DeepSeek 配置说明

Lumo 当前是纯前端实现，DeepSeek Key 会保存在浏览器 `localStorage` 中，或在使用 `VITE_DEEPSEEK_API_KEY` 时被打包进前端资源。前端通过 `dangerouslyAllowBrowser: true` 直接调用 DeepSeek。

因此，这种接入方式只适合本地体验、个人自托管和受控演示，**不适合把带有真实 Key 的版本公开部署**。生产环境应增加自己的服务端 API，由服务端安全保存密钥，并设置鉴权、额度限制和审计。

### Supabase 配置说明

仓库提供了实验性的 Supabase 接入：

1. 创建 Supabase 项目。
2. 在 SQL Editor 中执行 `supabase/schema.sql`。
3. 配置 Project URL 和 anon key。
4. 使用邮箱 Magic Link 登录。
5. 在设置页手动将当前本地研究数据同步到 Supabase。

SQL 已为各数据表开启 Row Level Security，使登录用户只能访问自己的记录。当前实现仍属于早期版本：界面中的同步操作以本地数据上推为主，尚未实现成熟的双向实时同步、离线冲突解决和版本历史，请先备份数据再测试。

## 部署

### Vercel

导入 GitHub 仓库后，Vercel 会读取 `vercel.json`：

- Build Command：`pnpm build`
- Output Directory：`dist`
- SPA 路由会重写到 `index.html`

### Netlify

Netlify 会读取 `netlify.toml`：

- Build Command：`pnpm build`
- Publish Directory：`dist`
- 所有前端路由回退到 `index.html`

公开部署时不要设置真实的 `VITE_DEEPSEEK_API_KEY`。Supabase anon key 可以出现在前端，但必须正确配置 RLS；不要使用 service role key。

## 当前状态与能力边界

Lumo 目前是一个功能较完整的前端研究工作台原型，而不是已经完成商业化和多人协作验证的 SaaS 产品。

当前已具备真实可运行的本地资料管理、研究关系、导出、浏览器采集和可选 AI 调用。以下能力仍需要继续工程化：

- 安全的服务端 AI 代理与用量控制；
- 稳定的网页正文解析和文件处理服务；
- 大文件、图片和视频的对象存储；
- 完整的双向云同步与冲突解决；
- 团队空间、权限、评论和审计；
- 自动化测试、错误监控和生产级性能优化。

## 隐私与安全

- `.env.local` 不应提交到 Git。
- 不要在公开部署中使用前端可见的真实 AI Key。
- 导入未知 JSON 前应先检查内容，重要数据应保留离线备份。
- Chrome 扩展采集的网页内容和截图保存在当前浏览器扩展存储中，直到用户导出或清空。
- 使用第三方 AI 或 Supabase 时，提交给这些服务的数据受对应服务条款和隐私政策约束。

## 说明

本仓库未声明开源许可证。在获得明确授权前，请不要将代码、设计或媒体资源视为可自由再分发或商用的开源内容。
