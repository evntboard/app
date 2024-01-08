import process from "node:process";
import {PrismaClient} from "@prisma/client"
import * as nats from "nats";

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
  var nc: undefined | ReturnType<typeof natsClientSingleton>
}

const prismaClientSingleton = () => {
  return new PrismaClient()
}

const natsClientSingleton = () => {
  return nats.connect({
    servers: [
      process.env.NATS_URL ?? 'localhost:4222'
    ]
  })
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()
export const nc = globalThis.nc ?? natsClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
if (process.env.NODE_ENV !== 'production') globalThis.nc = nc