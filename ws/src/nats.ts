import * as process from 'node:process'
import * as nats from 'nats'

export let nc: nats.NatsConnection | undefined

export const initNc = async () => {
  nc = await nats.connect({
    servers: [
      process.env.NATS_URL ?? 'localhost:4222'
    ]
  })
  console.log(`Connected to NATS "${nc.getServer()}"`)
}