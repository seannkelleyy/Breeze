import * as React from 'react'
import {
	ColumnDef,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	useReactTable,
	ColumnFiltersState,
} from '@tanstack/react-table'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '../../../components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

const data = [
	{ id: 1, name: 'Groceries', amount: 200, date: '2024-12-01', category: 'Food' },
	{ id: 2, name: 'Gym Membership', amount: 50, date: '2024-12-03', category: 'Health' },
	{ id: 3, name: 'Electric Bill', amount: 120, date: '2024-12-05', category: 'Utilities' },
	{ id: 4, name: 'Dining Out', amount: 80, date: '2024-12-07', category: 'Food' },
	{ id: 5, name: 'Internet', amount: 60, date: '2024-12-09', category: 'Utilities' },
	{ id: 6, name: 'Concert Tickets', amount: 150, date: '2024-12-11', category: 'Entertainment' },
	{ id: 7, name: 'Car Insurance', amount: 300, date: '2024-12-13', category: 'Insurance' },
	{ id: 8, name: 'Movie Night', amount: 40, date: '2024-12-14', category: 'Entertainment' },
	{ id: 9, name: 'Coffee', amount: 15, date: '2024-12-15', category: 'Food' },
	{ id: 10, name: 'Gas', amount: 70, date: '2024-12-16', category: 'Transportation' },
	{ id: 11, name: 'Water Bill', amount: 45, date: '2024-12-17', category: 'Utilities' },
	{ id: 12, name: 'Book Purchase', amount: 25, date: '2024-12-18', category: 'Education' },
	{ id: 13, name: 'Phone Bill', amount: 90, date: '2024-12-19', category: 'Utilities' },
	{ id: 14, name: 'Gift', amount: 100, date: '2024-12-20', category: 'Miscellaneous' },
	{ id: 15, name: 'Lunch', amount: 30, date: '2024-12-21', category: 'Food' },
	{ id: 16, name: 'Subscription', amount: 15, date: '2024-12-22', category: 'Entertainment' },
	{ id: 17, name: 'Haircut', amount: 25, date: '2024-12-23', category: 'Personal Care' },
	{ id: 18, name: 'Parking Fee', amount: 10, date: '2024-12-24', category: 'Transportation' },
	{ id: 19, name: 'Home Supplies', amount: 75, date: '2024-12-25', category: 'Household' },
	{ id: 20, name: 'Pet Food', amount: 50, date: '2024-12-26', category: 'Pets' },
	{ id: 21, name: 'Streaming Service', amount: 20, date: '2024-12-27', category: 'Entertainment' },
	{ id: 22, name: 'Holiday Decorations', amount: 60, date: '2024-12-28', category: 'Miscellaneous' },
	{ id: 23, name: 'Dinner', amount: 85, date: '2024-12-29', category: 'Food' },
	{ id: 24, name: 'Taxi Ride', amount: 25, date: '2024-12-30', category: 'Transportation' },
	{ id: 25, name: 'Health Checkup', amount: 200, date: '2024-12-31', category: 'Health' },
]

// eslint-disable-next-line react-refresh/only-export-components
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
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			const income = row.original

			return (
				<div className='flex justify-end'>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='ghost'
								className='h-8 w-8 p-0'
							>
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align='end'
							className='bg-background p-2 border border-border rounded-md'
						>
							<DropdownMenuItem
								className='hover:cursor-pointer hover:bg-border rounded-md p-1'
								onClick={() => navigator.clipboard.writeText(income.id?.toString() || '')}
							>
								Copy income ID
							</DropdownMenuItem>
							<DropdownMenuSeparator className='h-[1px] bg-border my-1' />
							<DropdownMenuItem className='hover:cursor-pointer hover:bg-border rounded-md p-1'>View income details</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)
		},
	},
]

export function ExpensesTable() {
	const [sorting, setSorting] = React.useState<SortingState>([{ id: 'date', desc: true }])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
	const [activeCategory, setActiveCategory] = React.useState('')
	const [nameFilter, setNameFilter] = React.useState('')

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
	})

	const uniqueCategories = Array.from(new Set(data.map((item) => item.category)))

	const handleCategoryClick = (category: React.SetStateAction<string>) => {
		setActiveCategory(category)
		table.getColumn('category')?.setFilterValue(category)
	}

	return (
		<div className='w-max min-w-[228px] max-w-[568px]'>
			<div className='flex items-center py-4'>
				<Input
					placeholder='Search by name...'
					value={nameFilter}
					onChange={(event) => {
						const value = event.target.value
						setNameFilter(value)
						table.getColumn('name')?.setFilterValue(value)
					}}
				/>
			</div>
			<div className='flex flex-wrap gap-2 py-4'>
				<Button
					onClick={() => handleCategoryClick('')}
					variant='outline'
					className={activeCategory === '' ? 'bg-accent text-white' : ''}
				>
					All
				</Button>
				{uniqueCategories.map((category) => (
					<Button
						key={category}
						onClick={() => handleCategoryClick(category)}
						variant='outline'
						className={activeCategory === category ? 'bg-accent text-white' : ''}
					>
						{category}
					</Button>
				))}
			</div>
			<div
				className='rounded-md border overflow-auto'
				style={{ maxHeight: '400px' }}
			>
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
		</div>
	)
}

