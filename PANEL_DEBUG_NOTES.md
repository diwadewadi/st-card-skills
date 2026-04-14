# 面板 (Panel) 集成调试笔记

## 问题背景

为「常识修改_保守女尊世界」角色卡创建 Vue 3 仪表盘面板，构建后集成到酒馆助手脚本，点击按钮弹出 iframe 弹窗。

## 已确认的问题

### 1. IframeBridgePlugin 构建产物损坏 ✅ 已修复

`devkit/webpack.config.ts` 中的 `IframeBridgePlugin` 生成的桥接脚本在最终 HTML 中是坏的。

**现象**: `dist/panel/index.html` 中桥接脚本的 `forEach` 部分丢失，模块脚本内容被吞进桥接脚本的数组字面量 `['` 中：

```
<head><script>if(window.parent!==window){['<script type="module">...整个模块JS...</script>
```

**根因**: 桥接脚本包含 `['$','_',...]`，其中 `$'` 是 `String.prototype.replace()` 的特殊替换模式（表示"匹配位置之后的文本"）。`html.replace(/<head>/i, '<head>' + bridgeScript)` 中的 `$'` 被解释为替换模式，将 `<head>` 之后的整个 HTML 内容插入到了数组字面量中间。（之前误判为 HtmlInlineScriptWebpackPlugin 转义冲突，实际无关。）

**修复**: 所有 `html.replace()` 调用改用函数替换 `() => ...`，避免 `$` 被解释为特殊模式。同时用 `JSON.stringify()` 生成数组字面量，更安全。

### 2. 酒馆助手脚本按钮绑定 ✅ 已修复（文档）

按钮不能靠在 JSON 元数据里声明就自动绑定回调。必须在脚本代码中用事件 API 绑定：

```javascript
$(() => {
  eventOn(getButtonEvent('按钮名'), callbackFunction);
});
```

参考: `尘史使徒4.0/scripts/002_状态栏-本地-content.js` 末尾的实现。

### 3. callGenericPopup 参数类型 ✅ 已修复（文档）

`SillyTavern.callGenericPopup()` 第一个参数必须是 jQuery 对象或字符串，不接受裸 HTMLElement：

```javascript
// 错误
SillyTavern.callGenericPopup(iframe, ...);
// 正确
SillyTavern.callGenericPopup($(iframe), ...);
```

### 4. iframe 全局变量注入问题 ✅ 已解决（架构变更）

面板以 iframe 形式弹出，Vue 应用需要 `Vue`、`VueRouter`、`z`、`$` 等全局变量。

**根因**: iframe 有独立的 window，全局变量不可用。`iframe.remove()` 后传给 popup 还会导致 contentDocument 丢失。

**解决方案**: 面板改为 JS 模式直接挂载（参考尘史使徒的做法），不再使用 iframe：
- 删除 panel 模板的 `index.html`，webpack 输出 JS 而非 HTML
- 面板脚本在酒馆主页面运行，通过 `callGenericPopup($('<div>'))` 弹出 Vue app
- 全局变量天然可用，无需桥接
- 已更新 `frontend.md`、`conventions.md`、`script.md`、`webpack.config.ts` 中的相关文档

### 5. store.ts 导入路径 ✅ 已修复（文档）

`st-card-skills/devkit/util/mvu-store` 这个路径在 webpack 构建时无法解析（卡片源码目录没有 node_modules）。正确的导入路径是 `@util/mvu-store`，对应 tsconfig 的 paths 映射 `@util/*` → `./util/*`。已在 `frontend.md` 和 `conventions.md` 中明确标注正确导入路径并禁止使用绝对路径。

## 关键文件路径

- devkit: `D:/ST/st-card-skills/devkit/`
- webpack 配置: `devkit/webpack.config.ts`
- IframeBridgePlugin: `webpack.config.ts:229-267`
- HtmlInlineScriptWebpackPlugin 源码: `devkit/node_modules/.pnpm/html-inline-script-webpack-*/dist/HtmlInlineScriptPlugin.js:74`
- 面板源码: `workspace/cards/常识修改_保守女尊世界/src/panel/`
- 面板构建产物: `workspace/cards/常识修改_保守女尊世界/dist/panel/index.html`
- 面板包装脚本: `workspace/cards/常识修改_保守女尊世界/scripts/002_仪表盘面板-content.js`
- 按钮事件 API 类型: `devkit/types/iframe/script.d.ts`
