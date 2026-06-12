'use client';
import { SummaryCards } from '../SummaryCards';
import ProjectionChartCard from '../ProjectionChartCard';
import ProjectionTables from '../ProjectionTables';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ChartConfig } from '@/components/ui/chart';

type SectionCollapse = {
  requiredMonthly: boolean;
  plannedMonthly: boolean;
  retirementEstimateCard: boolean;
  yearlyProjection: boolean;
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
  chartConfig: ChartConfig;
  projectionRows: ProjectionRow[];
  accounts: Array<{ id: string; name: string }>;
  accountLineColors: string[];
  accountBreakdownRows: AccountBreakdownRow[];
  collapses: SectionCollapse;
}

const ToggleBtn = ({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) => (
  <Button type="button" variant="ghost" size="icon" onClick={onClick}>
    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
  </Button>
);

export function ProjectionsSection({
  currentAge,
  chartConfig,
  projectionRows,
  accounts,
  accountLineColors,
  accountBreakdownRows,
  collapses,
}: ProjectionsSectionProps) {
  const {
    requiredMonthly,
    plannedMonthly,
    retirementEstimateCard,
    yearlyProjection,
    accountBreakdown,
    onToggle,
  } = collapses;

  return (
    <div className="space-y-6">
      <SummaryCards
        requiredMonthlyCollapsed={requiredMonthly}
        requiredMonthlyToggleControl={
          <ToggleBtn collapsed={requiredMonthly} onClick={() => onToggle('requiredMonthly')} />
        }
        plannedMonthlyCollapsed={plannedMonthly}
        plannedMonthlyToggleControl={
          <ToggleBtn collapsed={plannedMonthly} onClick={() => onToggle('plannedMonthly')} />
        }
        retirementNeedCollapsed={retirementEstimateCard}
        retirementNeedToggleControl={
          <ToggleBtn
            collapsed={retirementEstimateCard}
            onClick={() => onToggle('retirementEstimateCard')}
          />
        }
      />
      <ProjectionChartCard
        collapsed={false}
        toggleControl={null}
        currentAge={currentAge}
        chartConfig={chartConfig}
        projectionRows={projectionRows}
        accounts={accounts}
        accountLineColors={accountLineColors}
      />
      <ProjectionTables
        sections={{
          yearlyCollapsed: yearlyProjection,
          yearlyToggleControl: (
            <ToggleBtn collapsed={yearlyProjection} onClick={() => onToggle('yearlyProjection')} />
          ),
          accountBreakdownCollapsed: accountBreakdown,
          accountBreakdownToggleControl: (
            <ToggleBtn collapsed={accountBreakdown} onClick={() => onToggle('accountBreakdown')} />
          ),
        }}
        data={{ projectionRows, accountBreakdownRows }}
      />
    </div>
  );
}

export default ProjectionsSection;
