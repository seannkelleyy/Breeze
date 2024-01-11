import { BreezeCard } from '../../shared/BreezeCard'
import { BreezeText } from '../../shared/BreezeText'

/**
 * This is a future feature that will calculate the user's progess towards their budget.
 */
export const Progress = () => {
	return (
		<BreezeCard
			title='Progress'
			style={{
				width: '80%',
			}}
		>
			<BreezeText
				text="Great Work! You're on pace to make your budget!"
				type='medium'
			/>
		</BreezeCard>
	)
}
