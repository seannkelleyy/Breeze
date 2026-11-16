import { clamp } from '../../lib/plannerMath';
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
import { AssetFinanceDetails, VehicleDepreciationProfile } from '../../types/finance';

type Option<T extends string> = { value: T; label: string };

interface VehicleAccountFieldsProps {
  assetFinanceDetails: AssetFinanceDetails | undefined;
  defaultVehicleDepreciationProfile: string;
  defaultVehicleDepreciationRate: number;
  vehicleDepreciationProfileOptions: ReadonlyArray<Option<string>>;
  onUpdateAssetFinanceDetails: (
    updater: (current: AssetFinanceDetails) => AssetFinanceDetails,
  ) => void;
  toIsoDate: (value: Date) => string;
}

const VehicleAccountFields = ({
  assetFinanceDetails,
  defaultVehicleDepreciationProfile,
  defaultVehicleDepreciationRate,
  vehicleDepreciationProfileOptions,
  onUpdateAssetFinanceDetails,
  toIsoDate,
}: VehicleAccountFieldsProps) => {
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
        <Label>Current Vehicle Value</Label>
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
        <Label>Depreciation Model</Label>
        <Select
          value={
            assetFinanceDetails?.vehicleDepreciationProfile ?? defaultVehicleDepreciationProfile
          }
          onValueChange={(value) =>
            onUpdateAssetFinanceDetails((current) => ({
              ...current,
              vehicleDepreciationProfile: value as VehicleDepreciationProfile,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select depreciation model" />
          </SelectTrigger>
          <SelectContent>
            {vehicleDepreciationProfileOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {assetFinanceDetails?.vehicleDepreciationProfile === 'custom' ? (
          <div className="mt-2">
            <Label>Custom Depreciation %</Label>
            <FormattedNumberInput
              value={Math.abs(
                Math.min(
                  0,
                  assetFinanceDetails?.annualChangeRate ?? -defaultVehicleDepreciationRate,
                ),
              )}
              onValueChange={(value) =>
                onUpdateAssetFinanceDetails((current) => ({
                  ...current,
                  annualChangeRate: -clamp(value),
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

export default VehicleAccountFields;
