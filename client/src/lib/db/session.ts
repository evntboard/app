import {db} from "@/lib/db";
import {redis} from "@/lib/redis";
import {gKeyOrgaModules} from "@/lib/helper";

export async function getSessionsForOrganizationId(organizationId: string) {

  const keysProcess = await redis.hgetall(gKeyOrgaModules(organizationId))

  return await Promise.all(
    Object.entries(keysProcess).map(async ([sessionId, codeName]) => {
      const [code, name] = codeName.split(':')
      const moduleData = await db.module.findFirst({
        select: {
          id: true,
          name: true,
          code: true,
        },
        where: {
          organizationId,
          name,
          code
        }
      })

      return {
        sessionId,
        ...moduleData
      }
    })
  )
}