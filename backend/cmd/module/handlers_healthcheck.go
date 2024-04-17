package main

import (
	"github.com/evntboard/app/backend/internal/response"
	"net/http"
)

func (app *application) healthcheck(w http.ResponseWriter, r *http.Request) {
	err := response.JSON(
		w,
		http.StatusOK,
		map[string]string{
			"Status": "OK",
		},
	)
	if err != nil {
		app.serverError(w, r, err)
	}
}
