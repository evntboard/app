package service

import (
	"context"
	"fmt"
	"github.com/evntboard/app/event/model"
	"log"
)

type ModuleSessionService struct {
	dbService *DbService
}

func NewModuleSessionService(dbService *DbService) *ModuleSessionService {
	return &ModuleSessionService{dbService}
}

func (m *ModuleSessionService) GetModuleSessionIDByNameOrCode(organizationID, nameOrCode string) (*model.ModuleSession, error) {
	ctx := context.Background()
	rows, err := m.dbService.Db.Query(ctx, `
		SELECT module_session.id, module_session.module_id
		FROM module JOIN module_session ON module.id = module_session.module_id
		WHERE module.organization_id = $1 AND (module.code = $2 OR module.name = $2);
    `, organizationID, nameOrCode)
	if err != nil {
		log.Println("Error getting module ID by name or code:", err)
		return nil, err
	}
	defer rows.Close()

	if rows.Next() {
		moduleSession := &model.ModuleSession{}
		err := rows.Scan(&moduleSession.ModuleSessionID, &moduleSession.ModuleID)
		if err != nil {
			log.Println("Error scanning module ID:", err)
			return nil, err
		}
		return moduleSession, nil
	}

	return nil, fmt.Errorf("No matching module found")
}
