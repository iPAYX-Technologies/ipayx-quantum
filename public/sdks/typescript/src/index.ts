/**
 * iPayX Protocol TypeScript SDK
 * Official client for interacting with iPayX API
 */

export interface QuoteRequest {
  from: string;
  to: string;
  amount: number;
  kyc?: boolean;
}

export interface QuoteResponse {
  routes: Array<{
    rail: string;
    score: number;
    feePct: number;
    etaMin: number;
    quoteFX: number;
    oracleFX: number;
    fxSpread: number;
    liq: number;
    vol: number;
    status: string;
  }>;
  corridor: string;
  amount: number;
}

export interface ExecuteRequest {
  routeId: string;
  sourceAccount: string;
  destAccount: string;
  amount: number;
}

export interface ExecuteResponse {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedCompletionTime: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  from: string;
  to: string;
  createdAt: string;
  completedAt?: string;
  txHash?: string;
}

export interface MetricsResponse {
  totalVolume24h: number;
  totalTransactions24h: number;
  averageFee: number;
  averageEta: number;
  activeCorridors: number;
}

export class IpayxClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.ipayx.ai') {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`iPayX API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Get a quote for a cross-border payment
   */
  async quote(request: QuoteRequest): Promise<QuoteResponse> {
    return this.request<QuoteResponse>('/v1/quotes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Execute a payment using a selected route
   */
  async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    return this.request<ExecuteResponse>('/v1/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get payment status by ID
   */
  async getPayment(paymentId: string): Promise<PaymentStatus> {
    return this.request<PaymentStatus>(`/v1/payments/${paymentId}`, {
      method: 'GET',
    });
  }

  /**
   * Get platform metrics
   */
  async metrics(): Promise<MetricsResponse> {
    return this.request<MetricsResponse>('/v1/metrics', {
      method: 'GET',
    });
  }

  /**
   * Check API health status
   */
  async status(): Promise<{ status: string; uptime: number; version: string }> {
    return this.request('/status', {
      method: 'GET',
    });
  }
}

export default IpayxClient;
