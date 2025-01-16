// The logic for the processImage handler endpoint.
package image_processor

import (
	"context"
	"encoding/base64"
	"fmt"
	"math/rand"
	"net/http"
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
	GetDocumentsByIds(ctx context.Context, collectionName string, ids []string) ([]map[string]interface{}, error)
	GetDocumentsFilteredByValue(ctx context.Context, collectionName string, fieldName string, value any) ([]map[string]interface{}, error)
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
	ctx := context.Background()
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

	// Determine the Spirit's Move set.
	primaryTypePossibleMoves, err := ip.DatastoreClient.GetDocumentsFilteredByValue(ctx, "moves", "type", spiritData.PrimaryType)
	if err != nil {
		return models.Spirit{}, err
	}
	var secondaryTypePossibleMoves []map[string]interface{}
	if spiritData.SecondaryType != "None" {
		secondaryTypePossibleMoves, err = ip.DatastoreClient.GetDocumentsFilteredByValue(ctx, "moves", "type", spiritData.SecondaryType)
		if err != nil {
			return models.Spirit{}, err
		}
	}

	// Randomly select moves from primary and secondary types
	var selectedMoves []string

	// Select 2 random moves from primary type
	if len(primaryTypePossibleMoves) > 0 {
		selectedMoves = append(selectedMoves, selectRandomMoves(primaryTypePossibleMoves, 2)...)
	}
	// Select 2 random moves from secondary type if it exists.
	if len(secondaryTypePossibleMoves) > 0 {
		selectedMoves = append(selectedMoves, selectRandomMoves(secondaryTypePossibleMoves, 2)...)
	} else if len(primaryTypePossibleMoves) > 0 {
		selectedMoves = append(selectedMoves, selectRandomMoves(primaryTypePossibleMoves, 2)...)
	}
	doc["moveIds"] = selectedMoves

	// Step 2: Generate cartoon monster image using Replicate
	generatedImage, err := ip.createSpiritImage(&spiritData.ImageGenerationPrompt)
	if err != nil {
		return models.Spirit{}, err
	}

	const origPrefix = "data:image/jpg;base64,"
	trimmedBase64Image := strings.TrimPrefix(*base64Image, origPrefix)

	// Decode the base64-encoded image data
	decodedOrigImageData, err := base64.StdEncoding.DecodeString(trimmedBase64Image)
	if err != nil {
		return models.Spirit{}, fmt.Errorf("failed to decode original base64 image data: %v", err)
	}

	// Step 3: Upload results to Firebase Storage and Firestore
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
	// log.Printf("Generated image data: %+v", doc)
	doc["id"] = docId
	spirit := models.BuildSpiritfromDocData(ctx, ip.StorageClient, doc, ip.DatastoreClient)
	fmt.Printf("Move Names:\n")
	for _, move := range spirit.Moves {
		fmt.Printf("- %s\n", *move.Name)
	}
	return spirit, nil
}

func (ip *ImageProcessor) generateSpiritData(base64Image *string) (*SpiritData, error) {
	// "model": "gpt-4o-2024-08-06",
	// "model": "gpt-4o-2024-11-20",
	model := "gpt-4o-2024-11-20"
	spiritData, err := openAiGenerateSpirit(&model, base64Image, ip.HttpClient)
	if err != nil {
		return nil, err
	}
	fmt.Printf("Spirit Data:\n"+
		"Name: %s\n"+
		"Description: %s\n"+
		"Image Generation Prompt: %s\n"+
		"Photo Object: %s\n"+
		"Primary Type: %s\n"+
		"Secondary Type: %s\n",
		// "Height: %v\n"+
		// "Weight: %v\n"+
		// "Strength: %v\n"+
		// "Toughness: %v\n"+
		// "Agility: %v\n"+
		// "Arcana: %v\n"+
		// "Aura: %v\n"+
		// "Charisma: %v\n"+
		// "Intimidation: %v\n"+
		// "Endurance: %v\n"+
		// "Luck: %v\n"+
		// "Hit Points: %v\n",
		spiritData.Name,
		spiritData.Description,
		spiritData.ImageGenerationPrompt,
		spiritData.PhotoObject,
		spiritData.PrimaryType,
		spiritData.SecondaryType,
		// spiritData.Height,
		// spiritData.Weight,
		// spiritData.Strength,
		// spiritData.Toughness,
		// spiritData.Agility,
		// spiritData.Arcana,
		// spiritData.Aura,
		// spiritData.Charisma,
		// spiritData.Intimidation,
		// spiritData.Endurance,
		// spiritData.Luck,
		// spiritData.HitPoints)
	)
	return spiritData, nil
}

func (ip *ImageProcessor) createSpiritImage(prompt *string) ([]byte, error) {
	// return replicatePro1_1GenerateImage(prompt, ip.HttpClient)
	return googleImagenGenerateImage(prompt, ip.HttpClient)
}

func selectRandomMoves(possibleMoves []map[string]interface{}, count int) []string {
	var selectedMoves []string
	rand.Seed(time.Now().UnixNano())
	for i := 0; i < count && len(possibleMoves) > 0; i++ {
		idx := rand.Intn(len(possibleMoves))
		if moveID, ok := possibleMoves[idx]["id"].(string); ok {
			selectedMoves = append(selectedMoves, moveID)
		}
		// Remove selected move to avoid duplicates
		possibleMoves = append(possibleMoves[:idx], possibleMoves[idx+1:]...)
	}
	return selectedMoves
}
