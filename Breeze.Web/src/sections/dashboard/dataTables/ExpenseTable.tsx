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
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { Expense } from '../../../services/hooks/expense/expenseServices'
import { useFetchExpenses } from '../../../services/hooks/expense/useFetchExpenses'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'

// eslint-disable-next-line react-refresh/only-export-components
export const columns: ColumnDef<Expense>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Name
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			)
		},
	},
	{
		accessorKey: 'amount',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Amount
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			)
		},
		cell: ({ row }) => {
			const amount = row.getValue('amount') as number
			return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
		},
	},
	{
		accessorKey: 'date',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Date
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			)
		},
		cell: ({ row }) =>
			new Date(row.getValue('date')).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			}),
	},
	{
		accessorKey: 'category',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Category
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			)
		},
	},
	{
		id: 'actions',
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
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
	const [activeCategory, setActiveCategory] = React.useState('')
	const [nameFilter, setNameFilter] = React.useState('')
	const { categories } = useBudgetContext()

	const { data: expenses = [], status } = useFetchExpenses({ category: categories[0] })

	const table = useReactTable({
		data: expenses,
		columns,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		state: { sorting, columnFilters, columnVisibility },
	})

	const uniqueCategories = Array.from(new Set(categories?.map((item) => item.name))).sort()

	const handleCategoryClick = (category: React.SetStateAction<string>) => {
		setActiveCategory(category)
		table.getColumn('category')?.setFilterValue(category)
	}

	return (
		<section
			title='Expenses'
			className='w-full'
		>
			<div className='flex flex-wrap gap-2 pb-2'>
				{['All', ...uniqueCategories].map((category) => {
					const isActive = activeCategory === category || (category === 'All' && activeCategory === '')
					return (
						<Button
							key={category}
							onClick={() => handleCategoryClick(category === 'All' ? '' : category)}
							variant='outline'
							className={isActive ? 'bg-accent text-white' : ''}
						>
							{category}
						</Button>
					)
				})}
			</div>
			<Input
				placeholder='Filter names...'
				value={nameFilter}
				className='w-full my-2'
				onChange={(event) => {
					const value = event.target.value
					setNameFilter(value)
					table.getColumn('name')?.setFilterValue(value)
				}}
			/>
			<div className='max-h-96 overflow-auto rounded-md border'>
				<Table className='w-full table-fixed'>
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
						{status === 'loading' ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='text-center'
								>
									Loading...
								</TableCell>
							</TableRow>
						) : status === 'error' ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='text-center'
								>
									Error loading expenses. Please try again.
								</TableCell>
							</TableRow>
						) : expenses.length ? (
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
		</section>
	)
}

