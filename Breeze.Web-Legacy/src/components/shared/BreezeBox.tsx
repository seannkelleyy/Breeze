type BreezeBoxProps = {
	title: string
	children: React.ReactNode
	direction?: 'row' | 'column'
	style?: React.CSSProperties
}

/**
 * Simple replacement for a flexbox container. This component is quick to use and configure.
 * @param props.title: - The title of the breeze box.
 * @param props.children: - The children of the breeze box.
 * @param props.direction: - Optional - The direction of the breeze box. Defaults to column.
 * @param props.style: - Optional - The style of the breeze box.
 */
export const BreezeBox = ({ title, children, direction, style }: BreezeBoxProps) => {
	const className = direction ? `breeze-box-${direction}` : 'breeze-box-column'
	return (
		<section
			title={title}
			className={className}
			style={style}
		>
			{children}
		</section>
	)
}
