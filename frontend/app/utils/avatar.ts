import { OrganizationsResponse, UsersResponse } from '~/types/pocketbase'

export const getAvatarUrl = (entity: OrganizationsResponse | UsersResponse | undefined) => {
  if (entity === undefined) {
    return undefined
  }

  if (entity.avatar === "") {
    return undefined
  }

  if (import.meta.env.PROD) {
    return `/api/files/${entity.collectionName}/${entity.id}/${entity.avatar}`
  } else {
    return `http://localhost:8090/api/files/${entity.collectionName}/${entity.id}/${entity.avatar}`
  }
}