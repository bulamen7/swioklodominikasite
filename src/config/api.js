import { supabase } from './supabase';

// Helper to get auth headers for API calls
export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// Authenticated fetch wrapper
export async function authFetch(url, options = {}) {
  const headers = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
}
