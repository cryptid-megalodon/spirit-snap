// Package file_storage provides a wrapper around Firebase Storage.
package file_storage

import (
	"context"
	"fmt"
	"time"

	gcs "cloud.google.com/go/storage"
	firebase "firebase.google.com/go"
	firebase_storage "firebase.google.com/go/storage"
)

// Client is the production implementation of Storage,
// using the actual Firebase Storage client.
type Client struct {
	Client *firebase_storage.Client
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

// Writes data to Firebase Storage.
//
// Parameters:
//   - ctx: The context for the operation.
//   - bucketName: The name of the storage bucket (optional if using default bucket).
//   - filePath: The desired path for the object in the bucket.
//   - data: The byte slice to be uploaded.
//   - contentType: The MIME type of the file.
//
// Returns:
//   - An error if any issue occurs during the upload process.
func (c *Client) Write(ctx context.Context, bucketName string, filePath string, data []byte, contentType string) error {
	bucket, err := c.Client.Bucket(bucketName)
	if err != nil {
		return fmt.Errorf("failed to get bucket: %v", err)
	}

	writer := bucket.Object(filePath).NewWriter(ctx)
	writer.ContentType = contentType

	if _, err := writer.Write(data); err != nil {
		return fmt.Errorf("failed to write data to object: %v", err)
	}

	// Close the writer to finalize the upload
	if err := writer.Close(); err != nil {
		return fmt.Errorf("failed to close object writer: %v", err)
	}

	if _, err := bucket.Object(filePath).Attrs(ctx); err != nil {
		return fmt.Errorf("failed to get object attributes: %v", err)
	}

	return nil
}

// GetDownloadURL retrieves the download URL for a file in Firebase Storage.
//
// Parameters:
//   - ctx: The context for the operation.
//   - bucketName: The name of the storage bucket (optional if using default bucket).
//   - filePath: The path of the object in the bucket.
//
// Returns:
//   - The download URL as a string.
//   - An error if any issue occurs during the process.
func (c *Client) GetDownloadURL(ctx context.Context, bucketName string, filePath string) (string, error) {
	bucket, err := c.Client.Bucket(bucketName)
	if err != nil {
		return "", fmt.Errorf("failed to get bucket: %v", err)
	}

	opts := &gcs.SignedURLOptions{
		Scheme:  gcs.SigningSchemeV4,
		Method:  "GET",
		Expires: time.Now().Add(7 * 24 * time.Hour), // Set the expiration time for the URL
	}
	url, err := bucket.SignedURL(filePath, opts)
	if err != nil {
		return "", fmt.Errorf("failed to get signed URL: %v", err)
	}

	return url, nil
}
