export const DATA_EVENTS = 'events'

export const gChOrgaEvents = (organizationId: string): string => {
  return `organization.${organizationId}.events`
}

export const gChOrgaEvent = (organizationId: string, eventId: string): string => {
  return `organization.${organizationId}.event.${eventId}`
}

export const gChOrgaStorage = (organizationId: string): string => {
  return `organization.${organizationId}.storage`
}

export const gChOrgaModule = (organizationId: string, sessionId: string): string => {
  return `organization.${organizationId}.module.${sessionId}`
}

export const gChOrgaModuleEject = (organizationId: string, sessionId: string): string => {
  return `organization.${organizationId}.module-eject.${sessionId}`
}


