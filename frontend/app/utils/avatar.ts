import { OrganizationsResponse, UsersResponse } from '~/types/pocketbase'

export const getAvatarUrl = (pocketbaseUrl: string, entity: OrganizationsResponse | UsersResponse | undefined) => {
  if (entity === undefined) {
    return undefined
  }

  if (entity.avatar === "") {
    return undefined
  }

  return `${pocketbaseUrl}/api/files/${entity.collectionName}/${entity.id}/${entity.avatar}`
}