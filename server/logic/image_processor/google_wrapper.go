package image_processor

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"golang.org/x/oauth2/google"
)

// Regions currently serving imagen 3. Generated from inspecting the drop down list on:
// https://console.cloud.google.com/vertex-ai/studio/vision?project=spirit-snap&inv=1&invt=AbmsiA
var regions = []string{
	"us-central1",
	"northamerica-northeast1",
	"southamerica-east1",
	"us-east1",
	"us-east4",
	"us-east5",
	"us-south1",
	"us-west1",
	"us-west4",
	"asia-east1",
	"asia-east2",
	"asia-northeast1",
	"asia-northeast3",
	"asia-south1",
	"asia-southeast1",
	"australia-southeast1",
	"europe-central2",
	"europe-north1",
	"europe-southwest1",
	"europe-west1",
	"europe-west2",
	"europe-west3",
	"europe-west4",
	"europe-west6",
	"europe-west8",
	"europe-west9",
	"me-central1",
	"me-central2",
	"me-west1",
}

var currentRegionIndex = 0

func getNextRegion() string {
	region := regions[currentRegionIndex]
	currentRegionIndex = (currentRegionIndex + 1) % len(regions)
	return region
}

// Model Documentation: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api#model-versions
// var modelName = "imagen-3.0-fast-generate-001"
var modelName = "imagen-3.0-generate-001"

func googleImagenGenerateImage(prompt *string, httpClient *http.Client) ([]byte, error) {
	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT_ID")
	if projectID == "" {
		return nil, fmt.Errorf("Google Cloud project ID not set")
	}

	requestBody := map[string]interface{}{
		"instances": []map[string]interface{}{
			{
				"prompt": prompt,
			},
		},
		// Parameter Reference: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api#parameter_list
		"parameters": map[string]interface{}{
			"sampleCount":      1,
			"aspectRatio":      "1:1",
			"personGeneration": "dont_allow",
			"safetySetting":    "block_only_high",
			"addWatermark":     false,
			"outputOptions": map[string]interface{}{
				"mimeType": "image/png",
			},
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}
	location := getNextRegion()
	url := fmt.Sprintf("https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:predict",
		location, projectID, location, modelName)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	// Get access token using gcloud
	accessToken, err := GetAccessToken()
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Google Imagen API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, err
	}

	imageData, err := getImageFromGoogleResponse(result)
	if err != nil {
		return nil, fmt.Errorf("unexpected Google Imagen API response: %s", err)
	}
	return imageData, nil
}

// GetAccessToken retrieves an OAuth2 access token using the Service Account credentials
func GetAccessToken() (string, error) {
	jsonCredentials := os.Getenv("FIREBASE_CREDENTIALS_JSON")
	if jsonCredentials == "" {
		log.Fatal("FIREBASE_CREDENTIALS_JSON environment variable is not set")
	}

	// Parse the credentials
	ctx := context.Background()
	creds, err := google.CredentialsFromJSON(ctx, []byte(jsonCredentials), "https://www.googleapis.com/auth/cloud-platform")
	if err != nil {
		return "", fmt.Errorf("failed to parse service account credentials: %w", err)
	}

	// Retrieve the token
	tokenSource := creds.TokenSource
	token, err := tokenSource.Token()
	if err != nil {
		return "", fmt.Errorf("failed to retrieve access token: %w", err)
	}

	return token.AccessToken, nil
}

func getImageFromGoogleResponse(result map[string]interface{}) ([]byte, error) {
	predictions, ok := result["predictions"].([]interface{})
	if !ok || len(predictions) == 0 {
		return nil, fmt.Errorf("missing or empty 'predictions' array")
	}

	prediction, ok := predictions[0].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid prediction format")
	}

	imageData, ok := prediction["bytesBase64Encoded"].(string)
	if !ok {
		return nil, fmt.Errorf("missing or invalid 'bytesBase64Encoded' field")
	}

	decodedImageData, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64 image data: %w", err)
	}

	return decodedImageData, nil
}
