package service

import "C"
import (
	"fmt"
	"github.com/evntboard/app/event/model"
	"strings"
)

type SharedService struct {
	dbService *DbService
}

func NewSharedService(dbService *DbService) *SharedService {
	return &SharedService{dbService}
}

func (c *SharedService) GetSharedsFromPathSequence(triggerName string, organizationId string) ([]*model.Shared, error) {
	keywords := strings.Split(triggerName, "/")

	if len(keywords) <= 2 {
		keywords = make([]string, 0)
	} else {
		keywords = keywords[1:]
		keywords = keywords[:len(keywords)-1]
	}

	var conditions []string
	for i, _ := range keywords {
		strs := strings.Join(keywords[:i+1], "/")
		conditions = append(conditions, fmt.Sprintf("(shared.name NOT LIKE '/%s/%%/%%' AND shared.name LIKE '/%s/%%')", strs, strs))
	}

	query := fmt.Sprintf("SELECT * FROM shared WHERE shared.organization_id = '%s' AND shared.enable = true AND (shared.name NOT LIKE '/%%/%%' AND shared.name LIKE '/%%');", organizationId)
	if len(conditions) > 0 {
		query = fmt.Sprintf("SELECT * FROM shared WHERE shared.organization_id = '%s' AND shared.enable = true AND (shared.name NOT LIKE '/%%/%%' AND shared.name LIKE '/%%') OR %s;", organizationId, strings.Join(conditions, " OR "))
	}

	var shareds []*model.Shared
	c.dbService.Db.Raw(query).Scan(&shareds)

	return shareds, nil
}
