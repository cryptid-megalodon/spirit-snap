// Package firebase_storage provides utilities for handling data I/O with Firebase Storage.
// It abstracts the interactions with Firebase Storage to allow for easier testing through
// dependency injection and interfaces for mocking.
package file_storage

import (
	"context"
	"fmt"

	"cloud.google.com/go/storage"
)

// FileStorage defines an interface for interacting with Firebase Storage.
//
// It provides methods for writing data to the storage and closing the service.
type FileStorage interface {
	// Write uploads data to Firebase Storage and returns the download URL.
	//
	// Parameters:
	//   - ctx: The context for the operation.
	//   - bucketName: The name of the storage bucket.
	//   - objectName: The desired name for the object in the storage.
	//   - data: The byte slice to be uploaded.
	//
	// Returns:
	//   - A string containing the download URL of the uploaded object if successful.
	//   - An error if any issue occurs during the upload process.
	//
	// This method writes data to the specified storage bucket and constructs a download URL for the uploaded object.
	Write(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error)

	// Close closes the storage service and releases any resources.
	//
	// Returns:
	//   - An error if any issue occurs during the close operation.
	//
	// This method should be called when the storage service is no longer needed.
	Close() error
}

// FirebaseStorageClient is the production implementation of Storage,
// using the actual Firebase Storage client.
type FirebaseStorageClient struct {
	client *storage.Client
}

// Write uploads data to Firebase Storage and returns the download URL.
//
// Parameters:
//   - ctx: The context for the operation.
//   - bucketName: The name of the storage bucket.
//   - objectName: The desired name for the object in the storage.
//   - data: The byte slice to be uploaded.
//
// Returns:
//   - A string containing the download URL of the uploaded object if successful.
//   - An error if any issue occurs during the upload process.
//
// This method writes data to the specified storage bucket and constructs a download URL for the uploaded object.
func (s *FirebaseStorageClient) Write(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error) {
	bucket := s.client.Bucket(bucketName)
	object := bucket.Object(objectName)
	writer := object.NewWriter(ctx)

	// Set the ContentType of the file
	writer.ContentType = contentType

	if _, err := writer.Write(data); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	attrs, err := object.Attrs(ctx)
	if err != nil {
		return "", err
	}

	downloadURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, attrs.Name)
	fmt.Printf("Uploaded %s and got download URL: %s\n", objectName, downloadURL)

	return downloadURL, nil
}

// Close closes the storage service and releases any resources.
//
// Returns:
//   - An error if any issue occurs during the close operation.
//
// This method should be called when the storage service is no longer needed.
func (s *FirebaseStorageClient) Close() error {
	return s.client.Close()
}

// NewStorageServFileStorageice creates a new instance of .
//
// Parameters:
//   - ctx: The context for the operation.
//
// Returns:
//   - A FileStorage interface.
//   - An error if any issue occurs during client creation.
//
// This function initializes a new storage client to interact with Firebase Storage.
func NewFirebaseStorageClient(ctx context.Context) (*FirebaseStorageClient, error) {
	client, err := storage.NewClient(ctx)
	if err != nil {
		return nil, err
	}
	return &FirebaseStorageClient{client: client}, nil
}
