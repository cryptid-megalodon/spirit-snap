# Golang Server in Docker Container (GCP Serverless Setup)

This project sets up a simple Golang server, containerized using Docker, and deployed to **Google Cloud Run** for a fully managed, serverless application. **Google Cloud Run** automatically scales your application based on traffic, without having to manage the underlying infrastructure.

## Overview
- **Language**: Go (Golang)
- **Containerization**: Docker
- **Deployment Platform**: Google Cloud Run (Serverless)
- **Cloud Provider**: Google Cloud Platform (GCP)

---

## Prerequisites

1. **Google Cloud Account**: You need a [Google Cloud](https://cloud.google.com/) account.
2. **GCP CLI (gcloud)**: Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and authenticate by running:
    ```bash
    gcloud auth login
    ```
3. **Docker**: Ensure [Docker](https://www.docker.com/) is installed and running on your machine.
4. **Go (Golang)**: Install [Go](https://golang.org/doc/install).

---

## Instructions

### Setup and Running Locally

#### Step 1. **Build the Docker Container**

To build the Docker image locally:

```bash
docker build -t gcr.io/spirit-snap/server .
```

#### Step 2. **Test the Docker Container Locally**

Run the Docker container locally to ensure everything works:

```bash
docker compose up
```

You can now post to endpoints at `http://localhost:8080`. The best way to do
this is using an Expo Go version of the client or a developement version of the
app where you can set the address of the backend. NOTE: you may probably need
to specify the ip address of the local backend, not localhost.

#### Step 3. **Start the Expo Go Frontend Client**

Set the appropriate backend ip address in the client .env file. To find the
address on linux run ifconfig. The address should start with 192.168.

Set the EXPO_PUBLIC_BACKEND_SERVER_URL environment variable to correct address
and port number.

Run the following command to run the Metro server. Make sure it's running
in Expo Go mode, not developement mode.

```bash
npx expo start
```

Scan the QR code with the Expo Go app and select the Expo Go mode.

Play around with the local dev version of the client and backend!

---

### Testing with a GCP Serverless Backend

#### Step 1: Tag the Docker image for GCR

Tag the build with relevant version or feature informatoin to identify it.

```bash
docker tag gcr.io/spirit-snap/server v0.xx
```

#### Step 2: Push the image to Google Container Registry

```bash
docker push gcr.io/spirit-snap/server
```

#### Step 3: **Deploy the Docker Image to Google Cloud Run**

Deploy your container to **Google Cloud Run**.

```bash
gcloud run deploy spirit-snap-server \
    --image gcr.io/spirit-snap/my-go-server \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

This command:
- Deploys the container to Cloud Run.
- Sets it to run in the `us-central1` region.
- Allows unauthenticated requests (public access).

#### Step 5: **Test the Deployed Service**

After deployment, you’ll get a URL for your service. You can point an Expo Go
dev client at this by setting the EXPO_PUBLIC_BACKEND_SERVER_URL environment
variable in the client .env.

#### Step 6: **Delete the Cloud Run Service**

If you want to stop or delete the service to avoid incurring costs:

```bash
gcloud run services delete spirit-snap-server --region us-central1
```

---

## Additional Commands

### List Cloud Run Services
To list all services deployed in Cloud Run:

```bash
gcloud run services list --region us-central1
```

### View Cloud Run Logs
To check logs for your service:

```bash
gcloud logs read --platform run
```

---
