import type { ReactNode } from 'react';

import { formatCurrencyWithCode } from '../lib/plannerMath';
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

const ProjectionTables = ({ sections, data }: ProjectionTablesProps) => {
  const { currencyCode, plannerSummary } = useCurrentUser();
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);
  const { accountBreakdownCollapsed, accountBreakdownToggleControl } = sections;
  const { accountBreakdownRows } = data;
  const targetAge = plannerSummary?.targetAge ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Account Contribution Breakdown</CardTitle>
          <CardDescription>
            Per-account monthly amounts, limits, and projected values at target age.
          </CardDescription>
        </div>
        {accountBreakdownToggleControl}
      </CardHeader>
      {!accountBreakdownCollapsed ? (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Employee / Month</TableHead>
                <TableHead>Match / Month</TableHead>
                <TableHead>Total / Month</TableHead>
                <TableHead>Annual vs Limit</TableHead>
                <TableHead>Projected Value at {targetAge}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountBreakdownRows.map((row) => {
                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default ProjectionTables;
