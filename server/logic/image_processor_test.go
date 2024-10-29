package logic

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"

	"spirit-snap/server/utils/datastore"
	"spirit-snap/server/utils/file_storage"

	"github.com/stretchr/testify/assert"
)

// MockRoundTripper mocks HTTP requests
type MockRoundTripper struct {
	RoundTripFunc func(req *http.Request) (*http.Response, error)
}

func (m *MockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	return m.RoundTripFunc(req)
}

func TestProcess_Success(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock StorageClient
	mockStorage := &file_storage.MockStorageClient{
		WriteFunc: func(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error) {
			return "http://mock-download-url.com/" + objectName, nil
		},
	}

	// Mock FirestoreClient
	mockFirestore := &datastore.MockFirestoreClient{
		AddDocumentFunc: func(ctx context.Context, collectionName string, data interface{}) error {
			return nil
		},
	}

	// Mock HTTP Client
	mockRoundTripper := &MockRoundTripper{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			if req.URL.String() == "https://api.openai.com/v1/chat/completions" {
				responseBody := `{
                    "choices": [
                        {
                            "message": {
                                "content": "Mock Caption"
                            }
                        }
                    ]
                }`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			} else if req.URL.String() == "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions" {
				responseBody := `{
					"output": [
						"https://mockdownloadurl.com"
					]
                }`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			} else if req.URL.String() == "https://mockdownloadurl.com" {
				responseBody := `{ content: "mockgeneratedimage.webp"}`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			}
			return nil, fmt.Errorf("unknown URL: %s", req.URL.String())
		},
	}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image)

	// Assert
	assert.NoError(t, err)
}

func TestProcess_FailOnCaptionGeneration(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock HTTP Client to simulate failure in getImageCaption
	mockRoundTripper := &MockRoundTripper{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			if req.URL.String() == "https://api.openai.com/v1/chat/completions" {
				return &http.Response{
					StatusCode: http.StatusInternalServerError,
					Body:       io.NopCloser(bytes.NewBufferString(`{"error": "Internal Server Error"}`)),
					Header:     make(http.Header),
				}, nil
			}
			return nil, fmt.Errorf("unknown URL: %s", req.URL.String())
		},
	}

	// Mock StorageClient and FirestoreClient
	mockStorage := &file_storage.MockStorageClient{}
	mockFirestore := &datastore.MockFirestoreClient{}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "OpenAI API request failed with status 500: {\"error\": \"Internal Server Error\"}")
}

func TestProcess_FailOnMisunderstoodImageCaptionResponse(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock HTTP Client to simulate failure in getImageCaption
	mockRoundTripper := &MockRoundTripper{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			if req.URL.String() == "https://api.openai.com/v1/chat/completions" {
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(`{"content": ""}`)),
					Header:     make(http.Header),
				}, nil
			}
			return nil, fmt.Errorf("unknown URL: %s", req.URL.String())
		},
	}

	// Mock StorageClient and FirestoreClient
	mockStorage := &file_storage.MockStorageClient{}
	mockFirestore := &datastore.MockFirestoreClient{}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unexpected OpenAI API response: missing 'choices' key in response")
}

func TestProcess_FailOnImageGeneration(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock HTTP Client to simulate failure in generateCartoonMonster
	mockRoundTripper := &MockRoundTripper{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			if req.URL.String() == "https://api.openai.com/v1/chat/completions" {
				responseBody := `{
                    "choices": [
                        {
                            "message": {
                                "content": "Mock Caption"
                            }
                        }
                    ]
                }`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			} else if req.URL.String() == "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions" {
				return &http.Response{
					StatusCode: http.StatusInternalServerError,
					Body:       io.NopCloser(bytes.NewBufferString(`{"error": "Internal Server Error"}`)),
					Header:     make(http.Header),
				}, nil
			}
			return nil, fmt.Errorf("unknown URL: %s", req.URL.String())
		},
	}

	// Mock StorageClient and FirestoreClient
	mockStorage := &file_storage.MockStorageClient{}
	mockFirestore := &datastore.MockFirestoreClient{}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "Replicate API request failed with status 500: {\"error\": \"Internal Server Error\"}")
}

func TestProcess_FailOnMisunderstoodImageGenerationResponse(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock HTTP Client to simulate failure in generateCartoonMonster
	mockRoundTripper := &MockRoundTripper{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			if req.URL.String() == "https://api.openai.com/v1/chat/completions" {
				responseBody := `{
                    "choices": [
                        {
                            "message": {
                                "content": "Mock Caption"
                            }
                        }
                    ]
                }`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			} else if req.URL.String() == "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions" {
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(`{"content": ""}`)),
					Header:     make(http.Header),
				}, nil
			}
			return nil, fmt.Errorf("unknown URL: %s", req.URL.String())
		},
	}

	// Mock StorageClient and FirestoreClient
	mockStorage := &file_storage.MockStorageClient{}
	mockFirestore := &datastore.MockFirestoreClient{}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unexpected replicate API response: missing or empty 'output' array")
}

func TestProcess_FailOnStorageWrite(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock StorageClient to fail on Write
	mockStorage := &file_storage.MockStorageClient{
		WriteFunc: func(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error) {
			return "", errors.New("storage write failed")
		},
	}

	// Mock FirestoreClient
	mockFirestore := &datastore.MockFirestoreClient{}

	// Mock HTTP Client with successful responses
	mockRoundTripper := &MockRoundTripper{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			if req.URL.String() == "https://api.openai.com/v1/chat/completions" {
				responseBody := `{
                    "choices": [
                        {
                            "message": {
                                "content": "Mock Caption"
                            }
                        }
                    ]
                }`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			} else if req.URL.String() == "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions" {
				// Output is base64encoded.
				responseBody := `{
					"output": [
						"https://mockdownloadurl.com"
					]
                }`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			} else if req.URL.String() == "https://mockdownloadurl.com" {
				responseBody := `{ content: "mockgeneratedimage.webp"}`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			}
			return nil, fmt.Errorf("unknown URL: %s", req.URL.String())
		},
	}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "storage write failed")
}

func TestProcess_FailOnFirestoreWrite(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock StorageClient with successful writes
	mockStorage := &file_storage.MockStorageClient{
		WriteFunc: func(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error) {
			return "http://mock-download-url.com/" + objectName, nil
		},
	}

	// Mock FirestoreClient to fail on AddDocument
	mockFirestore := &datastore.MockFirestoreClient{
		AddDocumentFunc: func(ctx context.Context, collectionName string, data interface{}) error {
			return errors.New("firestore write failed")
		},
	}

	// Mock HTTP Client with successful responses
	mockRoundTripper := &MockRoundTripper{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			if req.URL.String() == "https://api.openai.com/v1/chat/completions" {
				responseBody := `{
                    "choices": [
                        {
                            "message": {
                                "content": "Mock Caption"
                            }
                        }
                    ]
                }`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			} else if req.URL.String() == "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions" {
				// Output is base64encoded.
				responseBody := `{
					"output": [
						"https://mockdownloadurl.com"
					]
                }`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			} else if req.URL.String() == "https://mockdownloadurl.com" {
				responseBody := `{ content: "mockgeneratedimage.webp"}`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(responseBody)),
					Header:     make(http.Header),
				}, nil
			}
			return nil, fmt.Errorf("unknown URL: %s", req.URL.String())
		},
	}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "firestore write failed")
}
