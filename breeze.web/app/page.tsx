'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/lib/services/queries/assets';
import { GET_GOALS } from '@/lib/services/queries/goals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Progress } from '@/components/ui/progress';
import { SignUpButton } from '@clerk/clerk-react';
import BreezeAuthButton from '@/components/common/auth/BreezeAuthButton';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Wrench,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Target,
  CheckCircle2,
  Circle,
  ListChecks,
  Loader2,
} from 'lucide-react';
import type { Goal } from '@/app/goals/types/goal';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const quickLinks = [
  {
    label: 'Future',
    href: '/future',
    icon: TrendingUp,
    description: 'Track your path to financial independence.',
  },
  {
    label: 'Accounts',
    href: '/accounts',
    icon: Users,
    description: 'Configure your household members and financial accounts.',
  },
  {
    label: 'Goals',
    href: '/goals',
    icon: Target,
    description: 'Plan, prioritize, and track your financial goals.',
  },
  {
    label: 'Budget',
    href: '/budget',
    icon: Wallet,
    description: 'Monthly budgeting, categories, and expenses.',
  },
  {
    label: 'Tools',
    href: '/tools',
    icon: Wrench,
    description: 'Mortgage calculator and financial utilities.',
  },
];

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const {
    userId,
    isSignedIn,
    isLoaded,
    user,
    setupCompleted,
    monthlyExpenses,
    disclaimerAccepted,
  } = useCurrentUser();
  const { request } = useGraphql();

  const { data } = useQuery({
    queryKey: ['dashboard-summary', userId],
    queryFn: async () => {
      const [assetsResp, liabilitiesResp, goalsResp] = await Promise.all([
        request<{
          assets: Array<{ id: string; name: string; assetType: string; currentValue: string }>;
        }>(GET_ASSETS_BY_USER, { userId }),
        request<{
          liabilities: Array<{
            id: string;
            name: string;
            liabilityType: string;
            currentBalance: string;
          }>;
        }>(GET_LIABILITIES_BY_USER, { userId }),
        request<{ goals: Goal[] }>(GET_GOALS, { userId }),
      ]);

      const assets = assetsResp?.assets ?? [];
      const liabilities = liabilitiesResp?.liabilities ?? [];
      const goals = goalsResp?.goals ?? [];

      const totalAssets = assets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
      const totalLiabilities = liabilities.reduce(
        (sum, l) => sum + (Number(l.currentBalance) || 0),
        0,
      );
      const netWorth = totalAssets - totalLiabilities;

      const assetsByType = new Map<string, number>();
      for (const asset of assets) {
        const type = asset.assetType;
        assetsByType.set(type, (assetsByType.get(type) ?? 0) + (Number(asset.currentValue) || 0));
      }

      const liabilitiesByType = new Map<string, number>();
      for (const liability of liabilities) {
        const type = liability.liabilityType;
        liabilitiesByType.set(
          type,
          (liabilitiesByType.get(type) ?? 0) + (Number(liability.currentBalance) || 0),
        );
      }

      const footSteps = goals
        .filter((g) => g.isFinancialOrderStep)
        .sort((a, b) => (a.financialOrderStep ?? 0) - (b.financialOrderStep ?? 0));
      const completedSteps = footSteps.filter((g) => g.isCompleted).length;

      const regularGoals = goals.filter((g) => !g.isFinancialOrderStep);
      const completedGoals = regularGoals.filter((g) => g.isCompleted).length;

      return {
        totalAssets,
        totalLiabilities,
        netWorth,
        assetCount: assets.length,
        liabilityCount: liabilities.length,
        assetsByType: Object.fromEntries(assetsByType),
        liabilitiesByType: Object.fromEntries(liabilitiesByType),
        footSteps,
        completedSteps,
        totalSteps: footSteps.length,
        regularGoals,
        completedGoals,
        totalGoals: regularGoals.length,
      };
    },
    enabled: isSignedIn && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (!isSignedIn || !isLoaded) {
    return (
      <section className="flex h-screen w-screen flex-col items-center justify-center">
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <h1 className="w-full text-left text-5xl font-medium">Breeze</h1>
          <p className="w-full text-center">The personal financial planner</p>
          <div className="flex flex-col gap-2">
            <BreezeAuthButton />
            <p className="mt-4 w-full text-center text-sm">Don&apos;t have an account?</p>
            <SignUpButton>
              <Button className="w-min self-center">Sign Up</Button>
            </SignUpButton>
          </div>
        </div>
      </section>
    );
  }

  const setupSteps = [
    { label: 'Profile created', done: setupCompleted },
    { label: 'People configured', done: setupCompleted },
    { label: 'Accounts added', done: setupCompleted },
    { label: 'Monthly expenses set', done: (monthlyExpenses ?? 0) > 0 },
    { label: 'Disclaimer accepted', done: disclaimerAccepted },
  ];
  const completedSetupSteps = setupSteps.filter((s) => s.done).length;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome, ${user?.firstName ?? 'there'}`}
        subtitle="Here's your financial overview."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Worth</CardDescription>
            <CardTitle className="text-3xl">{data ? formatCurrency(data.netWorth) : '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {data
                ? `${data.assetCount} assets, ${data.liabilityCount} liabilities`
                : 'Loading...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ArrowUpRight className="text-success size-4" />
              Total Assets
            </CardDescription>
            <CardTitle className="text-3xl">
              {data ? formatCurrency(data.totalAssets) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {data ? `Across ${Object.keys(data.assetsByType).length} types` : 'Loading...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ArrowDownRight className="text-destructive size-4" />
              Total Liabilities
            </CardDescription>
            <CardTitle className="text-3xl">
              {data ? formatCurrency(data.totalLiabilities) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {data ? `Across ${Object.keys(data.liabilitiesByType).length} types` : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Progress */}
      {!setupCompleted && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg font-semibold">Getting Started</CardTitle>
              <CardDescription>Complete your setup to unlock full planning.</CardDescription>
            </div>
            <Link href="/future">
              <Button variant="outline" size="sm">
                Continue Setup
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(completedSetupSteps / setupSteps.length) * 100} />
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-5">
              {setupSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle2 className="text-success h-4 w-4 shrink-0" />
                  ) : (
                    <Circle className="text-muted-foreground h-4 w-4 shrink-0" />
                  )}
                  <span
                    className={step.done ? 'text-muted-foreground text-xs line-through' : 'text-xs'}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOO Progress + Goals */}
      {data && data.totalSteps > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="text-muted-foreground h-4 w-4" />
                <div>
                  <CardTitle className="text-sm font-medium">
                    Financial Order of Operations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {data.completedSteps} of {data.totalSteps} steps complete
                  </CardDescription>
                </div>
              </div>
              <Link href="/goals">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Progress
                value={data.totalSteps > 0 ? (data.completedSteps / data.totalSteps) * 100 : 0}
                className="mb-3"
              />
              {data.footSteps.slice(0, 5).map((step) => (
                <div key={step.id} className="flex items-center gap-2 py-0.5">
                  {step.isCompleted ? (
                    <CheckCircle2 className="text-success h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Circle className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                  )}
                  <span
                    className={
                      step.isCompleted ? 'text-muted-foreground text-xs line-through' : 'text-xs'
                    }
                  >
                    {step.description}
                  </span>
                </div>
              ))}
              {data.totalSteps > 5 && (
                <p className="text-muted-foreground pt-1 text-xs">
                  +{data.totalSteps - 5} more steps
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium">Goals</CardTitle>
                <CardDescription className="text-xs">
                  {data.completedGoals} of {data.totalGoals} goals complete
                </CardDescription>
              </div>
              <Link href="/goals">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.regularGoals.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <Target className="text-muted-foreground size-6" />
                  <p className="text-muted-foreground text-xs">No goals yet</p>
                  <Link href="/goals">
                    <Button variant="outline" size="sm">
                      Add Goal
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {data.regularGoals.slice(0, 5).map((goal) => (
                    <div key={goal.id} className="flex items-center gap-2 py-0.5">
                      {goal.isCompleted ? (
                        <CheckCircle2 className="text-success h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Circle className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      )}
                      <span
                        className={
                          goal.isCompleted
                            ? 'text-muted-foreground text-xs line-through'
                            : 'text-xs'
                        }
                      >
                        {goal.description}
                      </span>
                    </div>
                  ))}
                  {data.totalGoals > 5 && (
                    <p className="text-muted-foreground pt-1 text-xs">
                      +{data.totalGoals - 5} more goals
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:bg-accent h-full transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <link.icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{link.label}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{link.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
