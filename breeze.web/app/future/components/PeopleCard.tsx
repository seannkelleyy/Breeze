'use client';
import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataCard } from '@/components/common/DataCard';
import { usePlannerPeople, usePersonMutations } from '../hooks/planner/index';
import { BonusMode, PayType, PayCadence, PlannerPerson } from '../types/person';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { formatCurrencyWithCode } from '@/lib/utils';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import * as plannerConstants from '../lib/constants';

export interface PeopleCardProps {
  collapsed: boolean;
}

const PeopleCard = ({ collapsed }: PeopleCardProps) => {
  const { userId } = useCurrentUser();
  const { people, updatePerson, addPerson, removePerson } = usePlannerPeople();
  const { upsertPersonMutation, deletePersonMutation } = usePersonMutations(userId);

  const bonusModeOptions = plannerConstants.PLANNER_BONUS_MODE_OPTIONS;

  const [editingPerson, setEditingPerson] = useState<PlannerPerson | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState<PlannerPerson | null>(null);

  useAutoSave(() => {
    if (people.length === 0) return;
    for (const person of people) {
      upsertPersonMutation.mutate(person);
    }
  }, [people]);

  const handleAddPerson = () => {
    addPerson();
    setShowAddModal(true);
  };

  const handleSaveNewPerson = () => {
    setShowAddModal(false);
  };

  const handleSaveAndAddAnother = () => {
    addPerson();
  };

  const handleDeletePerson = (person: PlannerPerson) => {
    deletePersonMutation.mutate(person.id);
    removePerson(person.id);
    setDeletingPerson(null);
  };

  if (collapsed) return null;

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <PersonSummaryCard
              key={person.id}
              person={person}
              onEdit={() => setEditingPerson(person)}
              onDelete={() => setDeletingPerson(person)}
              canRemove={people.length > 1}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={handleAddPerson}>
            Add Person
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPerson && (
        <PersonFormModal
          person={editingPerson}
          bonusModeOptions={bonusModeOptions}
          onUpdate={(updater) => {
            updatePerson(editingPerson.id, (current) => {
              const updated = updater(current);
              if (updated.isPrimary && !current.isPrimary) {
                for (const other of people) {
                  if (other.id !== editingPerson.id && other.isPrimary) {
                    updatePerson(other.id, (p) => ({ ...p, isPrimary: false }));
                  }
                }
              }
              return updated;
            });
          }}
          onClose={() => setEditingPerson(null)}
          mode="edit"
        />
      )}

      {/* Add Modal */}
      {showAddModal && people.length > 0 && (
        <PersonFormModal
          person={people[people.length - 1]}
          bonusModeOptions={bonusModeOptions}
          onUpdate={(updater) => updatePerson(people[people.length - 1].id, updater)}
          onClose={handleSaveNewPerson}
          onSaveAndAddAnother={handleSaveAndAddAnother}
          mode="add"
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deletingPerson !== null}
        onOpenChange={(open) => !open && setDeletingPerson(null)}
        title="Remove Person"
        description={`Are you sure you want to remove ${deletingPerson?.name || 'this person'}? Their accounts will need to be reassigned.`}
        confirmLabel="Remove"
        onConfirm={() => deletingPerson && handleDeletePerson(deletingPerson)}
      />
    </>
  );
};

function PersonSummaryCard({
  person,
  onEdit,
  onDelete,
  canRemove,
}: {
  person: PlannerPerson;
  onEdit: () => void;
  onDelete: () => void;
  canRemove: boolean;
}) {
  const fc = (v: number) => formatCurrencyWithCode(v, 'USD', { maximumFractionDigits: 0 });

  const summaryLines = [
    person.payType === 'hourly'
      ? `$${person.hourlyRate}/hr × ${person.expectedHoursPerWeek}hrs/wk`
      : `Salary: ${fc(person.annualSalary)}`,
    person.annualBonus > 0
      ? person.bonusMode === 'salary-percent'
        ? `Bonus: ${person.annualBonus}% of salary`
        : `Bonus: ${fc(person.annualBonus)}`
      : null,
    `Growth: ${person.incomeGrowthRate}%`,
    `${person.payCadence} · Pay day ${person.payDay}`,
  ].filter(Boolean) as string[];

  return (
    <DataCard
      icon={<UserRound className="size-4" />}
      iconVariant="muted"
      name={person.name || 'Unnamed'}
      badges={person.isPrimary ? [{ label: 'Primary' }] : undefined}
      summaryLines={summaryLines}
      updatedAt={person.updatedAt}
      onEdit={onEdit}
      onDelete={onDelete}
      canDelete={canRemove}
    />
  );
}

function PersonFormModal({
  person,
  bonusModeOptions,
  onUpdate,
  onClose,
  onSaveAndAddAnother,
  mode,
}: {
  person: PlannerPerson;
  bonusModeOptions: ReadonlyArray<{ value: string; label: string }>;
  onUpdate: (updater: (current: PlannerPerson) => PlannerPerson) => void;
  onClose: () => void;
  onSaveAndAddAnother?: () => void;
  mode: 'edit' | 'add';
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? `Edit ${person.name || 'Person'}` : 'Add Person'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? "Update the person's details below."
              : 'Fill in the details for the new household member.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={person.name}
              onChange={(e) => onUpdate((c) => ({ ...c, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label>Birthday</Label>
            <Input
              type="date"
              value={person.birthday}
              onChange={(e) => onUpdate((c) => ({ ...c, birthday: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Retirement Age</Label>
            <FormattedNumberInput
              value={person.retirementAge}
              onValueChange={(v) => onUpdate((c) => ({ ...c, retirementAge: v }))}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Annual Salary</Label>
            <FormattedNumberInput
              value={person.annualSalary}
              onValueChange={(v) => onUpdate((c) => ({ ...c, annualSalary: v }))}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Bonus Type</Label>
            <Select
              value={person.bonusMode}
              onValueChange={(v) => onUpdate((c) => ({ ...c, bonusMode: v as BonusMode }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bonus type" />
              </SelectTrigger>
              <SelectContent>
                {bonusModeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
              onValueChange={(v) => onUpdate((c) => ({ ...c, annualBonus: v }))}
              maxFractionDigits={person.bonusMode === 'salary-percent' ? 2 : 0}
            />
            <p className="text-muted-foreground text-xs">
              Use after-tax bonus dollars (actual take-home bonus amount).
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Income Growth %</Label>
            <Select
              value={String(person.incomeGrowthRate)}
              onValueChange={(v) => onUpdate((c) => ({ ...c, incomeGrowthRate: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select growth rate" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((rate) => (
                  <SelectItem key={rate} value={String(rate)}>
                    {rate}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pay Type</Label>
            <Select
              value={person.payType}
              onValueChange={(v) => onUpdate((c) => ({ ...c, payType: v as PayType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pay type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pay Cadence</Label>
            <Select
              value={person.payCadence}
              onValueChange={(v) => onUpdate((c) => ({ ...c, payCadence: v as PayCadence }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cadence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pay Day (1-28)</Label>
            <FormattedNumberInput
              value={person.payDay}
              onValueChange={(v) =>
                onUpdate((c) => ({ ...c, payDay: Math.min(28, Math.max(1, v)) }))
              }
              maxFractionDigits={0}
            />
          </div>
          {person.payType === 'hourly' && (
            <>
              <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <FormattedNumberInput
                  value={person.hourlyRate}
                  onValueChange={(v) => onUpdate((c) => ({ ...c, hourlyRate: v }))}
                  maxFractionDigits={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Hours/Week</Label>
                <FormattedNumberInput
                  value={person.expectedHoursPerWeek}
                  onValueChange={(v) => onUpdate((c) => ({ ...c, expectedHoursPerWeek: v }))}
                  maxFractionDigits={0}
                />
              </div>
            </>
          )}
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              id="isPrimary"
              className="accent-primary"
              checked={person.isPrimary}
              onChange={(e) => onUpdate((c) => ({ ...c, isPrimary: e.target.checked }))}
            />
            <Label htmlFor="isPrimary" className="cursor-pointer text-sm">
              Primary household member
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {mode === 'edit' ? 'Done' : 'Cancel'}
          </Button>
          {mode === 'add' && onSaveAndAddAnother && (
            <Button variant="outline" onClick={onSaveAndAddAnother}>
              Save & Add Another
            </Button>
          )}
          {mode === 'add' && <Button onClick={onClose}>Save</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PeopleCard;
