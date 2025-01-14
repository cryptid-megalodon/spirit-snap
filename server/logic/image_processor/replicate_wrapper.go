package image_processor

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func replicateSchnellGenerateImation(prompt *string, httpClient *http.Client) ([]byte, error) {
	apiKey := os.Getenv("REPLICATE_API_TOKEN")
	if apiKey == "" {
		return nil, fmt.Errorf("replicate API token not set")
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
			"output_quality": 90,
			// // Number of denoising steps; lower steps produce faster but lower quality results
			"num_inference_steps": 4,
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Token "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "wait")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Check if the status code indicates success
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body) // Read the body in case of error for debugging
		//lint:ignore ST1005 Capitilization is intentional as it is the API provider's name.
		return nil, fmt.Errorf("Replicate API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, err
	}

	image_uri, err := getImageUriFromReplicateSchnellResponse(result)
	if err != nil {
		return nil, fmt.Errorf("unexpected replicate API response: %s", err)
	}
	// Download generated image
	imageResp, err := httpClient.Get(image_uri)
	if err != nil {
		return nil, err
	}
	defer imageResp.Body.Close()
	generatedImage, err := io.ReadAll(imageResp.Body)
	if err != nil {
		return nil, err
	}
	return generatedImage, nil
}
func replicatePro1_1GenerateImage(prompt *string, httpClient *http.Client) ([]byte, error) {
	apiKey := os.Getenv("REPLICATE_API_TOKEN")
	if apiKey == "" {
		return nil, fmt.Errorf("replicate API token not set")
	}

	requestBody := map[string]interface{}{
		"input": map[string]interface{}{
			// Prompt for generated image
			"prompt": prompt,
			// Format of the output images
			"output_format": "webp",
			// Random seed for reproducible generation
			"seed":         42,
			"width":        1024,
			"height":       1024,
			"aspect_ratio": "1:1",
			// Quality when saving the output images, from 0 to 100 (not relevant for .png outputs)
			"output_quality": 90,
			// Use an LLM to improve the prompt.
			"prompt_upsampling": false,
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Token "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "wait")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Check if the status code indicates success
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body) // Read the body in case of error for debugging
		//lint:ignore ST1005 Capitilization is intentional as it is the API provider's name.
		return nil, fmt.Errorf("Replicate API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, err
	}

	image_uri, err := getImageUriFromReplicateFluxPro1_1Response(result)
	if err != nil {
		return nil, fmt.Errorf("unexpected replicate API response: %s", err)
	}
	// Download generated image
	imageResp, err := httpClient.Get(image_uri)
	if err != nil {
		return nil, err
	}
	defer imageResp.Body.Close()
	generatedImage, err := io.ReadAll(imageResp.Body)
	if err != nil {
		return nil, err
	}
	return generatedImage, nil
}

// This function takes a JSON response from the Replicate Image Generation API
// and safely retrieves the base64 image data from it.
func getImageUriFromReplicateSchnellResponse(result map[string]interface{}) (string, error) {
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

// This function takes a JSON response from the Replicate Image Generation API
// and safely retrieves the base64 image data from it.
func getImageUriFromReplicateFluxPro1_1Response(result map[string]interface{}) (string, error) {
	// Access the "output" field directly in the top-level map
	output, ok := result["output"]
	if !ok {
		return "", fmt.Errorf("missing 'output' field")
	}

	// Retrieve the first item in the "output" array, expecting it to be a string
	imageData, ok := output.(string)
	if !ok {
		return "", fmt.Errorf("'output' is not a string containing base64 image data")
	}

	return imageData, nil
}
