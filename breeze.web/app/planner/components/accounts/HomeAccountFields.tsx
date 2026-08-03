import { FormattedNumberInput } from '../../../../components/common/form/FormattedNumberInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssetFinanceDetails, HomeGrowthProfile } from '../../types/finance';

type Option<T extends string> = { value: T; label: string };

interface HomeAccountFieldsProps {
  assetFinanceDetails: AssetFinanceDetails | undefined;
  defaultHomeGrowthProfile: string;
  defaultHomeAppreciationRate: number;
  homeGrowthProfileOptions: ReadonlyArray<Option<string>>;
  onUpdateAssetFinanceDetails: (
    updater: (current: AssetFinanceDetails) => AssetFinanceDetails,
  ) => void;
  toIsoDate: (value: Date) => string;
  getHomeAnnualGrowthRate: (
    profile: HomeGrowthProfile | string | undefined,
    customAnnualRate: number,
  ) => number;
}

const HomeAccountFields = ({
  assetFinanceDetails,
  defaultHomeGrowthProfile,
  defaultHomeAppreciationRate,
  homeGrowthProfileOptions,
  onUpdateAssetFinanceDetails,
  toIsoDate,
  getHomeAnnualGrowthRate,
}: HomeAccountFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Purchase Date</Label>
        <Input
          type="date"
          value={assetFinanceDetails?.purchaseDate ?? toIsoDate(new Date())}
          onChange={(event) =>
            onUpdateAssetFinanceDetails((current) => ({
              ...current,
              purchaseDate: event.target.value,
            }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Purchase Price</Label>
        <FormattedNumberInput
          value={assetFinanceDetails?.purchasePrice ?? 0}
          onValueChange={(value) =>
            onUpdateAssetFinanceDetails((current) => ({
              ...current,
              purchasePrice: value,
            }))
          }
          maxFractionDigits={0}
        />
      </div>
      <div className="space-y-2">
        <Label>Current Home Value</Label>
        <FormattedNumberInput
          value={assetFinanceDetails?.currentValue ?? 0}
          onValueChange={(value) =>
            onUpdateAssetFinanceDetails((current) => ({
              ...current,
              currentValue: value,
            }))
          }
          maxFractionDigits={0}
        />
      </div>
      <div className="space-y-2">
        <Label>Growth Model</Label>
        <Select
          value={assetFinanceDetails?.homeGrowthProfile ?? defaultHomeGrowthProfile}
          onValueChange={(value) =>
            onUpdateAssetFinanceDetails((current) => {
              const profile = value as HomeGrowthProfile;
              return {
                ...current,
                homeGrowthProfile: profile,
                annualChangeRate: getHomeAnnualGrowthRate(profile, current.annualChangeRate),
              };
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select growth model" />
          </SelectTrigger>
          <SelectContent>
            {homeGrowthProfileOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {assetFinanceDetails?.homeGrowthProfile === 'custom' ? (
          <div className="mt-2">
            <Label>Custom Appreciation %</Label>
            <FormattedNumberInput
              value={assetFinanceDetails?.annualChangeRate ?? defaultHomeAppreciationRate}
              onValueChange={(value) =>
                onUpdateAssetFinanceDetails((current) => ({
                  ...current,
                  annualChangeRate: value,
                }))
              }
              maxFractionDigits={2}
            />
          </div>
        ) : null}
      </div>
    </>
  );
};

export default HomeAccountFields;
