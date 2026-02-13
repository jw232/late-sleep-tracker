1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY

---

# 项目文档：晚睡记录与原因分析 App

## 项目概述

这是一个帮助用户追踪和改善晚睡习惯的 Web 应用。用户可以记录每天的入睡时间和晚睡原因，AI 会分析原因并提供改善建议。支持 Free/Pro 订阅计费（Stripe），含营销落地页。

## 技术栈

- **框架**: Next.js 16.1.6 (App Router)
- **前端**: React 19.2.3 + TypeScript
- **认证**: Supabase Auth (Google OAuth + Magic Link) via @supabase/ssr
- **数据库**: Supabase (PostgreSQL) via @supabase/supabase-js ^2.95.3
- **AI**: Anthropic Claude API (claude-opus-4-6) via @anthropic-ai/sdk
- **计费**: Stripe ^20.3.1（Checkout + Customer Portal + Webhooks）
- **UI**: shadcn/ui (Radix UI ^1.4.3) + Tailwind CSS 4 + Lucide React icons
- **动画**: framer-motion ^12.34.0（落地页滚动动画）
- **工具库**: clsx, tailwind-merge, class-variance-authority
- **测试**: Vitest ^4.0.18 + @testing-library/react + @testing-library/jest-dom

## 设计系统："Calm Night Sky" 全局暗色主题

- 暗色主题通过 `:root` CSS 变量实现（oklch 色彩空间）
- 背景：固定渐变 `#0a0e27 → #141852 → #1a1040`（`body { background-attachment: fixed }`）
- 主色：琥珀色 amber（`oklch(0.82 0.16 84)`）
- 玻璃拟态：卡片 `--card: oklch(1 0 0 / 5%)` + `backdrop-blur-md`
- 星空画布：`<Starfield />` 组件在 `layout.tsx` 中全局渲染（z-0），鼠标视差效果
- 颜色约定：暗色主题下使用 `*-400` 变体（非 `*-600`），确保可读性

## 已完成功能

### 1. 落地页 (`/`，未登录时)
- 营销页面（Hero、功能介绍 4 卡片、使用步骤 3 步、定价对比 Free/Pro、CTA、Footer）
- `<Starfield />` 动画背景（~200 颗星星 + 鼠标视差）
- `<LandingNav />` 独立导航（Logo + 语言切换 + 登录按钮）
- framer-motion 滚动入场动画（fade-in、blur、scale）

### 2. 记录页 (`/`，已登录时)
- 日期选择器
- 入睡时间按钮网格（21:00-04:00，30分钟间隔）
- 晚睡原因文本输入
- 状态评分（1-5）
- AI 分析结果展示（主要原因、置信度、改善建议、标签）
- 连续记录天数（streak）卡片，含动态激励文字
- 自动保存：AI分析完成后自动保存到数据库
- AI 用量限制提示（Free 用户 5 次/月）

### 3. 历史页 (`/history`)
- 记录列表视图
- 时间范围筛选（7天/30天）
- 搜索功能（支持回车和按钮触发）
- 编辑记录（弹窗编辑日期/时间/原因）
- 删除记录（二次确认弹窗）
- AI分析结果直接展示
  - 主要原因 + 置信度进度条
  - 改善建议列表
  - 标签展示

### 4. 洞察页 (`/insights`)
- 时间范围筛选（7天/30天）
- 晚睡原因 Top 5 统计（水平条形图）
- 入睡时间统计（平均/最早/最晚）
- 入睡时间趋势图（最近14天柱状图，支持悬停查看详情）
- AI 模式分析（PatternAnalysis）
  - 行为模式识别（含证据和频率）
  - 星期分析（最差日期和详细分析）
  - 趋势方向（improving/worsening/stable）
  - 可操作建议列表
- 最少3条记录才显示AI分析

### 5. 设置页 (`/settings`)
- 语言切换（中文/English）
- 数据导出（CSV/JSON）
- 清空数据（需输入确认文字，无记录时按钮禁用）
- 隐私说明（4条要点）
- 关于信息（版本号和应用描述）
- 记录总数展示
- 退出登录按钮

### 6. 计费页 (`/billing`)
- 订阅状态展示（Free/Pro、当前周期结束日期）
- 定价卡片（月付/年付切换）
- Stripe Checkout 跳转购买
- Stripe Customer Portal 管理订阅（取消/续订）
- Free 用户 AI 分析用量限制（5 次/月），Pro 无限制

### 7. 用户认证
- 登录页 (`/login`)：Google OAuth + Magic Link
- Middleware 路由保护：未登录自动跳转 `/login`
- Auth Callback (`/auth/callback`)：OAuth code → session 交换
- 导航栏显示用户邮箱首字母 + PRO 徽章 + 登出按钮（LogOut 图标）
- 数据隔离：所有 API 路由按 `user_id` 过滤，RLS 策略兜底
- Cookie-based session 管理（@supabase/ssr）

## 项目结构

```
260112/late-sleep-tracker/
├── middleware.ts                # 路由保护（未登录→/login，已登录+/login→/）
├── app/
│   ├── globals.css             # Tailwind CSS 4 + "Calm Night Sky" 主题变量
│   ├── layout.tsx              # 根布局 + Starfield(z-0) + Navigation + 内容(z-10)
│   ├── page.tsx                # 服务端组件：已登录→RecordPage，未登录→LandingPage
│   ├── login/page.tsx          # 登录页（Google OAuth + Magic Link）
│   ├── auth/callback/route.ts  # OAuth callback（code → session）
│   ├── billing/page.tsx        # 计费页（订阅状态 + 定价卡片）
│   ├── history/page.tsx        # 历史页
│   ├── insights/page.tsx       # 洞察页
│   ├── settings/page.tsx       # 设置页
│   └── api/
│       ├── analyze/route.ts    # AI分析接口（单条记录，含用量限制）
│       ├── records/route.ts    # 记录CRUD（user_id 隔离）
│       ├── insights/route.ts   # 聚合统计 + AI模式分析（user_id 隔离）
│       ├── export/route.ts     # 数据导出 + 清空（user_id 隔离）
│       ├── usage/route.ts      # 订阅状态 + AI 用量查询
│       └── stripe/
│           ├── checkout/route.ts  # 创建 Stripe Checkout Session
│           ├── portal/route.ts    # 创建 Stripe Customer Portal Session
│           └── webhook/route.ts   # Stripe Webhook 处理（subscription 事件）
├── components/
│   ├── navigation.tsx          # 顶部导航栏（5页面链接 + 玻璃拟态 + PRO徽章 + 登出）
│   ├── ui/                     # shadcn组件（button, input, textarea, card, dialog, tabs, label, select）
│   ├── landing/
│   │   ├── landing-page.tsx    # 营销落地页（Hero + Features + Pricing + CTA）
│   │   ├── landing-nav.tsx     # 落地页导航（Logo + 语言切换 + Login）
│   │   └── starfield.tsx       # 星空画布动画（~200星 + 鼠标视差）
│   ├── record/
│   │   ├── record-page.tsx     # 记录页容器（加载用量状态 + 编排子组件）
│   │   ├── record-form.tsx     # 输入表单（含时间按钮网格）
│   │   ├── analysis-result.tsx # AI结果展示
│   │   └── streak-card.tsx     # 连续记录天数卡片
│   ├── history/
│   │   ├── record-list.tsx     # 列表视图
│   │   └── record-card.tsx     # 记录卡片（含AI分析展示）
│   └── insights/
│       ├── reason-chart.tsx    # 原因Top5图表
│       ├── sleep-stats.tsx     # 时间统计 + 14天趋势柱状图
│       └── ai-summary.tsx      # AI模式分析展示
├── lib/
│   ├── supabase/client.ts      # Supabase 浏览器端客户端
│   ├── supabase/server.ts      # Supabase 服务端客户端（cookies）
│   ├── supabase/middleware.ts   # Supabase middleware 辅助（session 刷新）
│   ├── supabase/admin.ts       # Supabase Admin 客户端（service_role_key，用于 webhook）
│   ├── anthropic.ts            # Anthropic Claude客户端
│   ├── streak.ts               # Streak 计算纯函数（从组件提取）
│   ├── stripe.ts               # Stripe 客户端实例
│   ├── subscription.ts         # 订阅状态查询（getSubscriptionStatus）
│   └── utils.ts                # cn() 工具函数
├── hooks/
│   └── use-locale.ts           # 国际化hook（中/英切换，localStorage持久化）
├── locales/
│   ├── zh.json                 # 中文
│   └── en.json                 # 英文
├── types/index.ts              # 类型定义
├── vitest.config.ts            # 测试配置（jsdom环境，@/路径别名）
└── tests/
    ├── setup.ts                # 测试初始化（@testing-library/jest-dom）
    ├── helpers/
    │   └── mock-supabase.ts    # 共享 Supabase Mock 工厂（createMockSupabase, createMockQueryBuilder）
    ├── api/
    │   ├── records.test.ts     # 记录 CRUD 测试（26 用例）
    │   ├── analyze.test.ts     # AI 分析测试（16 用例）
    │   ├── insights.test.ts    # 洞察聚合测试（20 用例）
    │   ├── export.test.ts      # 导出/清空测试（14 用例）
    │   ├── usage.test.ts       # 订阅状态测试（6 用例）
    │   └── stripe/
    │       ├── checkout.test.ts  # Stripe Checkout 测试（10 用例）
    │       ├── portal.test.ts    # Stripe Portal 测试（6 用例）
    │       └── webhook.test.ts   # Stripe Webhook 测试（15 用例）
    ├── lib/
    │   ├── streak.test.ts        # Streak 计算逻辑测试（9 用例）
    │   ├── utils.test.ts         # cn() 工具函数测试（3 用例）
    │   ├── subscription.test.ts  # 订阅状态查询测试（12 用例）
    │   ├── anthropic.test.ts     # Anthropic 客户端测试（2 用例）
    │   └── stripe-client.test.ts # Stripe 客户端测试（4 用例）
    ├── hooks/
    │   └── use-locale.test.ts  # 国际化 hook 测试（5 用例）
    ├── components/
    │   ├── navigation.test.tsx     # 导航栏测试（2 用例）
    │   ├── record/
    │   │   ├── streak-card.test.tsx           # Streak 卡片测试（4 用例）
    │   │   ├── record-form.test.tsx           # 记录表单渲染测试（5 用例）
    │   │   ├── record-form-interaction.test.tsx # 记录表单交互测试（10 用例）
    │   │   └── analysis-result.test.tsx       # AI 结果展示测试（8 用例）
    │   ├── history/
    │   │   ├── record-card.test.tsx  # 记录卡片测试（5 用例）
    │   │   └── record-list.test.tsx  # 记录列表测试（5 用例）
    │   └── insights/
    │       ├── reason-chart.test.tsx # 原因图表测试（6 用例）
    │       ├── sleep-stats.test.tsx  # 时间统计测试（6 用例）
    │       └── ai-summary.test.tsx   # AI 摘要测试（7 用例）
    ├── pages/
    │   ├── login.test.tsx      # 登录页测试（8 用例）
    │   ├── settings.test.tsx   # 设置页测试（9 用例）
    │   ├── history.test.tsx    # 历史页测试（6 用例）
    │   └── billing.test.tsx    # 计费页测试（5 用例）
    ├── middleware/
    │   └── update-session.test.ts # 中间件路由保护测试（8 用例）
    ├── auth/
    │   └── callback.test.ts    # OAuth 回调测试（4 用例）
    └── edge-cases/
        ├── insights-calculations.test.ts # 时间计算边界测试（10 用例）
        ├── chart-edge.test.tsx           # 图表边界测试（3 用例）
        └── csv-export-edge.test.ts       # CSV 导出边界测试（2 用例）
```

## 类型定义

### 核心类型 (`types/index.ts`)

- **SleepRecord**: 完整记录（id, record_date, sleep_time, reason_text, mood_score, analysis, timestamps）
- **Analysis**: AI分析结果（top_reasons, suggestions, tags）
- **ReasonItem**: 原因条目（reason, confidence）
- **RecordFormData**: 表单数据（record_date, sleep_time, reason_text, mood_score）
- **PatternAnalysis**: AI模式分析（patterns[], weekday_analysis, trend, actionable_advice[]）
- **SubscriptionStatus**: 订阅状态（isPro, aiUsageThisMonth, aiLimitReached, currentPeriodEnd, cancelAtPeriodEnd）

## 数据库设计

### `sleep_records` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（关联 auth.users，RLS 策略依据） |
| record_date | DATE | 记录日期（必填） |
| sleep_time | TIME | 入睡时间（必填） |
| reason_text | TEXT | 晚睡原因（必填） |
| mood_score | INTEGER | 状态评分1-5（可选） |
| analysis | JSONB | AI分析结果 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### `subscriptions` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | UUID | 用户ID（关联 auth.users） |
| stripe_customer_id | TEXT | Stripe Customer ID |
| stripe_subscription_id | TEXT | Stripe Subscription ID |
| status | TEXT | 订阅状态（active, trialing, canceled 等） |
| current_period_end | TIMESTAMP | 当前计费周期结束时间 |
| cancel_at_period_end | BOOLEAN | 是否在周期末取消 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### `ai_usage` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID |
| endpoint | TEXT | 使用的端点（如 'analyze'） |
| created_at | TIMESTAMP | 使用时间（用于按月统计） |

### RLS 策略

启用 Row Level Security，4 条策略均按 `user_id = auth.uid()` 过滤：
- SELECT: 用户只能查看自己的记录
- INSERT: 插入时 user_id 必须匹配当前用户
- UPDATE: 用户只能修改自己的记录
- DELETE: 用户只能删除自己的记录

### Analysis JSONB 结构

```json
{
  "top_reasons": [{"reason": "工作", "confidence": 85}],
  "suggestions": ["建议1", "建议2"],
  "tags": ["work", "deadline"]
}
```

## 环境变量配置

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_YEARLY=price_...
```

## 开发命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 生产构建
npm run start      # 启动生产服务器
npm run lint       # ESLint 检查
npm run test       # 运行测试（vitest run）
npm run test:watch # 监听模式测试（vitest）
```

## 测试

- **框架**: Vitest + @testing-library/react + @testing-library/jest-dom
- **环境**: jsdom (via vitest.config.ts)
- **路径别名**: `@/` 映射到项目根目录
- **Mock 模式**: 共享 `tests/helpers/mock-supabase.ts` 提供 `createMockSupabase()` 和 `createMockQueryBuilder()`，模拟 Supabase 的 thenable 链式查询
- **注意**: 项目未安装 `@testing-library/user-event`，组件交互测试使用 `fireEvent`
- **状态**: 261 个测试用例，33 个文件全部通过

| 类别 | 文件数 | 用例数 | 说明 |
|------|--------|--------|------|
| API 路由测试 | 8 | 113 | records, analyze, insights, export, usage, stripe checkout/portal/webhook |
| 组件交互测试 | 6 | 42 | analysis-result, record-form-interaction, record-list, reason-chart, sleep-stats, ai-summary |
| 页面集成测试 | 4 | 28 | login, settings, history, billing |
| Lib 模块测试 | 5 | 30 | streak, utils, subscription, anthropic, stripe-client |
| 中间件/认证测试 | 2 | 12 | update-session, auth callback |
| 组件渲染测试 | 5 | 21 | navigation, streak-card, record-form, record-card, use-locale |
| 边界条件测试 | 3 | 15 | insights-calculations, chart-edge, csv-export-edge |
| **合计** | **33** | **261** | |

### 安全测试覆盖
- 所有 8 个 API 路由验证 401（未认证）
- 所有数据查询验证 `user_id` 过滤（数据隔离）
- PUT/DELETE 验证同时匹配 `id` + `user_id`（所有权验证）
- POST 验证 `user_id` 取自 session 而非请求体（防篡改）

## 认证架构

- **认证流程**: Supabase Auth (cookie-based) → middleware 自动刷新 session → API 路由验证 user
- **数据隔离**: RLS 按 `user_id = auth.uid()` 自动过滤 + API 路由手动添加 `.eq('user_id', user.id)` 双重保障
- **客户端**: `lib/supabase/client.ts` 用于浏览器端（登录页、导航栏登出）
- **服务端**: `lib/supabase/server.ts` 用于所有 API 路由，通过 cookies 传递 auth token
- **管理端**: `lib/supabase/admin.ts` 用于 Stripe webhook（需 service_role_key 绕过 RLS）

### 手动配置项

1. **Google OAuth**: Google Cloud Console 创建 OAuth Client → Supabase Dashboard → Providers → Google 填入 Client ID/Secret
2. **Redirect URL**: Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: `https://late-sleep-tracker.vercel.app`
   - **Redirect URLs**: `http://localhost:3000/**`（本地开发）+ `https://late-sleep-tracker.vercel.app/**`（生产环境）
3. **Magic Link**: Supabase 默认启用 Email provider

## 项目状态

**功能开发：全部完成** — 所有 PRD 需求已实现并可用。

| 功能 | 状态 | 说明 |
|------|------|------|
| prd-improvements.md（3 项优化） | ✅ 完成 | 时间按钮网格 + Streak 激励 + AI 模式分析 |
| prd-auth.md（认证系统） | ✅ 完成 | Google OAuth + Magic Link + RLS + 数据隔离 |
| prd-tests.md（单元测试） | ✅ 完成 | 261/261 用例通过，33/33 文件通过（含全部 API 路由测试） |
| Landing Page（营销落地页） | ✅ 完成 | Hero + Features + Pricing + Starfield 动画 |
| Stripe 订阅计费 | ✅ 完成 | Checkout + Portal + Webhooks + Free/Pro 用量限制 |
| "Calm Night Sky" 暗色主题 | ✅ 完成 | oklch 变量 + 星空渐变背景 + 玻璃拟态卡片 |

### 已知问题
- 无

### 代码指标
- ~3,440 行 TypeScript/TSX（源码）
- 21 个组件（13 业务 + 8 shadcn UI）
- 8 个 API 路由，6 个页面
- 261 个测试用例（33 个文件全部通过）

## 最近更新

### 2026-02-13: 全面测试套件（228 新测试）+ NaN 修复

**测试套件**：
- 新增 `tests/helpers/mock-supabase.ts` — 共享 Supabase Mock 工厂（thenable 链式查询模拟）
- 新增 27 个测试文件，228 个新测试用例，覆盖：
  - 所有 8 个 API 路由（records, analyze, insights, export, usage, stripe checkout/portal/webhook）
  - 6 个组件交互测试（analysis-result, record-form-interaction, record-list, reason-chart, sleep-stats, ai-summary）
  - 4 个页面集成测试（login, settings, history, billing）
  - 3 个 lib 模块测试（subscription, anthropic, stripe-client）
  - 中间件路由保护 + OAuth 回调测试
  - 边界条件测试（时间计算、图表、CSV 导出）
- 安全测试：所有 API 验证 401、user_id 数据隔离、所有权验证
- 原有 33 个测试未修改，全部继续通过
- 最终：261 个测试，33 个文件，0 失败

**Bug 修复**：
- `app/api/records/route.ts`: `days` 参数为非数字字符串时（如 `?days=abc`），`parseInt` 返回 `NaN` 导致 `RangeError`。修复：添加 `|| 30` 兜底，使 NaN 默认为 30 天

### 2026-02-11: Landing Page + "Calm Night Sky" 全局暗色主题 + Stripe 订阅计费

**Landing Page**：
- 新增 `components/landing/landing-page.tsx` — 营销页面（Hero、功能、定价、CTA）
- 新增 `components/landing/landing-nav.tsx` — 落地页独立导航
- 新增 `components/landing/starfield.tsx` — 星空画布动画
- `app/page.tsx` 改为服务端组件，按登录状态路由 Landing vs Record
- `app/layout.tsx` 添加 Starfield 全局背景 + z-10 内容层

**暗色主题**：
- `app/globals.css` 所有 CSS 变量改为 oklch 暗色方案
- body 添加 `#0a0e27 → #141852 → #1a1040` 固定渐变背景
- 卡片改为玻璃拟态（白色 5% + backdrop-blur-md）
- 导航栏改为 `bg-white/5 backdrop-blur-md` 风格

**Stripe 订阅计费**：
- 新增 `app/billing/page.tsx` — 计费管理页
- 新增 `app/api/stripe/checkout/route.ts` — 创建 Checkout Session
- 新增 `app/api/stripe/portal/route.ts` — 创建 Customer Portal
- 新增 `app/api/stripe/webhook/route.ts` — 处理订阅事件
- 新增 `app/api/usage/route.ts` — 用量查询
- 新增 `lib/stripe.ts` — Stripe 客户端
- 新增 `lib/subscription.ts` — 订阅状态查询逻辑
- 新增 `lib/supabase/admin.ts` — Supabase Admin 客户端
- 新增 `components/record/record-page.tsx` — 记录页容器（含用量状态）
- 导航栏添加 Billing 链接 + PRO 徽章
- `types/index.ts` 添加 `SubscriptionStatus` 类型

### 2026-02-10: 导航栏登出按钮 + API 数据隔离

**导航栏变更**：
- 新增 `LogOut` 图标按钮（在用户头像右侧），点击后登出并跳转 `/login`

**API 数据隔离**：
- `records/route.ts`: GET/PUT/DELETE 查询均添加 `.eq('user_id', user.id)`
- `insights/route.ts`: GET 查询添加 `.eq('user_id', user.id)`
- `export/route.ts`: GET 查询添加 `.eq('user_id', user.id)`，DELETE 的 `.neq('id', '000...')` hack 替换为 `.eq('user_id', user.id)`

### 2026-02-09: 用户认证系统

**新增文件**：
- `middleware.ts` — 路由保护
- `app/login/page.tsx` — 登录页（Google OAuth + Magic Link）
- `app/auth/callback/route.ts` — OAuth callback
- `lib/supabase/server.ts` — 服务端 Supabase 客户端
- `lib/supabase/middleware.ts` — Middleware session 刷新

**修改文件**：
- 所有 API 路由改用 server client + auth 检查
- `settings/page.tsx` 添加退出登录按钮
- `navigation.tsx` 显示用户邮箱首字母，`/login` 时隐藏
- `locales/*.json` 添加 `login` 节点 + `settings.signOut`

**数据库迁移**：
- 添加 `user_id` 列 + RLS 4 条策略

### 2026-02-08: 记录页优化 + 洞察页增强

**记录页变更**：
- 新增入睡时间按钮网格（21:00-04:00，30分钟间隔），替代手动输入
- 新增 `streak-card.tsx` 组件，展示连续记录天数和6级激励文字

**洞察页变更**：
- 新增 `sleep-stats.tsx` 组件（替代原来的简单统计展示），含14天趋势柱状图
- AI分析升级为 PatternAnalysis 格式：模式识别、星期分析、趋势方向、可操作建议
- 新增 `PatternAnalysis` 类型定义到 `types/index.ts`

**测试配置**：
- 添加 Vitest + Testing Library 依赖
- 创建 `vitest.config.ts` 配置文件

### 2026-02-04: 历史页 AI 分析结果展示增强

**变更内容**：在历史页的每条记录卡片中直接展示完整的 AI 分析结果。

**修改文件**：`components/history/record-card.tsx`

**新增展示内容**：
- 主要原因列表（带置信度百分比进度条）
- 改善建议列表
- 已有的标签展示保持不变
