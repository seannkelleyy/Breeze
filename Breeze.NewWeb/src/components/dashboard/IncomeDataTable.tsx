import * as React from 'react'
import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
import { Checkbox } from '@radix-ui/react-checkbox'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
} from '@radix-ui/react-dropdown-menu'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '../ui/table'
import { Income } from '../../services/hooks/income/incomeServices'

const data: Income[] = [
	{
		id: 1,
		userId: 'user1',
		budgetId: 101,
		name: 'Freelance Project',
		amount: 500,
		date: '2024-12-15',
	},
	{
		id: 2,
		userId: 'user2',
		budgetId: 102,
		name: 'Salary',
		amount: 3000,
		date: '2024-12-01',
	},
	{
		id: 3,
		userId: 'user1',
		budgetId: 103,
		name: 'Investment Return',
		amount: 250,
		date: '2024-12-10',
	},
	{
		id: 4,
		userId: 'user3',
		budgetId: 104,
		name: 'Bonus',
		amount: 1200,
		date: '2024-12-20',
	},
	{
		id: 5,
		userId: 'user4',
		budgetId: 105,
		name: 'Part-time Job',
		amount: 800,
		date: '2024-12-05',
	},
	{
		id: 6,
		userId: 'user2',
		budgetId: 106,
		name: 'Consulting Fee',
		amount: 1500,
		date: '2024-12-07',
	},
	{
		id: 7,
		userId: 'user1',
		budgetId: 107,
		name: 'Online Course Sales',
		amount: 600,
		date: '2024-12-14',
	},
	{
		id: 8,
		userId: 'user5',
		budgetId: 108,
		name: 'Stock Dividends',
		amount: 400,
		date: '2024-12-09',
	},
	{
		id: 9,
		userId: 'user3',
		budgetId: 109,
		name: 'Gift Money',
		amount: 200,
		date: '2024-12-22',
	},
	{
		id: 10,
		userId: 'user4',
		budgetId: 110,
		name: 'Selling Handmade Crafts',
		amount: 750,
		date: '2024-12-03',
	},
	{
		id: 11,
		userId: 'user2',
		budgetId: 111,
		name: 'Freelance Writing',
		amount: 1200,
		date: '2024-12-13',
	},
	{
		id: 12,
		userId: 'user5',
		budgetId: 112,
		name: 'App Development',
		amount: 3500,
		date: '2024-12-11',
	},
	{
		id: 13,
		userId: 'user1',
		budgetId: 113,
		name: 'Teaching Workshop',
		amount: 900,
		date: '2024-12-16',
	},
	{
		id: 14,
		userId: 'user3',
		budgetId: 114,
		name: 'Investment Return',
		amount: 650,
		date: '2024-12-18',
	},
	{
		id: 15,
		userId: 'user2',
		budgetId: 115,
		name: 'Commission from Sales',
		amount: 1700,
		date: '2024-12-06',
	},
	{
		id: 16,
		userId: 'user4',
		budgetId: 116,
		name: 'Photography Gig',
		amount: 450,
		date: '2024-12-04',
	},
	{
		id: 17,
		userId: 'user5',
		budgetId: 117,
		name: 'Music Performance',
		amount: 700,
		date: '2024-12-12',
	},
	{
		id: 18,
		userId: 'user1',
		budgetId: 118,
		name: 'Blog Sponsorship',
		amount: 300,
		date: '2024-12-17',
	},
	{
		id: 19,
		userId: 'user3',
		budgetId: 119,
		name: 'Software Sales',
		amount: 2000,
		date: '2024-12-21',
	},
	{
		id: 20,
		userId: 'user4',
		budgetId: 120,
		name: 'E-book Royalties',
		amount: 500,
		date: '2024-12-08',
	},
]

// eslint-disable-next-line react-refresh/only-export-components
export const columns: ColumnDef<Income>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'name',
		header: 'Name',
	},
	{
		accessorKey: 'amount',
		header: 'Amount',
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue('amount'))
			const formatted = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(amount)
			return <div className='text-right font-medium'>{formatted}</div>
		},
	},
	{
		accessorKey: 'date',
		header: 'Date',
		cell: ({ row }) => {
			const date = new Date(row.getValue('date'))
			return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
		},
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			const income = row.original

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant='ghost'
							className='h-8 w-8 p-0'
						>
							<span className='sr-only'>Open menu</span>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => navigator.clipboard.writeText(income.id?.toString() || '')}>Copy income ID</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View income details</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)
		},
	},
]

export function IncomeTable() {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
	const [rowSelection, setRowSelection] = React.useState({})

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	})

	return (
		<div className='w-full'>
			<div className='flex items-center py-4'>
				<Input
					placeholder='Filter names...'
					value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
					onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
					className='max-w-sm'
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant='outline'
							className='ml-auto'
						>
							Columns <ChevronDown />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className='capitalize'
										checked={column.getIsVisible()}
										onCheckedChange={(value) => column.toggleVisibility(!!value)}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								)
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='h-24 text-center'
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className='flex items-center justify-end space-x-2 py-4'>
				<div className='flex-1 text-sm text-muted-foreground'>
					{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<div className='space-x-2'>
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
		</div>
	)
}

