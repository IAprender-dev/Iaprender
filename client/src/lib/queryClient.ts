import { QueryClient, QueryFunction } from '@tanstack/react-query';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type QueryFnOptions = { on401?: 'throw' | 'returnNull' };

// Criar uma função fetch limpa para evitar qualquer interferência
const safeFetch = (url: string, options: any) => {
  // Usar fetch nativo do browser de forma explícita
  const originalFetch = window.fetch;
  console.log('🔥 SafeFetch chamado:', { url, options });
  return originalFetch.call(window, url, options);
};

export const apiRequest = async (
  method: HttpMethod, 
  endpoint: string, 
  data?: any, 
  options: RequestInit = {}
) => {
  // Construir request de forma muito explícita
  const requestInit: RequestInit = {};
  requestInit.method = method;
  requestInit.credentials = 'include';
  requestInit.headers = new Headers();
  
  if (method !== 'GET') {
    (requestInit.headers as Headers).set('Content-Type', 'application/json');
  }
  
  if (data && method !== 'GET') {
    requestInit.body = JSON.stringify(data);
  }
  
  if (options.signal) {
    requestInit.signal = options.signal;
  }

  console.log('🎯 Final request:', { 
    endpoint, 
    method,
    requestInit: {
      method: requestInit.method,
      credentials: requestInit.credentials,
      headers: requestInit.headers,
      body: requestInit.body,
      signal: !!requestInit.signal
    }
  });
  
  try {
    return await safeFetch(endpoint, requestInit);
  } catch (error) {
    console.error('🚨 SafeFetch error:', error);
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