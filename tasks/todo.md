# 全局 "Calm Night Sky" 暗色主题

## 任务列表

### Step 1: 核心主题变量
- [x] 1.1 `app/globals.css` — `:root` 变量替换为夜空暗色值 + body 固定渐变背景

### Step 2: Starfield 全局化
- [x] 2.1 `app/layout.tsx` — 添加 Starfield + `relative z-10` 内容包裹

### Step 3: 玻璃态卡片
- [x] 3.1 `components/ui/card.tsx` — 添加 `backdrop-blur-md`

### Step 4: Landing 去重
- [x] 4.1 `components/landing/landing-page.tsx` — 移除渐变和 Starfield（已在 layout）

### Step 5: 玻璃态导航
- [x] 5.1 `components/navigation.tsx` — `bg-white/80` → 玻璃态

### Step 6: 硬编码浅色修复
- [x] 6.1 `components/record/streak-card.tsx` — 浅色 → 暗色安全版
- [x] 6.2 `components/record/record-page.tsx` — 浅色 → 暗色安全版
- [x] 6.3 `app/billing/page.tsx` — 浅色 → 暗色安全版
- [x] 6.4 `app/insights/page.tsx` — 浅色 → 暗色安全版
- [x] 6.5 `app/history/page.tsx` — `text-red-600` → `text-red-400`
- [x] 6.6 `components/insights/ai-summary.tsx` — trend 颜色 600 → 400
- [x] 6.7 `app/login/page.tsx` — divider 重写 + `text-green-600` → 400

### 验证
- [x] 7.1 `npm run build` 通过
- [x] 7.2 `npm run test` 通过（33/33）

## Review

### 变更总览

修改了 12 个文件，0 个新建。核心策略：修改 `:root` CSS 变量自动级联到所有 shadcn 组件（~90%），然后手动修复硬编码浅色类名（~10%）。

### 修改文件

| 文件 | 改动说明 |
|------|----------|
| `app/globals.css` | `:root` 变量全部替换为夜空暗色值（深蓝背景、近白前景、amber 主色、白 5% 卡片），移除 `.dark` 块，body 改用固定渐变背景 + `color-scheme: dark` |
| `app/layout.tsx` | 导入 Starfield 组件，添加到 body 顶层，内容用 `relative z-10` 包裹 |
| `components/ui/card.tsx` | Card base class 添加 `backdrop-blur-md`（1 个 class） |
| `components/landing/landing-page.tsx` | 移除 Starfield 导入和组件、移除重复的渐变背景 class、移除多余的 z-10 wrapper div |
| `components/navigation.tsx` | `bg-white/80 backdrop-blur-sm` → `bg-white/5 backdrop-blur-md border-white/10` |
| `components/record/streak-card.tsx` | `bg-orange-100` → `bg-amber-400/10`，`text-orange-500` → `text-amber-400` |
| `components/record/record-page.tsx` | `text-green-600` → `text-green-400`，`text-red-600` → `text-red-400`，`border-amber-200 bg-amber-50` → `border-amber-400/30 bg-amber-400/5`，`text-amber-800` → `text-amber-300`，`text-amber-600` → `text-amber-400/70` |
| `app/billing/page.tsx` | `border-green-200 bg-green-50 text-green-800` → `border-green-400/30 bg-green-400/5 text-green-300`，`text-green-600` → `text-green-400`，`text-amber-600` → `text-amber-400` |
| `app/insights/page.tsx` | `text-red-600` → `text-red-400`，`border-amber-200 bg-amber-50 text-amber-800` → `border-amber-400/30 bg-amber-400/5 text-amber-300`，`text-amber-600` → `text-amber-400/70` |
| `app/history/page.tsx` | `text-red-600` → `text-red-400` |
| `components/insights/ai-summary.tsx` | trend 颜色 `text-green-600/red-600/yellow-600` → `text-green-400/red-400/yellow-400` |
| `app/login/page.tsx` | divider 从 `absolute + bg-card` 改为 flex 两线方式（避免透明背景问题），`text-green-600` → `text-green-400` |

### 验证结果

- `npm run build`: 通过，所有路由正常生成
- `npm run test`: 7 files, 33/33 tests passed
- 所有测试检查文本内容而非 CSS 类名，不受主题变更影响
