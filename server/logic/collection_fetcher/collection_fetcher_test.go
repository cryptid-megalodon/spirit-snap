package collection_fetcher

import (
	"context"
	"spirit-snap/server/wrappers/datastore"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockStorageClient struct {
	mock.Mock
}

func (m *MockStorageClient) GetDownloadURL(ctx context.Context, bucketName, objectName string) (string, error) {
	args := m.Called(ctx, bucketName, objectName)
	return args.String(0), args.Error(1)
}

type MockDatastoreClient struct {
	mock.Mock
}

func (m *MockDatastoreClient) GetCollection(ctx context.Context, collectionName string, limit int, sortField string, sortDirection datastore.Direction, startAfter []interface{}) (*datastore.PageResult, error) {
	args := m.Called(ctx, collectionName, limit, sortField, sortDirection, startAfter)
	return args.Get(0).(*datastore.PageResult), args.Error(1)
}

func TestCollectionFetcher_Fetch(t *testing.T) {
	mockStorage := &MockStorageClient{}
	mockDatastore := &MockDatastoreClient{}
	fetcher := NewCollectionFetcher(mockStorage, mockDatastore)

	userId := "testUser123"
	limit := 10
	startAfter := []interface{}{"lastDoc"}

	testSpirit := map[string]interface{}{
		"id":                     "spirit1",
		"name":                   "Test Spirit",
		"description":            "Test Description",
		"primaryType":            "Type1",
		"secondaryType":          "Type2",
		"originalImageFilePath":  "original/path",
		"generatedImageFilePath": "generated/path",
		"agility":                10,
		"arcana":                 15,
		"aura":                   20,
		"charisma":               25,
		"endurance":              30,
		"height":                 180,
		"weight":                 75,
		"intimidation":           40,
		"luck":                   45,
		"strength":               50,
		"toughness":              55,
	}

	mockDatastore.On("GetCollection",
		mock.Anything,
		"users/testUser123/spirits",
		limit,
		"imageTimestamp",
		datastore.Desc,
		startAfter,
	).Return(&datastore.PageResult{
		Documents: []map[string]interface{}{testSpirit},
	}, nil)

	mockStorage.On("GetDownloadURL",
		mock.Anything,
		"spirit-snap.appspot.com",
		"original/path",
	).Return("http://original-url", nil)

	mockStorage.On("GetDownloadURL",
		mock.Anything,
		"spirit-snap.appspot.com",
		"generated/path",
	).Return("http://generated-url", nil)

	spirits, err := fetcher.Fetch(&userId, limit, startAfter)

	assert.NoError(t, err)
	assert.Len(t, spirits, 1)
	assert.Equal(t, "spirit1", spirits[0].ID)
	assert.Equal(t, "Test Spirit", spirits[0].Name)
	assert.Equal(t, "Test Description", spirits[0].Description)
	assert.Equal(t, "Type1", spirits[0].PrimaryType)
	assert.Equal(t, "Type2", spirits[0].SecondaryType)
	assert.Equal(t, "http://original-url", spirits[0].OriginalImageURL)
	assert.Equal(t, "http://generated-url", spirits[0].GeneratedImageURL)
	assert.Equal(t, 10, *spirits[0].Agility)
	assert.Equal(t, 15, *spirits[0].Arcana)
	assert.Equal(t, 20, *spirits[0].Aura)
	assert.Equal(t, 25, *spirits[0].Charisma)
	assert.Equal(t, 30, *spirits[0].Endurance)
	assert.Equal(t, 180, *spirits[0].Height)
	assert.Equal(t, 75, *spirits[0].Weight)
	assert.Equal(t, 40, *spirits[0].Intimidation)
	assert.Equal(t, 45, *spirits[0].Luck)
	assert.Equal(t, 50, *spirits[0].Strength)
	assert.Equal(t, 55, *spirits[0].Toughness)

	mockDatastore.AssertExpectations(t)
	mockStorage.AssertExpectations(t)
}

func TestCollectionFetcher_FetchWithNilPaths(t *testing.T) {
	mockStorage := &MockStorageClient{}
	mockDatastore := &MockDatastoreClient{}
	fetcher := NewCollectionFetcher(mockStorage, mockDatastore)

	userId := "testUser123"
	limit := 10
	startAfter := []interface{}{"lastDoc"}

	testSpirit := map[string]interface{}{
		"id":                     nil,
		"name":                   nil,
		"description":            nil,
		"primaryType":            nil,
		"secondaryType":          nil,
		"originalImageFilePath":  nil,
		"generatedImageFilePath": nil,
		"agility":                nil,
		"arcana":                 nil,
		"aura":                   nil,
		"charisma":               nil,
		"endurance":              nil,
		"height":                 nil,
		"weight":                 nil,
		"intimidation":           nil,
		"luck":                   nil,
		"strength":               nil,
		"toughness":              nil,
	}

	mockDatastore.On("GetCollection",
		mock.Anything,
		"users/testUser123/spirits",
		limit,
		"imageTimestamp",
		datastore.Desc,
		startAfter,
	).Return(&datastore.PageResult{
		Documents: []map[string]interface{}{testSpirit},
	}, nil)

	spirits, err := fetcher.Fetch(&userId, limit, startAfter)

	assert.NoError(t, err)
	assert.Len(t, spirits, 1)
	assert.Equal(t, "", spirits[0].ID)
	assert.Equal(t, "", spirits[0].Name)
	assert.Equal(t, "", spirits[0].Description)
	assert.Equal(t, "", spirits[0].PrimaryType)
	assert.Equal(t, "", spirits[0].SecondaryType)
	assert.Equal(t, "", spirits[0].OriginalImageURL)
	assert.Equal(t, "", spirits[0].GeneratedImageURL)
	assert.Nil(t, spirits[0].Agility)
	assert.Nil(t, spirits[0].Arcana)
	assert.Nil(t, spirits[0].Aura)
	assert.Nil(t, spirits[0].Charisma)
	assert.Nil(t, spirits[0].Endurance)
	assert.Nil(t, spirits[0].Height)
	assert.Nil(t, spirits[0].Weight)
	assert.Nil(t, spirits[0].Intimidation)
	assert.Nil(t, spirits[0].Luck)
	assert.Nil(t, spirits[0].Strength)
	assert.Nil(t, spirits[0].Toughness)

	mockDatastore.AssertExpectations(t)
	mockStorage.AssertNotCalled(t, "GetDownloadURL")
}
