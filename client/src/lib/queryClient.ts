import { QueryClient } from '@tanstack/react-query';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type QueryFnOptions = { on401?: 'throw' | 'returnNull' };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const apiRequest = async (
  method: HttpMethod, 
  endpoint: string, 
  data?: any, 
  options: RequestInit = {}
) => {
  const url = endpoint.startsWith('http') ? endpoint : endpoint;
  const opts: RequestInit = {
    method,
    headers: {
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    credentials: 'include', // Para enviar cookies com a requisição
    ...(data && method !== 'GET' ? { body: JSON.stringify(data) } : {}),
    ...options,
  };

  return fetch(url, opts);
};

export const getQueryFn = (options: QueryFnOptions = {}) => async ({ 
  queryKey, 
  signal 
}: { 
  queryKey: any[], 
  signal?: AbortSignal 
}) => {
  const [endpoint] = queryKey;
  
  try {
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
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    // Ignorar erros de cancelamento
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request aborted', queryKey);
      return null;
    }
    throw error;
  }
};