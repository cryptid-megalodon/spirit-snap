package models

import (
	"context"
)

// This is the model of the Spirit object that will be returned to the client.
type Spirit struct {
	ID                *string `json:"id"`
	Name              *string `json:"name"`
	Description       *string `json:"description"`
	PrimaryType       *string `json:"primaryType"`
	SecondaryType     *string `json:"secondaryType"`
	OriginalImageURL  *string `json:"originalImageDownloadUrl"`
	GeneratedImageURL *string `json:"generatedImageDownloadUrl"`
	Moves             []*Move `json:"moves"`

	Agility      *int `json:"agility"`
	Arcana       *int `json:"arcana"`
	Aura         *int `json:"aura"`
	Charisma     *int `json:"charisma"`
	Endurance    *int `json:"endurance"`
	Height       *int `json:"height"`
	Weight       *int `json:"weight"`
	Intimidation *int `json:"intimidation"`
	Luck         *int `json:"luck"`
	Strength     *int `json:"strength"`
	Toughness    *int `json:"toughness"`
	HitPoints    *int `json:"hitPoints"`
}

type StorageInterface interface {
	GetDownloadURL(ctx context.Context, bucketName, objectName string) (string, error)
}

type DatastoreInterface interface {
	GetDocumentsByIds(ctx context.Context, collectionName string, ids []string) ([]map[string]interface{}, error)
}

func getMoves(ctx context.Context, datastoreClient DatastoreInterface, moveIds []string) []*Move {
	moveDocs, _ := datastoreClient.GetDocumentsByIds(ctx, "moves", moveIds)
	if moveDocs == nil {
		return nil
	}

	var moves []*Move
	for _, doc := range moveDocs {
		moves = append(moves, BuildMovefromDocData(doc))
	}

	return moves
}

func BuildSpiritfromDocData(ctx context.Context, storageClient StorageInterface, doc map[string]interface{}, datastoreClient DatastoreInterface) Spirit {
	id := GetOptionalStringField(doc, "id")
	name := GetOptionalStringField(doc, "name")
	description := GetOptionalStringField(doc, "description")
	primaryType := GetOptionalStringField(doc, "primaryType")
	secondaryType := GetOptionalStringField(doc, "secondaryType")

	var originalUrl, generatedUrl *string
	originalUrl = getImageURL(ctx, storageClient, doc, "originalImageFilePath")
	generatedUrl = getImageURL(ctx, storageClient, doc, "generatedImageFilePath")

	moveIds := GetOptionalStringArrayField(doc, "moveIds")
	moves := []*Move{}
	if moveIds != nil {
		moves = getMoves(ctx, datastoreClient, moveIds)
	} else {
		moves = nil
	}

	// Extract numeric fields and set default values if not present
	agility := GetOptionalIntField(doc, "agility")
	arcana := GetOptionalIntField(doc, "arcana")
	aura := GetOptionalIntField(doc, "aura")
	charisma := GetOptionalIntField(doc, "charisma")
	endurance := GetOptionalIntField(doc, "endurance")
	height := GetOptionalIntField(doc, "height")
	weight := GetOptionalIntField(doc, "weight")
	intimidation := GetOptionalIntField(doc, "intimidation")
	luck := GetOptionalIntField(doc, "luck")
	strength := GetOptionalIntField(doc, "strength")
	toughness := GetOptionalIntField(doc, "toughness")
	hitPoints := GetOptionalIntField(doc, "hitPoints")

	return Spirit{
		ID:                id,
		Name:              name,
		Description:       description,
		PrimaryType:       primaryType,
		SecondaryType:     secondaryType,
		OriginalImageURL:  originalUrl,
		GeneratedImageURL: generatedUrl,
		Moves:             moves,

		Agility:      agility,
		Arcana:       arcana,
		Aura:         aura,
		Charisma:     charisma,
		Endurance:    endurance,
		Height:       height,
		Weight:       weight,
		Intimidation: intimidation,
		Luck:         luck,
		Strength:     strength,
		Toughness:    toughness,
		HitPoints:    hitPoints,
	}
}
