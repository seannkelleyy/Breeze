export const getMonthAsString = (month: number) => {
	switch (month) {
		case 0:
			return 'January'
		case 1:
			return 'February'
		case 2:
			return 'March'
		case 3:
			return 'April'
		case 4:
			return 'May'
		case 5:
			return 'June'
		case 6:
			return 'July'
		case 7:
			return 'August'
		case 8:
			return 'September'
		case 9:
			return 'October'
		case 10:
			return 'November'
		case 11:
			return 'December'
		default:
			return ''
	}
}

// Returns the total number of days in the month and year provided.
export const getNumberOfDaysInMonth = (month: number, year: number) => {
	switch (month) {
		case 0:
			return 31
		case 1:
			return year % 4 === 0 ? 29 : 28
		case 2:
			return 31
		case 3:
			return 30
		case 4:
			return 31
		case 5:
			return 30
		case 6:
			return 31
		case 7:
			return 31
		case 8:
			return 30
		case 9:
			return 31
		case 10:
			return 30
		case 11:
			return 31
		default:
			return 30
	}
}
