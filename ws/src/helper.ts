export const DATA_EVENTS = 'events'

export const gKeyOrgaEvent = (organizationId: string, eventId: string): string => {
  return `organization:${organizationId}:event:${eventId}`
}

export const gKeyOrgaEventTriggerProcess = (organizationId: string, eventId: string, triggerId: string): string => {
  return `organization:${organizationId}:event:${eventId}:trigger:${triggerId}:process`
}

export const gKeyOrgaEventTriggerLog = (organizationId: string, eventId: string, triggerId: string): string => {
  return `organization:${organizationId}:event:${eventId}:trigger:${triggerId}:log`
}

export const gKeyOrgaModules = (organizationId: string): string => {
  return `organization:${organizationId}:modules`
}

export const gKeyOrgaStorage = (organizationId: string): string => {
  return `organization:${organizationId}:storage`
}

export const gChOrgaEvents = (organizationId: string): string => {
  return `ch:organization:${organizationId}:events`
}

export const gChOrgaStorage = (organizationId: string): string => {
  return `ch:organization:${organizationId}:storage`
}

export const gChOrgaModule = (organizationId: string, sessionId: string): string => {
  return `organization:${organizationId}:module:${sessionId}`
}

export const gChOrgaModuleRequest = (organizationId: string, sessionId: string, requestId: string): string => {
  return `organization:${organizationId}:module:${sessionId}:${requestId}`
}

export const gChOrgaModuleEject = (organizationId: string, sessionId: string): string => {
  return `ch:organization:${organizationId}:module-eject:${sessionId}`
}