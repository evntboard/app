package utils

import (
	"github.com/pocketbase/pocketbase/models"
	"sort"
	"strings"
)

const (
	TypeFolder    = "folder"
	TypeShared    = "shared"
	TypeTrigger   = "trigger"
	TypeCondition = "condition"
)

type Node struct {
	ID       *string `json:"id,omitempty"`
	Slug     string  `json:"slug"`
	Name     string  `json:"name"`
	Type     string  `json:"type"`
	Enable   *bool   `json:"enable,omitempty"`
	IsLeaf   bool    `json:"-"`
	Children []*Node `json:"children,omitempty"`
}

func recursiveSort(nodes []*Node) []*Node {
	sort.Slice(nodes, func(i, j int) bool {
		a := nodes[i]
		b := nodes[j]

		if (a.Type == TypeFolder && b.Type == TypeFolder) ||
			(a.Type == TypeShared && b.Type == TypeShared) ||
			(a.Type == TypeTrigger && b.Type == TypeTrigger) {
			return a.Slug < b.Slug
		}

		if a.Type == TypeCondition && b.Type == TypeCondition {
			return a.Name < b.Name
		}

		if a.Type == TypeFolder && b.Type != TypeFolder {
			return true
		}

		if a.Type != TypeFolder && b.Type == TypeFolder {
			return false
		}

		if a.Type == TypeShared && b.Type == TypeTrigger {
			return true
		}

		if a.Type == TypeTrigger && b.Type == TypeShared {
			return false
		}

		return false
	})

	for _, node := range nodes {
		if node.Type == TypeFolder || node.Type == TypeTrigger {
			node.Children = recursiveSort(node.Children)
		}
	}

	return nodes
}

func GenerateTree(path string, triggerRecords []*models.Record, conditionsRecords []*models.Record, sharedRecords []*models.Record) *Node {
	rootName := "root"

	if path != "/" {
		rootName = path
	}

	root := &Node{
		Slug:     path,
		Name:     rootName,
		IsLeaf:   false,
		Children: make([]*Node, 0),
		Type:     "folder",
	}

	// Parcourir les déclencheurs et construire l'arborescence.
	for _, triggerRecord := range triggerRecords {
		if triggerRecord.GetString("name") == "" {
			continue
		}

		triggerName := strings.Replace(triggerRecord.GetString("name"), path, "", 1)

		split := strings.Split(triggerName, "/")

		currentNode := root
		for i, s := range split {
			// Si c'est un dossier (non une feuille).
			if i != (len(split) - 1) {
				found := false
				// Chercher parmi les enfants du nœud courant le nœud avec le nom "s" et IsLeaf à false.
				for _, child := range currentNode.Children {
					if child.Name == ("/"+s+"/") && !child.IsLeaf {
						currentNode = child
						found = true
						break
					}
				}

				// Si le nœud n'a pas été trouvé, le créer.
				if !found {
					newNode := &Node{
						Slug:     path + strings.Join(split[:(i+1)], "/") + "/",
						Name:     "/" + s + "/",
						IsLeaf:   false,
						Children: make([]*Node, 0),
						Type:     "folder",
					}
					currentNode.Children = append(currentNode.Children, newNode)
					currentNode = newNode
				}
				continue
			}

			triggerEnable := triggerRecord.GetBool("enable")

			conditionsNodes := make([]*Node, 0)

			for _, conditionRecord := range conditionsRecords {
				if conditionRecord.GetString("trigger") == triggerRecord.Id {
					conditionEnable := conditionRecord.GetBool("enable")
					conditionsNodes = append(conditionsNodes, &Node{
						ID:     &conditionRecord.Id,
						Slug:   conditionRecord.GetString("trigger"),
						Name:   conditionRecord.GetString("name"),
						Enable: &conditionEnable,
						IsLeaf: true,
						Type:   "condition",
					})
				}
			}

			// Si c'est une feuille.
			newNode := &Node{
				ID:       &triggerRecord.Id,
				Slug:     triggerRecord.GetString("name"),
				Name:     "/" + s,
				Enable:   &triggerEnable,
				IsLeaf:   true,
				Type:     "trigger",
				Children: conditionsNodes,
			}
			currentNode.Children = append(currentNode.Children, newNode)
		}
	}

	for _, sharedRecord := range sharedRecords {
		sharedName := strings.Replace(sharedRecord.GetString("name"), path, "", 1)

		split := strings.Split(sharedName, "/")

		currentNode := root
		for i, s := range split {
			// Si c'est un dossier (non une feuille).
			if i != (len(split) - 1) {
				found := false
				// Chercher parmi les enfants du nœud courant le nœud avec le nom "s" et IsLeaf à false.
				for _, child := range currentNode.Children {
					if child.Name == ("/"+s+"/") && !child.IsLeaf {
						currentNode = child
						found = true
						break
					}
				}

				// Si le nœud n'a pas été trouvé, le créer.
				if !found {
					newNode := &Node{
						Slug:     path + strings.Join(split[:(i+1)], "/") + "/",
						Name:     "/" + s + "/",
						IsLeaf:   false,
						Children: make([]*Node, 0),
						Type:     "folder",
					}
					currentNode.Children = append(currentNode.Children, newNode)
					currentNode = newNode
				}
				continue
			}

			enableShared := sharedRecord.GetBool("enable")

			// Si c'est une feuille.
			newNode := &Node{
				ID:     &sharedRecord.Id,
				Slug:   sharedRecord.GetString("name"),
				Name:   "/" + s,
				Enable: &enableShared,
				IsLeaf: true,
				Type:   "shared",
			}
			currentNode.Children = append(currentNode.Children, newNode)
		}
	}

	return &Node{
		ID:       root.ID,
		Slug:     root.Slug,
		Name:     root.Name,
		Type:     root.Type,
		Enable:   root.Enable,
		IsLeaf:   root.IsLeaf,
		Children: recursiveSort(root.Children),
	}
}
