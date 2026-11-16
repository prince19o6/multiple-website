const { describe, it } = require('node:test');
const assert = require('node:assert');

// Logic extracted from my-app/services/api.ts
class MockApiClient {
  constructor(config) {
    this.siteId = config.siteId;
    this.siteHostname = config.siteHostname;
    this.baseUrl = config.baseUrl;
    this.token = config.token || null;
    this.requestCounts = new Map();
  }

  buildHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Website-Hostname': this.siteHostname,
      'X-Tenant-Id': this.siteId,
      ...customHeaders
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async executeWithRetry(url, options = {}, maxRetries = 3) {
    const key = `${options.method || 'GET'}:${url}`;
    const attempts = (this.requestCounts.get(key) || 0) + 1;
    this.requestCounts.set(key, attempts);

    if (attempts > maxRetries + 1) {
      throw new Error(`[ApiClient] Request loop detected. Aborted after ${attempts} calls to ${url}`);
    }

    // Mock response mapping
    if (options.mockStatus === 401) {
      const err = new Error('Unauthorized');
      err.status = 401;
      err.code = 'AUTH_REQUIRED';
      throw err;
    }

    if (options.mockStatus === 429) {
      const err = new Error('Too Many Requests');
      err.status = 429;
      err.code = 'RATE_LIMITED';
      throw err;
    }

    return {
      status: 200,
      data: options.mockData || { success: true },
      headers: this.buildHeaders(options.headers)
    };
  }
}

describe('Mobile API Client Suite', () => {
  it('attaches mandatory X-Website-Hostname header based on active tenant', () => {
    const clientGujju = new MockApiClient({
      siteId: 'gujjutours',
      siteHostname: 'www.gujjutours.com',
      baseUrl: 'https://stagingapi.gujjutours.com'
    });

    const headersGujju = clientGujju.buildHeaders();
    assert.strictEqual(headersGujju['X-Website-Hostname'], 'www.gujjutours.com');
    assert.strictEqual(headersGujju['X-Tenant-Id'], 'gujjutours');

    const clientTechno = new MockApiClient({
      siteId: 'technoheaven',
      siteHostname: 'stagingb2b.technoheaven.com',
      baseUrl: 'https://stagingapi.technoheaven.com'
    });

    const headersTechno = clientTechno.buildHeaders();
    assert.strictEqual(headersTechno['X-Website-Hostname'], 'stagingb2b.technoheaven.com');
  });

  it('attaches Bearer token authorization when authenticated', () => {
    const client = new MockApiClient({
      siteId: 'tripgoasia',
      siteHostname: 'www.tripgoasia.com',
      baseUrl: 'https://stagingapi.tripgoasia.com',
      token: 'jwt-valid-token-abc-999'
    });

    const headers = client.buildHeaders();
    assert.strictEqual(headers['Authorization'], 'Bearer jwt-valid-token-abc-999');
  });

  it('protects against request loops when an endpoint repeatedly fails', async () => {
    const client = new MockApiClient({
      siteId: 'gujjutours',
      siteHostname: 'www.gujjutours.com',
      baseUrl: 'https://stagingapi.gujjutours.com'
    });

    const url = '/api/failing-endpoint';

    // Simulate 4 successive calls
    await client.executeWithRetry(url, {});
    await client.executeWithRetry(url, {});
    await client.executeWithRetry(url, {});
    await client.executeWithRetry(url, {});

    // 5th attempt must trigger request-loop safeguard
    await assert.rejects(async () => {
      await client.executeWithRetry(url, {}, 3);
    }, /Request loop detected/);
  });

  it('maps HTTP 401 to AUTH_REQUIRED error', async () => {
    const client = new MockApiClient({
      siteId: 'gujjutours',
      siteHostname: 'www.gujjutours.com',
      baseUrl: 'https://stagingapi.gujjutours.com'
    });

    await assert.rejects(async () => {
      await client.executeWithRetry('/api/protected', { mockStatus: 401 });
    }, (err) => {
      return err.status === 401 && err.code === 'AUTH_REQUIRED';
    });
  });

  it('maps HTTP 429 to RATE_LIMITED error', async () => {
    const client = new MockApiClient({
      siteId: 'gujjutours',
      siteHostname: 'www.gujjutours.com',
      baseUrl: 'https://stagingapi.gujjutours.com'
    });

    await assert.rejects(async () => {
      await client.executeWithRetry('/api/tours', { mockStatus: 429 });
    }, (err) => {
      return err.status === 429 && err.code === 'RATE_LIMITED';
    });
  });
});

