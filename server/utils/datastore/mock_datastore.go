package datastore

import (
	"context"
	"errors"
)

// MockFirestoreClient is a mock implementation of FirestoreClient that allows testing of AddDocument.
type MockFirestoreClient struct {
	AddDocumentFunc func(ctx context.Context, collectionName string, data interface{}) error
	CloseFunc       func() error
}

func (m *MockFirestoreClient) AddDocument(ctx context.Context, collectionName string, data interface{}) error {
	if m.AddDocumentFunc == nil {
		return errors.New("collection function not defined")
	}
	return m.AddDocumentFunc(ctx, collectionName, data)
}

func (m *MockFirestoreClient) Close() error {
	if m.CloseFunc != nil {
		return m.CloseFunc()
	}
	return nil
}
