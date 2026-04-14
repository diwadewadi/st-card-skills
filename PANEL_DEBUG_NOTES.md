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

### 4. iframe 全局变量注入问题（未解决）

面板以 iframe 形式弹出，Vue 应用需要 `Vue`、`VueRouter`、`z`、`$` 等全局变量。

**已尝试的方案**:

- **srcdoc + 桥接脚本 `window.parent`**: 桥接脚本通过 `window.parent.Vue` 复制全局变量。但酒馆助手脚本的全局变量（Vue、VueRouter、z 等）可能不在 DOM 的 `window` 对象上，而是在酒馆助手自己的执行环境中。`window.parent` 指向页面的 `window`，不一定有这些变量。结果: `VueRouter is not defined`。

- **contentDocument.write + contentWindow 注入**: 先把 iframe 临时挂到 DOM，通过 `iframe.contentWindow` 直接赋值全局变量，再 `document.write` HTML 结构，最后动态插入 `<script type="module">`。然后 `iframe.remove()` 移出 DOM 交给 popup。结果: 面板空白，可能是 remove 后 iframe 的 document 被销毁或模块脚本未执行。

**待验证的方向**:

- `iframe.remove()` 后再交给 popup 是否会导致 contentDocument 丢失？应该在 popup 内部创建 iframe 而不是先 remove 再传入。
- 酒馆助手的全局变量到底挂在哪个 window 上？需要在浏览器控制台检查 `window.Vue`、`window.VueRouter` 是否存在。
- 尘史使徒的状态栏是纯 JS 模式（无 index.html），不走 iframe，直接在酒馆助手环境执行，所以没有这个问题。面板如果也改成纯 JS 模式（不用 iframe），可以避开全局变量注入问题，但需要重新设计弹窗渲染方式。
- 或者用 Blob URL 创建 iframe src，在 Blob HTML 中内联 Vue/VueRouter 的 CDN import。

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
