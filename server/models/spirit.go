package models

import "context"

type Spirit struct {
	ID                *string `json:"id"`
	Name              *string `json:"name"`
	Description       *string `json:"description"`
	PrimaryType       *string `json:"primaryType"`
	SecondaryType     *string `json:"secondaryType"`
	OriginalImageURL  *string `json:"originalImageDownloadUrl"`
	GeneratedImageURL *string `json:"generatedImageDownloadUrl"`

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
}

type StorageInterface interface {
	GetDownloadURL(ctx context.Context, bucketName, objectName string) (string, error)
}

func getImageURL(ctx context.Context, storageClient StorageInterface, spirit map[string]interface{}, pathField string) *string {
	if path, ok := spirit[pathField].(string); ok {
		if url, err := storageClient.GetDownloadURL(ctx, "spirit-snap.appspot.com", path); err == nil {
			return &url
		}
	}
	return nil
}

func ExtractSpiritfromDocData(ctx context.Context, storageClient StorageInterface, doc map[string]interface{}) Spirit {
	id := getOptionalStringField(doc, "id")
	name := getOptionalStringField(doc, "name")
	description := getOptionalStringField(doc, "description")
	primaryType := getOptionalStringField(doc, "primaryType")
	secondaryType := getOptionalStringField(doc, "secondaryType")

	var originalUrl, generatedUrl *string
	originalUrl = getImageURL(ctx, storageClient, doc, "originalImageFilePath")
	generatedUrl = getImageURL(ctx, storageClient, doc, "generatedImageFilePath")

	// Extract numeric fields and set default values if not present
	agility := getOptionalIntField(doc, "agility")
	arcana := getOptionalIntField(doc, "arcana")
	aura := getOptionalIntField(doc, "aura")
	charisma := getOptionalIntField(doc, "charisma")
	endurance := getOptionalIntField(doc, "endurance")
	height := getOptionalIntField(doc, "height")
	weight := getOptionalIntField(doc, "weight")
	intimidation := getOptionalIntField(doc, "intimidation")
	luck := getOptionalIntField(doc, "luck")
	strength := getOptionalIntField(doc, "strength")
	toughness := getOptionalIntField(doc, "toughness")

	return Spirit{
		ID:                id,
		Name:              name,
		Description:       description,
		PrimaryType:       primaryType,
		SecondaryType:     secondaryType,
		OriginalImageURL:  originalUrl,
		GeneratedImageURL: generatedUrl,

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
	}
}

// Helper function to safely extract integer fields from the map
func getOptionalIntField(spirit map[string]interface{}, fieldName string) *int {
	value, ok := spirit[fieldName]
	if !ok || value == nil {
		return nil
	}
	switch v := value.(type) {
	case int:
		return &v
	case int64:
		val := int(v)
		return &val
	case float64:
		val := int(v)
		return &val
	default:
		return nil
	}
}

// Helper function to safely extract string fields from the map
func getOptionalStringField(spirit map[string]interface{}, fieldName string) *string {
	value, ok := spirit[fieldName]
	if !ok || value == nil {
		return nil
	}
	if v, ok := value.(string); ok {
		return &v
	}
	return nil
}
