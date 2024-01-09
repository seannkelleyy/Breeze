import { ReactNode } from 'react'
import './shared.css'

type BreezeBoxProps = {
	children: ReactNode[] | ReactNode
	title: string
}

export const BreezeBox = (props: BreezeBoxProps) => {
	const { children, title } = props
	return (
		<section
			className='breeze-box'
			title={title}
		>
			{children}
		</section>
	)
}
