package models

import "context"

type Move struct {
	ID   *string `json:"id"`
	Name *string `json:"name"`
}

func BuildMovefromDocData(ctx context.Context, doc map[string]interface{}) *Move {
	id := GetOptionalStringField(doc, "id")
	name := GetOptionalStringField(doc, "name")

	return &Move{
		ID:   id,
		Name: name,
	}
}
