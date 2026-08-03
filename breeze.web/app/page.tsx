'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/lib/services/queries/assets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { SignUpButton } from '@clerk/clerk-react';
import BreezeAuthButton from '@/components/common/auth/BreezeAuthButton';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Wrench,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const quickLinks = [
  {
    label: 'Planner',
    href: '/planner',
    icon: TrendingUp,
    description: 'Accounts, projections, and retirement planning.',
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

const DashboardPage = () => {
  const { userId, isSignedIn, user } = useCurrentUser();
  const { request } = useGraphql();

  const { data } = useQuery({
    queryKey: ['dashboard-summary', userId],
    queryFn: async () => {
      const [assetsResp, liabilitiesResp] = await Promise.all([
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
      ]);

      const assets = assetsResp?.assets ?? [];
      const liabilities = liabilitiesResp?.liabilities ?? [];

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

      return {
        totalAssets,
        totalLiabilities,
        netWorth,
        assetCount: assets.length,
        liabilityCount: liabilities.length,
        assetsByType: Object.fromEntries(assetsByType),
        liabilitiesByType: Object.fromEntries(liabilitiesByType),
      };
    },
    enabled: isSignedIn && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (!isSignedIn) {
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
};

export default DashboardPage;
