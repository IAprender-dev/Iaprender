import { QueryClient, QueryFunction } from '@tanstack/react-query';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type QueryFnOptions = { on401?: 'throw' | 'returnNull' };

export const apiRequest = async (
  method: HttpMethod, 
  endpoint: string, 
  data?: any, 
  options: RequestInit = {}
) => {
  const requestConfig: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  };
  
  if (data && method !== 'GET') {
    requestConfig.body = JSON.stringify(data);
  }
  
  console.log('🎯 API Request:', { method, endpoint, data });
  
  try {
    const response = await fetch(endpoint, requestConfig);
    return response;
  } catch (error) {
    console.error('🚨 API Request error:', error);
    throw error;
  }
};

export const getQueryFn = (options: QueryFnOptions = {}): QueryFunction => async (context) => {
  const { queryKey, signal } = context;
  const endpoint = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  
  console.log('getQueryFn called with:', { queryKey, endpoint, signal });
  
  if (typeof endpoint !== 'string') {
    console.error('Query key error:', { queryKey, endpoint, type: typeof endpoint });
    throw new Error('Query key must start with a string endpoint');
  }
  
  try {
    console.log('Calling apiRequest with:', { method: 'GET', endpoint });
    const response = await apiRequest(
      'GET', 
      endpoint, 
      undefined, 
      { signal }
    );
    
    if (!response.ok) {
      if (response.status === 401 && options.on401 === 'returnNull') {
        return null;
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`${response.status}: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request aborted', queryKey);
      return null;
    }
    throw error;
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});