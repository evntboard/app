import {PrismaClient} from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient
}

let prisma: PrismaClient

if (process.env.NODE_ENV === "production") {
  // @ts-ignore
  prisma = new PrismaClient().$extends({
    query: {
      user: {
        async create({ args, query }) {
          if (!args.data.name || args.data.name === "") {
            args.data = {...args.data, name: `user-${Math.random()}`}
          }
          return query(args)
        },
      },
    },
  })

} else {
  if (!global.cachedPrisma) {
    // @ts-ignore
    global.cachedPrisma = new PrismaClient().$extends({
      query: {
        user: {
          async create({ args, query }) {
            if (!args.data.name || args.data.name === "") {
              args.data = {...args.data, name: `user-${Math.random()}`}
            }
            return query(args)
          },
        },
      },
    })
  }
  prisma = global.cachedPrisma
}


export const db = prisma