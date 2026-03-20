export type IrsLimitKey = '401k' | '403b' | '457' | 'roth-ira' | 'traditional-ira' | 'hsa'

export type IrsLimitRule = {
	baseAnnualLimit: number
	familyAnnualLimit?: number
	catchUpAmount: number
	catchUpAge: number
}

export type IrsLimitConfig = Record<IrsLimitKey, IrsLimitRule>

export interface IRSAccount {
	id: number
	type: string
	maxAmount: number
	familyMaxAmount?: number | null
	catchUpAmount: number
	catchUpAge: number
}

