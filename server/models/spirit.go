package models

type Spirit struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	Description       string `json:"description"`
	PrimaryType       string `json:"primaryType"`
	SecondaryType     string `json:"secondaryType"`
	OriginalImageURL  string `json:"originalImageDownloadUrl"`
	GeneratedImageURL string `json:"generatedImageDownloadUrl"`

	Agility      *int `json:"agility"`
	Arcana       *int `json:"arcana"`
	Aura         *int `json:"aura"`
	Charisma     *int `json:"charisma"`
	Endurance    *int `json:"endurance"`
	Height       *int `json:"height"`
	Weight       *int `json:"weight"`
	Intimidation *int `json:"intimidation"`
	Luck         *int `json:"luck"`
	Strength     *int `json:"strength"`
	Toughness    *int `json:"toughness"`
}
