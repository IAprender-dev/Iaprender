import { QueryClient, QueryFunction } from '@tanstack/react-query';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type QueryFnOptions = { on401?: 'throw' | 'returnNull' };

export const apiRequest = async (
  method: HttpMethod, 
  endpoint: string, 
  data?: any, 
  options: RequestInit = {}
) => {
  // Criar URL e opções de forma mais explícita
  const url = endpoint;
  const requestOptions = {
    method,
    credentials: 'include' as RequestCredentials,
    headers: {} as Record<string, string>,
  };
  
  // Adicionar Content-Type apenas para requests que não são GET
  if (method !== 'GET') {
    requestOptions.headers['Content-Type'] = 'application/json';
  }
  
  // Adicionar body apenas se tiver data e não for GET
  if (data && method !== 'GET') {
    (requestOptions as any).body = JSON.stringify(data);
  }
  
  // Adicionar signal se fornecido
  if (options.signal) {
    (requestOptions as any).signal = options.signal;
  }

  console.log('🚀 Request details:', { url, method, options: requestOptions });
  
  return window.fetch(url, requestOptions);
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