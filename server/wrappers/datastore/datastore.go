// Package datastore provides a wrapper around the Firestore datastore API.
package datastore

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"google.golang.org/api/iterator"
)

// Direction is the sort direction for result ordering.
type Direction int32

const (
	// Asc sorts results from smallest to largest.
	Asc Direction = Direction(firestore.Asc)

	// Desc sorts results from largest to smallest.
	Desc Direction = Direction(firestore.Desc)
)

// Client is a wrapper around the Firestore Client client that implements Client interface.
type Client struct {
	Client *firestore.Client
}

func NewClient(ctx context.Context, app *firebase.App) (*Client, error) {
	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firestore client: %v", err)
	}
	return &Client{
		Client: firestoreClient,
	}, nil
}

// AddDocument adds a new document to a specified Client collection.
//
// Parameters:
//   - ctx: The context for Client client operations.
//   - collectionName: The name of the Client collection where the document will be added.
//   - data: The document data to be added.
//
// Returns:
//   - The ID of the newly added document, or an empty string if the operation fails.
//   - An error if the operation fails, otherwise nil.
func (r *Client) AddDocument(ctx context.Context, collectionName string, data interface{}) (string, error) {
	docRef, _, err := r.Client.Collection(collectionName).Add(ctx, data)
	if err != nil {
		return "", err
	}
	return docRef.ID, err
}

// PageResult represents a page of documents with cursor information
type PageResult struct {
	Documents  []map[string]interface{}
	LastCursor []interface{}
	HasMore    bool
}

// GetCollection retrieves a page of documents from the specified Firestore collection.
//
// Parameters:
//   - ctx: The context for the client operations.
//   - collectionName: The name of the Firestore collection to retrieve documents from.
//   - limit: The maximum number of documents to return per page.
//   - sortField: The field to sort the documents by.
//   - sortDirection: The direction to sort the documents (ascending or descending).
//   - startAfter: An optional slice of values to use as the starting point for the page.
//
// Returns:
//   - A PageResult containing the retrieved documents, the last cursor value, and a flag indicating if there are more pages.
//   - An error if the operation fails.
func (r *Client) GetCollection(ctx context.Context, collectionName string, limit int, sortField string, sortDirection Direction, startAfter []interface{}) (*PageResult, error) {
	query := r.Client.Collection(collectionName).
		OrderBy(sortField, firestore.Direction(sortDirection)).
		Limit(limit + 1) // Fetch one extra to determine if there are more pages

	if len(startAfter) > 0 {
		query = query.StartAfter(startAfter...)
	}

	iter := query.Documents(ctx)
	var docs []map[string]interface{}
	var lastDoc *firestore.DocumentSnapshot

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("error fetching documents: %v", err)
		}

		lastDoc = doc
		doc_data := doc.Data()
		doc_data["id"] = doc.Ref.ID
		docs = append(docs, doc_data)
	}

	hasMore := len(docs) > limit
	if hasMore {
		docs = docs[:limit] // Remove the extra document we fetched
	}

	// Get the cursor values for the last document based on the sort field
	var lastCursor []interface{}
	if lastDoc != nil {
		lastCursor = []interface{}{lastDoc.Data()[sortField]}
	}

	return &PageResult{
		Documents:  docs,
		LastCursor: lastCursor,
		HasMore:    hasMore,
	}, nil
}

// Close closes the Client client connection.
//
// Returns:
//   - An error if closing the client fails, otherwise nil.
func (r *Client) Close() error {
	return r.Client.Close()
}

// write this function, this is currently all auto complete
func (r *Client) GetDocumentsByIds(ctx context.Context, collectionName string, ids []string) ([]map[string]interface{}, error) {
	collection := r.Client.Collection(collectionName)
	var results []map[string]interface{}

	// Use a batch to retrieve documents
	for _, id := range ids {
		docRef := collection.Doc(id)
		docSnapshot, err := docRef.Get(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to retrieve document with ID %s: %w", id, err)
		}

		if !docSnapshot.Exists() {
			return nil, fmt.Errorf("document with ID %s does not exist", id)
		}

		results = append(results, docSnapshot.Data())
	}

	return results, nil
}
