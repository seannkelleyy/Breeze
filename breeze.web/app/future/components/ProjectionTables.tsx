'use client';
import { useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

import { formatCurrencyWithCode } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

type AccountBreakdownRow = {
  id: string;
  name: string;
  ownerLabel: string;
  accountTypeLabel: string;
  employeeMonthly: number;
  matchMonthly: number;
  totalMonthly: number;
  annualEmployee: number;
  suggestedLimit: number;
  exceedsLimit: boolean;
  projectedValue: number;
};

export type ProjectionTablesContextValue = {
  data: {
    accountBreakdownRows: AccountBreakdownRow[];
  };
};

export type ProjectionTablesProps = ProjectionTablesContextValue & {
  sections: {
    accountBreakdownCollapsed: boolean;
    accountBreakdownToggleControl: ReactNode;
  };
};

type SortKey = keyof AccountBreakdownRow;
type SortDir = 'asc' | 'desc';

function SortableHead({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey;
  currentSortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = currentSortKey === sortKey;
  return (
    <TableHead
      className="hover:text-foreground cursor-pointer select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          currentSortDir === 'asc' ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )
        ) : null}
      </span>
    </TableHead>
  );
}

const ProjectionTables = ({ sections, data }: ProjectionTablesProps) => {
  const { currencyCode, plannerSummary } = useCurrentUser();
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);
  const { accountBreakdownCollapsed, accountBreakdownToggleControl } = sections;
  const { accountBreakdownRows } = data;
  const targetAge = plannerSummary?.targetAge ?? 0;

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRows = [...accountBreakdownRows].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Account Contribution Breakdown</CardTitle>
          <CardDescription>
            Per-account monthly amounts, limits, and projected values at target age. Click column
            headers to sort.
          </CardDescription>
        </div>
        {accountBreakdownToggleControl}
      </CardHeader>
      {!accountBreakdownCollapsed ? (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead
                  label="Account"
                  sortKey="name"
                  currentSortKey={sortKey}
                  currentSortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHead
                  label="Owner"
                  sortKey="ownerLabel"
                  currentSortKey={sortKey}
                  currentSortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHead
                  label="Type"
                  sortKey="accountTypeLabel"
                  currentSortKey={sortKey}
                  currentSortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHead
                  label="Employee / Month"
                  sortKey="employeeMonthly"
                  currentSortKey={sortKey}
                  currentSortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHead
                  label="Match / Month"
                  sortKey="matchMonthly"
                  currentSortKey={sortKey}
                  currentSortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHead
                  label="Total / Month"
                  sortKey="totalMonthly"
                  currentSortKey={sortKey}
                  currentSortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHead
                  label="Annual vs Limit"
                  sortKey="annualEmployee"
                  currentSortKey={sortKey}
                  currentSortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHead
                  label={`Projected at ${targetAge}`}
                  sortKey="projectedValue"
                  currentSortKey={sortKey}
                  currentSortDir={sortDir}
                  onSort={handleSort}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.ownerLabel}</TableCell>
                  <TableCell>{row.accountTypeLabel}</TableCell>
                  <TableCell>{formatCurrency(row.employeeMonthly)}</TableCell>
                  <TableCell>{formatCurrency(row.matchMonthly)}</TableCell>
                  <TableCell>{formatCurrency(row.totalMonthly)}</TableCell>
                  <TableCell className={row.exceedsLimit ? 'text-destructive font-medium' : ''}>
                    {row.suggestedLimit > 0
                      ? `${formatCurrency(row.annualEmployee)} / ${formatCurrency(row.suggestedLimit)}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{formatCurrency(row.projectedValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default ProjectionTables;
