export type Income = {
	id?: number
	userId?: string
	name: string
	date: Date
	amount: number
	budgetId?: number
}

export const emptyIncome: Income = {
	name: '',
	date: new Date(),
	amount: 0,
}