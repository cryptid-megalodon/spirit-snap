package models

type Spirit struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	Description       string `json:"description"`
	PrimaryType       string `json:"primaryType"`
	SecondaryType     string `json:"secondaryType"`
	OriginalImageURL  string `json:"originalImageDownloadUrl"`
	GeneratedImageURL string `json:"generatedImageDownloadUrl"`
}
