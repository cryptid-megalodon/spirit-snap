package models

import "context"

// Helper function to safely extract integer fields from the doc
func GetOptionalIntField(doc map[string]interface{}, fieldName string) *int {
	value, ok := doc[fieldName]
	if !ok || value == nil {
		return nil
	}
	switch v := value.(type) {
	case int:
		return &v
	case int64:
		val := int(v)
		return &val
	case float64:
		val := int(v)
		return &val
	default:
		return nil
	}
}

// Helper function to safely extract string fields from the doc
func GetOptionalStringField(doc map[string]interface{}, fieldName string) *string {
	value, ok := doc[fieldName]
	if !ok || value == nil {
		return nil
	}
	if v, ok := value.(string); ok {
		return &v
	}
	return nil
}

// Helper function to safely extract string array fields from the doc
func GetOptionalStringArrayField(doc map[string]interface{}, fieldName string) []string {
	value, ok := doc[fieldName]
	if !ok || value == nil {
		return nil
	}

	if arr, ok := value.([]interface{}); ok {
		result := make([]string, len(arr))
		for i, v := range arr {
			if str, ok := v.(string); ok {
				result[i] = str
			}
		}
		return result
	}

	if arr, ok := value.([]string); ok {
		return arr
	}

	return nil
}

func getImageURL(ctx context.Context, storageClient StorageInterface, doc map[string]interface{}, pathField string) *string {
	if path, ok := doc[pathField].(string); ok {
		if url, err := storageClient.GetDownloadURL(ctx, "spirit-snap.appspot.com", path); err == nil {
			return &url
		}
	}
	return nil
}
