'use client';

import React from 'react';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ArrowUpDown } from 'lucide-react';

import { useBudgetContext } from '../../providers';

import { EditExpenseDialog } from './dialogs/EditExpenseDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Expense } from '../../types/expense';

/**
 * Component to display a table of expenses with sorting and filtering capabilities.
 * Users can filter expenses by category and name, and sort by different columns.
 * @returns {JSX.Element} The ExpensesTable component.
 */
export const ExpensesTable = () => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [activeCategory, setActiveCategory] = React.useState('');
  const [nameFilter, setNameFilter] = React.useState('');
  const { categories, expenses } = useBudgetContext();

  const columns = React.useMemo<ColumnDef<Expense>[]>(() => {
    const recurrenceLabelByInterval: Record<string, string> = {
      none: 'One-time',
      weekly: 'Weekly',
      biweekly: 'Biweekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };

    return [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="flex items-center px-1 text-xs sm:text-sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Name
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="flex items-center px-1 text-xs sm:text-sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Amount
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = row.getValue('amount') as number;
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount);
        },
      },
      {
        accessorKey: 'date',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="flex items-center px-1 text-xs sm:text-sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Date
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue('date') as string | number | Date | null | undefined;
          return dayjs(date).format('MMMM D, YYYY');
        },
      },
      {
        accessorKey: 'splits',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="flex items-center px-1 text-xs sm:text-sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Categories
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const splits = row.getValue('splits') as { categoryId: string }[] | undefined;
          if (!splits || splits.length === 0) return 'None';
          const categoryNames = splits
            .map((split) => {
              const category = categories.find((cat) => cat.id === split.categoryId);
              return category?.name ?? 'Unknown';
            })
            .join(', ');
          return categoryNames;
        },
      },
      {
        id: 'schedule',
        header: 'Schedule',
        cell: () => {
          // Expenses are always one-time in the new schema
          // Recurring expenses would be generated from templates
          return 'One-time';
        },
      },
    ];
  }, [categories]);

  const filteredExpenses = React.useMemo(() => {
    if (!activeCategory) return expenses;
    return expenses.filter((expense) => {
      // Check if any split in this expense belongs to the active category
      return expense.splits.some((split) => {
        const category = categories.find((cat) => cat.id === split.categoryId);
        return category?.name === activeCategory;
      });
    });
  }, [activeCategory, expenses, categories]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredExpenses,
    columns,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnFilters, columnVisibility },
  });

  const uniqueCategories = Array.from(new Set(categories?.map((item) => item.name))).sort();

  const handleCategoryClick = (category: React.SetStateAction<string>) => {
    setActiveCategory(category);
  };

  return (
    <section title="Expenses" className="w-full">
      <section className="flex flex-wrap gap-2 pb-2" title="Filter Categories">
        {['All', ...uniqueCategories].map((category) => {
          const isActive =
            activeCategory === category || (category === 'All' && activeCategory === '');
          return (
            <Button
              key={category}
              onClick={() => handleCategoryClick(category === 'All' ? '' : category)}
              variant="outline"
              className={isActive ? 'bg-accent text-white' : ''}
            >
              {category}
            </Button>
          );
        })}
      </section>
      <Input
        placeholder="Filter names..."
        value={nameFilter}
        className="my-2 w-full"
        onChange={(event) => {
          const value = event.target.value;
          setNameFilter(value);
          table.getColumn('name')?.setFilterValue(value);
        }}
      />
      <section className="max-h-96 overflow-auto rounded-md border" title="Expenses Table">
        <Table className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {expenses?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <EditExpenseDialog existingExpense={row.original}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </EditExpenseDialog>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </section>
  );
};
