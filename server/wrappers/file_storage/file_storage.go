// Package file_storage provides a wrapper around Firebase Storage.
package file_storage

import (
	"context"
	"fmt"

	"cloud.google.com/go/storage"
	"google.golang.org/api/option"
)

// Client is the production implementation of Storage,
// using the actual Firebase Storage client.
type Client struct {
	client *storage.Client
}

// Uploads data to Firebase Storage and returns the download URL.
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
func (s *Client) Write(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error) {
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

// Closes the storage service and releases any resources.
//
// Returns:
//   - An error if any issue occurs during the close operation.
func (s *Client) Close() error {
	return s.client.Close()
}

// Creates a new instance of Client.
//
// Parameters:
//   - ctx: The context for the operation.
//
// Returns:
//   - A FileStorage interface.
//   - An error if any issue occurs during client creation.
func NewClient(ctx context.Context, jsonCredentials string) (*Client, error) {
	client, err := storage.NewClient(ctx, option.WithCredentialsJSON([]byte(jsonCredentials)))
	if err != nil {
		return nil, err
	}
	return &Client{client: client}, nil
}
