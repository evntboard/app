package utils

import "fmt"

const DataEvents = "events"

func GChOrgaStorage(organizationID string) string {
	return fmt.Sprintf("organization.%s.storage", organizationID)
}

func GChOrgaModule(organizationID, sessionID string) string {
	return fmt.Sprintf("organization.%s.module.%s", organizationID, sessionID)
}

func GChOrgaEvent(organizationID, eventID string) string {
	return fmt.Sprintf("organization.%s:event.%s", organizationID, eventID)
}
