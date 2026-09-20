'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { HouseholdPayStats, PaydayCalendar } from './people/HouseholdPayPanel';
import { usePaycheckDeductions } from '../hooks/planner/usePaycheckDeductions';
import { PersonFormModal } from './people/PersonFormModal';
import { PersonSummaryCard } from './people/PersonSummaryCard';
import { usePlannerState } from '../providers/PlannerStateProvider';
import useTaxYear from '../hooks/planner/useTaxYear';
import { usePlannerPeople, usePersonMutations } from '../hooks/planner/index';
import { PlannerPerson } from '../types/person';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

export interface PeopleCardProps {
  collapsed: boolean;
}

const PeopleCard = ({ collapsed }: PeopleCardProps) => {
  const { userId, currencyCode, inflationRate, filingStatus, deductionType } = useCurrentUser();
  const { people, updatePerson, addPerson, removePerson } = usePlannerPeople();
  const { plannerAccounts } = usePlannerState();
  const taxTables = useTaxYear(filingStatus);
  const { deductions: allWithholdings } = usePaycheckDeductions(null);
  const { upsertPersonMutation, deletePersonMutation } = usePersonMutations(userId);

  const [editingPerson, setEditingPerson] = useState<PlannerPerson | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState<PlannerPerson | null>(null);

  // The modal must always render the live person object — edits update the
  // array immutably, so the snapshot captured at pencil-click goes stale.
  const editingLive = editingPerson
    ? (people.find((p) => p.id === editingPerson.id) ?? null)
    : null;

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
        <HouseholdPayStats
          people={people}
          accounts={plannerAccounts}
          withholdings={allWithholdings}
          currencyCode={currencyCode}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <PersonSummaryCard
              key={person.id}
              person={person}
              accounts={plannerAccounts}
              withholdings={allWithholdings}
              currencyCode={currencyCode}
              taxTables={taxTables}
              deductionType={deductionType}
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

        <PaydayCalendar
          people={people}
          accounts={plannerAccounts}
          withholdings={allWithholdings}
          currencyCode={currencyCode}
        />
      </div>

      {/* Edit Modal */}
      {editingLive && (
        <PersonFormModal
          key={editingLive.id}
          person={editingLive}
          people={people}
          accounts={plannerAccounts}
          currencyCode={currencyCode}
          taxTables={taxTables}
          deductionType={deductionType}
          inflationRate={inflationRate}
          onUpdate={(updater) => {
            const editingId = editingLive.id;
            updatePerson(editingId, (current) => {
              const updated = updater(current);
              if (updated.isPrimary && !current.isPrimary) {
                for (const other of people) {
                  if (other.id !== editingId && other.isPrimary) {
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
          key={people[people.length - 1].id}
          person={people[people.length - 1]}
          people={people}
          accounts={plannerAccounts}
          currencyCode={currencyCode}
          taxTables={taxTables}
          deductionType={deductionType}
          inflationRate={inflationRate}
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

export default PeopleCard;
