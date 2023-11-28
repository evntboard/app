export const generateModulesKey = (organizationId) => {
  return `organization:${organizationId}:modules`
}

export const generateModuleKeyChannel = (organizationId, clientId) => {
  return `organization:${organizationId}:module:${clientId}`
}

export const generateModuleKeyResponseChannel = (organizationId, clientId, requestId) => {
  return `${generateModuleKeyChannel(organizationId, clientId)}:${requestId}`
}
