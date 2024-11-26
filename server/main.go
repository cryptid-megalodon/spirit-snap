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
	"spirit-snap/server/middleware"
	"spirit-snap/server/wrappers/datastore"
	"spirit-snap/server/wrappers/file_storage"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"google.golang.org/api/option"
)

type ProcessorInterface interface {
	Process(image *string, userId *string) error
	Close()
}

type Server struct {
	FirebaseApp    *firebase.App
	ImageProcessor ProcessorInterface
	AuthClient     *auth.Client
}

func NewServer(ctx context.Context, firebaseApp *firebase.App, rt http.RoundTripper) (*Server, error) {
	storageClient, err := file_storage.NewClient(ctx, firebaseApp)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firebase Storage client: %v", err)
	}

	datastoreClient, err := datastore.NewClient(ctx, firebaseApp)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firestore client: %v", err)
	}

	authClient, err := firebaseApp.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firebase Auth client: %v", err)
	}

	return &Server{
		FirebaseApp:    firebaseApp,
		ImageProcessor: logic.NewImageProcessor(storageClient, datastoreClient, rt),
		AuthClient:     authClient,
	}, nil
}

func (s *Server) Close() {
	s.ImageProcessor.Close()
}

type ImageData struct {
	Base64Image string
}

// Hanldes the HTTP details for the processImage endpoint.
func (s *Server) processImageHandler(w http.ResponseWriter, r *http.Request) {
	log.Print("Received request to process image.")
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	token, ok := middleware.GetAuthenticatedUser(r.Context())
	if !ok {
		log.Printf("Error getting authenticated user.")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var image ImageData
	err := json.NewDecoder(r.Body).Decode(&image)
	if err != nil {
		log.Printf("Error during JSON decoding: %s", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err = s.ImageProcessor.Process(&image.Base64Image, &token.UID)
	if err != nil {
		log.Printf("Error during image processing: %s", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Image processed successfully"))
}

func main() {
	port := *flag.Int("port", 8080, "Port for the HTTP server")
	flag.Parse()

	jsonCredentials := os.Getenv("FIREBASE_CREDENTIALS_JSON")
	if jsonCredentials == "" {
		log.Fatal("FIREBASE_CREDENTIALS_JSON environment variable is not set")
	}

	ctx := context.Background()
	opts := option.WithCredentialsJSON([]byte(jsonCredentials))
	firebaseApp, err := firebase.NewApp(ctx, nil, opts)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase App: %v", err)
	}

	s, err := NewServer(ctx, firebaseApp, http.DefaultTransport)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}
	defer s.Close()

	mux := http.NewServeMux()

	mux.Handle("/ProcessImage", middleware.AuthMiddleware(s.AuthClient)(http.HandlerFunc(s.processImageHandler)))

	portMessage := fmt.Sprintf("Server is running on port %d.", port)
	fmt.Println(portMessage)
	log.Print(portMessage)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), mux))
}
