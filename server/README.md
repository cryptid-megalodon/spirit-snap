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
2. **GCP Project**: Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
3. **GCP CLI (gcloud)**: Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and authenticate by running:
    ```bash
    gcloud auth login
    ```
4. **Docker**: Ensure [Docker](https://www.docker.com/) is installed and running on your machine.
5. **Go (Golang)**: Install [Go](https://golang.org/doc/install).

---

## Setup and Running Locally

## Instructions

### 1. **Build the Docker Container**

To build the Docker image locally:

```bash
docker build -t gcr.io/spirit-snap/server .
```

### 2. **Test the Docker Container Locally**

Run the Docker container locally to ensure everything works:

```bash
docker run -d -p 8080:8080 gcr.io/spirit-snap/server
```

You can now visit `http://localhost:8080` in your browser.


### 3. **Tag and Push the Docker Image to Google Container Registry (GCR)**

#### Step 1: Tag the Docker image for GCR

Tag the build with relevant version or feature informatoin to identify it.

```bash
docker tag V0.xx gcr.io/spirit-snap/server
```

#### Step 2: Push the image to Google Container Registry

```bash
docker push gcr.io/spirit-snap/server
```

### 4. **Deploy the Docker Image to Google Cloud Run**

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

### 5. **Test the Deployed Service**

After deployment, you’ll get a URL for your service. You can test it by opening the URL in your browser.

### 6. **Delete the Cloud Run Service**

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
