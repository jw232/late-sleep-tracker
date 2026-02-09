# Rebuild Late Sleep Tracker App - Todo

## Steps

- [x] **Step 1**: Install dependencies (supabase, openai, clsx, tailwind-merge, cva, lucide-react, vitest, testing-library)
- [x] **Step 2**: Initialize shadcn/ui + add 8 UI components (button, input, textarea, card, dialog, tabs, label, select)
- [x] **Step 3**: Create types (`types/index.ts`) + library files (`lib/supabase/client.ts`, `lib/openai.ts`)
- [x] **Step 4**: Create locale files (`locales/zh.json`, `locales/en.json`) + `hooks/use-locale.ts`
- [x] **Step 5**: Build navigation component + update `app/layout.tsx`
- [x] **Step 6**: Verify Supabase `sleep_records` table exists (confirmed with 2 existing records)
- [x] **Step 7**: Create all 4 API routes (records, analyze, insights, export)
- [x] **Step 8**: Build Record page - home (`/`) with form, analysis result, streak card
- [x] **Step 9**: Build History page (`/history`) with record list, search, edit/delete
- [x] **Step 10**: Build Insights page (`/insights`) with charts, stats, AI pattern analysis
- [x] **Step 11**: Build Settings page (`/settings`) with language, export, clear data, about
- [x] **Step 12**: Create `vitest.config.ts`
- [x] **Step 13**: Final verification - `npm run build` passes cleanly

---

## Review

### Summary
Rebuilt the entire Late Sleep Tracker app from a blank Next.js 16.1.6 template. All 4 pages, 4 API routes, 9 custom components, locale system, and type definitions created from scratch.

### Files Created (35 files)
| Category | Count | Files |
|----------|-------|-------|
| Types | 1 | `types/index.ts` |
| Lib | 3 | `lib/utils.ts` (shadcn), `lib/supabase/client.ts`, `lib/openai.ts` |
| Locales | 2 | `locales/zh.json`, `locales/en.json` |
| Hooks | 1 | `hooks/use-locale.ts` |
| UI (shadcn) | 8 | button, input, textarea, card, dialog, tabs, label, select |
| Components | 9 | navigation, 3 record, 2 history, 3 insights |
| Pages | 5 | layout + 4 pages (home, history, insights, settings) |
| API Routes | 4 | records, analyze, insights, export |
| Config | 2 | `vitest.config.ts`, `components.json` |

### Key Decisions
- **Pure CSS charts** - no charting library, just Tailwind + inline styles
- **Native `<input type="date">`** - no external date picker
- **useLocale hook** - simple localStorage-backed, not React Context
- **Auto-save flow**: submit → AI analyze → auto-save record with analysis to Supabase

### Verification
- `npm run build` passes cleanly (0 errors, 0 warnings)
- All 4 pages rendered as static: `/`, `/history`, `/insights`, `/settings`
- All 4 API routes compiled as dynamic: `/api/records`, `/api/analyze`, `/api/insights`, `/api/export`
- Supabase table `sleep_records` confirmed active with correct schema
