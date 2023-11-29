export type TriggerWithProcessData = {
  trigger: {
    id: string,
    name: string,
  },
  process: {
    start?: string,
    end?: string,
    error?: string,
    exec?: "true" | "false",
  } | undefined,
  logs: Array<string>
}