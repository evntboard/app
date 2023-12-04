export const generatePersistentStorageKey = (organizationId: string) => {
  return `organization:${organizationId}:storage:persistent`
}

export const generateTemporaryStorageKey = (organizationId: string) => {
  return `organization:${organizationId}:storage:temporary`
}

export const generateModulesKey = (organizationId: string) => {
  return `organization:${organizationId}:modules`
}

export const generateModuleKeyChannel = (organizationId: string, clientId: string) => {
  return `organization:${organizationId}:module:${clientId}`
}

export const generateModuleKeyChannelEject = (organizationId: string, clientId: string) => {
  return `organization:${organizationId}:module-eject:${clientId}`
}

export const generateModuleKeyResponseChannel = (organizationId: string, clientId: string, requestId: string) => {
  return `${generateModuleKeyChannel(organizationId, clientId)}:${requestId}`
}
