'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Wrench, Home, LinkIcon } from 'lucide-react';

const tools = [
  {
    title: 'Mortgage Calculator',
    description: 'Analyze amortization, refinance choices, and extra payment strategies.',
    href: '/tools/mortgage',
    icon: Home,
  },
  {
    title: 'Plaid Connections',
    description: 'Connect bank accounts and sync balances automatically.',
    href: '/plaid-connections',
    icon: LinkIcon,
  },
];

const ToolsPage = () => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader icon={Wrench} title="Tools" subtitle="Financial calculators and utilities." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="hover:bg-accent h-full transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <tool.icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{tool.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
