# 🛠️ Useful Tools

由 [OpenClaw AI](https://github.com/SkyWalkerKKKK) 驱动生成的实用小工具集合。每个工具是根目录下的一个独立子目录，互不干扰。

在线访问：**https://useful-tools.pages.dev** （部署后替换为实际地址）

---

## ✨ 特性

- 🧩 **工具独立**：每个工具一个目录，自带 `index.html`，零耦合。
- 🔁 **首页自动生成**：无需手动维护首页卡片，push 后自动刷新。
- 🎨 **统一暗色风格**：首页卡片样式统一，每个工具按名称自动配色。
- 🔍 **内置搜索**：按名称 / 描述 / 标签实时过滤。
- ☁️ **Cloudflare Pages**：免费、免备案、push 即部署。

---

## 📁 目录结构

```
useful-tools/
├── scripts/
│   └── build-index.mjs     # 构建脚本：扫描工具并生成首页
├── gold-calculator/        # 工具 1：金价计算器
│   ├── index.html
│   └── tool.json           # 可选：工具元数据
├── qrcode/                 # 工具 2（示例）：将来新增
│   ├── index.html
│   └── tool.json
├── package.json
└── README.md
```

---

## ➕ 新增一个工具（3 步）

1. **在根目录新建一个目录**，名字用连字符小写英文，例如 `color-picker/`
2. **在目录里放一个 `index.html`**，工具的所有资源都用**相对路径**引用（`./style.css`，不要 `/style.css`）
3. **（推荐）放一个 `tool.json`** 描述工具，让首页卡片更好看：

   ```json
   {
     "name": "取色器",
     "icon": "🎨",
     "desc": "从图片或屏幕任意位置提取颜色，支持 HEX / RGB / HSL。",
     "tags": ["Design", "Color"]
   }
   ```

完成。`git push` 后 Cloudflare 会自动重新构建，首页会自动出现新卡片，无需改动任何其它文件。

> 没有 `tool.json` 也能工作：脚本会用目录名做标题、🔧 做图标。

---

## 🔧 本地预览

```bash
# 1. 生成首页
npm run build

# 2. 本地起服务预览（在 dist/ 目录下）
npx serve dist
# 或
cd dist && python -m http.server 8080
```

---

## ☁️ 部署到 Cloudflare Pages

构建脚本会把网站文件输出到 `dist/`，Pages 直接部署这个目录即可。

| 配置项 | 值 |
|------|------|
| 框架预设 | 无（None） |
| 构建命令 | `npm run build` |
| 构建输出目录 | `dist` |
| 环境变量 | `NODE_VERSION` = `18`（可选） |
| 生产分支 | `main` |

部署后访问 `https://<项目名>.pages.dev`。

---

## 📜 约定

- **目录命名**：连字符小写英文，如 `gold-calculator`、`qrcode-gen`
- **资源路径**：一律使用**相对路径**，避免在子路径下 404
- **公共资源**：需要共享的 CSS / JS 放 `shared/` 目录（不会被当作工具）
- **跳过的目录**：`node_modules`、`scripts`、`assets`、`shared`、`public`、`dist`、`.git`、`.github`、所有 `.` 开头的目录

---

## 📄 License

MIT
