// The logic for the processImage handler endpoint.
package logic

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
	"strings"
	"time"
)

const humanReadablePrompt = `
Imagine a new creature based on the subject of this image. Create a
cohesive name, description and a prompt for an image generation model
that will generate an image for the creature. Imagine creative traits and features
about the monster that highlight or modify the subject's appearance in the prompt.
The image should have a vibrant anime art style.`

var prompt = strings.ReplaceAll(humanReadablePrompt, "\n", " ")

const humanReadableCreatureNamePrompt = `
Create a name for a creature in a game, following these guidelines:

1. **Portmanteau and Fusion Words**: Combine two or more words related to the creature’s abilities, appearance, or type. For example, a plant-reptile creature could be named "Floragon" (flora + dragon) or "Leafor" (leaf + roar).

2. **Sound Mimicry**: Use sounds that resemble or evoke the creature’s characteristics. For a quick, agile creature, consider a name with snappy or sharp sounds like "Zapet" or "Flink."

3. **Descriptive Elements**: Include words or syllables that hint at the creature’s elemental type, habitat, or behavior. For a fire-breathing canine, a name like "Blazehound" or "Inferfang" could convey its fiery, fierce nature.

4. **Phonetic Appeal**: Make the name catchy, short, and easy to say. Simple, memorable names like "Mondo" or "Peblar" are easy to remember and give the creature a unique identity.

5. **Playful Alliteration and Rhyming**: Consider names that rhyme or use repetition to add charm, like "Scorpy Pounce" for a scorpion-like creature, or "Fluffyflame" for a gentle fire creature.

6. **Cultural and Linguistic References**: Draw inspiration from mythological, linguistic, or cultural references that match the creature's background or lore. For example, "Drakonis" might be a name for a dragon-inspired creature, borrowing from ancient mythology.

### Examples:
- For a water-dwelling snake, you could create names like "Aquasnake," "Hydravine," or "Ripcoil."
- For an icy bird, names could include "Frostfeather," "Glaciawl," or "Snowflap."
- For a creature with electricity-based powers, try names like "Boltstrike," "Zapico," or "Electross."

Use these ideas to create a name that feels both imaginative and descriptive, helping players instantly connect with the creature’s nature and abilities.`

var creatureNamePrompt = strings.ReplaceAll(humanReadableCreatureNamePrompt, "\n", " ")

const humanReadableSpritePrompt = `
Create a text-to-image prompt for a creature sprite in a game, incorporating the following guidelines to capture an imaginative, pixel-art style. Aim for a design that is compact, visually engaging, and communicates the creature’s unique traits.

1. **Compact and Expressive Design**: Describe the creature’s defining features, colors, and shape so that it’s clear in a small, pixelated form. Focus on elements that communicate personality, such as a happy expression, a fierce stance, or a mischievous glint in the eyes.

2. **Stylized Proportions**: Emphasize unique features by suggesting enlarged or stylized proportions. For example, if it’s a fast creature, suggest long limbs; if it’s a wise creature, suggest large eyes or an owl-like head.

3. **Whimsical and Surprising Elements**: Include one or two imaginative twists, such as unusual limbs, elemental features (like flames, ice crystals, or vines), or magical accessories. For example, “A small lizard with a flaming tail” or “An owl with branches instead of wings.”

4. **Vibrant Color Palettes**: Specify colors that reflect the creature’s elemental or personality traits (e.g., fiery reds and oranges, earthy greens and browns, icy blues and whites). Mention color accents that enhance these traits, like “a bright red shell with yellow spikes.”

5. **Expressive Poses or Subtle Animations**: Suggest an expressive pose that hints at the creature’s character, such as a “confident, forward stance” for a brave creature or a “playful, crouching position” for a shy one. If animated, mention small, repetitive movements, like a flickering tail or blinking eyes.

6. **Detail and Minimalist Shading**: Mention basic shading and details to give dimension without over-complicating the sprite. For example, “Add light shadowing under its feet for depth” or “Use simple highlights to suggest a glossy, metallic surface.”

### Example Prompts:
- "A small, chubby dragon with a rounded snout, large, friendly eyes, and tiny wings. It has green scales with light yellow highlights and a curled tail. In a playful, seated pose, looking up with curiosity."
- "A fierce, fox-like creature with sharp red fur, blue lightning bolt markings, and narrowed yellow eyes. The sprite is small but includes a dynamic, lunging pose to show its speed."
- "A plant-inspired creature, resembling a turtle with leaves growing from its back. It has a gentle expression, with vibrant green shell and earthy brown legs. The sprite is facing forward with a peaceful pose."

Create a prompt with these elements to capture the creature’s defining features and overall personality while keeping the design simple, expressive, and suitable for a pixel-art sprite.`

var spritePrompt = strings.ReplaceAll(humanReadableSpritePrompt, "\n", " ")

const humanReadablePhotoObjectPrompt = `
What is the object in this photo?`

var photoObjectPrompt = strings.ReplaceAll(humanReadablePhotoObjectPrompt, "\n", " ")

const humanReadableDescriptionPrompt = `
Create a new entry for this creature in the monster encyclopedia, the intent should
be to give readers a meaningful glimpse into the creature’s life cycle,
behaviors, or unique attributes in a way that feels both credible and
enchanting. Each entry should provide a standalone insight, highlighting
either an aspect of the creature’s appearance, abilities, or behavior. When
creating entries for new creatures, authors might aim to blend the familiar
and the fantastical, grounding each creature in an observable, relatable
behavior that invites players to imagine the creature’s life in its world
while hinting at its powers or evolutionary potential.`

var descriptionPrompt = strings.ReplaceAll(humanReadableDescriptionPrompt, "\n", " ")

const humanReadablePrimaryTypePrompt = `
Select the creature type that best represents the creature's style and captures
its natural elemental affinities.`

var primaryTypePrompt = strings.ReplaceAll(humanReadablePrimaryTypePrompt, "\n", " ")

const humanReadableSecondaryTypePrompt = `
If the creature has a compelling secondary type that adds more character, pick
a secondary type. Otherwise pick "None". A single type can be more compelling
if it's a strong fit for the creature's lore or background.`

var secondaryTypePrompt = strings.ReplaceAll(humanReadableSecondaryTypePrompt, "\n", " ")

const humanReadableHeightPrompt = `
Calculate the creature's height based on its physical description and lore. Height should be the number of centimeters.`

var heightPrompt = strings.ReplaceAll(humanReadableHeightPrompt, "\n", " ")

const humanReadableWeightPrompt = `
Calculate the creature's weight based on its physical description and lore. Weight should be the number of kilograms.`

var weightPrompt = strings.ReplaceAll(humanReadableWeightPrompt, "\n", " ")

const humanReadableStrengthPrompt = `
Calculate the creature's Strength based on its physical description, lore, and capabilities. Strength determines physical attack power and how much damage it can deal in physical moves.`

var strengthPrompt = strings.ReplaceAll(humanReadableStrengthPrompt, "\n", " ")

const humanReadableToughnessPrompt = `
Calculate the creature's Toughness based on its physical resilience, build, and lore. Toughness reduces the damage taken from physical attacks.`

var toughnessPrompt = strings.ReplaceAll(humanReadableToughnessPrompt, "\n", " ")

const humanReadableAgilityPrompt = `
Calculate the creature's Agility based on its speed, grace, and lore. Agility determines turn order in battles and increases the chance to dodge incoming attacks.`

var agilityPrompt = strings.ReplaceAll(humanReadableAgilityPrompt, "\n", " ")

const humanReadableArcanaPrompt = `
Calculate the creature's Arcana based on its mental or supernatural abilities, description, and lore. Arcana governs special attack power for mental or energy-based moves.`

var arcanaPrompt = strings.ReplaceAll(humanReadableArcanaPrompt, "\n", " ")

const humanReadableAuraPrompt = `
Calculate the creature's Aura based on its magical or supernatural resistance, description, and lore. Aura represents special defense, reducing the impact of mental or energy-based attacks.`

var auraPrompt = strings.ReplaceAll(humanReadableAuraPrompt, "\n", " ")

const humanReadableCharismaPrompt = `
Calculate the creature's Charisma based on its charm, persuasive nature, and lore. Charisma influences interactions, charm-based moves, and the ability to gain favor or allies.`

var charismaPrompt = strings.ReplaceAll(humanReadableCharismaPrompt, "\n", " ")

const humanReadableIntimidationPrompt = `
Calculate the creature's Intimidation based on its fearsome traits, imposing presence, and lore. Intimidation impacts an opponent's morale, increasing the likelihood of errors or lowering their stats temporarily.`

var intimidationPrompt = strings.ReplaceAll(humanReadableIntimidationPrompt, "\n", " ")

const humanReadableEndurancePrompt = `
Calculate the creature's Endurance based on its size, stamina, and lore. Endurance governs the monster's health and how many hits it can take before being defeated.`

var endurancePrompt = strings.ReplaceAll(humanReadableEndurancePrompt, "\n", " ")

const humanReadableLuckPrompt = `
Calculate the creature's Luck based on its lore and any traits that suggest unpredictability or fortune. Luck affects critical hits, dodges, and random outcomes during battles or events.`

var luckPrompt = strings.ReplaceAll(humanReadableLuckPrompt, "\n", " ")

type Processor interface {
	Process(image *string, userId *string) error
	Close()
}

type CreatureData struct {
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
	Endurance             int    `json:"endurance"`    // Governs health and stamina
	Luck                  int    `json:"luck"`         // Adds an unpredictable element
}

type ImageProcessor struct {
	StorageClient   StorageInterface
	DatastoreClient DatastoreInterface
	HttpClient      *http.Client
}

// StorageInterface defines an interface for interacting with Storeage Wrapper.
type StorageInterface interface {
	Write(ctx context.Context, bucketName, objectName string, data []byte, contentType string) (string, error)
}

// DatastoreInterface is an interface that defines methods for interacting with the Datastore backend.
// It allows for dependency injection and easier testing by allowing mocking of DatastoreClient interactions.
type DatastoreInterface interface {
	AddDocument(ctx context.Context, collectionName string, data interface{}) error
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
func (ip *ImageProcessor) Process(base64Image *string, userId *string) error {
	generatedImageData := make(map[string]interface{})
	// ISO 8601 Timestamp (human-readable UTC date and time)
	timestamp := time.Now().UTC().Format(time.RFC3339)
	generatedImageData["imageTimestamp"] = timestamp

	originalFilename := fmt.Sprintf("%s-original.jpeg", timestamp)
	generatedFilename := fmt.Sprintf("%s-generated.webp", timestamp)

	// Step 1: Get the image caption from OpenAI
	creatureData, err := ip.createCreatureData(base64Image)
	if err != nil || creatureData == nil {
		return err
	}
	generatedImageData["name"] = creatureData.Name
	generatedImageData["description"] = creatureData.Description
	generatedImageData["imageGenerationPrompt"] = creatureData.ImageGenerationPrompt
	generatedImageData["photoObject"] = creatureData.PhotoObject
	generatedImageData["primaryType"] = creatureData.PrimaryType
	generatedImageData["secondaryType"] = creatureData.SecondaryType
	generatedImageData["height"] = creatureData.Height
	generatedImageData["weight"] = creatureData.Weight
	generatedImageData["strength"] = creatureData.Strength
	generatedImageData["toughness"] = creatureData.Toughness
	generatedImageData["agility"] = creatureData.Agility
	generatedImageData["arcana"] = creatureData.Arcana
	generatedImageData["aura"] = creatureData.Aura
	generatedImageData["charisma"] = creatureData.Charisma
	generatedImageData["intimidation"] = creatureData.Intimidation
	generatedImageData["endurance"] = creatureData.Endurance
	generatedImageData["luck"] = creatureData.Luck

	// Step 2: Generate cartoon monster image using Replicate
	generatedImageURI, err := ip.createCreatureImage(&creatureData.ImageGenerationPrompt)
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
	origDownloadURL, err := ip.StorageClient.Write(ctx, "spirit-snap.appspot.com", "photos/"+*userId+"/"+originalFilename, []byte(decodedOrigImageData), "image/jpeg")
	if err != nil {
		return err
	}

	genDownloadURL, err := ip.StorageClient.Write(ctx, "spirit-snap.appspot.com", "generatedImages/"+*userId+"/"+generatedFilename, generatedImage, "image/webp")
	if err != nil {
		return err
	}
	generatedImageData["originalImageDownloadUrl"] = origDownloadURL
	generatedImageData["generatedImageDownloadUrl"] = genDownloadURL

	err = ip.DatastoreClient.AddDocument(ctx, "users/"+*userId+"/spirits", generatedImageData)
	if err != nil {
		return err
	}

	return nil
}

func (ip *ImageProcessor) createCreatureData(base64Image *string) (*CreatureData, error) {
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
					},
					"required": []string{
						"name", "description", "image_generation_prompt", "photo_object", "primary_type",
						"secondary_type", "height", "weight", "strength", "toughness", "agility", "arcana",
						"aura", "charisma", "intimidation", "endurance", "luck",
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

	creatureData, err := getContentFromOpenAiResponse(result)
	if err != nil {
		return nil, fmt.Errorf("unexpected OpenAI API response: %s", err)
	}
	return creatureData, nil
}

func (ip *ImageProcessor) createCreatureImage(prompt *string) (string, error) {
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
func getContentFromOpenAiResponse(result map[string]interface{}) (*CreatureData, error) {
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
	var creatureData CreatureData

	err := json.Unmarshal([]byte(content), &creatureData)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling content: %v", err)
	}

	return &creatureData, nil
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
