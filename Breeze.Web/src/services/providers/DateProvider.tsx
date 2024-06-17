import React, { createContext, useContext } from 'react'

type DateProviderProps = { children: React.ReactNode }
type DateContextType = { date: Date; getMonthAsString: (month: number) => string; getNumberOfDaysInMonth: (month: number, year: number) => number }
const DateContext = createContext<DateContextType>({} as DateContextType)

export const DateProvider = ({ children }: DateProviderProps) => {
	const date = new Date(Date.now())
	date.setMonth(date.getMonth() + 1)

	const getMonthAsString = (month: number) => {
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
	const getNumberOfDaysInMonth = (month: number, year: number) => {
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
	return <DateContext.Provider value={{ date, getMonthAsString, getNumberOfDaysInMonth }}>{children}</DateContext.Provider>
}

// Hook to access the context
// eslint-disable-next-line react-refresh/only-export-components
export const useDateContext = () => useContext(DateContext)
