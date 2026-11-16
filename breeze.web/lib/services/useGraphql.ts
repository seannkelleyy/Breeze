'use client';
import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { print } from 'graphql';
import axios from 'axios';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

interface GraphQLErrorItem {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLErrorItem[];
}

/** Throws an error, preserving Axios errors as-is and wrapping others. */
const toError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    return error;
  }
  return new Error('Unexpected error sending GraphQL request');
};

const useGraphql = () => {
  const { getToken } = useAuth();

  return useMemo(() => {
    const axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
    });

    axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    const request = async <TData, TVariables = Record<string, unknown>>(
      query: TypedDocumentNode<TData, TVariables>,
      variables?: TVariables,
    ): Promise<TData> => {
      let response;
      try {
        response = await axiosInstance.post<GraphQLResponse<TData>>('query', {
          query: print(query),
          variables,
        });
      } catch (error) {
        throw toError(error);
      }

      if (response.data.errors && response.data.errors.length > 0) {
        throw new Error(response.data.errors.map((item) => item.message).join('; '));
      }

      if (response.data.data === undefined) {
        throw new Error('GraphQL response did not include data');
      }

      return response.data.data;
    };

    return { request };
  }, [getToken]);
};

export default useGraphql;
