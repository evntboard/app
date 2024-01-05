import {JSONRPCClient} from "json-rpc-2.0";
import {WebSocket} from 'ws'

export const clients: Map<string, {
  ws: WebSocket
  rpc: JSONRPCClient
}> = new Map()
