import { ROBINHOOD_PUBLIC_RPC } from './chain.js';
import { LiveRpcTransport, type RpcTransport } from '../../transports/live-rpc.js';
export interface RobinhoodProviderOptions { rpcUrl?: string | undefined; timeoutMs?: number | undefined; transport?: RpcTransport | undefined; }
export function robinhoodRpcUrl(env: NodeJS.ProcessEnv = process.env): string { return env.MACHINEFI_ROBINHOOD_RPC_URL || ROBINHOOD_PUBLIC_RPC; }
export function createRobinhoodTransport(options: RobinhoodProviderOptions = {}): RpcTransport { return options.transport ?? new LiveRpcTransport(options.rpcUrl ?? robinhoodRpcUrl(), options.timeoutMs); }
