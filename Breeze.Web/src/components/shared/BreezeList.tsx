type BreezeListProps = {
	children: React.ReactNode
	style?: React.CSSProperties
}

/**
 * Simple replacement for lists in Breeze, comes standard with default Breeze styling.
 * @param props.children: The children of the list.
 * @param props.style: - Optional - The style of the list.
 */
export const BreezeList = (props: BreezeListProps) => {
	const { children, style } = props
	return (
		<ul
			className='breeze-list'
			style={style}
		>
			{children}
		</ul>
	)
}
