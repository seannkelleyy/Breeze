import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContext, useContext, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import usePlannerPeople from '../usePlannerPeople';
import { getAgeFromBirthday } from '../../../lib/plannerMath';
import type { PlannerPerson } from '../../../types/person';

// The real PlannerStateProvider carries planner-wide state; tests supply a
// minimal context with live React state so mutations re-render the harness.
const TestCtx = createContext<{
  plannerPeople: PlannerPerson[];
  setPlannerPeople: (value: PlannerPerson[] | ((prev: PlannerPerson[]) => PlannerPerson[])) => void;
} | null>(null);

vi.mock('../../../providers/PlannerStateProvider', () => ({
  usePlannerState: () => useContext(TestCtx),
}));

let uuidCounter = 0;

const person = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Sean',
  birthday: '1990-06-15',
  retirementAge: 65,
  annualSalary: 100000,
  bonusMode: 'dollars',
  annualBonus: 0,
  incomeGrowthRate: 0,
  isPrimary: true,
  payType: 'salary',
  payDay: 1,
  payCadence: 'biweekly',
  hourlyRate: 0,
  expectedHoursPerWeek: 0,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

function Provider({ children, initial }: { children: React.ReactNode; initial: PlannerPerson[] }) {
  const [people, setPeople] = useState(initial);
  return (
    <TestCtx.Provider value={{ plannerPeople: people, setPlannerPeople: setPeople }}>
      {children}
    </TestCtx.Provider>
  );
}

function Harness() {
  const { people, currentAge, updatePerson, addPerson, removePerson } = usePlannerPeople();
  return (
    <div>
      <span data-testid="count">{people.length}</span>
      <span data-testid="age">{currentAge}</span>
      <span data-testid="salary">{people[0]?.annualSalary}</span>
      <span data-testid="primary">{String(people[0]?.isPrimary)}</span>
      <span data-testid="last-name">{people[people.length - 1]?.name}</span>
      <button onClick={() => updatePerson(people[0].id, (p) => ({ ...p, name: 'Updated' }))}>
        update
      </button>
      <button onClick={addPerson}>add</button>
      <button onClick={() => removePerson(people[0].id)}>remove</button>
    </div>
  );
}

const renderHarness = (initial: PlannerPerson[] = []) =>
  render(
    <Provider initial={initial}>
      <Harness />
    </Provider>,
  );

describe('usePlannerPeople', () => {
  beforeEach(() => {
    uuidCounter = 0;
    vi.stubGlobal('crypto', { randomUUID: () => `generated-${++uuidCounter}` });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('injects a default person when the list is empty', async () => {
    renderHarness();

    expect(await screen.findByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('salary')).toHaveTextContent('120000');
    expect(screen.getByTestId('primary')).toHaveTextContent('true');
  });

  it('does not inject a default person when people already exist', () => {
    renderHarness([person()]);

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('salary')).toHaveTextContent('100000');
  });

  it('derives currentAge from the first person', () => {
    renderHarness([person({ birthday: '1990-06-15' })]);

    expect(screen.getByTestId('age')).toHaveTextContent(String(getAgeFromBirthday('1990-06-15')));
  });

  it('updates only the matching person', () => {
    renderHarness([person({ id: 'p1', name: 'Sean' }), person({ id: 'p2', name: 'Sam' })]);

    fireEvent.click(screen.getByText('update'));

    expect(screen.getByTestId('last-name')).toHaveTextContent('Sam');
    expect(screen.queryByText('Updated')).toBeNull();
    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });

  it('adds a secondary person with no salary and non-primary flag', () => {
    renderHarness([person()]);

    fireEvent.click(screen.getByText('add'));

    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('salary')).toHaveTextContent('100000');
  });

  it('removes a person by id', () => {
    renderHarness([person({ id: 'p1' }), person({ id: 'p2', name: 'Sam' })]);

    fireEvent.click(screen.getByText('remove'));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('last-name')).toHaveTextContent('Sam');
  });
});
