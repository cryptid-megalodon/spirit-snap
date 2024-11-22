// Package datastore provides a wrapper around the Firestore datastore API.
package datastore

import (
	"context"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
)

// Client is a wrapper around the Firestore Client client that implements Client interface.
type Client struct {
	client *firestore.Client
}

// NewClient creates a new instance of FirestoreWrapper.
//
// Parameters:
//   - ctx: The context for Client client operations.
//   - projectID: The GCP project ID where Client is located.
//
// Returns:
//   - An instance of Client.
//   - An error if the client creation fails.
//
// This function initializes the real Client client that connects to the actual Client service.
func NewClient(ctx context.Context, projectId string, jsonCredentials string) (*Client, error) {
	client, err := firestore.NewClient(ctx, projectId, option.WithCredentialsJSON([]byte(jsonCredentials)))
	if err != nil {
		return nil, err
	}
	return &Client{client: client}, nil
}

// AddDocument adds a new document to a specified Client collection.
//
// Parameters:
//   - ctx: The context for Client client operations.
//   - collectionName: The name of the Client collection where the document will be added.
//   - data: The document data to be added.
//
// Returns:
//   - An error if the operation fails, otherwise nil.
func (r *Client) AddDocument(ctx context.Context, collectionName string, data interface{}) error {
	_, _, err := r.client.Collection(collectionName).Add(ctx, data)
	return err
}

// Close closes the Client client connection.
//
// Returns:
//   - An error if closing the client fails, otherwise nil.
func (r *Client) Close() error {
	return r.client.Close()
}
