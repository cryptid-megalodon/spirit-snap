package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"spirit-snap/server/logic/collection_fetcher"
	"spirit-snap/server/middleware"
	"testing"

	"firebase.google.com/go/auth"
	"github.com/stretchr/testify/assert"
)

// MockImageProcessor implements the Processor interface for testing
type MockImageProcessor struct {
	ProcessFunc func(image *string, userId *string) error
}

func (m *MockImageProcessor) Process(image *string, userId *string) error {
	return m.ProcessFunc(image, userId)
}

func (m *MockImageProcessor) Close() {}

// MockCollectionFetcher implements the CollectionFetcher interface for testing
type MockCollectionFetcher struct {
	FetchFunc func(*string, int, []interface{}) ([]collection_fetcher.SpiritData, error)
}

func (m *MockCollectionFetcher) Fetch(userId *string, limit int, cursor []interface{}) ([]collection_fetcher.SpiritData, error) {
	return m.FetchFunc(userId, limit, cursor)
}

// MockAuthClient implements a mock Firebase auth client
type MockAuthClient struct {
	VerifyIDTokenFunc func(context.Context, string) (*auth.Token, error)
}

func (m *MockAuthClient) VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error) {
	if m.VerifyIDTokenFunc != nil {
		return m.VerifyIDTokenFunc(ctx, idToken)
	}
	return &auth.Token{UID: "test-user-id"}, nil
}

func TestProcessImageHandler_MethodNotAllowed(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{},
		AuthClient:     &MockAuthClient{},
	}

	req := httptest.NewRequest(http.MethodGet, "/ProcessImage", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.processImageHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusMethodNotAllowed, rr.Code)
	assert.Equal(t, "Only POST method is allowed\n", rr.Body.String())
}

func TestProcessImageHandler_BadRequest(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{},
		AuthClient:     &MockAuthClient{},
	}

	// Send an invalid JSON body
	req := httptest.NewRequest(http.MethodPost, "/ProcessImage", bytes.NewBuffer([]byte(`invalid-json`)))
	req.Header.Set("Authorization", "Bearer test-token")
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.processImageHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Equal(t, "Invalid request payload\n", rr.Body.String())
}

func TestProcessImageHandler_InternalServerError(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{
			ProcessFunc: func(image *string, userId *string) error {
				return fmt.Errorf("mock error")
			},
		},
		AuthClient: &MockAuthClient{},
	}

	// Send a valid JSON body
	imageData := ImageData{Base64Image: "test_base64_image"}
	body, _ := json.Marshal(imageData)
	req := httptest.NewRequest(http.MethodPost, "/ProcessImage", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer test-token")
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.processImageHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Equal(t, "mock error\n", rr.Body.String())
}

func TestProcessImageHandler_Success(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{
			ProcessFunc: func(image *string, userId *string) error {
				return nil // Simulate successful processing
			},
		},
		AuthClient: &MockAuthClient{},
	}

	// Send a valid JSON body
	imageData := ImageData{Base64Image: "test_base64_image"}
	body, _ := json.Marshal(imageData)
	req := httptest.NewRequest(http.MethodPost, "/ProcessImage", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer test-token")
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.processImageHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "Image processed successfully", rr.Body.String())
}

func TestProcessImageHandler_Unauthorized(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{},
		AuthClient:     &MockAuthClient{},
	}

	req := httptest.NewRequest(http.MethodPost, "/ProcessImage", nil)
	// Don't set Authorization header to test unauthorized case
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.processImageHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Equal(t, "Unauthorized: missing or invalid Authorization header\n", rr.Body.String())
}

func TestProcessImageHandler_InvalidToken(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{},
		AuthClient: &MockAuthClient{
			VerifyIDTokenFunc: func(ctx context.Context, token string) (*auth.Token, error) {
				log.Printf("Here! Received token: %s", token)
				return nil, fmt.Errorf("invalid token")
			},
		},
	}

	req := httptest.NewRequest(http.MethodPost, "/ProcessImage", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.processImageHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Equal(t, "Unauthorized: invalid ID token\n", rr.Body.String())
}

func TestFetchSpiritsHandler_MethodNotAllowed(t *testing.T) {
	// Setup
	server := &Server{
		CollectionFetcher: &MockCollectionFetcher{},
		AuthClient:        &MockAuthClient{},
	}

	req := httptest.NewRequest(http.MethodPost, "/FetchSpirits", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.fetchSpiritsHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusMethodNotAllowed, rr.Code)
	assert.Equal(t, "Only GET method is allowed\n", rr.Body.String())
}

func TestFetchSpiritsHandler_Unauthorized(t *testing.T) {
	// Setup
	server := &Server{
		CollectionFetcher: &MockCollectionFetcher{},
		AuthClient:        &MockAuthClient{},
	}

	req := httptest.NewRequest(http.MethodGet, "/FetchSpirits", nil)
	// Don't set Authorization header to test unauthorized case
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.fetchSpiritsHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, rr.Code)
	assert.Equal(t, "Unauthorized: missing or invalid Authorization header\n", rr.Body.String())
}

func TestFetchSpiritsHandler_InternalServerError(t *testing.T) {
	// Setup
	server := &Server{
		CollectionFetcher: &MockCollectionFetcher{
			FetchFunc: func(userId *string, limit int, cursor []interface{}) ([]collection_fetcher.SpiritData, error) {
				return nil, fmt.Errorf("mock error")
			},
		},
		AuthClient: &MockAuthClient{},
	}

	req := httptest.NewRequest(http.MethodGet, "/FetchSpirits", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.fetchSpiritsHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Equal(t, "mock error\n", rr.Body.String())
}

func TestFetchSpiritsHandler_Success(t *testing.T) {
	// Setup
	mockSpirits := []collection_fetcher.SpiritData{
		{ID: "1", Name: "Spirit 1"},
		{ID: "2", Name: "Spirit 2"},
	}

	server := &Server{
		CollectionFetcher: &MockCollectionFetcher{
			FetchFunc: func(userId *string, limit int, cursor []interface{}) ([]collection_fetcher.SpiritData, error) {
				return mockSpirits, nil
			},
		},
		AuthClient: &MockAuthClient{},
	}

	req := httptest.NewRequest(http.MethodGet, "/FetchSpirits", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	rr := httptest.NewRecorder()

	// Execute
	handler := middleware.AuthMiddleware(server.AuthClient)(http.HandlerFunc(server.fetchSpiritsHandler))
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusOK, rr.Code)
	var response []collection_fetcher.SpiritData
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.Equal(t, mockSpirits, response)
}
