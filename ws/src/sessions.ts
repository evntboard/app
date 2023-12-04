import {JSONRPCClient} from "json-rpc-2.0";
import { WebSocket } from 'ws'

export const clients : Map<string, {
  ws: WebSocket
  rpc: JSONRPCClient
  organizationId: string | undefined
  code: string | undefined
  name: string | undefined
}> = new Map()
// string ID : { ws: socket, rpc: client, organizationId: XX, code: XX, name: XX }
