# Redis

## storage
  - `events` LIST of string shaped like `organization:${organizationId}:event:${eventId}`, event server pop an element and process it
  - `organization:${organizationId}:storage` HSET string key, JSON value
  - `organization:${organizationId}:modules` HSET key sessionId value `${moduleCode}:${moduleName}`
  - `organization:${organizationId}:event:${eventId}` STRING of event data in JSON
  - `organization:${organizationId}:event:${eventId}:trigger:${triggerId}:log` LIST of string
  - `organization:${organizationId}:event:${eventId}:trigger:${triggerId}:process` HSET with 
    - start DATE RFC3339 if empty processing not started
    - end DATE RFC3339 if empty processing not finished
    - error STRING empty if no error 
    - exec BOOLEAN reaction executed or not

## channel
  - `ch:organization:${organizationId}:storage` this channel receive JSON key value when a storage var is updated
  - `ch:organization:${organizationId}:events` this channel receive text `organization:${organizationId}:event:${eventId}` who is a redis key to get event data
  - `ch:organization:${organizationId}:module-eject:${sessionId}` this channel receive empty message, if WS server receive that and have this sessionId it just close connexion
  - `ch:organization:${organizationId}:module:${sessionId}` this channel receive empty message, if WS server receive that and have this sessionId it just close connexion
  - `ch:organization:${organizationId}:module:${sessionId}:${requestId}` this channel receive empty message, if WS server receive that and have this sessionId it just close connexion