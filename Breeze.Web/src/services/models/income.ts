export type Income = {
	id?: number
	userId?: string
	budgetId?: number
	name: string
	date: Date
	amount: number
}

// This is used to inialize a new income
export const emptyIncome: Income = {
	name: 'Income Name',
	date: new Date(),
	amount: 0,
}