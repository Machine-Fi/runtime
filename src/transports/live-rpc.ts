export interface JsonRpcRequest { jsonrpc: '2.0'; id: number; method: string; params: unknown[]; }
export interface RpcTransport { request<T>(method: string, params?: unknown[]): Promise<T>; }
interface JsonRpcError { code?: number; message?: string; data?: unknown; }
interface JsonRpcResponse<T> { result?: T; error?: JsonRpcError; }
export class LiveRpcTransport implements RpcTransport {
  constructor(readonly rpcUrl: string, readonly timeoutMs = 12000) {}
  async request<T>(method: string, params: unknown[] = []): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params } satisfies JsonRpcRequest), signal: controller.signal });
      const body = await res.json() as JsonRpcResponse<T>;
      if (!res.ok || body.error) throw new Error(body.error?.message ?? `RPC ${res.status}`);
      if (!('result' in body)) throw new Error('malformed JSON-RPC response');
      return body.result as T;
    } finally { clearTimeout(timer); }
  }
}
