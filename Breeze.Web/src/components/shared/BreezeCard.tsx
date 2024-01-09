import { ReactNode } from 'react'
import './shared.css'

type BreezeCardProps = {
	children: ReactNode[] | ReactNode
	title: string
}

export const BreezeCard = (props: BreezeCardProps) => {
	const { children, title } = props
	return (
		<section
			className='breeze-card'
			title={title}
		>
			{children}
		</section>
	)
}
