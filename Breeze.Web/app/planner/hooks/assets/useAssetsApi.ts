import useGraphql from '@/lib/services/useGraphql';

import { ApiAsset, CreateApiAssetInput, UpdateApiAssetInput } from '../../types/apiAsset';

interface AssetsPayload {
  assets: ApiAsset[];
}

interface AssetsVariables {
  userId: string;
}

interface CreateAssetPayload {
  createAsset: ApiAsset;
}

interface CreateAssetVariables {
  input: CreateApiAssetInput;
}

interface UpdateAssetPayload {
  updateAsset: ApiAsset;
}

interface UpdateAssetVariables {
  input: UpdateApiAssetInput;
}

interface DeleteAssetPayload {
  deleteAsset: boolean;
}

interface DeleteAssetVariables {
  id: string;
}

const ASSETS_QUERY = `
  query Assets($userId: ID!) {
    assets(userId: $userId) {
      id
      userId
      name
      assetType
      currentValue
      lastValueUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

const CREATE_ASSET_MUTATION = `
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      id
      userId
      name
      assetType
      currentValue
      lastValueUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_ASSET_MUTATION = `
  mutation UpdateAsset($input: UpdateAssetInput!) {
    updateAsset(input: $input) {
      id
      userId
      name
      assetType
      currentValue
      lastValueUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

const DELETE_ASSET_MUTATION = `
  mutation DeleteAsset($id: ID!) {
    deleteAsset(id: $id)
  }
`;

const useAssetsApi = () => {
  const { request } = useGraphql();

  const getAssets = async (userId: string): Promise<ApiAsset[]> => {
    const payload = await request<AssetsPayload, AssetsVariables>(ASSETS_QUERY, {
      userId,
    });

    return payload.assets;
  };

  const createAsset = async (input: CreateApiAssetInput): Promise<ApiAsset> => {
    const payload = await request<CreateAssetPayload, CreateAssetVariables>(CREATE_ASSET_MUTATION, {
      input,
    });

    return payload.createAsset;
  };

  const updateAsset = async (input: UpdateApiAssetInput): Promise<ApiAsset> => {
    const payload = await request<UpdateAssetPayload, UpdateAssetVariables>(UPDATE_ASSET_MUTATION, {
      input,
    });

    return payload.updateAsset;
  };

  const deleteAsset = async (id: string): Promise<boolean> => {
    const payload = await request<DeleteAssetPayload, DeleteAssetVariables>(DELETE_ASSET_MUTATION, {
      id,
    });

    return payload.deleteAsset;
  };

  return {
    getAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  };
};

export default useAssetsApi;
