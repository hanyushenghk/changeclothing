# 写代码规则

写代码时严格遵循以下 4 条：

## 1. YAGNI(用不到不要做)

- 用最简单的实现满足当前需求
- 不要为未来可能的扩展提前设计抽象层
- 不留 TODO/未来扩展位
- 1 种实现就别造工厂模式

## 2. KISS(保持简单)

- 能用普通函数解决的，不要用类
- 能用 if-else 解决的，不要用 Strategy 模式
- 优先可读性，不优先"看起来专业"
- 5 行能写完的，不要用 50 行

## 3. 命名是设计

- 变量名/函数名要精确说明它装的是什么/做什么
- 不要用 data / temp / helper / util / manager 这种通用名
- 函数名里不要用 do / process / handle 这种空动词
- 如果需要注释解释命名，先改名字

## 4. Fail Fast(快速失败)

- 不要 catch 你不知道怎么处理的异常
- 在数据边界(API 输入、DB 输出)校验输入，出错立即抛具体异常
- 报错信息要包含"是什么值导致的"
- 绝不允许 silent fail / try： ... except： pass

## 项目 FORBIDDEN（禁止行为）清单

### 依赖 / 环境类

- 禁止用 npm install。统一用 pnpm。
- 禁止用 require()。统一 ESM import。
- 禁止用 axios。统一用原生 fetch 或 ofetch —— bundle 已经过大。
- 禁止用 moment.js。改 date-fns 或原生 Intl。
- 禁止用 jQuery。React 项目里不要再出现 $('#xxx')。

### AI 应用 / LLM 类

- 禁止把 OPENAI_API_KEY / ANTHROPIC_API_KEY 写在前台代码里 —— 必须走后端代理。
- 禁止用 OpenAI 旧版 chat.completions。统一用 AI SDK v6。
- 禁止 stream 响应时用 await response.text() —— 会丢失流式特性。
- 禁止把 prompt 硬编码在组件里。统一放 prompts/ 目录，版本化管理。
- 禁止生成“假成功”的兜底数据。LLM 出错就报错，不要返回 mock 数据糊弄。

### Next.js 类

- 禁止用 pages/ router。统一 app/ router —— 项目已迁移完成，不允许回退。
- 禁止在 'use client' 组件里直接 fetch 数据库。必须走 server component 或 server action。
- 禁止用 useEffect 做数据加载。统一 server component 或 SWR。

### 代码风格 / AI 协作流程类

- 禁止生成超过 200 行的单文件。超过就拆。
- 禁止留 // TODO 注释。该做就做，不做就不留位。
- 禁止 try { ... } catch (e) { console.log(e) }。要么不 catch，要么写明具体处理。
- 禁止改 package.json / .env 不告诉用户。引入新依赖、改环境变量必须确认。
- 禁止 commit 不带语义化 message。每个 commit 必须能看懂“为啥改”。

### 数据 / 安全类

- 禁止 DELETE 不带 WHERE。必须用软删除。
- 禁止用户密码明文存数据库。bcrypt 或 argon2。
- 禁止前端展示完整 token / API key。
