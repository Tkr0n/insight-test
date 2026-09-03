import { afterEach, describe, expect, it, vi } from 'vitest';

describe('apiClient baseURL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to /api when VITE_API_URL is unset', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.resetModules();
    const { apiClient } = await import('../axios-client');
    expect(apiClient.defaults.baseURL).toBe('/api');
  });

  it('uses VITE_API_URL when set', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.insight.verkku.com/api');
    vi.resetModules();
    const { apiClient } = await import('../axios-client');
    expect(apiClient.defaults.baseURL).toBe('https://api.insight.verkku.com/api');
  });
});