package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"firebase.google.com/go/auth"
)

type mockAuthClient struct {
	verifyFunc func(context.Context, string) (*auth.Token, error)
}

func (m *mockAuthClient) VerifyIDToken(ctx context.Context, token string) (*auth.Token, error) {
	return m.verifyFunc(ctx, token)
}

func TestAuthMiddleware(t *testing.T) {
	tests := []struct {
		name           string
		authHeader     string
		setupMock      func(context.Context, string) (*auth.Token, error)
		expectedStatus int
	}{
		{
			name:       "Valid token",
			authHeader: "Bearer valid-token",
			setupMock: func(ctx context.Context, token string) (*auth.Token, error) {
				return &auth.Token{UID: "test-user"}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Missing Bearer prefix",
			authHeader:     "valid-token",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Empty Authorization header",
			authHeader:     "",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:       "Invalid token",
			authHeader: "Bearer invalid-token",
			setupMock: func(ctx context.Context, token string) (*auth.Token, error) {
				return nil, errors.New("invalid token")
			},
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := &mockAuthClient{
				verifyFunc: tt.setupMock,
			}

			handler := AuthMiddleware(mockClient)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				token, ok := GetAuthenticatedUser(r.Context())
				if !ok && tt.expectedStatus == http.StatusOK {
					t.Error("Expected user token in context, got none")
				}
				if ok && token == nil {
					t.Error("Got ok=true but nil token")
				}
				w.WriteHeader(http.StatusOK)
			}))

			req := httptest.NewRequest("GET", "/", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("Expected status code %d, got %d", tt.expectedStatus, rr.Code)
			}
		})
	}
}

func TestGetAuthenticatedUser(t *testing.T) {
	tests := []struct {
		name     string
		ctx      context.Context
		wantUser *auth.Token
		wantOk   bool
	}{
		{
			name:     "Context with user",
			ctx:      context.WithValue(context.Background(), userContextKey, &auth.Token{UID: "test-user"}),
			wantUser: &auth.Token{UID: "test-user"},
			wantOk:   true,
		},
		{
			name:     "Context without user",
			ctx:      context.Background(),
			wantUser: nil,
			wantOk:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotUser, gotOk := GetAuthenticatedUser(tt.ctx)
			if gotOk != tt.wantOk {
				t.Errorf("GetAuthenticatedUser() gotOk = %v, want %v", gotOk, tt.wantOk)
			}
			if tt.wantOk && gotUser.UID != tt.wantUser.UID {
				t.Errorf("GetAuthenticatedUser() gotUser = %v, want %v", gotUser, tt.wantUser)
			}
		})
	}
}
