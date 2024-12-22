// The logic for the processImage handler endpoint.
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
	"spirit-snap/server/models"
	"strings"
	"time"
)

// JSON schema spec for unmarshelling the OpenAI API create spirit request.
type SpiritData struct {
	Name                  string `json:"name"`
	Description           string `json:"description"`
	ImageGenerationPrompt string `json:"image_generation_prompt"`
	PhotoObject           string `json:"photo_object"`
	PrimaryType           string `json:"primary_type"`
	SecondaryType         string `json:"secondary_type"`
	Height                int    `json:"height"`
	Weight                int    `json:"weight"`
	Strength              int    `json:"strength"`     // Governs physical attack power
	Toughness             int    `json:"toughness"`    // Represents physical defense
	Agility               int    `json:"agility"`      // Determines speed and evasion
	Arcana                int    `json:"arcana"`       // Governs special attack power
	Aura                  int    `json:"aura"`         // Represents special defense
	Charisma              int    `json:"charisma"`     // Determines charm and persuasiveness
	Intimidation          int    `json:"intimidation"` // Represents fearsome or imposing traits
	Endurance             int    `json:"endurance"`    // Governs stamina
	Luck                  int    `json:"luck"`         // Adds an unpredictable element
	HitPoints             int    `json:"hit_points"`   // The base hit points of the creature
}

type ImageProcessor struct {
	StorageClient   StorageInterface
	DatastoreClient DatastoreInterface
	HttpClient      *http.Client
}

// StorageInterface defines an interface for interacting with Storeage Wrapper.
type StorageInterface interface {
	Write(ctx context.Context, bucketName, objectName string, data []byte, contentType string) error
	GetDownloadURL(ctx context.Context, bucketName, objectName string) (string, error)
}

// DatastoreInterface is an interface that defines methods for interacting with the Datastore backend.
// It allows for dependency injection and easier testing by allowing mocking of DatastoreClient interactions.
type DatastoreInterface interface {
	AddDocument(ctx context.Context, collectionName string, data interface{}) (string, error)
	Close() error
}

func NewImageProcessor(storage StorageInterface, ds DatastoreInterface, rt http.RoundTripper) *ImageProcessor {
	// To idiomatically mock HTTP clients, you mock the connectivity component i.e. the RoundTripper which makes the network calls.
	httpClient := &http.Client{
		Transport: rt,
	}
	return &ImageProcessor{
		StorageClient:   storage,
		DatastoreClient: ds,
		HttpClient:      httpClient,
	}
}

func (ip *ImageProcessor) Close() {
	ip.DatastoreClient.Close()
}

// This is the implementation for the processImage endpoint. It will be called
// at high QPS.
func (ip *ImageProcessor) Process(base64Image *string, userId *string) (models.Spirit, error) {
	doc := make(map[string]interface{})
	// ISO 8601 Timestamp (human-readable UTC date and time)
	timestamp := time.Now().UTC().Format(time.RFC3339)
	doc["imageTimestamp"] = timestamp

	originalFilename := fmt.Sprintf("%s-original.jpeg", timestamp)
	generatedFilename := fmt.Sprintf("%s-generated.webp", timestamp)

	// Step 1: Get the image caption from OpenAI
	spiritData, err := ip.generateSpiritData(base64Image)
	if err != nil || spiritData == nil {
		return models.Spirit{}, err
	}
	doc["name"] = spiritData.Name
	doc["description"] = spiritData.Description
	doc["imageGenerationPrompt"] = spiritData.ImageGenerationPrompt
	doc["photoObject"] = spiritData.PhotoObject
	doc["primaryType"] = spiritData.PrimaryType
	doc["secondaryType"] = spiritData.SecondaryType
	doc["height"] = spiritData.Height
	doc["weight"] = spiritData.Weight
	doc["strength"] = spiritData.Strength
	doc["toughness"] = spiritData.Toughness
	doc["agility"] = spiritData.Agility
	doc["arcana"] = spiritData.Arcana
	doc["aura"] = spiritData.Aura
	doc["charisma"] = spiritData.Charisma
	doc["intimidation"] = spiritData.Intimidation
	doc["endurance"] = spiritData.Endurance
	doc["luck"] = spiritData.Luck
	doc["hitPoints"] = spiritData.HitPoints

	// Step 2: Generate cartoon monster image using Replicate
	generatedImageURI, err := ip.createSpiritImage(&spiritData.ImageGenerationPrompt)
	if err != nil || generatedImageURI == "" {
		return models.Spirit{}, err
	}

	const origPrefix = "data:image/jpg;base64,"
	trimmedBase64Image := strings.TrimPrefix(*base64Image, origPrefix)

	// Decode the base64-encoded image data
	decodedOrigImageData, err := base64.StdEncoding.DecodeString(trimmedBase64Image)
	if err != nil {
		return models.Spirit{}, fmt.Errorf("failed to decode original base64 image data: %v", err)
	}

	// Download generated image
	resp, err := ip.HttpClient.Get(generatedImageURI)
	if err != nil {
		return models.Spirit{}, err
	}
	defer resp.Body.Close()
	generatedImage, err := io.ReadAll(resp.Body)
	if err != nil {
		return models.Spirit{}, err
	}

	// Step 3: Upload results to Firebase Storage and Firestore
	ctx := context.Background()
	origFilePath := "photos/" + *userId + "/" + originalFilename
	if err := ip.StorageClient.Write(ctx, "spirit-snap.appspot.com", origFilePath, []byte(decodedOrigImageData), "image/jpeg"); err != nil {
		return models.Spirit{}, err
	}

	genFilePath := "generatedImages/" + *userId + "/" + generatedFilename
	if err := ip.StorageClient.Write(ctx, "spirit-snap.appspot.com", genFilePath, generatedImage, "image/webp"); err != nil {
		return models.Spirit{}, err
	}
	doc["originalImageFilePath"] = origFilePath
	doc["generatedImageFilePath"] = genFilePath

	docId, err := ip.DatastoreClient.AddDocument(ctx, "users/"+*userId+"/spirits", doc)
	if err != nil {
		return models.Spirit{}, err
	}
	log.Printf("Generated image data: %+v", doc)
	doc["id"] = docId
	spirit := models.ExtractSpiritfromDocData(ctx, ip.StorageClient, doc)
	return spirit, nil
}

func (ip *ImageProcessor) generateSpiritData(base64Image *string) (*SpiritData, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("OpenAI API key not set")
	}

	requestBody := map[string]interface{}{
		"model": "gpt-4o-mini",
		"messages": []map[string]interface{}{
			{
				"role": "user",
				"content": []map[string]interface{}{
					{
						"type": "text",
						"text": prompt,
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
		"response_format": map[string]interface{}{
			"type": "json_schema",
			"json_schema": map[string]interface{}{
				"name":   "cartoon_creature",
				"strict": true,
				"schema": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"name": map[string]interface{}{
							"type":        "string",
							"description": creatureNamePrompt,
						},
						"description": map[string]interface{}{
							"type":        "string",
							"description": descriptionPrompt,
						},
						"image_generation_prompt": map[string]interface{}{
							"type":        "string",
							"description": spritePrompt,
						},
						"photo_object": map[string]interface{}{
							"type":        "string",
							"description": photoObjectPrompt,
						},
						"primary_type": map[string]interface{}{
							"type":        "string",
							"description": primaryTypePrompt,
							"enum":        []string{"Fire", "Water", "Rock", "Grass", "Psychic", "Electric", "Fighting"},
						},
						"secondary_type": map[string]interface{}{
							"type":        "string",
							"description": secondaryTypePrompt,
							"enum":        []string{"None", "Fire", "Water", "Rock", "Grass", "Psychic", "Electric", "Fighting"},
						},
						"height": map[string]interface{}{
							"type":        "integer",
							"description": heightPrompt,
						},
						"weight": map[string]interface{}{
							"type":        "integer",
							"description": weightPrompt,
						},
						"strength": map[string]interface{}{
							"type":        "integer",
							"description": strengthPrompt,
						},
						"toughness": map[string]interface{}{
							"type":        "integer",
							"description": toughnessPrompt,
						},
						"agility": map[string]interface{}{
							"type":        "integer",
							"description": agilityPrompt,
						},
						"arcana": map[string]interface{}{
							"type":        "integer",
							"description": arcanaPrompt,
						},
						"aura": map[string]interface{}{
							"type":        "integer",
							"description": auraPrompt,
						},
						"charisma": map[string]interface{}{
							"type":        "integer",
							"description": charismaPrompt,
						},
						"intimidation": map[string]interface{}{
							"type":        "integer",
							"description": intimidationPrompt,
						},
						"endurance": map[string]interface{}{
							"type":        "integer",
							"description": endurancePrompt,
						},
						"luck": map[string]interface{}{
							"type":        "integer",
							"description": luckPrompt,
						},
						"hit_points": map[string]interface{}{
							"type":        "integer",
							"description": hitPointsPrompt,
						},
					},
					"required": []string{
						"name", "description", "image_generation_prompt", "photo_object", "primary_type",
						"secondary_type", "height", "weight", "strength", "toughness", "agility", "arcana",
						"aura", "charisma", "intimidation", "endurance", "luck", "hit_points",
					},
					"additionalProperties": false,
				},
			},
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := ip.HttpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Check if the status code indicates success
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body) // Read the body in case of error for debugging
		return nil, fmt.Errorf("OpenAI API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, err
	}

	spiritData, err := getContentFromOpenAiResponse(result)
	if err != nil {
		return nil, fmt.Errorf("unexpected OpenAI API response: %s", err)
	}
	return spiritData, nil
}

func (ip *ImageProcessor) createSpiritImage(prompt *string) (string, error) {
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

	image_uri, err := getImageFromReplicateResponse(result)
	if err != nil {
		return "", fmt.Errorf("unexpected replicate API response: %s", err)
	}
	return image_uri, nil
}

// This function takes a JSON response from the OpenAI Completions API and safely
// retrieves the generated JSON result.
func getContentFromOpenAiResponse(result map[string]interface{}) (*SpiritData, error) {
	choices, ok := result["choices"]
	if !ok {
		return nil, fmt.Errorf("missing 'choices' key in response")
	}

	// Check that 'choices' is of the expected type ([]interface{})
	choiceArray, ok := choices.([]interface{})
	if !ok || len(choiceArray) == 0 {
		return nil, fmt.Errorf("'choices' is not an array or is empty")
	}

	// Access the first choice safely
	firstChoice, ok := choiceArray[0].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected format for 'choices[0]'")
	}

	// Access the "message" field in the first choice
	message, ok := firstChoice["message"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("missing or invalid 'message' in choices[0]")
	}

	// Access the "content" field in the "message" map
	content, ok := message["content"].(string)
	if !ok {
		return nil, fmt.Errorf("missing or invalid 'content' in message")
	}
	log.Print("OpenAI Response:", content)

	// Create a map to store the parsed JSON
	var spiritData SpiritData

	err := json.Unmarshal([]byte(content), &spiritData)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling content: %v", err)
	}

	return &spiritData, nil
}

// This function takes a JSON response from the Replicate Image Generation API
// and safely retrieves the base64 image data from it.
func getImageFromReplicateResponse(result map[string]interface{}) (string, error) {
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
