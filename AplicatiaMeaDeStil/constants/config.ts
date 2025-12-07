// Backend configuration
export const API_BASE_URL = 'http://localhost:5000';

export function backendInfo(): string { 
  return `API Base URL: ${API_BASE_URL}`; 
}
