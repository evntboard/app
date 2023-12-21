import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {prisma} from '../prisma'
import {sessionRegisterSchema} from '../schema'
import {clients} from '../sessions'

export const sessionRegister: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
  if (!clients.has(clientId)) {
    throw new JSONRPCErrorException(
      'Unknown client',
      213,
      "Unknown client"
    )
  }

  const client = clients.get(clientId)

  if (!client) {
    throw new JSONRPCErrorException(
      'Unknown client',
      213,
      "Unknown client"
    )
  }

  const params = sessionRegisterSchema.safeParse(rawParams)

  if (params.success === false) {
    client?.ws?.close?.()
    throw new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  const module = await prisma.module.findFirst({
    select: {
      id: true,
      organizationId: true,
      params: {
        select: {
          key: true,
          value: true
        }
      }
    },
    where: {
      code: params.data.code,
      name: params.data.name,
      token: params.data.token
    }
  })

  if (!module) {
    client?.ws?.close?.()
    throw new JSONRPCErrorException(
      'Unknown Module',
      12,
      'Unknown Module'
    )
  }

  const keyExist = await prisma.moduleSession.count({
    where: {
      OR: [
        {id: clientId},
        {
          module: {
            name: params.data.name,
            code: params.data.code,
            organizationId: module.organizationId
          }
        }
      ]
    }
  })

  if (keyExist) {
    client?.ws?.close?.()
    throw new JSONRPCErrorException(
      'Module already connected',
      12,
      'Module already connected'
    )
  }

  console.log(`REGISTER MODULE ${params.data.code}:${params.data.name}`)

  await prisma.moduleSession.create({
    data: {
      id: clientId,
      moduleId: module.id,
      subs: params.data.subs ?? [],
      lastMessage: new Date()
    }
  })

  // TODO PUBLISH NEW SESSION nc?.publish()

  return module.params
}
