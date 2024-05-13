type BreezeProgressBarProps = {
	title: string
	percentage: number
	style?: React.CSSProperties
}

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
