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

func (m *MockDatastoreClient) GetDocumentsByIds(ctx context.Context, collectionName string, ids []string) ([]map[string]interface{}, error) {
	args := m.Called(ctx, collectionName, ids)
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

func TestCollectionFetcher_Fetch(t *testing.T) {
	mockStorage := &MockStorageClient{}
	mockDatastore := &MockDatastoreClient{}
	fetcher := NewCollectionFetcher(mockStorage, mockDatastore)

	userId := "testUser123"
	limit := 10
	startAfter := []interface{}{"lastDoc"}

	moveID1 := "move1"
	moveID2 := "move2"

	testSpirit := map[string]interface{}{
		"id":                     "spirit1",
		"name":                   "Test Spirit",
		"description":            "Test Description",
		"primaryType":            "Type1",
		"secondaryType":          "Type2",
		"originalImageFilePath":  "original/path",
		"generatedImageFilePath": "generated/path",
		"moveIds":                []string{moveID1, moveID2},
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

	moveDocs := []map[string]interface{}{
		{
			"id":   "move1",
			"name": "Test Move",
		},
		{
			"id":   "move2",
			"name": "Test Move 2	",
		},
	}
	mockDatastore.On("GetDocumentsByIds",
		mock.Anything,
		"moves",
		[]string{"move1", "move2"},
	).Return(moveDocs, nil)

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

	expectedID := "spirit1"
	expectedName := "Test Spirit"
	expectedDesc := "Test Description"
	expectedPrimary := "Type1"
	expectedSecondary := "Type2"
	expectedOrigURL := "http://original-url"
	expectedGenURL := "http://generated-url"
	expectedMoveId1 := moveID1
	expectedMoveId2 := moveID2
	expectedAgility := 10
	expectedArcana := 15
	expectedAura := 20
	expectedCharisma := 25
	expectedEndurance := 30
	expectedHeight := 180
	expectedWeight := 75
	expectedIntimidation := 40
	expectedLuck := 45
	expectedStrength := 50
	expectedToughness := 55

	assert.Equal(t, &expectedID, spirits[0].ID)
	assert.Equal(t, &expectedName, spirits[0].Name)
	assert.Equal(t, &expectedDesc, spirits[0].Description)
	assert.Equal(t, &expectedPrimary, spirits[0].PrimaryType)
	assert.Equal(t, &expectedSecondary, spirits[0].SecondaryType)
	assert.Equal(t, &expectedOrigURL, spirits[0].OriginalImageURL)
	assert.Equal(t, &expectedGenURL, spirits[0].GeneratedImageURL)
	assert.Equal(t, &expectedMoveId1, spirits[0].Moves[0].ID)
	assert.Equal(t, &expectedMoveId2, spirits[0].Moves[1].ID)
	assert.Equal(t, &expectedAgility, spirits[0].Agility)
	assert.Equal(t, &expectedArcana, spirits[0].Arcana)
	assert.Equal(t, &expectedAura, spirits[0].Aura)
	assert.Equal(t, &expectedCharisma, spirits[0].Charisma)
	assert.Equal(t, &expectedEndurance, spirits[0].Endurance)
	assert.Equal(t, &expectedHeight, spirits[0].Height)
	assert.Equal(t, &expectedWeight, spirits[0].Weight)
	assert.Equal(t, &expectedIntimidation, spirits[0].Intimidation)
	assert.Equal(t, &expectedLuck, spirits[0].Luck)
	assert.Equal(t, &expectedStrength, spirits[0].Strength)
	assert.Equal(t, &expectedToughness, spirits[0].Toughness)

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
		"moveIds":                nil,
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
	assert.Nil(t, spirits[0].ID)
	assert.Nil(t, spirits[0].Name)
	assert.Nil(t, spirits[0].Description)
	assert.Nil(t, spirits[0].PrimaryType)
	assert.Nil(t, spirits[0].SecondaryType)
	assert.Nil(t, spirits[0].OriginalImageURL)
	assert.Nil(t, spirits[0].GeneratedImageURL)
	assert.Nil(t, spirits[0].Moves)
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
