package collection_fetcher

import (
	"context"
	"fmt"
	"spirit-snap/server/wrappers/datastore"
)

type SpiritData struct {
	ID                        string `json:"id"`
	Name                      string `json:"name"`
	Description               string `json:"description"`
	PrimaryType               string `json:"primaryType"`
	SecondaryType             string `json:"secondaryType"`
	OriginalImageDownloadUrl  string `json:"originalImageDownloadUrl"`
	GeneratedImageDownloadUrl string `json:"generatedImageDownloadUrl"`
}

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

func (sp *CollectionFetcher) Fetch(userId *string, limit int, startAfter []interface{}) ([]SpiritData, error) {
	ctx := context.Background()

	// Get spirits collection with pagination
	result, err := sp.DatastoreClient.GetCollection(ctx, fmt.Sprintf("users/%s/spirits", *userId), limit, "imageTimestamp", datastore.Desc, startAfter)
	if err != nil {
		return nil, err
	}

	// Get download URLs for each spirit's images
	var spiritData []SpiritData
	for _, spirit := range result.Documents {
		originalUrl, err := sp.StorageClient.GetDownloadURL(ctx, spirit["originalImageFilePath"].(string), spirit["originalImageFilePath"].(string))
		if err != nil {
			continue
		}
		generatedUrl, err := sp.StorageClient.GetDownloadURL(ctx, spirit["generatedImageFilePath"].(string), spirit["generatedImageFilePath"].(string))
		if err != nil {
			continue
		}

		spiritData = append(spiritData, SpiritData{
			ID:                        spirit["id"].(string),
			Name:                      spirit["name"].(string),
			Description:               spirit["description"].(string),
			PrimaryType:               spirit["primaryType"].(string),
			SecondaryType:             spirit["secondaryType"].(string),
			OriginalImageDownloadUrl:  originalUrl,
			GeneratedImageDownloadUrl: generatedUrl,
		})
	}

	return spiritData, nil
}
