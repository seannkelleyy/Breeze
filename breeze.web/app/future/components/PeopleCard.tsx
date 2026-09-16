'use client';
import { useState } from 'react';
import { Pencil, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { usePlannerPeople, usePersonMutations } from '../hooks/planner/index';
import { BonusMode, PlannerPerson } from '../types/person';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
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
          onUpdate={(updater) => updatePerson(editingPerson.id, updater)}
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
  const fc = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <Card className="relative">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-10 items-center justify-center rounded-full">
              <UserRound className="text-muted-foreground size-5" />
            </div>
            <div>
              <p className="font-medium">{person.name || 'Unnamed'}</p>
              <p className="text-muted-foreground text-xs">
                Retire at {person.retirementAge}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="size-8 cursor-pointer" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
            {canRemove && (
              <Button
                variant="destructive"
                size="icon"
                className="size-8 cursor-pointer"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div className="text-muted-foreground mt-3 space-y-1 text-xs">
          <p>Salary: {fc(person.annualSalary)}</p>
          {person.annualBonus > 0 && (
            <p>
              Bonus: {person.bonusMode === 'salary-percent'
                ? `${person.annualBonus}% of salary`
                : fc(person.annualBonus)}
            </p>
          )}
          <p>Growth: {person.incomeGrowthRate}%</p>
        </div>
      </CardContent>
    </Card>
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
          <DialogTitle>{mode === 'edit' ? `Edit ${person.name || 'Person'}` : 'Add Person'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update the person\'s details below.' : 'Fill in the details for the new household member.'}
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
            <FormattedNumberInput
              value={person.incomeGrowthRate}
              onValueChange={(v) => onUpdate((c) => ({ ...c, incomeGrowthRate: v }))}
              maxFractionDigits={2}
            />
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
          {mode === 'add' && (
            <Button onClick={onClose}>Save</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PeopleCard;
