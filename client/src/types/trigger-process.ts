export type TriggerWithProcessData = {
  trigger: {
    id: string,
    name: string,
  },
  process: {
    start?: string,
    end?: string,
    error?: string,
  } | undefined,
  logs: Array<string>
}