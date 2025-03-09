import * as React from 'react'
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
import { ArrowUpDown } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '../../../components/ui/table'
import { Income } from '../../../services/hooks/income/incomeServices'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import dayjs from 'dayjs'
import { IncomeDialog } from '../dialogs/IncomeDialog'

// eslint-disable-next-line react-refresh/only-export-components
export const columns: ColumnDef<Income>[] = [
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
			const amount = parseFloat(row.getValue('amount'))
			const formatted = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(amount)
			return <div className='text-left font-medium'>{formatted}</div>
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
		cell: ({ row }) => {
			const date = row.getValue('date') as string | number | Date | null | undefined
			return dayjs(date).format('MMMM D, YYYY')
		},
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			const income = row.original

			return (
				<div className='flex justify-end'>
					<IncomeDialog existingIncome={income} />
				</div>
			)
		},
	},
]

export function IncomeTable() {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
	const [rowSelection, setRowSelection] = React.useState({})
	const { incomes = [] } = useBudgetContext()

	const table = useReactTable({
		data: incomes ?? [],
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
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
		<section
			title='Incomes'
			className='w-full '
		>
			<Input
				placeholder='Filter names...'
				value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
				onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
				className='w-full my-2'
			/>
			<section
				className='max-h-96 overflow-auto rounded-md border'
				title='Incomes Table'
			>
				<Table className='w-full table-fixed'>
					<TableHeader className='w-full'>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length > 0 ? (
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
							<TableRow className='w-full'>
								<TableCell
									colSpan={columns.length}
									className='h-24 text-center w-full'
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</section>
		</section>
	)
}

