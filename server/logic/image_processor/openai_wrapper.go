package image_processor

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func openAiGenerateSpirit(model_name *string, base64Image *string, httpClient *http.Client) (*SpiritData, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("OpenAI API key not set")
	}

	requestBody := map[string]interface{}{
		"model": model_name,
		"messages": []map[string]interface{}{
			{
				"role":    "system",
				"content": systemPrompt,
			},
			{
				"role": "user",
				"content": []map[string]interface{}{
					{
						"type": "text",
						"text": userPrompt,
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
							"enum": []string{
								"Sky",     // wind/freedom/height
								"Wave",    // water/fluidity/change
								"Flame",   // fire/passion/warmth
								"Stone",   // earth/endurance/stability
								"Frost",   // ice/preservation/cold
								"Growth",  // plant/nurturing/flourishing
								"Dream",   // mystery/psychic/illusion
								"Shadow",  // darkness/stealth/hidden
								"Light",   // illumination/truth/radiance
								"Spirit",  // essence/commonality/soul
								"Harmony", // peace/balance/order
								"Chaos",   // disorder/war/spontaneity
								"Steel",   // technology/craft/construction
								"Art",     // creativity/expression/beauty
								"Song",    // music/sound/rhythm
								"Spark",   // electricity/energy/power
								"Thread",  // patterns/connections/textiles
								"Rune",    // knowledge/symbols/writing
							},
						},
						"secondary_type": map[string]interface{}{
							"type":        "string",
							"description": secondaryTypePrompt,
							"enum": []string{
								"None",    // mono-type
								"Sky",     // wind/freedom/height
								"Wave",    // water/fluidity/change
								"Flame",   // fire/passion/warmth
								"Stone",   // earth/endurance/stability
								"Frost",   // ice/preservation/cold
								"Growth",  // plant/nurturing/flourishing
								"Dream",   // mystery/psychic/illusion
								"Shadow",  // darkness/stealth/hidden
								"Light",   // illumination/truth/radiance
								"Spirit",  // essence/commonality/soul
								"Harmony", // peace/balance/order
								"Chaos",   // disorder/war/spontaneity
								"Steel",   // technology/craft/construction
								"Art",     // creativity/expression/beauty
								"Song",    // music/sound/rhythm
								"Spark",   // electricity/energy/power
								"Thread",  // patterns/connections/textiles
								"Rune",    // knowledge/symbols/writing
							},
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

	resp, err := httpClient.Do(req)
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
	// log.Print("OpenAI Response:", content)

	// Create a map to store the parsed JSON
	var spiritData SpiritData

	err := json.Unmarshal([]byte(content), &spiritData)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling content: %v", err)
	}

	return &spiritData, nil
}
