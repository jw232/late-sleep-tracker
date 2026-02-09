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

这是一个帮助用户追踪和改善晚睡习惯的 Web 应用。用户可以记录每天的入睡时间和晚睡原因，AI 会分析原因并提供改善建议。

## 技术栈

- **框架**: Next.js 16.1.6 (App Router)
- **前端**: React 19.2.3 + TypeScript
- **数据库**: Supabase (PostgreSQL) via @supabase/supabase-js ^2.94.0
- **AI**: OpenAI API (GPT-4o-mini) via openai ^6.17.0
- **UI**: shadcn/ui (Radix UI ^1.4.3) + Tailwind CSS 4 + Lucide React icons
- **工具库**: clsx, tailwind-merge, class-variance-authority
- **测试**: Vitest ^4.0.18 + @testing-library/react (已配置，测试文件待创建)

## 已完成功能

### 1. 记录页 (`/`)
- 日期选择器
- 入睡时间按钮网格（21:00-04:00，30分钟间隔）
- 晚睡原因文本输入
- 状态评分（1-5）
- AI 分析结果展示（主要原因、置信度、改善建议、标签）
- 连续记录天数（streak）卡片，含动态激励文字
- 自动保存：AI分析完成后自动保存到数据库

### 2. 历史页 (`/history`)
- 记录列表视图
- 时间范围筛选（7天/30天）
- 搜索功能（支持回车和按钮触发）
- 编辑记录（弹窗编辑日期/时间/原因）
- 删除记录（二次确认弹窗）
- AI分析结果直接展示
  - 主要原因 + 置信度进度条
  - 改善建议列表
  - 标签展示

### 3. 洞察页 (`/insights`)
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

### 4. 设置页 (`/settings`)
- 语言切换（中文/English）
- 数据导出（CSV/JSON）
- 清空数据（需输入确认文字，无记录时按钮禁用）
- 隐私说明（4条要点）
- 关于信息（版本号和应用描述）
- 记录总数展示

## 项目结构

```
260112/late-sleep-tracker/
├── app/
│   ├── layout.tsx              # 根布局 + Navigation
│   ├── page.tsx                # 记录页（首页）
│   ├── history/page.tsx        # 历史页
│   ├── insights/page.tsx       # 洞察页
│   ├── settings/page.tsx       # 设置页
│   └── api/
│       ├── analyze/route.ts    # AI分析接口（单条记录）
│       ├── records/route.ts    # 记录CRUD
│       ├── insights/route.ts   # 聚合统计 + AI模式分析
│       └── export/route.ts     # 数据导出 + 清空
├── components/
│   ├── navigation.tsx          # 顶部导航栏（4页面链接 + 语言切换）
│   ├── ui/                     # shadcn组件（button, input, textarea, card, dialog, tabs, label, select）
│   ├── record/
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
│   ├── supabase/client.ts      # Supabase客户端
│   ├── openai.ts               # OpenAI客户端
│   └── utils.ts                # cn() 工具函数
├── hooks/
│   └── use-locale.ts           # 国际化hook（中/英切换，localStorage持久化）
├── locales/
│   ├── zh.json                 # 中文
│   └── en.json                 # 英文
├── types/index.ts              # 类型定义
└── vitest.config.ts            # 测试配置（jsdom环境，@/路径别名）
```

## 类型定义

### 核心类型 (`types/index.ts`)

- **SleepRecord**: 完整记录（id, record_date, sleep_time, reason_text, mood_score, analysis, timestamps）
- **Analysis**: AI分析结果（top_reasons, suggestions, tags）
- **ReasonItem**: 原因条目（reason, confidence）
- **RecordFormData**: 表单数据（record_date, sleep_time, reason_text, mood_score）
- **PatternAnalysis**: AI模式分析（patterns[], weekday_analysis, trend, actionable_advice[]）

## 数据库设计

### `sleep_records` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| record_date | DATE | 记录日期（必填） |
| sleep_time | TIME | 入睡时间（必填） |
| reason_text | TEXT | 晚睡原因（必填） |
| mood_score | INTEGER | 状态评分1-5（可选） |
| analysis | JSONB | AI分析结果 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
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
- **状态**: 已配置（vitest.config.ts 和 package.json scripts 已就位），测试文件待创建
- **路径别名**: `@/` 映射到项目根目录

## 最近更新

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
