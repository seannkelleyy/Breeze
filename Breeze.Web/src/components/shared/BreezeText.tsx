import { ReactNode } from 'react'

type BreezeTextProps = {
	text: string | ReactNode
	type: 'small' | 'medium' | 'large' | 'small-heading' | 'large-heading' | 'title'
}

export const BreezeText = (props: BreezeTextProps) => {
	const { text, type } = props
	return <p className={`breeze-text-${type}`}>{text}</p>
}
