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

Run the following command to run the Metro server. Double chec it's running
in Expo Go mode, not developement mode.

```bash
npx expo start --go
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
    --image gcr.io/spirit-snap/server \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

This command:
- Deploys the container to Cloud Run.
- Sets it to run in the `us-central1` region.
- Allows unauthenticated requests (public access).

#### Step 4: **Test the Deployed Service**

After deployment, you’ll get a URL for your service. You can point an Expo Go
dev client at this by setting the EXPO_PUBLIC_BACKEND_SERVER_URL environment
variable in the client .env.

#### Step 5: **Delete the Cloud Run Service**

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

### Server Log Explorer Link
To view the server logs in the browser click [here](https://console.cloud.google.com/logs/query?project=spirit-snap).

---

### Google Cloud Secret Manager Setup

Google Cloud Secret Manager allows you to securely store and access sensitive information such as API keys, database credentials, and service account files. Here’s how to set up and manage secrets for the **Spirit Snap** project.

#### 1. Adding a New Secret

To store sensitive data like Firebase credentials in Google Cloud Secret Manager:

```sh
echo -n "YOUR_SECRET_VALUE" | gcloud secrets create SECRET_NAME --data-file=-
```

Replace `SECRET_NAME` and `YOUR_SECRET_VALUE` with the name of the secret and value that you are creating.

#### 2. Updating a Secret with a New Version

To update an existing secret, add a new version:

```sh
gcloud secrets versions add SECRET_NAME --data-file=/path/to/updated-firebase-key.json
```

Replace `SECRET_NAME` with the name of the secret you are creating. You can specify which version to use in your deployment or default to `latest`.

#### 3. Setting Secret Access Permissions

To allow Cloud Run to access this secret, grant the **Secret Manager Secret Accessor** role to the service account used by Cloud Run. 

```sh
gcloud secrets add-iam-policy-binding SECRET_NAME \
    --member="serviceAccount:128476670109-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```
Replace `SECRET_NAME` with the name of the secret you are creating. The member running our project is 128476670109-compute@developer.gserviceaccount.com.

---

### Deploying to Google Cloud Run with Environment Variables and Secrets

To deploy the Docker image to Cloud Run, we’ll use environment variables from a `.env` file for non-sensitive data and specify sensitive data using the `--update-secrets` flag for secure access.

#### 1. Loading Environment Variables from a `.env` File

If you have non-sensitive environment variables in a `.env` file, you can load them directly into the deployment command:

```sh
gcloud run deploy spirit-snap-server \
    --image gcr.io/spirit-snap/server \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars "$(grep -v '^#' .env | xargs | sed 's/ /,/g')" \
    --update-secrets "FIREBASE_CREDENTIALS_JSON=FIREBASE_CREDENTIALS_JSON:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,REPLICATE_API_TOKEN=REPLICATE_API_TOKEN:latest"
```

This command reads the `.env` file, removes comments, converts it to the format required by `--set-env-vars`, and passes it to the deployment command.

In this example:
- **`GOOGLE_APPLICATION_CREDENTIALS_JSON=FIREBASE_CREDENTIALS_JSON:latest`** makes the latest version of `FIREBASE_CREDENTIALS_JSON` available as an environment variable named `GOOGLE_APPLICATION_CREDENTIALS_JSON` within the container.

By combining `--set-env-vars` for general environment variables and `--update-secrets` for sensitive data, you maintain both security and flexibility in your deployment.

---
