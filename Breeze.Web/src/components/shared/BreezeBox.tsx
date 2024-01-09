type BreezeBoxProps = {
	title: string
	direction?: 'row' | 'column'
	children: React.ReactNode
}

export const BreezeBox = (props: BreezeBoxProps) => {
	const { title, children, direction } = props
	const className = direction ? `breeze-box-${direction}` : 'breeze-box-column'
	return (
		<section
			title={title}
			className={className}
		>
			{children}
		</section>
	)
}
