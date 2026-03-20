import useHttp from '@/lib/services/useHttp'

export type ScheduleType = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'

export interface RecurringIncomeTemplate {
	id?: number
	userId?: string
	name: string
	amount: number
	scheduleType: ScheduleType
	anchorDate: string
	semiMonthlyDay1?: number | null
	semiMonthlyDay2?: number | null
	monthlyDayOfMonth?: number | null
	startDate: string
	stopDate?: string | null
	isActive: boolean
}

export interface RecurringCategoryTemplate {
	id?: number
	userId?: string
	name: string
	allocation: number
	startDate: string
	stopDate?: string | null
	isActive: boolean
}

export const useRecurringTemplates = () => {
	const { getMany, post, patch, deleteOne } = useHttp()

	const getRecurringIncomeTemplates = async (): Promise<RecurringIncomeTemplate[]> => await getMany<RecurringIncomeTemplate>('recurring-income-templates')

	const postRecurringIncomeTemplate = async (template: RecurringIncomeTemplate): Promise<RecurringIncomeTemplate> =>
		await post<RecurringIncomeTemplate, RecurringIncomeTemplate>('recurring-income-templates', template)

	const patchRecurringIncomeTemplate = async (template: RecurringIncomeTemplate): Promise<RecurringIncomeTemplate> =>
		await patch<RecurringIncomeTemplate, RecurringIncomeTemplate>(`recurring-income-templates/${template.id}`, template)

	const deleteRecurringIncomeTemplate = async (id: number): Promise<void> => await deleteOne(`recurring-income-templates/${id}`)

	const getRecurringCategoryTemplates = async (): Promise<RecurringCategoryTemplate[]> => await getMany<RecurringCategoryTemplate>('recurring-category-templates')

	const postRecurringCategoryTemplate = async (template: RecurringCategoryTemplate): Promise<RecurringCategoryTemplate> =>
		await post<RecurringCategoryTemplate, RecurringCategoryTemplate>('recurring-category-templates', template)

	const patchRecurringCategoryTemplate = async (template: RecurringCategoryTemplate): Promise<RecurringCategoryTemplate> =>
		await patch<RecurringCategoryTemplate, RecurringCategoryTemplate>(`recurring-category-templates/${template.id}`, template)

	const deleteRecurringCategoryTemplate = async (id: number): Promise<void> => await deleteOne(`recurring-category-templates/${id}`)

	return {
		getRecurringIncomeTemplates,
		postRecurringIncomeTemplate,
		patchRecurringIncomeTemplate,
		deleteRecurringIncomeTemplate,
		getRecurringCategoryTemplates,
		postRecurringCategoryTemplate,
		patchRecurringCategoryTemplate,
		deleteRecurringCategoryTemplate,
	}
}

