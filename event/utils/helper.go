package utils

import "fmt"

const DataEvents = "events"

func GKeyOrgaEvent(organizationID, eventID string) string {
	return fmt.Sprintf("organization:%s:event:%s", organizationID, eventID)
}

func GKeyOrgaEventTriggerProcess(organizationID, eventID, triggerID string) string {
	return fmt.Sprintf("organization:%s:event:%s:trigger:%s:process", organizationID, eventID, triggerID)
}

func GKeyOrgaEventTriggerLog(organizationID, eventID, triggerID string) string {
	return fmt.Sprintf("organization:%s:event:%s:trigger:%s:log", organizationID, eventID, triggerID)
}

func GKeyOrgaModules(organizationID string) string {
	return fmt.Sprintf("organization:%s:modules", organizationID)
}

func GKeyOrgaStorage(organizationID string) string {
	return fmt.Sprintf("organization:%s:storage", organizationID)
}

func GChOrgaEvents(organizationID string) string {
	return fmt.Sprintf("ch:organization:%s:events", organizationID)
}

func GChOrgaStorage(organizationID string) string {
	return fmt.Sprintf("ch:organization:%s:storage", organizationID)
}

func GChOrgaModule(organizationID, sessionID string) string {
	return fmt.Sprintf("ch:organization:%s:module:%s", organizationID, sessionID)
}

func GChOrgaModuleRequest(organizationID, sessionID, requestID string) string {
	return fmt.Sprintf("organization:%s:module:%s:%s", organizationID, sessionID, requestID)
}

func GChOrgaModuleEject(organizationID, sessionID string) string {
	return fmt.Sprintf("ch:organization:%s:module-eject:%s", organizationID, sessionID)
}

func GChOrgaEvent(organizationID, eventID string) string {
	return fmt.Sprintf("ch:organization:%s:event:%s", organizationID, eventID)
}
