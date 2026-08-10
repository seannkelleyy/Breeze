'use client';
import { type ReactNode } from 'react';

import * as plannerConstants from '../lib/constants';
import { FormattedNumberInput } from '../../../components/common/form/FormattedNumberInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlannerPeople, usePersonMutations } from '../hooks/planner/index';
import { BonusMode, PlannerPerson } from '../types/person';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

export interface PeopleCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
}

const PeopleCard = ({ collapsed, toggleControl }: PeopleCardProps) => {
  const { userId } = useCurrentUser();
  const { people, updatePerson, addPerson, removePerson } = usePlannerPeople();
  const { upsertPersonMutation } = usePersonMutations(userId);

  const bonusModeOptions = plannerConstants.PLANNER_BONUS_MODE_OPTIONS;

  useAutoSave(() => {
    if (people.length === 0) return;
    for (const person of people) {
      upsertPersonMutation.mutate(person);
    }
  }, [people]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle>Household</CardTitle>
        {toggleControl}
      </CardHeader>
      {!collapsed ? (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                updatePerson={updatePerson}
                removePerson={removePerson}
                canRemove={people.length > 1}
                bonusModeOptions={bonusModeOptions}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={addPerson}>
              Add Person
            </Button>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

function PersonCard({
  person,
  updatePerson,
  removePerson,
  canRemove,
  bonusModeOptions,
}: {
  person: PlannerPerson;
  updatePerson: (id: string, updater: (current: PlannerPerson) => PlannerPerson) => void;
  removePerson: (id: string) => void;
  canRemove: boolean;
  bonusModeOptions: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={person.name}
          onChange={(event) =>
            updatePerson(person.id, (current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Birthday</Label>
        <Input
          type="date"
          value={person.birthday}
          onChange={(event) =>
            updatePerson(person.id, (current) => ({
              ...current,
              birthday: event.target.value,
            }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Retirement Age</Label>
        <FormattedNumberInput
          value={person.retirementAge}
          onValueChange={(value) =>
            updatePerson(person.id, (current) => ({
              ...current,
              retirementAge: value,
            }))
          }
          maxFractionDigits={0}
        />
      </div>
      <div className="space-y-2">
        <Label>Annual Salary</Label>
        <FormattedNumberInput
          value={person.annualSalary}
          onValueChange={(value) =>
            updatePerson(person.id, (current) => ({
              ...current,
              annualSalary: value,
            }))
          }
          maxFractionDigits={0}
        />
      </div>
      <div className="space-y-2">
        <Label>Bonus Type</Label>
        <Select
          value={person.bonusMode}
          onValueChange={(value) =>
            updatePerson(person.id, (current) => ({
              ...current,
              bonusMode: value as BonusMode,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select bonus type" />
          </SelectTrigger>
          <SelectContent>
            {bonusModeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>
          {person.bonusMode === 'salary-percent' ? 'Bonus % of Salary' : 'Annual Net Bonus ($)'}
        </Label>
        <FormattedNumberInput
          value={person.annualBonus}
          onValueChange={(value) =>
            updatePerson(person.id, (current) => ({
              ...current,
              annualBonus: value,
            }))
          }
          maxFractionDigits={person.bonusMode === 'salary-percent' ? 2 : 0}
        />
        <p className="text-muted-foreground text-xs">
          Use after-tax bonus dollars (actual take-home bonus amount).
        </p>
      </div>
      <div className="space-y-2">
        <Label>Income Growth %</Label>
        <FormattedNumberInput
          value={person.incomeGrowthRate}
          onValueChange={(value) =>
            updatePerson(person.id, (current) => ({
              ...current,
              incomeGrowthRate: value,
            }))
          }
          maxFractionDigits={2}
        />
      </div>
      {canRemove ? (
        <div className="flex justify-end sm:col-span-2">
          <Button
            variant="destructive"
            type="button"
            size="sm"
            onClick={() => removePerson(person.id)}
          >
            Remove Person
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default PeopleCard;