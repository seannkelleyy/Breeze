# Recurring Budget Generation Spec

Date: 2026-03-14
Owner: Breeze
Status: Proposed

## 1. Purpose

Define a predictable recurring-planning system so monthly budgets are pre-populated with common planned incomes and category allocations.

This supports:

- Biweekly payroll (for example, every other Thursday)
- Weekly payroll
- Semi-monthly payroll (for example, 1st and 15th)
- Monthly payroll
- Recurring category allocations (rent, mortgage, insurance)

This does not auto-create actual expense transactions. Expense rows remain actual spending entries against categories.

## 2. Product Rules

1. Monthly budget = month snapshot for planning + tracking.
2. Recurring templates are source of truth for planned recurring items.
3. Opening a month budget generates planned rows from active recurring templates that overlap the month.
4. Add Income remains for one-off/manual income (commission, side sales, one-time reimbursements).
5. Category allocations are planned values. Expense entries represent actual spend.

## 3. Scope

### In Scope

- Recurring income templates
- Recurring category templates
- Month generation for planned incomes/categories
- Start and stop dates (null stop date means never ends)
- Recurring columns visible in Income and Category planning tables

### Out of Scope (Phase 1)

- Auto-creating actual expense transactions
- Proration by business day or holiday calendars
- Per-template timezone support

## 4. Domain Model

### 4.1 RecurringIncomeTemplate

Columns:

- Id (int, PK)
- UserId (string, indexed)
- Name (string)
- Amount (decimal)
- ScheduleType (string enum: weekly, biweekly, semimonthly, monthly)
- AnchorDate (date, required)
- SemiMonthlyDay1 (int, nullable)
- SemiMonthlyDay2 (int, nullable)
- MonthlyDayOfMonth (int, nullable)
- StartDate (date, required)
- StopDate (date, nullable)
- IsActive (bool, default true)
- CreatedAtUtc (datetime)
- UpdatedAtUtc (datetime)

Notes:

- weekly/biweekly use AnchorDate cadence from first known paycheck.
- semimonthly uses day fields (example: 1 and 15).
- monthly uses MonthlyDayOfMonth or fallback to AnchorDate day.

### 4.2 RecurringCategoryTemplate

Columns:

- Id (int, PK)
- UserId (string, indexed)
- Name (string)
- Allocation (decimal)
- StartDate (date, required)
- StopDate (date, nullable)
- IsActive (bool, default true)
- CreatedAtUtc (datetime)
- UpdatedAtUtc (datetime)

Notes:

- Category template creates planned category rows in each month.
- Actual category spend still comes from expense transaction entries.

### 4.3 BudgetGeneratedIncome

Either use existing Income table with source fields or introduce dedicated generated table. Recommended: keep existing Income table and add source metadata.

Add to Income:

- SourceType (string enum: manual, recurring-template)
- SourceTemplateId (int, nullable)
- SourceOccurrenceDate (date, nullable)
- GenerationMonth (date, nullable, month start)

Constraint:

- Unique(UserId, BudgetId, SourceTemplateId, SourceOccurrenceDate) where SourceTemplateId is not null.

### 4.4 BudgetGeneratedCategory

Reuse Category table with source metadata.

Add to Category:

- SourceType (string enum: manual, recurring-template)
- SourceTemplateId (int, nullable)
- GenerationMonth (date, nullable, month start)

Constraint:

- Unique(UserId, BudgetId, SourceTemplateId) where SourceTemplateId is not null.

## 5. API Contract

### 5.1 Recurring Income Templates

- GET /recurring-income-templates
- POST /recurring-income-templates
- PATCH /recurring-income-templates/{id}
- DELETE /recurring-income-templates/{id}

Request body fields:

- name, amount, scheduleType, anchorDate, semiMonthlyDay1, semiMonthlyDay2, monthlyDayOfMonth, startDate, stopDate, isActive

### 5.2 Recurring Category Templates

- GET /recurring-category-templates
- POST /recurring-category-templates
- PATCH /recurring-category-templates/{id}
- DELETE /recurring-category-templates/{id}

Request body fields:

- name, allocation, startDate, stopDate, isActive

### 5.3 Budget Generation Endpoint

Option A (recommended): trigger generation from existing budget get path.

- GET /budgets/{year}-{month}
- Internally calls generator idempotently before returning data.

Option B: explicit endpoint in addition to GET.

- POST /budgets/{year}-{month}/generate
- Query param: force=true to regenerate recurring-derived rows.

## 6. Month Generation Algorithm

Input:

- userId
- target month start date

Steps:

1. Ensure budget exists for target month.
2. Fetch active recurring income templates where date range overlaps target month.
3. For each income template, compute occurrences in month:
   - weekly: every 7 days from anchor date
   - biweekly: every 14 days from anchor date
   - semimonthly: two configured days each month
   - monthly: configured day each month (fallback anchor day)
4. Upsert generated income rows for each occurrence using idempotency key.
5. Fetch active recurring category templates where date range overlaps target month.
6. Upsert one category row per category template.
7. Recalculate MonthlyIncome and MonthlyExpenses.

Rules:

- If stopDate is null, template continues.
- If day exceeds month length, clamp to month end.
- Never duplicate generated rows with same idempotency key.

## 7. UI Flow

### 7.1 Income Screen

- Add column: Recurring
- Add column: Schedule
- Add column: Start
- Add column: Stop
- Add column: Anchor

Buttons:

- Add Income: one-time/manual only (commission or irregular income)
- Manage Recurring Incomes: opens template manager modal/page

### 7.2 Categories Screen

- Add column: Recurring
- Add column: Start
- Add column: Stop
- Add column: Source

Buttons:

- Add Category: manual one-off category for this month
- Manage Recurring Categories: opens template manager modal/page

### 7.3 Budget Open/Create

When user opens month:

- Trigger generation for that month.
- Display generated planned rows immediately.
- Show subtle banner: Generated from recurring templates.

### 7.4 Edit Behavior

For recurring-derived rows:

- Offer edit scope prompt:
  - This month only
  - Update recurring template (future months)

Phase 1 simplification option:

- Disable direct editing of recurring-derived rows in table and route edits through template manager.

## 8. Migration Plan

Current system has recurring fields attached to Income/Expense rows. Move recurring planning source to templates.

Migration steps:

1. Create new template tables.
2. Backfill recurring income templates from existing incomes with IsRecurring=true.
3. Backfill recurring category templates from categories that should recur (manual curation may be needed).
4. Mark existing recurring-derived monthly rows as SourceType=recurring-template where possible.
5. Keep legacy fields during transition.
6. After stabilization, deprecate row-level recurring settings for monthly plan rows.

## 9. Validation Rules

Income template:

- amount > 0
- scheduleType required
- startDate required
- stopDate >= startDate when provided
- semimonthly requires both day1 and day2 in 1..31 and day1 != day2
- monthly day in 1..31 when provided

Category template:

- allocation >= 0
- startDate required
- stopDate >= startDate when provided

## 10. Acceptance Criteria

1. Biweekly Thursday schedule generates correct occurrences per month from anchor date.
2. Weekly schedule generates all in-month occurrences.
3. Semimonthly (1 and 15) generates two occurrences when valid in month.
4. New month budget auto-populates from active recurring templates.
5. One-time commission income does not auto-carry into future months.
6. Generated rows are idempotent (no duplicates on repeated opens).
7. Budget totals reflect generated planned values.
8. Expense entries continue to represent actual spend against categories.

## 11. Rollout Plan

Phase 1:

- DB tables + recurring template APIs
- Generation service + idempotency
- Hook generation into GET /budgets/{year}-{month}
- Basic template management UI

Phase 2:

- Edit scope controls (this month vs template)
- Regenerate month action with dry-run preview
- Better table badges and source indicators

Phase 3:

- Optional analytics and forecast enhancements
- Optional calendar visualization of occurrences

## 12. Open Decisions

1. Should semimonthly support only fixed day pairs or also last-day variants?
2. For invalid monthly day in short month, clamp vs skip?
3. Should generated recurring rows be editable directly in month table or always through template editor?
4. Should month generation run silently on each GET or be user-triggered with explicit action?

