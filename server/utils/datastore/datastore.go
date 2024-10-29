// Package firestore provides utilities for interacting with FirestoreClient.
// It includes interfaces and implementations for dependency injection and testing.
package datastore

import (
	"context"

	"cloud.google.com/go/firestore"
)

// Datastore is an interface that defines methods for interacting with FirestoreClient.
// It allows for dependency injection and easier testing by allowing mocking of FirestoreClient interactions.
type Datastore interface {
	AddDocument(ctx context.Context, collectionName string, data interface{}) error
	Close() error
}

// FirestoreClient is a wrapper around the Firestore Client client that implements Datastore interface.
type FirestoreClient struct {
	client *firestore.Client
}

// NewFirestoreClient creates a new instance of FireStore.
//
// Parameters:
//   - ctx: The context for FirestoreClient client operations.
//   - projectID: The GCP project ID where FirestoreClient is located.
//
// Returns:
//   - An instance of Datastore.
//   - An error if the client creation fails.
//
// This function initializes the real FirestoreClient client that connects to the actual FirestoreClient service.
func NewFirestoreClient(ctx context.Context, projectID string) (Datastore, error) {
	client, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	return &FirestoreClient{client: client}, nil
}

// AddDocument adds a new document to a specified FirestoreClient collection.
//
// Parameters:
//   - ctx: The context for FirestoreClient client operations.
//   - collectionName: The name of the FirestoreClient collection where the document will be added.
//   - data: The document data to be added.
//
// Returns:
//   - An error if the operation fails, otherwise nil.
func (r *FirestoreClient) AddDocument(ctx context.Context, collectionName string, data interface{}) error {
	_, _, err := r.client.Collection(collectionName).Add(ctx, data)
	return err
}

// Close closes the FirestoreClient client connection.
//
// Returns:
//   - An error if closing the client fails, otherwise nil.
func (r *FirestoreClient) Close() error {
	return r.client.Close()
}
