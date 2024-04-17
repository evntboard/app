package database

func (app *PocketBaseClient) CreateProcessLog(processId string, log any) error {
	_, err := app.pb.Create(
		"event_process_logs",
		map[string]any{
			"event_process": processId,
			"log":           log,
		})

	return err
}
