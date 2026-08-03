import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

/** Throws an error, preserving Axios errors as-is and wrapping others. */
const toError = (error: unknown, context?: string): Error => {
  if (axios.isAxiosError(error)) {
    return error;
  }
  return new Error(context ? `Unexpected error in ${context}` : 'An unexpected error occurred');
};

const useHttp = () => {
  const { getToken } = useAuth();

  return useMemo(() => {
    const axiosInstance = axios.create({
      baseURL:
        process.env.NODE_ENV === 'production'
          ? process.env.NEXT_PUBLIC_HOSTED_API
          : process.env.NEXT_PUBLIC_LOCAL_API,
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

    const getOne = async <T>(relativeUri: string): Promise<T> => {
      try {
        return (await axiosInstance.get<T>(relativeUri)).data as T;
      } catch (error) {
        throw toError(error, 'getOne');
      }
    };

    const getMany = async <T>(relativeUri: string): Promise<T[]> => {
      try {
        return (await axiosInstance.get<T[]>(relativeUri)).data;
      } catch (error) {
        throw toError(error, 'getMany');
      }
    };

    const getManyArray = async <T>(relativeUri: string): Promise<T[][]> => {
      try {
        return (await axiosInstance.get<T[][]>(relativeUri)).data;
      } catch (error) {
        throw toError(error, 'getManyArray');
      }
    };

    const getManyHeader = async <T>(
      relativeUri: string,
    ): Promise<{ data: T[]; headers: unknown }> => {
      try {
        const response = await axiosInstance.get<T[]>(relativeUri);
        return { data: response.data, headers: response.headers };
      } catch (error) {
        throw toError(error, 'getManyHeader');
      }
    };

    const post = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
      try {
        return (await axiosInstance.post<T>(relativeUri, rq)).data as T;
      } catch (error) {
        throw toError(error, 'post');
      }
    };

    const patch = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
      try {
        return (await axiosInstance.patch<T>(relativeUri, rq)).data;
      } catch (error) {
        throw toError(error, 'patch');
      }
    };

    const put = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
      try {
        return (await axiosInstance.put<T>(relativeUri, rq)).data;
      } catch (error) {
        throw toError(error, 'put');
      }
    };

    const deleteOne = async <T>(relativeUri: string): Promise<void> => {
      try {
        await axiosInstance.delete<T>(relativeUri);
      } catch (error) {
        throw toError(error, 'deleteOne');
      }
    };

    return {
      getOne,
      getMany,
      getManyArray,
      getManyHeader,
      post,
      patch,
      put,
      deleteOne,
    };
  }, [getToken]);
};

export default useHttp;
