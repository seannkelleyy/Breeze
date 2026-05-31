'use client';
import { SummaryCards } from '../SummaryCards';
import ProjectionChartCard from '../ProjectionChartCard';
import ProjectionTables from '../ProjectionTables';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ChartConfig } from '@/components/ui/chart';

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
  projectionRowsData: ProjectionRow[];
  accountBreakdownRowsData: AccountBreakdownRow[];
  requiredMonthlyCollapsed: boolean;
  plannedMonthlyCollapsed: boolean;
  retirementNeedCollapsed: boolean;
  yearlyCollapsed: boolean;
  accountBreakdownCollapsed: boolean;
  onToggleRequiredMonthly: () => void;
  onTogglePlannedMonthly: () => void;
  onToggleRetirementNeed: () => void;
  onToggleYearly: () => void;
  onToggleAccountBreakdown: () => void;
}

export function ProjectionsSection({
  currentAge,
  chartConfig,
  projectionRows,
  accounts,
  accountLineColors,
  projectionRowsData,
  accountBreakdownRowsData,
  requiredMonthlyCollapsed,
  plannedMonthlyCollapsed,
  retirementNeedCollapsed,
  yearlyCollapsed,
  accountBreakdownCollapsed,
  onToggleRequiredMonthly,
  onTogglePlannedMonthly,
  onToggleRetirementNeed,
  onToggleYearly,
  onToggleAccountBreakdown,
}: ProjectionsSectionProps) {
  return (
    <div className="space-y-6">
      <SummaryCards
        requiredMonthlyCollapsed={requiredMonthlyCollapsed}
        requiredMonthlyToggleControl={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleRequiredMonthly}
          >
            {requiredMonthlyCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        }
        plannedMonthlyCollapsed={plannedMonthlyCollapsed}
        plannedMonthlyToggleControl={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onTogglePlannedMonthly}
          >
            {plannedMonthlyCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        }
        retirementNeedCollapsed={retirementNeedCollapsed}
        retirementNeedToggleControl={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleRetirementNeed}
          >
            {retirementNeedCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
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
          yearlyCollapsed,
          yearlyToggleControl: (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleYearly}
            >
              {yearlyCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          ),
          accountBreakdownCollapsed,
          accountBreakdownToggleControl: (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleAccountBreakdown}
            >
              {accountBreakdownCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          ),
        }}
        data={{
          projectionRows: projectionRowsData,
          accountBreakdownRows: accountBreakdownRowsData,
        }}
      />
    </div>
  );
}

export default ProjectionsSection;
