import { FormattedNumberInput } from '../../../../components/common/form/FormattedNumberInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlannerAccount, ContributionMode, AccountRateProfile } from '../../types/account'

type Option<T extends string> = { value: T; label: string }

interface LiabilityAccountFieldsProps {
	account: PlannerAccount
	contributionInputLabel: string
	modeOptions: ReadonlyArray<Option<ContributionMode>>
	accountRateProfileOptions: ReadonlyArray<Option<AccountRateProfile>>
	selectedRateProfile: AccountRateProfile
	usesDepreciationInput: boolean
	onUpdateAccount: (updater: (current: PlannerAccount) => PlannerAccount) => void
	onSetContributionToIrsMax: () => void
	getDisplayedRateForAccount: (account: PlannerAccount) => number
	getAnnualRateFromProfile: (profile: AccountRateProfile, currentAnnualRate: number) => number
	getStoredAnnualRateForInput: (account: PlannerAccount, value: number) => number
}

const LiabilityAccountFields = ({
	account,
	contributionInputLabel,
	modeOptions,
	accountRateProfileOptions,
	selectedRateProfile,
	usesDepreciationInput,
	onUpdateAccount,
	onSetContributionToIrsMax,
	getDisplayedRateForAccount,
	getAnnualRateFromProfile,
	getStoredAnnualRateForInput,
}: LiabilityAccountFieldsProps) => {
	return (
		<>
			<div className='space-y-2'>
				<Label>Payment Type</Label>
				<Select
					value={account.contributionMode}
					onValueChange={(value) => onUpdateAccount((current) => ({ ...current, contributionMode: value as ContributionMode }))}
				>
					<SelectTrigger>
						<SelectValue placeholder='Select payment type' />
					</SelectTrigger>
					<SelectContent>
						{modeOptions.map((modeOption) => (
							<SelectItem
								key={modeOption.value}
								value={modeOption.value}
							>
								{modeOption.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className='space-y-2'>
				<div className='flex items-center justify-between gap-2'>
					<Label>{contributionInputLabel}</Label>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={onSetContributionToIrsMax}
						disabled
					>
						Max It Out
					</Button>
				</div>
				<FormattedNumberInput
					value={account.contributionValue}
					onValueChange={(value) => onUpdateAccount((current) => ({ ...current, contributionValue: value }))}
					maxFractionDigits={2}
				/>
			</div>
			<div className='space-y-2'>
				<Label>Current Balance Owed</Label>
				<FormattedNumberInput
					value={account.startingBalance}
					onValueChange={(value) => onUpdateAccount((current) => ({ ...current, startingBalance: value }))}
					maxFractionDigits={0}
				/>
			</div>
			<div className='space-y-2'>
				<Label>Interest Profile</Label>
				<Select
					value={selectedRateProfile}
					onValueChange={(value) =>
						onUpdateAccount((current) => ({
							...current,
							annualRate: getStoredAnnualRateForInput(current, getAnnualRateFromProfile(value as AccountRateProfile, getDisplayedRateForAccount(current))),
						}))
					}
				>
					<SelectTrigger>
						<SelectValue placeholder='Select rate profile' />
					</SelectTrigger>
					<SelectContent>
						{accountRateProfileOptions.map((option) => (
							<SelectItem
								key={option.value}
								value={option.value}
							>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{selectedRateProfile === 'custom' ? (
					<div className='mt-2 space-y-2'>
						<Label>{usesDepreciationInput ? 'Custom Depreciation %' : 'Custom Interest %'}</Label>
						<FormattedNumberInput
							value={getDisplayedRateForAccount(account)}
							onValueChange={(value) => onUpdateAccount((current) => ({ ...current, annualRate: getStoredAnnualRateForInput(current, value) }))}
							maxFractionDigits={2}
						/>
					</div>
				) : null}
			</div>
		</>
	)
}

export default LiabilityAccountFields

