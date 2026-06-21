// ============================================================
// build-index.mjs
// 自动扫描 tools 目录下所有子目录，根据每个工具的 tool.json
// 元数据生成工具集合首页 index.html。
//
// 新增工具时无需修改本脚本：只要在根目录新建一个含 index.html
// 的子目录（并可选地放一个 tool.json）即可。
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 项目根 = scripts/ 的上一级，无论从哪里调用都正确
const ROOT = resolve(__dirname, '..');

// 不视为"工具"的目录（公共资源、构建相关等）
const SKIP_DIRS = new Set([
  'node_modules',
  'scripts',
  'assets',
  'shared',
  'public',
  'dist',
  '.git',
  '.github',
]);

// 构建产物输出目录（只含网站文件，不含源码）
const OUT_DIR = 'dist';

// ---------- 工具函数 ----------

// 目录名转人类可读标题：gold-calculator -> "Gold Calculator"
function humanize(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// 把目录名（连字符风格）转成 CSS 友好的颜色种子
function colorFromName(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    main: `hsl(${hue}, 70%, 60%)`,
    soft: `hsl(${hue}, 70%, 60%, 0.12)`,
  };
}

// 读取单个工具的元数据（缺失字段用默认值补全）
function readTool(dirName) {
  const dir = path.join(ROOT, dirName);
  const defaults = {
    name: humanize(dirName),
    icon: '🔧',
    desc: '',
    tags: [],
    path: dirName,
  };

  const metaFile = path.join(dir, 'tool.json');
  if (fs.existsSync(metaFile)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      return { ...defaults, ...meta, path: dirName };
    } catch (err) {
      console.warn(`⚠️  ${dirName}/tool.json 解析失败，使用默认值: ${err.message}`);
      return defaults;
    }
  }
  return defaults;
}

// 扫描根目录，找出所有"工具"（含 index.html 的子目录）
function discoverTools() {
  const tools = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const indexPath = path.join(ROOT, entry.name, 'index.html');
    if (!fs.existsSync(indexPath)) continue; // 没 index.html 就不算工具
    tools.push(readTool(entry.name));
  }
  // 按名称排序，保证首页顺序稳定
  tools.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  return tools;
}

// ---------- 首页模板 ----------

function renderCard(tool) {
  const color = colorFromName(tool.path);
  const tags = (tool.tags || [])
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join('');

  return `      <a class="tool-card" href="./${tool.path}/index.html"
          data-name="${escapeAttr(tool.name)}"
          data-desc="${escapeAttr(tool.desc || '')}"
          data-tags="${escapeAttr((tool.tags || []).join(' '))}"
          style="--c:${color.main};--cs:${color.soft}">
        <div class="tool-icon">${tool.icon}</div>
        <h2 class="tool-name">${escapeHtml(tool.name)}</h2>
        <p class="tool-desc">${escapeHtml(tool.desc || '暂无描述')}</p>
        ${tags ? `<div class="tool-tags">${tags}</div>` : ''}
        <span class="arrow">→</span>
      </a>`;
}

function renderPage(tools) {
  const cards = tools.map(renderCard).join('\n');
  const count = tools.length;
  const empty = tools.length === 0;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🛠️ Useful Tools · 实用工具集合</title>
  <meta name="description" content="由 OpenClaw AI 驱动生成的实用小工具集合，开箱即用。" />
  <style>
    :root {
      --bg: #0f1117;
      --bg-grad: radial-gradient(circle at 15% -10%, rgba(120,140,255,0.08), transparent 45%);
      --card: #181b25;
      --card-hover: #20242f;
      --border: #2a2e3c;
      --text: #e8eaf0;
      --text-dim: #9aa0b0;
      --accent: #8aa4ff;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
                   "Microsoft YaHei", sans-serif;
      background: var(--bg);
      background-image: var(--bg-grad);
      color: var(--text);
      min-height: 100vh;
      padding: 56px 20px 80px;
    }
    .container { width: 100%; max-width: 960px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 40px; }
    h1 { font-size: 2.6rem; font-weight: 700; letter-spacing: -0.5px; }
    .subtitle { color: var(--text-dim); margin-top: 12px; font-size: 1.02rem; line-height: 1.6; }
    .count { display: inline-block; margin-top: 18px; font-size: 0.8rem; color: var(--accent);
             background: rgba(138,164,255,0.1); padding: 4px 14px; border-radius: 20px; }

    .search-wrap { max-width: 420px; margin: 0 auto 36px; }
    .search {
      width: 100%; padding: 13px 18px; font-size: 0.95rem;
      background: var(--card); color: var(--text);
      border: 1px solid var(--border); border-radius: 12px; outline: none;
      transition: border-color .2s;
    }
    .search:focus { border-color: var(--accent); }
    .search::placeholder { color: #6b7280; }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 18px;
    }
    .tool-card {
      position: relative; display: block;
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 26px 24px;
      text-decoration: none; color: var(--text);
      transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease, background .22s ease;
      overflow: hidden;
    }
    .tool-card:hover {
      background: var(--card-hover);
      border-color: var(--c);
      transform: translateY(-3px);
      box-shadow: 0 14px 34px rgba(0,0,0,0.28);
    }
    .tool-icon { font-size: 2.1rem; line-height: 1; margin-bottom: 14px; }
    .tool-name { font-size: 1.2rem; margin-bottom: 8px; }
    .tool-desc { color: var(--text-dim); font-size: 0.9rem; line-height: 1.55; }
    .tool-tags { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { font-size: 0.72rem; background: var(--cs); color: var(--c);
           padding: 3px 10px; border-radius: 20px; font-weight: 500; }
    .arrow { position: absolute; top: 26px; right: 22px; color: var(--c);
             opacity: 0; transform: translateX(-6px); transition: .22s ease; }
    .tool-card:hover .arrow { opacity: 1; transform: translateX(0); }

    .empty { text-align: center; color: var(--text-dim); padding: 60px 0; }

    footer { margin-top: 60px; text-align: center; color: var(--text-dim);
             font-size: 0.85rem; line-height: 1.9; }
    footer a { color: var(--accent); text-decoration: none; }
    footer a:hover { text-decoration: underline; }

    @media (max-width: 540px) {
      h1 { font-size: 2rem; }
      .tools-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🛠️ Useful Tools</h1>
      <p class="subtitle">由 OpenClaw AI 驱动生成的实用小工具集合<br>打开即用，开箱即食</p>
      <span class="count">${count} 个工具</span>
    </header>

    <div class="search-wrap">
      <input class="search" id="search" type="text" placeholder="🔍 搜索工具名称、描述或标签…" />
    </div>

${empty
  ? `    <div class="empty">还没有工具。在仓库根目录新建一个含 <code>index.html</code> 的子目录即可。</div>`
  : `    <main class="tools-grid">
${cards}
    </main>`}

    <footer>
      <p>Made with 🤖 by OpenClaw · Maintained by SkyWalkerKKKK</p>
      <p><a href="https://github.com/SkyWalkerKKKK/useful-tools">查看源码 →</a></p>
    </footer>
  </div>

  <script>
    // 纯前端搜索：根据输入实时过滤卡片（从 DOM 读取 data-* 属性）
    var input = document.getElementById('search');
    var cards = document.querySelectorAll('.tool-card');
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      cards.forEach(function (card) {
        var text = (card.dataset.name + ' ' + card.dataset.desc + ' ' + card.dataset.tags).toLowerCase();
        card.style.display = text.indexOf(q) !== -1 ? '' : 'none';
      });
    });
  </script>
</body>
</html>
`;
}

// ---------- HTML 转义 ----------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

// ---------- 文件拷贝（递归）----------

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ---------- 主流程 ----------

const tools = discoverTools();
const html = renderPage(tools);

// 清空并重建 dist/ 目录
const outRoot = path.join(ROOT, OUT_DIR);
fs.rmSync(outRoot, { recursive: true, force: true });
fs.mkdirSync(outRoot, { recursive: true });

// 写入首页
fs.writeFileSync(path.join(outRoot, 'index.html'), html, 'utf8');

// 拷贝每个工具目录
for (const tool of tools) {
  copyDir(path.join(ROOT, tool.path), path.join(outRoot, tool.path));
}

// 如果有 shared/ 公共资源目录，也一并拷贝
const sharedDir = path.join(ROOT, 'shared');
if (fs.existsSync(sharedDir)) copyDir(sharedDir, path.join(outRoot, 'shared'));

console.log(`✅ 构建完成，产物输出到 ${OUT_DIR}/`);
console.log(`   共 ${tools.length} 个工具：`);
tools.forEach((t) => console.log(`   - ${t.icon}  ${t.name}  (/${t.path}/)`));
