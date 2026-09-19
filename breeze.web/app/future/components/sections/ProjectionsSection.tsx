'use client';
import ProjectionChartCard from '../ProjectionChartCard';
import ProjectionTables from '../ProjectionTables';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ChartConfig } from '@/components/ui/chart';

type SectionCollapse = {
  accountBreakdown: boolean;
  onToggle: (section: string) => void;
};

type ProjectionRow = {
  age: number;
  totalBalance: number;
  totalContributions: number;
  [key: `account-${number}`]: number;
};

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

interface ProjectionsSectionProps {
  currentAge: number;
  targetAge: number;
  chartConfig: ChartConfig;
  projectionRows: ProjectionRow[];
  accounts: Array<{ id: string; name: string }>;
  accountBreakdownRows: AccountBreakdownRow[];
  projectionEndAge: number;
  setProjectionEndAge: (age: number) => void;
  collapses: SectionCollapse;
}

const ToggleBtn = ({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) => (
  <Button type="button" variant="ghost" size="icon" onClick={onClick}>
    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
  </Button>
);

export function ProjectionsSection({
  currentAge,
  targetAge,
  chartConfig,
  projectionRows,
  accounts,
  accountBreakdownRows,
  projectionEndAge,
  setProjectionEndAge,
  collapses,
}: ProjectionsSectionProps) {
  const { accountBreakdown, onToggle } = collapses;

  return (
    <div className="space-y-6">
      <ProjectionChartCard
        collapsed={false}
        toggleControl={null}
        currentAge={currentAge}
        targetAge={targetAge}
        chartConfig={chartConfig}
        projectionRows={projectionRows}
        accounts={accounts}
        projectionEndAge={projectionEndAge}
        setProjectionEndAge={setProjectionEndAge}
      />
      <ProjectionTables
        sections={{
          accountBreakdownCollapsed: accountBreakdown,
          accountBreakdownToggleControl: (
            <ToggleBtn collapsed={accountBreakdown} onClick={() => onToggle('accountBreakdown')} />
          ),
        }}
        data={{ accountBreakdownRows }}
      />
    </div>
  );
}

export default ProjectionsSection;
