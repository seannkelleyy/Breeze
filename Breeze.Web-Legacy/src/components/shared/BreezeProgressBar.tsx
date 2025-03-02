type BreezeProgressBarProps = {
	title: string
	percentage: number
	style?: React.CSSProperties
}

/**
 * Simple progress bar used in Breeze, comes standard with default Breeze styling.
 * @param props.title: The title of the progress bar.
 * @param props.percentage: The percentage of the progress bar.
 * @param props.style: - Optional - The style of the progress bar.
 */
export const BreezeProgressBar = ({ title, percentage, style }: BreezeProgressBarProps) => {
	return (
		<section
			title={title}
			className='breeze-progress-bar'
		>
			<section
				title={`${title} fill`}
				className='breeze-progress-bar-fill'
				style={{
					width: `${percentage}%`,
					...style,
				}}
			/>
		</section>
	)
}
