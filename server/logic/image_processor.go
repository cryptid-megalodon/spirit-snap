// The logic for the processImage handler endpoint.
package logic

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"spirit-snap/server/utils/datastore"
	"spirit-snap/server/utils/file_storage"
	"strings"
	"time"
)

type Processor interface {
	Process(image *string) error
	Close()
}

type ImageProcessor struct {
	StorageClient   file_storage.FileStorage
	FirestoreClient datastore.Datastore
	HttpClient      *http.Client
}

func NewImageProcessor(storage file_storage.FileStorage, ds datastore.Datastore, rt http.RoundTripper) *ImageProcessor {
	// To idiomatically mock HTTP clients, you mock the connectivity component i.e. the RoundTripper which makes the network calls.
	httpClient := &http.Client{
		Transport: rt,
	}
	return &ImageProcessor{
		StorageClient:   storage,
		FirestoreClient: ds,
		HttpClient:      httpClient,
	}
}

func (ip *ImageProcessor) Close() {
	ip.StorageClient.Close()
	ip.FirestoreClient.Close()
}

// This is the implementation for the processImage endpoint. It will be called
// at high QPS.
func (ip *ImageProcessor) Process(base64Image *string) error {
	generatedImageData := make(map[string]interface{})
	// ISO 8601 Timestamp (human-readable UTC date and time)
	timestamp := time.Now().UTC().Format(time.RFC3339)
	generatedImageData["image_timestamp"] = timestamp

	originalFilename := fmt.Sprintf("%s-original.jpeg", timestamp)
	generatedFilename := fmt.Sprintf("%s-generated.webp", timestamp)

	// Step 1: Get the image caption from OpenAI
	caption, err := ip.getImageCaption(base64Image)
	if err != nil || caption == "" {
		return err
	}
	generatedImageData["caption"] = caption

	// Step 2: Generate cartoon monster image using Replicate
	generatedImageURI, err := ip.generateCartoonMonster(&caption)
	if err != nil || generatedImageURI == "" {
		return err
	}

	const origPrefix = "data:image/jpg;base64,"
	trimmedBase64Image := strings.TrimPrefix(*base64Image, origPrefix)

	// Decode the base64-encoded image data
	decodedOrigImageData, err := base64.StdEncoding.DecodeString(trimmedBase64Image)
	if err != nil {
		return fmt.Errorf("failed to decode original base64 image data: %v", err)
	}

	// Download generated image
	resp, err := ip.HttpClient.Get(generatedImageURI)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	generatedImage, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// Step 3: Upload results to Firebase Storage and Firestore
	ctx := context.Background()
	origDownloadURL, err := ip.StorageClient.Write(ctx, "spirit-snap.appspot.com", "images/"+originalFilename, []byte(decodedOrigImageData), "image/jpeg")
	if err != nil {
		return err
	}

	genDownloadURL, err := ip.StorageClient.Write(ctx, "spirit-snap.appspot.com", "images/"+generatedFilename, generatedImage, "image/webp")
	if err != nil {
		return err
	}
	generatedImageData["originalImageDownloadUrl"] = origDownloadURL
	generatedImageData["generatedImageDownloadUrl"] = genDownloadURL

	err = ip.FirestoreClient.AddDocument(ctx, "generatedImages", generatedImageData)
	if err != nil {
		return err
	}

	return nil
}

func (ip *ImageProcessor) getImageCaption(base64Image *string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("OpenAI API key not set")
	}

	requestBody := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]interface{}{
			{
				"role": "user",
				"content": []map[string]interface{}{
					{
						"type": "text",
						"text": `Write a prompt for an image generation model that captures the content of this image as a cartoon monster. Imagine creative traits and features about the monster that modify the creature's appearance in the prompt. The image should have a vibrant anime art style.`,
					},
					{
						"type": "image_url",
						"image_url": map[string]interface{}{
							"url": *base64Image,
						},
					},
				},
			},
		},
		"max_tokens": 300,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := ip.HttpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Check if the status code indicates success
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body) // Read the body in case of error for debugging
		return "", fmt.Errorf("OpenAI API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return "", err
	}

	caption, err := safelyRetrieveCaption(result)
	if err != nil {
		return "", fmt.Errorf("unexpected OpenAI API response: %s", err)
	}
	return caption, nil
}

func (ip *ImageProcessor) generateCartoonMonster(prompt *string) (string, error) {
	apiKey := os.Getenv("REPLICATE_API_TOKEN")
	if apiKey == "" {
		return "", fmt.Errorf("replicate API token not set")
	}

	requestBody := map[string]interface{}{
		"input": map[string]interface{}{
			// Prompt for generated image
			"prompt": prompt,
			// Format of the output images
			"output_format": "webp",
			// Random seed for reproducible generation
			"seed": 42,
			// Run faster predictions with model optimized for speed (currently fp8 quantized); disable to run in original bf16
			"go_fast": true,
			// Disable safety checker for generated images.
			"disable_safety_checker": true,
			// Approximate number of megapixels for generated image
			"megapixels": "1",
			// Number of outputs to generate
			"num_outputs": 1,
			// Aspect ratio for the generated image
			"aspect_ratio": "1:1",
			// Quality when saving the output images, from 0 to 100 (not relevant for .png outputs)
			"output_quality": 80,
			// Number of denoising steps; lower steps produce faster but lower quality results
			"num_inference_steps": 4,
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Token "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "wait")

	resp, err := ip.HttpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Check if the status code indicates success
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body) // Read the body in case of error for debugging
		//lint:ignore ST1005 Capitilization is intentional as it is the API provider's name.
		return "", fmt.Errorf("Replicate API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return "", err
	}

	image_uri, err := safelyRetrieveImageData(result)
	if err != nil {
		return "", fmt.Errorf("unexpected replicate API response: %s", err)
	}
	return image_uri, nil
}

// This function takes a JSON response from the OpenAI Completions API and safely
// retrieves the image caption from it.
func safelyRetrieveCaption(result map[string]interface{}) (string, error) {
	choices, ok := result["choices"]
	if !ok {
		return "", fmt.Errorf("missing 'choices' key in response")
	}

	// Check that 'choices' is of the expected type ([]interface{})
	choiceArray, ok := choices.([]interface{})
	if !ok || len(choiceArray) == 0 {
		return "", fmt.Errorf("'choices' is not an array or is empty")
	}

	// Access the first choice safely
	firstChoice, ok := choiceArray[0].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected format for 'choices[0]'")
	}

	// Access the "message" field in the first choice
	message, ok := firstChoice["message"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("missing or invalid 'message' in choices[0]")
	}

	// Access the "content" field in the "message" map
	content, ok := message["content"].(string)
	if !ok {
		return "", fmt.Errorf("missing or invalid 'content' in message")
	}

	return content, nil
}

// This function takes a JSON response from the Replicate Image Generation API
// and safely retrieves the base64 image data from it.
func safelyRetrieveImageData(result map[string]interface{}) (string, error) {
	// Access the "output" field directly in the top-level map
	output, ok := result["output"].([]interface{})
	if !ok || len(output) == 0 {
		return "", fmt.Errorf("missing or empty 'output' array")
	}

	// Retrieve the first item in the "output" array, expecting it to be a string
	imageData, ok := output[0].(string)
	if !ok {
		return "", fmt.Errorf("'output[0]' is not a string containing base64 image data")
	}

	return imageData, nil
}
