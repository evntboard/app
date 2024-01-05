# NATS

## channel
  - `events` this channel receive event ID
  - `organization.${organizationId}.storage` this channel receive JSON key value when a storage var is updated
  - `organization.${organizationId}.events` this channel receive event ID
  - `organization.${organizationId}.event.${eventId}` this channel receive event ID who process changed
  - `organization.${organizationId}.module-eject.${sessionId}` this channel receive empty message, if WS server receive that and have this sessionId it just close connexion
  - `organization.${organizationId}.module.${sessionId}` this channel receive empty message, if WS server receive that and have this sessionId it just close connexion