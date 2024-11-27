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
	assert.Equal(t, "http://original-url", spirits[0].OriginalImageDownloadUrl)
	assert.Equal(t, "http://generated-url", spirits[0].GeneratedImageDownloadUrl)

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
	assert.Equal(t, "", spirits[0].OriginalImageDownloadUrl)
	assert.Equal(t, "", spirits[0].GeneratedImageDownloadUrl)
	mockDatastore.AssertExpectations(t)
	mockStorage.AssertNotCalled(t, "GetDownloadURL")
}
