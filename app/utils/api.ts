type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}

export async function callApi(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(endpoint, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(`API call failed: ${response.statusText}. ${errorResponse.error || ""}`);
  }

  return response.json();
}