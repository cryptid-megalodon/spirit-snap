package file_storage

import (
	"context"
)

// MockStorageClient is a mock implementation of the StorageClient interface for testing purposes.
type MockStorageClient struct {
	WriteFunc func(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error)
	CloseFunc func() error
}

func (m *MockStorageClient) Write(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error) {
	if m.WriteFunc != nil {
		return m.WriteFunc(ctx, bucketName, objectName, data, contentType)
	}
	return "mock-download-url", nil
}

func (m *MockStorageClient) Close() error {
	if m.CloseFunc != nil {
		return m.CloseFunc()
	}
	return nil
}
