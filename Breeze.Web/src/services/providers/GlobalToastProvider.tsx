import { BreezeToast, BreezeToastProps } from '@/components/shared/BreezeToast'
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'

export type GlobalToastContextProps = {
	showToast: (message: string, color: 'red' | 'green' | 'yellow') => void
	closeToast: () => void
}

export const GlobalToastContext = createContext<GlobalToastContextProps>({
	showToast: (message: string, color: 'red' | 'green' | 'yellow') => console.log(message, color),
	closeToast: () => console.log('closeToast'),
})

/**
 * @description A provider that can be used to display messages to the user. Used to access the toast from anywhere in the app
 */
export const GlobalToastProvider = ({ children }: { children: ReactNode }) => {
	const [toast, setToast] = useState<BreezeToastProps>({
		open: false,
		message: '',
		color: 'green',
	})

	const closeToast = useCallback(() => {
		setToast({ ...toast, open: false })
	}, [toast])

	/**
	 * @description Display the global toast message to the user
	 * Utilizes [AlchemyToast] as the base Component
	 * @remarks IMPORTANT: Make sure you call this in a useEffect or useCallback to avoid infinite loops
	 */
	const showToast = useCallback(
		(message: string, color: 'red' | 'green' | 'yellow') => {
			setToast({ open: true, message, color })
		},
		[setToast],
	)

	const value = useMemo(() => ({ showToast, closeToast }), [closeToast, showToast])

	return (
		<GlobalToastContext.Provider value={value}>
			<>
				{children}
				<BreezeToast
					open={toast.open}
					message={toast.message}
					color={toast.color}
				/>
			</>
		</GlobalToastContext.Provider>
	)
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalToast = () => useContext(GlobalToastContext)
