export const getMonthAsString = (month: number) => {
	switch (month) {
		case 1:
			return 'January'
		case 2:
			return 'February'
		case 3:
			return 'March'
		case 4:
			return 'April'
		case 5:
			return 'May'
		case 6:
			return 'June'
		case 7:
			return 'July'
		case 8:
			return 'August'
		case 9:
			return 'September'
		case 10:
			return 'October'
		case 11:
			return 'November'
		case 12:
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
