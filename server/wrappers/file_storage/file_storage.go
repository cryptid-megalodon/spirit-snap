// Package file_storage provides a wrapper around Firebase Storage.
package file_storage

import (
	"context"
	"fmt"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/storage"
)

// Client is the production implementation of Storage,
// using the actual Firebase Storage client.
type Client struct {
	Client *storage.Client
}

func NewClient(ctx context.Context, firebaseApp *firebase.App) (*Client, error) {
	firebaseStorageClient, err := firebaseApp.Storage(ctx)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firebase Storage client: %v", err)
	}
	return &Client{
		Client: firebaseStorageClient,
	}, nil
}

// Writes data to Firebase Storage and returns the download URL.
//
// Parameters:
//   - ctx: The context for the operation.
//   - bucketName: The name of the storage bucket (optional if using default bucket).
//   - objectName: The desired name for the object in the storage.
//   - data: The byte slice to be uploaded.
//   - contentType: The MIME type of the file.
//
// Returns:
//   - A string containing the download URL of the uploaded object if successful.
//   - An error if any issue occurs during the upload process.
//
// This method writes data to the specified storage bucket and constructs a download URL for the uploaded object.
func (c *Client) Write(ctx context.Context, bucketName string, objectName string, data []byte, contentType string) (string, error) {
	// Use the default bucket if bucketName is not provided
	bucket, err := c.Client.Bucket(bucketName)
	if err != nil {
		return "", fmt.Errorf("failed to get bucket: %v", err)
	}

	// Create a writer for the object
	writer := bucket.Object(objectName).NewWriter(ctx)
	writer.ContentType = contentType

	// Write the data to the object
	if _, err := writer.Write(data); err != nil {
		return "", fmt.Errorf("failed to write data to object: %v", err)
	}

	// Close the writer to finalize the upload
	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close object writer: %v", err)
	}

	// Generate a signed URL for the uploaded object
	attrs, err := bucket.Object(objectName).Attrs(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get object attributes: %v", err)
	}

	downloadURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", attrs.Bucket, attrs.Name)
	fmt.Printf("Uploaded %s and got download URL: %s\n", objectName, downloadURL)

	return downloadURL, nil
}
