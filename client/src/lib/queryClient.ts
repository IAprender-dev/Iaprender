import { QueryClient, QueryFunction } from '@tanstack/react-query';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type QueryFnOptions = { on401?: 'throw' | 'returnNull' };

export const apiRequest = async (
  endpoint: string,
  options: { method?: HttpMethod; body?: any } = {}
) => {
  const { method = 'GET', body } = options;
  
  const opts: RequestInit = {
    method,
    headers: {
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    },
    credentials: 'include',
    ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(endpoint, opts);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`${response.status}: ${errorText}`);
  }
  
  return response.json();
};

export const getQueryFn = (options: QueryFnOptions = {}): QueryFunction => async (context) => {
  const { queryKey, signal } = context;
  const [endpoint] = queryKey;
  
  if (typeof endpoint !== 'string') {
    throw new Error('Query key must start with a string endpoint');
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
      signal
    });
    
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