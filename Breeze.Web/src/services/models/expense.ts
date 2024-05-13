export type Expense = {
	id?: number
	userId?: string
	categoryId?: number
	name: string
	date: Date
	amount: number
}

// This is used to inialize a new expense
export const emptyExpense: Expense = {
	name: 'Expense Name',
	date: new Date(),
	amount: 0,
}
