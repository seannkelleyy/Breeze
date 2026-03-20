import React from 'react'

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
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import { ArrowUpDown, Table as LucideTable } from 'lucide-react'

import { useBudgetContext } from '../../providers'

import { EditExpenseDialog } from './dialogs/EditExpenseDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Expense } from '../../types/expense'

/**
 * Component to display a table of expenses with sorting and filtering capabilities.
 * Users can filter expenses by category and name, and sort by different columns.
 * @returns {JSX.Element} The ExpensesTable component.
 */
export const ExpensesTable = () => {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
	const [activeCategory, setActiveCategory] = React.useState('')
	const [nameFilter, setNameFilter] = React.useState('')
	const { categories, expenses } = useBudgetContext()
	const recurrenceLabelByInterval: Record<string, string> = {
		none: 'One-time',
		weekly: 'Weekly',
		biweekly: 'Biweekly',
		monthly: 'Monthly',
		quarterly: 'Quarterly',
		yearly: 'Yearly',
	}

	const columns = React.useMemo<ColumnDef<Expense>[]>(
		() => [
			{
				accessorKey: 'name',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							className='flex items-center px-1 text-xs sm:text-sm'
							onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
						>
							Name
							<ArrowUpDown className='w-3 h-3 sm:w-4 sm:h-4' />
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
							className='flex items-center px-1 text-xs sm:text-sm'
							onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
						>
							Amount
							<ArrowUpDown className='w-3 h-3 sm:w-4 sm:h-4' />
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
							className='flex items-center px-1 text-xs sm:text-sm'
							onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
						>
							Date
							<ArrowUpDown className='w-3 h-3 sm:w-4 sm:h-4' />
						</Button>
					)
				},
				cell: ({ row }) => {
					const date = row.getValue('date') as string | number | Date | null | undefined
					return dayjs(date).format('MMMM D, YYYY')
				},
			},
			{
				accessorKey: 'categoryId',
				header: ({ column }) => {
					return (
						<Button
							variant='ghost'
							className='flex items-center px-1 text-xs sm:text-sm'
							onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
						>
							Category
							<ArrowUpDown className='w-3 h-3 sm:w-4 sm:h-4' />
						</Button>
					)
				},
				cell: ({ row }) => {
					const categoryId = row.getValue('categoryId') as number
					const category = categories.find((cat) => cat.id === categoryId)
					return category ? category.name : 'Unknown'
				},
			},
			{
				id: 'schedule',
				header: 'Schedule',
				cell: ({ row }) => {
					const recurrenceInterval = row.original.recurrenceInterval ?? 'none'
					if (recurrenceInterval === 'none') {
						return 'One-time'
					}

					const dueDay = row.original.dueDayOfMonth
					return `${recurrenceLabelByInterval[recurrenceInterval] ?? 'Recurring'}${dueDay ? ` - day ${dueDay}` : ''}`
				},
			},
		],
		[categories, recurrenceLabelByInterval],
	)

	const filteredExpenses = React.useMemo(() => {
		if (!activeCategory) return expenses
		return expenses.filter((expense) => {
			const category = categories.find((cat) => cat.id === expense.categoryId)
			return category?.name === activeCategory
		})
	}, [activeCategory, expenses, categories])

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
	})

	const uniqueCategories = Array.from(new Set(categories?.map((item) => item.name))).sort()

	const handleCategoryClick = (category: React.SetStateAction<string>) => {
		setActiveCategory(category)
		table.getColumn('categoryId')?.setFilterValue(category)
	}

	return (
		<section
			title='Expenses'
			className='w-full'
		>
			<section
				className='flex flex-wrap gap-2 pb-2'
				title='Filter Categories'
			>
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
			</section>
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
			<section
				className='max-h-96 overflow-auto rounded-md border'
				title='Expenses Table'
			>
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
						{expenses?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											<EditExpenseDialog existingExpense={row.original}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</EditExpenseDialog>
										</TableCell>
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
			</section>
		</section>
	)
}

