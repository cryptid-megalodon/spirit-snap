package models

import "context"

type Move struct {
	ID          *string `json:"id"`
	Name        *string `json:"name"`
}

func ExtractMovefromDocData(ctx context.Context, doc map[string]interface{}) *Move {
	id := getOptionalStringField(doc, "id")
	name := getOptionalStringField(doc, "name")

	return &Move{
		ID:   id,
		Name: name,
	}
}