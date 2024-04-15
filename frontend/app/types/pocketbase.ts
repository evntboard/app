/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	CustomEvents = "custom_events",
	EventProcessLogs = "event_process_logs",
	EventProcessRequests = "event_process_requests",
	EventProcesses = "event_processes",
	Events = "events",
	ModuleParams = "module_params",
	Modules = "modules",
	Organizations = "organizations",
	Shareds = "shareds",
	Storages = "storages",
	TriggerConditions = "trigger_conditions",
	Triggers = "triggers",
	UserOrganization = "user_organization",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	created: IsoDateString
	updated: IsoDateString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type CustomEventsRecord<Tpayload = unknown> = {
	description?: string
	name: string
	organization: RecordIdString
	payload?: null | Tpayload
}

export type EventProcessLogsRecord = {
	event_process: RecordIdString
	log?: string
}

export type EventProcessRequestsRecord<Terror = unknown, Tparams = unknown, Tresult = unknown> = {
	error?: null | Terror
	event_process: RecordIdString
	method?: string
	module: RecordIdString
	notification?: boolean
	params?: null | Tparams
	request_date?: IsoDateString
	response_date?: IsoDateString
	result?: null | Tresult
}

export type EventProcessesRecord = {
	end_at?: IsoDateString
	error?: string
	event: RecordIdString
	executed?: boolean
	start_at?: IsoDateString
	trigger: RecordIdString
}

export type EventsRecord<Tpayload = unknown> = {
	emitted_at?: IsoDateString
	emitter_code: string
	emitter_name: string
	name: string
	organization: RecordIdString
	payload?: null | Tpayload
}

export type ModuleParamsRecord<Tvalue = unknown> = {
	key: string
	module: RecordIdString
	value?: null | Tvalue
}

export type ModulesRecord = {
	code: string
	name: string
	organization: RecordIdString
	session?: string
	sub?: string
	token?: string
}

export type OrganizationsRecord = {
	avatar?: string
	name: string
}

export type SharedsRecord = {
	code?: string
	enable?: boolean
	name: string
	organization: RecordIdString
}

export type StoragesRecord<Tvalue = unknown> = {
	key: string
	organization: RecordIdString
	value?: null | Tvalue
}

export enum TriggerConditionsTypeOptions {
	"BASIC" = "BASIC",
	"THROTTLE" = "THROTTLE",
	"DEBOUNCE" = "DEBOUNCE",
}
export type TriggerConditionsRecord = {
	code?: string
	enable?: boolean
	name: string
	timeout?: number
	trigger: RecordIdString
	type?: TriggerConditionsTypeOptions
}

export type TriggersRecord = {
	channel?: string
	code?: string
	enable?: boolean
	name: string
	organization: RecordIdString
}

export enum UserOrganizationRoleOptions {
	"CREATOR" = "CREATOR",
	"READ" = "READ",
	"WRITE" = "WRITE",
}
export type UserOrganizationRecord = {
	organization: RecordIdString
	role: UserOrganizationRoleOptions
	user: RecordIdString
}

export type UsersRecord = {
	avatar?: string
	name?: string
}

// Response types include system fields and match responses from the PocketBase API
export type CustomEventsResponse<Tpayload = unknown, Texpand = unknown> = Required<CustomEventsRecord<Tpayload>> & BaseSystemFields<Texpand>
export type EventProcessLogsResponse<Texpand = unknown> = Required<EventProcessLogsRecord> & BaseSystemFields<Texpand>
export type EventProcessRequestsResponse<Terror = unknown, Tparams = unknown, Tresult = unknown, Texpand = unknown> = Required<EventProcessRequestsRecord<Terror, Tparams, Tresult>> & BaseSystemFields<Texpand>
export type EventProcessesResponse<Texpand = unknown> = Required<EventProcessesRecord> & BaseSystemFields<Texpand>
export type EventsResponse<Tpayload = unknown, Texpand = unknown> = Required<EventsRecord<Tpayload>> & BaseSystemFields<Texpand>
export type ModuleParamsResponse<Tvalue = unknown, Texpand = unknown> = Required<ModuleParamsRecord<Tvalue>> & BaseSystemFields<Texpand>
export type ModulesResponse<Texpand = unknown> = Required<ModulesRecord> & BaseSystemFields<Texpand>
export type OrganizationsResponse<Texpand = unknown> = Required<OrganizationsRecord> & BaseSystemFields<Texpand>
export type SharedsResponse<Texpand = unknown> = Required<SharedsRecord> & BaseSystemFields<Texpand>
export type StoragesResponse<Tvalue = unknown, Texpand = unknown> = Required<StoragesRecord<Tvalue>> & BaseSystemFields<Texpand>
export type TriggerConditionsResponse<Texpand = unknown> = Required<TriggerConditionsRecord> & BaseSystemFields<Texpand>
export type TriggersResponse<Texpand = unknown> = Required<TriggersRecord> & BaseSystemFields<Texpand>
export type UserOrganizationResponse<Texpand = unknown> = Required<UserOrganizationRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	custom_events: CustomEventsRecord
	event_process_logs: EventProcessLogsRecord
	event_process_requests: EventProcessRequestsRecord
	event_processes: EventProcessesRecord
	events: EventsRecord
	module_params: ModuleParamsRecord
	modules: ModulesRecord
	organizations: OrganizationsRecord
	shareds: SharedsRecord
	storages: StoragesRecord
	trigger_conditions: TriggerConditionsRecord
	triggers: TriggersRecord
	user_organization: UserOrganizationRecord
	users: UsersRecord
}

export type CollectionResponses = {
	custom_events: CustomEventsResponse
	event_process_logs: EventProcessLogsResponse
	event_process_requests: EventProcessRequestsResponse
	event_processes: EventProcessesResponse
	events: EventsResponse
	module_params: ModuleParamsResponse
	modules: ModulesResponse
	organizations: OrganizationsResponse
	shareds: SharedsResponse
	storages: StoragesResponse
	trigger_conditions: TriggerConditionsResponse
	triggers: TriggersResponse
	user_organization: UserOrganizationResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'custom_events'): RecordService<CustomEventsResponse>
	collection(idOrName: 'event_process_logs'): RecordService<EventProcessLogsResponse>
	collection(idOrName: 'event_process_requests'): RecordService<EventProcessRequestsResponse>
	collection(idOrName: 'event_processes'): RecordService<EventProcessesResponse>
	collection(idOrName: 'events'): RecordService<EventsResponse>
	collection(idOrName: 'module_params'): RecordService<ModuleParamsResponse>
	collection(idOrName: 'modules'): RecordService<ModulesResponse>
	collection(idOrName: 'organizations'): RecordService<OrganizationsResponse>
	collection(idOrName: 'shareds'): RecordService<SharedsResponse>
	collection(idOrName: 'storages'): RecordService<StoragesResponse>
	collection(idOrName: 'trigger_conditions'): RecordService<TriggerConditionsResponse>
	collection(idOrName: 'triggers'): RecordService<TriggersResponse>
	collection(idOrName: 'user_organization'): RecordService<UserOrganizationResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
