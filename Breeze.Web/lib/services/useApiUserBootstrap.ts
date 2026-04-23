import useGraphql from './useGraphql';

import { ApiUser } from '@/app/planner/types/apiAsset';

export interface CreateApiUserInput {
  identityProviderId: string;
  email: string;
  returnType: 'REAL' | 'NOMINAL';
  safeWithdrawalRate: string;
  currencyType: string;
  inflationRate: string;
  deductionType: 'STANDARD' | 'ITEMIZED';
  deductionAmount?: string | null;
  filingStatus: 'SINGLE' | 'MFJ' | 'MFS' | 'HOH';
  payoffStrategy: 'AVALANCHE' | 'SNOWBALL';
}

interface CurrentApiUserPayload {
  me: ApiUser | null;
}

interface CreateUserPayload {
  createUser: ApiUser;
}

interface CreateUserVariables {
  input: CreateApiUserInput;
}

const CURRENT_API_USER_QUERY = `
  query CurrentApiUser {
    me {
      id
      identityProviderId
      email
    }
  }
`;

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      identityProviderId
      email
    }
  }
`;

const useApiUserBootstrap = () => {
  const { request } = useGraphql();

  const getCurrentApiUser = async (): Promise<ApiUser | null> => {
    const payload = await request<CurrentApiUserPayload>(CURRENT_API_USER_QUERY);
    return payload.me;
  };

  const createApiUser = async (input: CreateApiUserInput): Promise<ApiUser> => {
    const payload = await request<CreateUserPayload, CreateUserVariables>(CREATE_USER_MUTATION, {
      input,
    });

    return payload.createUser;
  };

  return {
    getCurrentApiUser,
    createApiUser,
  };
};

export default useApiUserBootstrap;