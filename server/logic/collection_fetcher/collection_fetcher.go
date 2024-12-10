package collection_fetcher

import (
	"context"
	"fmt"
	"spirit-snap/server/models"
	"spirit-snap/server/wrappers/datastore"
)

type StorageInterface interface {
	GetDownloadURL(ctx context.Context, bucketName, objectName string) (string, error)
}

type CollectionDatastoreInterface interface {
	GetCollection(ctx context.Context, collectionName string, limit int, sortField string, sortDirection datastore.Direction, startAfter []interface{}) (*datastore.PageResult, error)
}

type CollectionFetcher struct {
	StorageClient   StorageInterface
	DatastoreClient CollectionDatastoreInterface
}

func NewCollectionFetcher(storage StorageInterface, ds CollectionDatastoreInterface) *CollectionFetcher {
	return &CollectionFetcher{
		StorageClient:   storage,
		DatastoreClient: ds,
	}
}

func (sp *CollectionFetcher) Fetch(userId *string, limit int, startAfter []interface{}) ([]models.Spirit, error) {
	ctx := context.Background()

	// Get spirits collection with pagination
	result, err := sp.DatastoreClient.GetCollection(ctx, fmt.Sprintf("users/%s/spirits", *userId), limit, "imageTimestamp", datastore.Desc, startAfter)
	if err != nil {
		return nil, err
	}

	// Get download URLs for each spirit's images
	var spiritData []models.Spirit
	for _, spirit := range result.Documents {
		id := getOptionalStringField(spirit, "id")
		name := getOptionalStringField(spirit, "name")
		description := getOptionalStringField(spirit, "description")
		primaryType := getOptionalStringField(spirit, "primaryType")
		secondaryType := getOptionalStringField(spirit, "secondaryType")

		var originalUrl, generatedUrl *string
		originalUrl = getImageURL(ctx, sp.StorageClient, spirit, "originalImageFilePath")
		generatedUrl = getImageURL(ctx, sp.StorageClient, spirit, "generatedImageFilePath")

		// Extract numeric fields and set default values if not present
		agility := getOptionalIntField(spirit, "agility")
		arcana := getOptionalIntField(spirit, "arcana")
		aura := getOptionalIntField(spirit, "aura")
		charisma := getOptionalIntField(spirit, "charisma")
		endurance := getOptionalIntField(spirit, "endurance")
		height := getOptionalIntField(spirit, "height")
		weight := getOptionalIntField(spirit, "weight")
		intimidation := getOptionalIntField(spirit, "intimidation")
		luck := getOptionalIntField(spirit, "luck")
		strength := getOptionalIntField(spirit, "strength")
		toughness := getOptionalIntField(spirit, "toughness")

		spiritData = append(spiritData, models.Spirit{
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
		})
	}

	return spiritData, nil
}

func getImageURL(ctx context.Context, storageClient StorageInterface, spirit map[string]interface{}, pathField string) *string {
	if path, ok := spirit[pathField].(string); ok {
		if url, err := storageClient.GetDownloadURL(ctx, "spirit-snap.appspot.com", path); err == nil {
			return &url
		}
	}
	return nil
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
