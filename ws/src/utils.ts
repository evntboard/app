export const generateStorageKey = (organizationId: string) => {
  return `organization:${organizationId}:storage`
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
