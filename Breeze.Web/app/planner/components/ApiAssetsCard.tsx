'use client';

import { useMemo, useState } from 'react';

import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

import {
  useApiUser,
  useCreateAsset,
  useDeleteAsset,
  useFetchAssets,
  useUpdateAsset,
} from '../hooks/assets';
import { ApiAsset, ApiAssetType } from '../types/apiAsset';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

const assetTypeOptions: Array<{ value: ApiAssetType; label: string }> = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund' },
  { value: 'BROKERAGE', label: 'Brokerage' },
  { value: '_401K', label: '401(k)' },
  { value: '_403B', label: '403(b)' },
  { value: '_457', label: '457' },
  { value: 'ROTH_IRA', label: 'Roth IRA' },
  { value: 'TRADITIONAL_IRA', label: 'Traditional IRA' },
  { value: 'HSA', label: 'HSA' },
  { value: 'HOME', label: 'Home / Real Estate' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'OTHER', label: 'Other' },
];

interface EditableAssetValues {
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
}

const ApiAssetsCard = () => {
  const {
    user,
    isLoaded,
    isSignedIn,
    currencyCode,
    returnDisplayMode,
    inflationRate,
    safeWithdrawalRate,
  } = useCurrentUser();

  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<ApiAssetType>('BROKERAGE');
  const [newAssetValue, setNewAssetValue] = useState('0.00');
  const [editByAssetId, setEditByAssetId] = useState<Record<string, EditableAssetValues>>({});

  const apiUserQuery = useApiUser({
    identityProviderId: user?.id ?? '',
    email: user?.primaryEmailAddress?.emailAddress ?? '',
    currencyCode,
    returnDisplayMode,
    inflationRate,
    safeWithdrawalRate,
    enabled: isLoaded && isSignedIn,
  });

  const apiUserId = apiUserQuery.data?.id;

  const assetsQuery = useFetchAssets({
    userId: apiUserId,
    enabled: Boolean(apiUserId),
  });

  const createAssetMutation = useCreateAsset({ userId: apiUserId });
  const updateAssetMutation = useUpdateAsset({ userId: apiUserId });
  const deleteAssetMutation = useDeleteAsset({ userId: apiUserId });

  const isBusy =
    apiUserQuery.isLoading ||
    assetsQuery.isLoading ||
    createAssetMutation.isPending ||
    updateAssetMutation.isPending ||
    deleteAssetMutation.isPending;

  const sortedAssets = useMemo(() => {
    const assets = assetsQuery.data ?? [];
    return [...assets].sort((a, b) => a.name.localeCompare(b.name));
  }, [assetsQuery.data]);

  const getEditableAsset = (asset: ApiAsset): EditableAssetValues =>
    editByAssetId[asset.id] ?? {
      name: asset.name,
      assetType: asset.assetType,
      currentValue: asset.currentValue,
    };

  const onCreateAsset = async () => {
    if (!apiUserId || !newAssetName.trim()) {
      return;
    }

    await createAssetMutation.mutateAsync({
      userId: apiUserId,
      name: newAssetName.trim(),
      assetType: newAssetType,
      currentValue: newAssetValue,
      owner: 'self',
      contributionMode: 'monthly',
      contributionValue: '0',
      employerMatchRate: '0',
      employerMatchMaxPercentOfSalary: '0',
      annualRate: '0',
    });

    setNewAssetName('');
    setNewAssetType('BROKERAGE');
    setNewAssetValue('0.00');
  };

  const onSaveAsset = async (assetId: string, values: EditableAssetValues) => {
    await updateAssetMutation.mutateAsync({
      id: assetId,
      name: values.name.trim(),
      assetType: values.assetType,
      currentValue: values.currentValue,
      owner: 'self',
      contributionMode: 'monthly',
      contributionValue: '0',
      employerMatchRate: '0',
      employerMatchMaxPercentOfSalary: '0',
      annualRate: '0',
    });

    setEditByAssetId((current) => {
      const next = { ...current };
      delete next[assetId];
      return next;
    });
  };

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Assets</CardTitle>
          <CardDescription>Sign in to sync assets with the API backend.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Assets</CardTitle>
        <CardDescription>
          Backend-synced asset CRUD using the new GraphQL Asset API slice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiUserQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Resolving API user...</p>
        ) : null}

        {apiUserQuery.error ? (
          <p className="text-destructive text-sm">{apiUserQuery.error.message}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Asset Name</Label>
            <Input
              placeholder="Brokerage Account"
              value={newAssetName}
              onChange={(event) => setNewAssetName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Asset Type</Label>
            <Select
              value={newAssetType}
              onValueChange={(value) => setNewAssetType(value as ApiAssetType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Current Value</Label>
            <Input
              value={newAssetValue}
              onChange={(event) => setNewAssetValue(event.target.value)}
              placeholder="125000.55"
            />
          </div>
          <div className="md:col-span-4">
            <Button
              type="button"
              onClick={() => void onCreateAsset()}
              disabled={!apiUserId || !newAssetName.trim() || createAssetMutation.isPending}
            >
              {createAssetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" /> Add Asset
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {assetsQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading assets...</p>
          ) : null}

          {assetsQuery.error ? (
            <p className="text-destructive text-sm">{assetsQuery.error.message}</p>
          ) : null}

          {!assetsQuery.isLoading && sortedAssets.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No assets yet. Add your first asset above.
            </p>
          ) : null}

          {sortedAssets.map((asset) => {
            const editable = getEditableAsset(asset);

            return (
              <div
                key={asset.id}
                className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-12"
              >
                <div className="space-y-2 md:col-span-4">
                  <Label>Name</Label>
                  <Input
                    value={editable.name}
                    onChange={(event) =>
                      setEditByAssetId((current) => ({
                        ...current,
                        [asset.id]: {
                          ...editable,
                          name: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Type</Label>
                  <Select
                    value={editable.assetType}
                    onValueChange={(value) =>
                      setEditByAssetId((current) => ({
                        ...current,
                        [asset.id]: {
                          ...editable,
                          assetType: value as ApiAssetType,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Current Value</Label>
                  <Input
                    value={editable.currentValue}
                    onChange={(event) =>
                      setEditByAssetId((current) => ({
                        ...current,
                        [asset.id]: {
                          ...editable,
                          currentValue: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-end gap-2 md:col-span-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void onSaveAsset(asset.id, editable)}
                    disabled={updateAssetMutation.isPending || !editable.name.trim()}
                  >
                    <Save className="mr-2 size-4" /> Save
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteAssetMutation.mutate(asset.id)}
                    disabled={deleteAssetMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {isBusy ? <p className="text-muted-foreground text-xs">Syncing with API...</p> : null}
      </CardContent>
    </Card>
  );
};

export default ApiAssetsCard;
