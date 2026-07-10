# Defect: Household Self Person Cannot Be Edited

## Status
Resolved

A `useEffect` in `usePlannerPeople.ts` (line 15-25) now initializes a default self person from `PLANNER_DEFAULT_SELF_PERSON` when the people array is empty. The self person is always present and editable on page load.

## Environment
- Planner page → Household section → People card
- All display modes

## Symptoms
- The "Self" person cannot be added or edited in the Household section
- Only "Add Spouse" button is available; there is no corresponding "Add Self" or mechanism to edit self person data
- The household section starts empty (no people shown), requiring the user to add a spouse before any person data can be seen
- If no spouse is added, the household section shows no person cards at all, yet the planner still uses hardcoded default values

## Root Cause

### Issue 1: Self person is never initialized
File: `breeze.web/app/planner/hooks/planner/usePlannerPeople.ts`
- The hook provides `addSpouse()` and `removeSpouse()` but there is no `initSelf()` or `addSelf()` function
- The people array starts empty `[]` from state initialization in `CurrentUserProvider`
- `useFetchPlanner.ts` (line 111) returns `people: [] as PlannerPerson[]` — always empty
- The self person only exists as fallback logic in `usePlannerPeople.ts` line 14: `people.find((person) => person.type === 'self') ?? people[0]`
- This fallback still returns `undefined` when `people` is empty

### Issue 2: `PLANNER_DEFAULT_SELF_PERSON` exists but is unused
File: `breeze.web/app/planner/lib/constants.ts`
```typescript
export const PLANNER_DEFAULT_SELF_PERSON = {
  type: 'self',
  name: 'Self',
  birthday: '1990-01-01',
  retirementAge: 60,
  annualSalary: 120000,
  bonusMode: PLANNER_DEFAULT_BONUS_MODE,
  annualBonus: PLANNER_DEFAULT_ANNUAL_BONUS,
  incomeGrowthRate: PLANNER_DEFAULT_INCOME_GROWTH_RATE,
} as const;
```
This constant exists but is never used anywhere in the codebase to initialize the self person.

### Issue 3: PeopleCard only navigates existing people
File: `breeze.web/app/planner/components/PeopleCard.tsx`
- Line 30: `const { people, hasSpouse, currentAge, updatePerson, removeSpouse, addSpouse } = usePlannerPeople();`
- Line 38: `const activePerson = people[safeActivePersonIndex];`
- If `people` is empty, `activePerson` is undefined, and the form renders nothing
- There is no "Add Self" button analogous to the "Add Spouse" button on line 230
- There is no initialization logic to create the self person on first load

### Issue 4: Planner falls back to hardcoded defaults silently
File: `breeze.web/app/planner/lib/plannerMath.ts`
- `getPlannerHouseholdSnapshot` (line 139-158) uses optional chaining and defaults:
  ```typescript
  const sp = people.find((p) => p.type === 'self');
  const bd = sp?.birthday ?? '';
  const si = sp?.annualSalary ?? 0;
  ```
- `getAgeFromBirthday('')` returns `30` as a fallback
- This means the planner produces results with invisible default data that the user cannot see or modify

## Reproduction Steps
1. Navigate to Planner page
2. Locate the "Household" section
3. Observe: No person cards are shown
4. See: Only "Add Spouse" button is present
5. There is no way to view or edit "Self" person data (name, birthday, salary, retirement age, etc.)

## Expected Behavior
- A "Self" person should always be present and editable when the planner loads
- The self person should be pre-populated with sensible defaults from `PLANNER_DEFAULT_SELF_PERSON`
- The PeopleCard should show the self person by default, with an option to add a spouse
- The UI should not require adding a spouse to see person data

## Affected Files
- `breeze.web/app/planner/hooks/planner/usePlannerPeople.ts` — no self initialization
- `breeze.web/app/planner/components/PeopleCard.tsx` — no "Add Self" button or self initialization
- `breeze.web/app/planner/hooks/planner/useFetchPlanner.ts` — returns empty `people` array
- `breeze.web/app/planner/lib/constants.ts` — `PLANNER_DEFAULT_SELF_PERSON` defined but unused
- `breeze.web/app/planner/lib/providers/CurrentUserProvider.tsx` — `plannerPeople` initial state is `[]`

## Suggested Fix
1. In `usePlannerPeople.ts`: Initialize the self person from `PLANNER_DEFAULT_SELF_PERSON` if the people array is empty
2. In `PeopleCard.tsx`: Ensure the self person is always shown by default; optionally add a mechanism to edit self data directly
3. No new UI needed for "Add Self" — the self person should always exist