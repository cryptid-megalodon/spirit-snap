package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

// MockImageProcessor implements the Processor interface for testing
type MockImageProcessor struct {
	ProcessFunc func(image *string) error
}

func (m *MockImageProcessor) Process(image *string) error {
	return m.ProcessFunc(image)
}

func (m *MockImageProcessor) Close() {}

// Test cases
func TestProcessImageHandler_MethodNotAllowed(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{},
	}

	req := httptest.NewRequest(http.MethodGet, "/ProcessImage", nil)
	rr := httptest.NewRecorder()

	// Execute
	handler := http.HandlerFunc(server.processImageHandler)
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusMethodNotAllowed, rr.Code)
	assert.Equal(t, "Only POST method is allowed\n", rr.Body.String())
}

func TestProcessImageHandler_BadRequest(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{},
	}

	// Send an invalid JSON body
	req := httptest.NewRequest(http.MethodPost, "/ProcessImage", bytes.NewBuffer([]byte(`invalid-json`)))
	rr := httptest.NewRecorder()

	// Execute
	handler := http.HandlerFunc(server.processImageHandler)
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Equal(t, "Invalid request payload\n", rr.Body.String())
}

func TestProcessImageHandler_InternalServerError(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{
			ProcessFunc: func(image *string) error {
				return fmt.Errorf("mock error")
			},
		},
	}

	// Send a valid JSON body
	imageData := ImageData{Base64Image: "test_base64_image"}
	body, _ := json.Marshal(imageData)
	req := httptest.NewRequest(http.MethodPost, "/ProcessImage", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	// Execute
	handler := http.HandlerFunc(server.processImageHandler)
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Equal(t, "mock error\n", rr.Body.String())
}

func TestProcessImageHandler_Success(t *testing.T) {
	// Setup
	server := &Server{
		ImageProcessor: &MockImageProcessor{
			ProcessFunc: func(image *string) error {
				return nil // Simulate successful processing
			},
		},
	}

	// Send a valid JSON body
	imageData := ImageData{Base64Image: "test_base64_image"}
	body, _ := json.Marshal(imageData)
	req := httptest.NewRequest(http.MethodPost, "/ProcessImage", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	// Execute
	handler := http.HandlerFunc(server.processImageHandler)
	handler.ServeHTTP(rr, req)

	// Assert
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "Image processed successfully", rr.Body.String())
}
