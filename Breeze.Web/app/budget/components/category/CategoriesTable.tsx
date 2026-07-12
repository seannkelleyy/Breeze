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
import { ArrowUpDown } from 'lucide-react';

import { useBudgetContext } from '../../providers';
import { Category } from '../../types/category';
import { Badge } from '@/components/ui/badge';
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
import { CreateCategoryDialog } from './dialogs/CreateCategoryDialog';
import { EditCategoryDialog } from './dialogs/EditCategoryDialog';

export const CategoriesTable = () => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [nameFilter, setNameFilter] = React.useState('');
  const { categories } = useBudgetContext();

  const columns = React.useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="flex items-center px-1 text-xs sm:text-sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        ),
      },
      {
        accessorKey: 'allocation',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="flex items-center px-1 text-xs sm:text-sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Allocation
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const amount = Number(row.getValue('allocation')) || 0;
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
            amount,
          );
        },
      },
      {
        accessorKey: 'currentSpend',
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="flex items-center px-1 text-xs sm:text-sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Spent
            <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const amount = Number(row.getValue('currentSpend')) || 0;
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount);
          const allocation = Number(row.original.allocation) || 0;
          const overBudget = allocation > 0 && amount > allocation;
          return (
            <span className={overBudget ? 'text-destructive font-medium' : ''}>{formatted}</span>
          );
        },
      },
      {
        id: 'source',
        header: 'Source',
        cell: ({ row }) => {
          const category = row.original as Category;
          if (category.sourceType === 'RECURRING_TEMPLATE') {
            return <Badge variant="secondary">Recurring</Badge>;
          }
          return <span className="text-muted-foreground text-sm">Manual</span>;
        },
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: categories ?? [],
    columns,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnFilters, columnVisibility },
  });

  const totalAllocation = React.useMemo(
    () => categories.reduce((s, c) => s + (Number(c.allocation) || 0), 0),
    [categories],
  );

  return (
    <section title="Budget Categories" className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <CreateCategoryDialog />
        <span className="text-sm font-medium">
          Total Allocation:{' '}
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
            totalAllocation,
          )}
        </span>
      </div>
      <Input
        placeholder="Filter names..."
        value={nameFilter}
        className="my-2 w-full"
        onChange={(e) => {
          const value = e.target.value;
          setNameFilter(value);
          table.getColumn('name')?.setFilterValue(value);
        }}
      />
      <section className="max-h-96 overflow-auto rounded-md border" title="Categories Table">
        <Table className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {categories?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <EditCategoryDialog existingCategory={row.original}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </EditCategoryDialog>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </section>
  );
};

export default CategoriesTable;
