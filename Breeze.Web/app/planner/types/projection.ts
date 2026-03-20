export type ProjectionRow = {
	age: number
	totalBalance: number
	totalContributions: number
	[key: `account-${number}`]: number
}

