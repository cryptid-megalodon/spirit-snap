// This is the RESTful API for Spirit Snap.
//
// It is responsible for responding to and routing HTTP requests to the
// appropriate handlers. Business logic and network routing happen in this
// file. Core app logic happens in the implementation files for each endpoint.

package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"spirit-snap/server/logic"
	"spirit-snap/server/utils/datastore"
	"spirit-snap/server/utils/file_storage"
)

type Server struct {
	ImageProcessor logic.Processor
}

func NewServer(storage file_storage.FileStorage, ds datastore.Datastore, rt http.RoundTripper) *Server {
	// To idiomatically mock HTTP clients, you mock the connectivity component i.e. the RoundTripper which makes the network calls.
	return &Server{
		ImageProcessor: logic.NewImageProcessor(storage, ds, rt),
	}
}

func (s *Server) Close() {
	s.ImageProcessor.Close()
}

type ImageData struct {
	Base64Image string
}

// Hanldes the HTTP details for the processImage endpoint.
func (s *Server) processImageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var image ImageData
	err := json.NewDecoder(r.Body).Decode(&image)
	if err != nil {
		log.Printf("Error during JSON decoding: %s", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err = s.ImageProcessor.Process(&image.Base64Image)
	if err != nil {
		log.Printf("Error during image processing: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Image processed successfully"))
}

func main() {
	// Define a flag for the port number with a default value of 8080.
	port := *flag.Int("port", 8080, "Port for the HTTP server")
	flag.Parse()

	// Initialize connections.
	ctx := context.Background()
	fs, err := file_storage.NewFirebaseStorageClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create Firebase storage client: %v", err)
	}
	project_id := os.Getenv("GOOGLE_CLOUD_PROJECT_ID")
	ds, err := datastore.NewFirestoreClient(ctx, project_id)
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	rt := http.DefaultTransport

	s := NewServer(fs, ds, rt)
	defer s.Close()

	http.HandleFunc("/ProcessImage", s.processImageHandler)
	portMessage := fmt.Sprintf("Server is running on port %d.", port)
	fmt.Println(portMessage)
	log.Print(portMessage)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}
