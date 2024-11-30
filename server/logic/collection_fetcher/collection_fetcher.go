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
		id, _ := spirit["id"].(string)
		name, _ := spirit["name"].(string)
		description, _ := spirit["description"].(string)
		primaryType, _ := spirit["primaryType"].(string)
		secondaryType, _ := spirit["secondaryType"].(string)

		var originalUrl, generatedUrl string
		if originalPath, ok := spirit["originalImageFilePath"].(string); ok {
			originalUrl, _ = sp.StorageClient.GetDownloadURL(ctx, "spirit-snap.appspot.com", originalPath)
		}
		if generatedPath, ok := spirit["generatedImageFilePath"].(string); ok {
			generatedUrl, _ = sp.StorageClient.GetDownloadURL(ctx, "spirit-snap.appspot.com", generatedPath)
		}

		spiritData = append(spiritData, models.Spirit{
			ID:                id,
			Name:              name,
			Description:       description,
			PrimaryType:       primaryType,
			SecondaryType:     secondaryType,
			OriginalImageURL:  originalUrl,
			GeneratedImageURL: generatedUrl,
		})
	}

	return spiritData, nil
}
