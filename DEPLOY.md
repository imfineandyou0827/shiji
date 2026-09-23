# 拾集 · 部署与安装说明

「拾集」是一个纯前端、本地优先的 PWA。所有数据保存在**浏览器本地**（localStorage），没有服务器、没有账号。

---

## 一、先构建

```bash
cd /root/projects/备忘录2
npm install
npm run build          # 产物在 dist/
```

构建后会生成 `dist/`，其中关键文件：

- `index.html` — 入口
- `sw.js` / `workbox-*.js` — Service Worker（离线支持）
- `manifest.webmanifest` — 应用清单（安装信息）
- `pwa-192x192.png` / `pwa-512x512.png` / `maskable-512x512.png` / `apple-touch-icon.png` — 图标

本地验证生产版：

```bash
npm run preview -- --port 4175 --host
# 电脑打开 http://localhost:4175
```

> 注意：`npm run dev`（开发模式）**不启用** Service Worker，测安装/离线请用 `build` + `preview`。

---

## 二、部署（任选一种，都需要 HTTPS）

> 仓库里已带 `netlify.toml` 和 `vercel.json`（构建命令、输出目录、SPA 回退、Service Worker 不缓存都配好了）。
> - **连 Git 仓库部署**：Netlify/Vercel 会自动读取，几乎零配置。
> - **拖拽部署**（Netlify Drop）：拖的是**构建产物** `dist/`（或 `shiji-dist.zip` 解压后的内容）。

PWA 安装要求**安全上下文**：`https://` 或 `localhost`。纯 `http://192.168.x.x` 局域网地址**不能安装**。

### 方式 A：Netlify Drop（最简单，无需账号）

1. 电脑打开 <https://app.netlify.com/drop>
2. 把整个 `dist/` 文件夹（或本仓库的 `shiji-dist.zip` 解压后）拖进去
3. 得到 `https://xxxx.netlify.app` 网址

### 方式 B：Vercel

```bash
npm i -g vercel
vercel            # 按提示，Build Command 填 npm run build，Output 目录填 dist
vercel --prod
```

### 方式 C：Cloudflare Pages

- 连接 Git 仓库，或直接用「Direct Upload」上传 `dist/`
- 构建命令：`npm run build`，输出目录：`dist`

### 方式 D：GitHub Pages（已内置自动部署，推荐个人用）

仓库里已带 `.github/workflows/deploy.yml`，推到 GitHub 后**自动构建并部署**，无需手工打包。

1. 新建一个 **Public** 仓库（免费版 Pages 仅公开仓库可用），名字随意，例如 `shiji`。
2. 把项目代码推上去（`.gitignore` 已排除 `node_modules` 和 `dist`）：
   ```bash
   cd 备忘录2
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```
   （不想用命令行：仓库页 → Add file → Upload files，拖入除 `node_modules`、`dist` 外的全部文件，**记得包含隐藏的 `.github` 文件夹**。）
3. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
4. 推送后自动跑构建（1–2 分钟）。网址：`https://你的用户名.github.io/仓库名/`。
5. 手机打开该网址 → 添加到主屏幕。**固定图标，以后更新不用重装**（Service Worker 自动更新）。

> 子路径 `base` 由工作流按仓库名自动设置，无需改动。

### 方式 E：自己的服务器（nginx）

把 `dist/` 内容放到站点根目录，nginx 配置（SPA 需要 fallback 到 index.html）：

```nginx
server {
  listen 443 ssl;
  server_name your.domain.com;
  root /var/www/shiji;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Service Worker 不要长期缓存
  location = /sw.js {
    add_header Cache-Control "no-cache";
  }
}
```

---

## 三、手机上安装

先用手机浏览器打开部署得到的 `https://...` 网址，然后：

- **Android Chrome**：地址栏右侧出现「安装」图标，或菜单 →「安装应用 / 添加到主屏幕」。
- **iPhone / iPad Safari**：底部「分享」按钮 →「添加到主屏幕」。
- 也可以进应用内「设置 → 安装到设备」，按提示操作。

安装后桌面会有图标，可全屏独立打开，**断网也能用**（应用外壳 + 看过的地图瓦片已缓存）。

---

## 四、数据说明（重要）

- 数据存在**当前浏览器、当前域名**下。换域名 / 换浏览器 / 清理浏览器数据 = 空库。
- 手机和电脑是**两份独立数据**。
- 迁移或同步：在旧地址「设置 → 导出 JSON」，到新地址「设置 → 导入 JSON」。
- 建议养成定期导出备份的习惯。

---

## 五、云同步（可选，GitHub Gist）

应用支持通过**你自己的私有 Gist**在手机与电脑间同步，数据在本地用口令加密后才上传。

1. 打开 <https://github.com/settings/tokens>，生成一个 Token，**只需勾选 `gist` 权限**。
2. 在应用「设置 → 云同步（GitHub Gist）」中填入：
   - **GitHub Token**：上一步的 Token
   - **Gist ID**：留空（首次同步会自动创建）
   - **同步口令**：自定义，用于加密（**务必牢记**）
3. 点「立即同步」：
   - 首次会创建私有 Gist 并上传；
   - 换设备时填同一个 Token / Gist ID / 口令，即可拉取合并。
4. 冲突按每条数据的 `updatedAt`「后写覆盖」；删除会记录墓碑，避免被另一端复活。

> Token 与口令保存在本机浏览器中，请勿在公用电脑上使用。Gist 上只有密文，没有明文。

---

## 六、子路径部署（GitHub Pages 等）

如果部署在子路径（如 `https://用户名.github.io/仓库名/`），需要把 `base` 设为该子路径，并同步给 PWA 的 `start_url` / `scope`。

`vite.config.ts`：

```ts
export default defineConfig({
  base: '/仓库名/',
  plugins: [
    react(),
    VitePWA({
      // ...
      manifest: {
        // ...
        start_url: '/仓库名/',
        scope: '/仓库名/',
      },
    }),
  ],
})
```

改完重新 `npm run build`。若部署在域名根目录，则无需这一步。

---

## 七、更新版本

重新构建并重新部署 `dist/` 即可。Service Worker 使用 `autoUpdate`，用户下次打开会自动拉取新版本。

---

## 八、数据安全：自动备份与提醒

- **本地自动备份**：应用会自动保留最近 10 份快照（约每 5 分钟或切到后台时），存在 IndexedDB。在「设置 → 本地自动备份」可**立即备份 / 恢复 / 导出 / 删除**。它独立于 localStorage，不占 5MB 配额，误删可从快照恢复。
- **云同步**：见第五节，跨设备 + 离职备份。
- **日程提醒**：见「设置 → 日程提醒」，开启后日程到点弹系统通知；网页版需保持 App 打开/后台运行。

---

## 附：临时内网穿透（仅用于快速试用）

手机与电脑不同网络时，可用隧道把本地预览临时映射成 https：

```bash
# cloudflared（推荐，无中间页）
cloudflared tunnel --url http://localhost:4175

# 或 localtunnel
npx localtunnel --port 4175
```

得到 `https://...` 网址后手机打开即可安装。缺点是隧道关掉后该网址失效（但已安装到手机的 App 仍可离线使用）；仅适合临时验证，长期使用请用上面的正式部署。
