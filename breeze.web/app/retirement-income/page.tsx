'use client';

import { Suspense } from 'react';
import { Loader2, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { RequireAuth } from '@/components/common/auth/RequireAuth';
import { AccessTimelineCard } from '@/features/retirement-access/components/AccessTimelineCard';
import { HsaLadderCard } from '@/features/retirement-access/components/HsaLadderCard';
import { ReimbursementsCard } from '@/features/retirement-access/components/ReimbursementsCard';
import { RothConversionsCard } from '@/features/retirement-access/components/RothConversionsCard';
import ConversionSuggestionsCard from '@/features/retirement-access/components/ConversionSuggestionsCard';
import { useRetirementAccess } from '@/features/retirement-access/hooks/useRetirementAccess';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { formatCurrencyWithCode } from '@/lib/utils';

export default function RetirementIncomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <RequireAuth>
        <RetirementIncomeContent />
      </RequireAuth>
    </Suspense>
  );
}

function RetirementIncomeContent() {
  const { userId, currencyCode } = useCurrentUser();
  const { data: access, isLoading } = useRetirementAccess(userId);
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const num = (v: string) => {
    const parsed = Number(v);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  if (isLoading || !access) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-24 pb-12">
        <PageHeader
          icon={KeyRound}
          title="Retirement Income"
          subtitle="Record HSA receipts and Roth conversions — the facts that drive the withdrawal plan on the Future page."
        />
        <Card>
          <CardContent className="text-muted-foreground flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your access ladder…
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader
        icon={KeyRound}
        title="Retirement Income"
        subtitle="Record HSA receipts and Roth conversions — the facts that drive the withdrawal plan on the Future page."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available to reimburse</CardDescription>
            <CardTitle className="text-success text-2xl">
              {fc(num(access.hsaSummary.availableToReimburse))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Saved receipts minus reimbursements already taken.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saved receipts</CardDescription>
            <CardTitle className="text-2xl">{fc(num(access.hsaSummary.totalReceipts))}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Qualified expenses you paid out of pocket.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reimbursed so far</CardDescription>
            <CardTitle className="text-2xl">{fc(num(access.hsaSummary.totalReimbursed))}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Tax-free withdrawals you have already taken.
          </CardContent>
        </Card>
      </div>

      <AccessTimelineCard
        buckets={access.rothBuckets}
        hsaAvailable={num(access.hsaSummary.availableToReimburse)}
        fc={fc}
      />

      <HsaLadderCard receipts={access.hsaReceipts} />
      <ReimbursementsCard reimbursements={access.hsaReimbursements} />
      <ConversionSuggestionsCard conversions={access.rothConversions} />

      <RothConversionsCard conversions={access.rothConversions} buckets={access.rothBuckets} />
    </div>
  );
}
