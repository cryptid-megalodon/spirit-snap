// Package datastore provides a wrapper around the Firestore datastore API.
package datastore

import (
	"context"

	"cloud.google.com/go/firestore"
)

// Client is a wrapper around the Firestore Client client that implements Client interface.
type Client struct {
	Client *firestore.Client
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
	_, _, err := r.Client.Collection(collectionName).Add(ctx, data)
	return err
}

// Close closes the Client client connection.
//
// Returns:
//   - An error if closing the client fails, otherwise nil.
func (r *Client) Close() error {
	return r.Client.Close()
}
