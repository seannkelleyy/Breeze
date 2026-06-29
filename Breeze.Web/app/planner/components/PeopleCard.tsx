'use client';
import { type ReactNode, useMemo, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import * as plannerConstants from '../lib/constants';
import { FormattedNumberInput } from '../../../components/common/form/FormattedNumberInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlannerPeople } from '../hooks/planner/index';
import { BonusMode } from '../types/person';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

export interface PeopleCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
}

const PeopleCard = ({ collapsed, toggleControl }: PeopleCardProps) => {
  const { plannerSummary } = useCurrentUser();
  const { people, hasSpouse, currentAge, updatePerson, removeSpouse, addSpouse } =
    usePlannerPeople();
  const bonusModeOptions = plannerConstants.PLANNER_BONUS_MODE_OPTIONS;
  const targetAge = plannerSummary?.targetAge ?? currentAge;
  const [activePersonIndex, setActivePersonIndex] = useState(0);
  const safeActivePersonIndex =
    people.length === 0 ? 0 : Math.min(activePersonIndex, people.length - 1);
  const activePerson = people[safeActivePersonIndex];
  const activePersonLabel = useMemo(() => {
    if (!activePerson) {
      return 'Person';
    }

    return activePerson.type === 'self' ? 'Self' : 'Spouse';
  }, [activePerson]);

  const showPreviousPerson = () => {
    if (people.length <= 1) {
      return;
    }

    setActivePersonIndex((previous) => (previous - 1 + people.length) % people.length);
  };

  const showNextPerson = () => {
    if (people.length <= 1) {
      return;
    }

    setActivePersonIndex((previous) => (previous + 1) % people.length);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>People</CardTitle>
          <CardDescription>
            Add household members and planning details (name, salary, birthday, retirement age).
          </CardDescription>
        </div>
        {toggleControl}
      </CardHeader>
      {!collapsed ? (
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">{activePersonLabel}</p>
              <p className="text-muted-foreground text-xs">
                Person {Math.min(safeActivePersonIndex + 1, people.length)} of {people.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={showPreviousPerson}
                disabled={people.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={showNextPerson}
                disabled={people.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {activePerson ? (
            <div
              key={activePerson.id}
              className="animate-in fade-in-0 slide-in-from-right-2 grid grid-cols-1 gap-3 rounded-md border p-3 duration-300 sm:col-span-2 md:grid-cols-2"
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={activePerson.name}
                  onChange={(event) =>
                    updatePerson(activePerson.id, (current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={activePerson.type === 'self' ? 'Self' : 'Spouse'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Birthday</Label>
                <Input
                  type="date"
                  value={activePerson.birthday}
                  onChange={(event) =>
                    updatePerson(activePerson.id, (current) => ({
                      ...current,
                      birthday: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Retirement Age</Label>
                <FormattedNumberInput
                  value={activePerson.retirementAge}
                  onValueChange={(value) =>
                    updatePerson(activePerson.id, (current) => ({
                      ...current,
                      retirementAge: value,
                    }))
                  }
                  maxFractionDigits={0}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Annual Salary</Label>
                <FormattedNumberInput
                  value={activePerson.annualSalary}
                  onValueChange={(value) =>
                    updatePerson(activePerson.id, (current) => ({
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
                  value={activePerson.bonusMode}
                  onValueChange={(value) =>
                    updatePerson(activePerson.id, (current) => ({
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
                  {activePerson.bonusMode === 'salary-percent'
                    ? 'Bonus % of Salary'
                    : 'Annual Net Bonus ($)'}
                </Label>
                <FormattedNumberInput
                  value={activePerson.annualBonus}
                  onValueChange={(value) =>
                    updatePerson(activePerson.id, (current) => ({
                      ...current,
                      annualBonus: value,
                    }))
                  }
                  maxFractionDigits={activePerson.bonusMode === 'salary-percent' ? 2 : 0}
                />
                <p className="text-muted-foreground text-xs">
                  Use after-tax bonus dollars (actual take-home bonus amount).
                </p>
              </div>
              <div className="space-y-2">
                <Label>Income Growth %</Label>
                <FormattedNumberInput
                  value={activePerson.incomeGrowthRate}
                  onValueChange={(value) =>
                    updatePerson(activePerson.id, (current) => ({
                      ...current,
                      incomeGrowthRate: value,
                    }))
                  }
                  maxFractionDigits={2}
                />
              </div>
              {activePerson.type === 'spouse' ? (
                <div className="flex justify-end md:col-span-2">
                  <Button variant="destructive" type="button" onClick={removeSpouse}>
                    Remove Spouse
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          {!hasSpouse ? (
            <div className="flex justify-end sm:col-span-2">
              <Button type="button" variant="outline" onClick={addSpouse}>
                Add Spouse
              </Button>
            </div>
          ) : null}
          <p className="text-muted-foreground text-xs sm:col-span-2">
            Projection timeline currently uses age {currentAge} to {targetAge} (max retirement age
            across people).
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default PeopleCard;
