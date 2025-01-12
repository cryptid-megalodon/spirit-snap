package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"

	"firebase.google.com/go/auth"
)

// Key type for storing user information in context
type contextKey string

const userContextKey = contextKey("user")

type AuthInterface interface {
	VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error)
}

// AuthMiddleware returns a middleware that authenticates requests using Firebase ID tokens.
func AuthMiddleware(authClient AuthInterface) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if !strings.HasPrefix(authHeader, "Bearer ") {
				log.Printf("Authorization Header: %s", authHeader)
				http.Error(w, "Unauthorized: missing or invalid Authorization header", http.StatusUnauthorized)
				return
			}

			idToken := strings.TrimPrefix(authHeader, "Bearer ")

			// Verify the ID token
			token, err := authClient.VerifyIDToken(r.Context(), idToken)
			if err != nil {
				log.Printf("Token verification failed: %v", err)
				http.Error(w, "Unauthorized: invalid ID token", http.StatusUnauthorized)
				return
			}

			// Attach user information to the context
			ctx := context.WithValue(r.Context(), userContextKey, token)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetAuthenticatedUser retrieves the authenticated user's token from the context.
func GetAuthenticatedUser(ctx context.Context) (*auth.Token, bool) {
	token, ok := ctx.Value(userContextKey).(*auth.Token)
	return token, ok
}
