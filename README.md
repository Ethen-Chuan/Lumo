# Lumo

Lumo 是一个 AI 资料工作台 Demo，覆盖资料收藏、AI 收件箱、阅读器、高亮、笔记、观点、证据、洞察和成果生成等流程。

## 本地运行

```bash
corepack pnpm install
corepack pnpm dev
```

默认访问地址：

```text
http://localhost:5173/
```

## 构建

```bash
corepack pnpm build
```

构建产物在 `dist/`。

## 上线到 Vercel

推荐用 Vercel，上线最快。

1. 把项目推到 GitHub。
2. 在 Vercel 选择 `Add New Project`。
3. 导入这个仓库。
4. Vercel 会读取 `vercel.json`，使用：
   - Build Command: `corepack pnpm build`
   - Output Directory: `dist`
5. 点击 Deploy。

命令行部署也可以：

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

## 上线到 Netlify

1. 把项目推到 GitHub。
2. 在 Netlify 选择 `Add new site`。
3. 导入这个仓库。
4. Netlify 会读取 `netlify.toml`，使用：
   - Build command: `corepack pnpm build`
   - Publish directory: `dist`
5. 点击 Deploy。

## 静态资源

图片、视频、音频和文本资料放在：

```text
public/media/
```

上线后访问路径保持为：

```text
/media/文件名
```

## 说明

当前版本是纯前端 Demo，数据来自本地 mock。上线后所有访问者看到的是同一套演示数据；真实用户登录、云端同步、浏览器插件、真实 AI API 和数据库需要后续接入后端服务。
