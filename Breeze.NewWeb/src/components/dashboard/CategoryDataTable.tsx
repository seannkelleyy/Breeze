import * as React from 'react'
import {
	ColumnDef,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
	ColumnFiltersState,
} from '@tanstack/react-table'
import { Button } from '../ui/button'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '../ui/table'

const data = [
	{ id: 1, name: 'Groceries', amount: 200, date: '2024-12-01', category: 'Food' },
	{ id: 2, name: 'Gym Membership', amount: 50, date: '2024-12-03', category: 'Health' },
	{ id: 3, name: 'Electric Bill', amount: 120, date: '2024-12-05', category: 'Utilities' },
	{ id: 4, name: 'Dining Out', amount: 80, date: '2024-12-07', category: 'Food' },
	{ id: 5, name: 'Internet', amount: 60, date: '2024-12-09', category: 'Utilities' },
	{ id: 6, name: 'Concert Tickets', amount: 150, date: '2024-12-11', category: 'Entertainment' },
]

export const columns: ColumnDef<(typeof data)[0]>[] = [
	{
		accessorKey: 'name',
		header: 'Name',
	},
	{
		accessorKey: 'amount',
		header: 'Amount',
		cell: ({ row }) => {
			const amount = row.getValue('amount') as number
			return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
		},
	},
	{
		accessorKey: 'date',
		header: 'Date',
		cell: ({ row }) =>
			new Date(row.getValue('date')).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			}),
		sortingFn: (a, b) => new Date(b.original.date).getTime() - new Date(a.original.date).getTime(),
	},
	{
		accessorKey: 'category',
		header: 'Category',
	},
]

export function ExpensesTable() {
	const [sorting, setSorting] = React.useState<SortingState>([{ id: 'date', desc: true }])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([{ id: 'category', value: '' }])
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
	const [activeCategory, setActiveCategory] = React.useState('')

	const table = useReactTable({
		data,
		columns,
		state: { sorting, columnFilters, columnVisibility },
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	const uniqueCategories = Array.from(new Set(data.map((item) => item.category)))

	const handleCategoryClick = (category: React.SetStateAction<string>) => {
		setActiveCategory(category)
		table.getColumn('category')?.setFilterValue(category)
	}

	return (
		<div className='w-full'>
			<div className='flex flex-wrap gap-2 py-4'>
				<Button
					onClick={() => handleCategoryClick('')}
					variant='outline'
					className={activeCategory === '' ? 'bg-blue-500 text-white' : ''}
				>
					All
				</Button>
				{uniqueCategories.map((category) => (
					<Button
						key={category}
						onClick={() => handleCategoryClick(category)}
						variant='outline'
						className={activeCategory === category ? 'bg-blue-500 text-white' : ''}
					>
						{category}
					</Button>
				))}
			</div>
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='text-center'
								>
									No results found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className='flex items-center justify-end space-x-2 py-4'>
				<Button
					variant='outline'
					size='sm'
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					Previous
				</Button>
				<Button
					variant='outline'
					size='sm'
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					Next
				</Button>
			</div>
		</div>
	)
}

