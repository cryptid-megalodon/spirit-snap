package auth

import (
	"context"
	"fmt"

	firebase "firebase.google.com/go"
	fireAuth "firebase.google.com/go/auth"
)

type Client struct {
	client *fireAuth.Client
}

func NewClient(ctx context.Context, firebaseApp *firebase.App) (*Client, error) {
	authClient, err := firebaseApp.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("error initializing Firebase Auth client: %v", err)
	}

	return &Client{
		client: authClient,
	}, nil
}

func (w *Client) VerifyIDToken(ctx context.Context, idToken string) (*fireAuth.Token, error) {
	token, err := w.client.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, fmt.Errorf("error verifying ID token: %v", err)
	}
	return token, nil
}

func (w *Client) GetUser(ctx context.Context, uid string) (*fireAuth.UserRecord, error) {
	user, err := w.client.GetUser(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("error getting user: %v", err)
	}
	return user, nil
}
