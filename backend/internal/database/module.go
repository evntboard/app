package database

import (
	"errors"
	"fmt"
	"github.com/evntboard/app/backend/internal/model"
	"github.com/google/uuid"
	"github.com/pluja/pocketbase"
	"log"
)

func (c *PocketBaseClient) ResetModuleSessionByModuleId(moduleId string) error {
	err := c.pb.Update(
		"modules",
		moduleId,
		map[string]any{
			"session": nil,
		},
	)

	if err != nil {
		log.Fatal(err)
	}

	return nil
}

func (c *PocketBaseClient) GetModuleByCodeNameToken(code, name, token string) (*model.Module, error) {
	collection := pocketbase.CollectionSet[model.Module](c.pb, "modules")

	strFilter := fmt.Sprintf("code = \"%s\" && name = \"%s\" && token = \"%s\"", code, name, token)
	response, err := collection.List(pocketbase.ParamsList{
		Size:    1,
		Page:    0,
		Sort:    "+created",
		Filters: strFilter,
		Expand:  "module_params_via_module",
	})

	if err != nil {
		log.Fatal(err)
	}

	if response.TotalItems != 1 {
		return nil, errors.New("not found")
	}

	return &response.Items[0], nil
}

func (c *PocketBaseClient) GenerateModuleSession(module *model.Module) error {
	newModuleSession := uuid.NewString()
	module.SessionId = newModuleSession
	return c.pb.Update(
		"modules",
		module.Id,
		map[string]any{
			"session": newModuleSession,
		},
	)
}

func (c *PocketBaseClient) GetModuleWithSessionByOrganizationIdAndNameOrCode(organizationId, name string) (*model.Module, error) {
	collection := pocketbase.CollectionSet[model.Module](c.pb, "modules")

	strFilter := fmt.Sprintf("organization = \"%s\" && session != \"\" && (name = \"%s\" || code =\"%s\")", organizationId, name, name)
	response, err := collection.List(pocketbase.ParamsList{
		Size:    1,
		Page:    0,
		Sort:    "+created",
		Filters: strFilter,
		Expand:  "",
	})

	if err != nil {
		return nil, err
	}

	if response.TotalItems == 0 {
		return nil, errors.New("not found")
	}

	return &response.Items[0], nil
}

func (c *PocketBaseClient) ResetAllModuleSession() error {
	collection := pocketbase.CollectionSet[model.Module](c.pb, "modules")
	response, err := collection.List(pocketbase.ParamsList{
		Size:    500,
		Page:    0,
		Sort:    "+created",
		Filters: "session != \"\"",
		Expand:  "",
	})

	if err != nil {
		log.Fatal(err)
	}

	for _, item := range response.Items {
		err := c.pb.Update(
			"modules",
			item.Id,
			map[string]any{
				"session": nil,
			},
		)
		if err != nil {
			return err
		}
	}

	return nil
}
