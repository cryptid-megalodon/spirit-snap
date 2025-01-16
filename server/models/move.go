package models

type Move struct {
	ID   *string `json:"id"`
	Name *string `json:"name"`
	Type *string `json:"type"`
}

func BuildMovefromDocData(doc map[string]interface{}) *Move {
	id := GetOptionalStringField(doc, "id")
	name := GetOptionalStringField(doc, "name")
	type_ := GetOptionalStringField(doc, "type")

	return &Move{
		ID:   id,
		Name: name,
		Type: type_,
	}
}
