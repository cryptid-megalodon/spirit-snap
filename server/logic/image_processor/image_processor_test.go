package image_processor

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

// MockRoundTripper mocks HTTP requests
type MockRoundTripper struct {
	RoundTripFunc func(req *http.Request) (*http.Response, error)
}

func (m *MockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	return m.RoundTripFunc(req)
}

type MockFirestoreClient struct {
	AddDocumentFunc func(ctx context.Context, collectionName string, data interface{}) error
	CloseFunc       func() error
}

func (m *MockFirestoreClient) AddDocument(ctx context.Context, collectionName string, data interface{}) error {
	if m.AddDocumentFunc == nil {
		return errors.New("collection function not defined")
	}
	return m.AddDocumentFunc(ctx, collectionName, data)
}

func (m *MockFirestoreClient) Close() error {
	if m.CloseFunc != nil {
		return m.CloseFunc()
	}
	return nil
}

type MockStorageClient struct {
	WriteFunc func(ctx context.Context, bucketName, objectName string, data []byte, contentType string) error
	CloseFunc func() error
}

func (m *MockStorageClient) Write(ctx context.Context, bucketName, objectName string, data []byte, contentType string) error {
	if m.WriteFunc != nil {
		return m.WriteFunc(ctx, bucketName, objectName, data, contentType)
	}
	return nil
}

func (m *MockStorageClient) Close() error {
	if m.CloseFunc != nil {
		return m.CloseFunc()
	}
	return nil
}

func TestProcess_Success(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	userId := "test_user_id"
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock StorageClient
	mockStorage := &MockStorageClient{
		WriteFunc: func(ctx context.Context, bucketName, objectName string, data []byte, contentType string) error {
			return nil
		},
	}

	// Mock FirestoreClient
	mockFirestore := &MockFirestoreClient{
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
                                "content": "{\"name\": \"Glimmering Griffon\", \"description\": \"A majestic griffon with shimmering golden feathers and a piercing gaze.\", \"image_generation_prompt\": \"A griffon with golden feathers soaring through a cloudy sky, sunlight reflecting off its wings.\"}"
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
	err := ip.Process(&base64Image, &userId)

	// Assert
	assert.NoError(t, err)
}

func TestProcess_FailOnCaptionGeneration(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	userId := "test_user_id"
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
	mockStorage := &MockStorageClient{}
	mockFirestore := &MockFirestoreClient{}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image, &userId)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "OpenAI API request failed with status 500: {\"error\": \"Internal Server Error\"}")
}

func TestProcess_FailOnMisunderstoodImageCaptionResponse(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	userId := "test_user_id"
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
					Body:       io.NopCloser(bytes.NewBufferString(`{"content": "{\"name\": \"Glimmering Griffon\", \"description\": \"A majestic griffon with shimmering golden feathers and a piercing gaze.\", \"image_generation_prompt\": \"A griffon with golden feathers soaring through a cloudy sky, sunlight reflecting off its wings.\"}" }`)),
					Header:     make(http.Header),
				}, nil
			}
			return nil, fmt.Errorf("unknown URL: %s", req.URL.String())
		},
	}

	// Mock StorageClient and FirestoreClient
	mockStorage := &MockStorageClient{}
	mockFirestore := &MockFirestoreClient{}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image, &userId)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unexpected OpenAI API response: missing 'choices' key in response")
}

func TestProcess_FailOnImageGeneration(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	userId := "test_user_id"
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
                                "content": "{\"name\": \"Glimmering Griffon\", \"description\": \"A majestic griffon with shimmering golden feathers and a piercing gaze.\", \"image_generation_prompt\": \"A griffon with golden feathers soaring through a cloudy sky, sunlight reflecting off its wings.\"}"
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
	mockStorage := &MockStorageClient{}
	mockFirestore := &MockFirestoreClient{}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image, &userId)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "Replicate API request failed with status 500: {\"error\": \"Internal Server Error\"}")
}

func TestProcess_FailOnMisunderstoodImageGenerationResponse(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	userId := "test_user_id"
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
                                "content": "{\"name\": \"Glimmering Griffon\", \"description\": \"A majestic griffon with shimmering golden feathers and a piercing gaze.\", \"image_generation_prompt\": \"A griffon with golden feathers soaring through a cloudy sky, sunlight reflecting off its wings.\"}"
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
	mockStorage := &MockStorageClient{}
	mockFirestore := &MockFirestoreClient{}

	// Create ImageProcessor instance
	ip := NewImageProcessor(mockStorage, mockFirestore, mockRoundTripper)

	// Execute
	err := ip.Process(&base64Image, &userId)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unexpected replicate API response: missing or empty 'output' array")
}

func TestProcess_FailOnStorageWrite(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	userId := "test_user_id"
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock StorageClient to fail on Write
	mockStorage := &MockStorageClient{
		WriteFunc: func(ctx context.Context, bucketName, objectName string, data []byte, contentType string) error {
			return errors.New("storage write failed")
		},
	}

	// Mock FirestoreClient
	mockFirestore := &MockFirestoreClient{}

	// Mock HTTP Client with successful responses
	mockRoundTripper := &MockRoundTripper{
		RoundTripFunc: func(req *http.Request) (*http.Response, error) {
			if req.URL.String() == "https://api.openai.com/v1/chat/completions" {
				responseBody := `{
                    "choices": [
                        {
                            "message": {
                                "content": "{\"name\": \"Glimmering Griffon\", \"description\": \"A majestic griffon with shimmering golden feathers and a piercing gaze.\", \"image_generation_prompt\": \"A griffon with golden feathers soaring through a cloudy sky, sunlight reflecting off its wings.\"}"
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
	err := ip.Process(&base64Image, &userId)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "storage write failed")
}

func TestProcess_FailOnFirestoreWrite(t *testing.T) {
	// Setup
	// Base64encoded string: "test_base64_image_data"
	base64Image := "dGVzdF9iYXNlNjRfaW1hZ2VfZGF0YQ=="
	userId := "test_user_id"
	// Set the environment variables
	os.Setenv("OPENAI_API_KEY", "your_value")
	defer os.Unsetenv("OPENAI_API_KEY")
	os.Setenv("REPLICATE_API_TOKEN", "your_value")
	defer os.Unsetenv("REPLICATE_API_TOKEN")

	// Mock StorageClient with successful writes
	mockStorage := &MockStorageClient{
		WriteFunc: func(ctx context.Context, bucketName, objectName string, data []byte, contentType string) error {
			return nil
		},
	}

	// Mock FirestoreClient to fail on AddDocument
	mockFirestore := &MockFirestoreClient{
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
                                "content": "{\"name\": \"Glimmering Griffon\", \"description\": \"A majestic griffon with shimmering golden feathers and a piercing gaze.\", \"image_generation_prompt\": \"A griffon with golden feathers soaring through a cloudy sky, sunlight reflecting off its wings.\"}"
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
	err := ip.Process(&base64Image, &userId)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "firestore write failed")
}
