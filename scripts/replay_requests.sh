#!/bin/bash

# Script to replay HTTP requests logged in a JSON file
# Usage:
#   ./replay_requests.sh <request_file> [destination_address]
# Parameters:
#   <request_file>: Path to the JSON file containing recorded requests.
#   [destination_address]: (Optional) Address to send the requests. Defaults to http://localhost:8080.

# Default values
LOG_FILE=${1:-~/Projects/react_native_projects/spirit-snap/scripts/saved_requests/requests.json}                  # Path to the log file (default: requests.json)
DESTINATION=${2:-http://localhost:8080}       # Destination address (default: http://localhost:8080)

# Check if the log file exists
if [[ ! -f "$LOG_FILE" ]]; then
    echo "Error: Request file '$LOG_FILE' does not exist."
    exit 1
fi

echo "Replaying requests from: $LOG_FILE"
echo "Sending to: $DESTINATION"

# Temporary file for request body
TEMP_BODY_FILE=$(mktemp)

# Replay each request in the log file
while IFS= read -r line; do
    # Parse request details
    METHOD=$(echo "$line" | jq -r '.method')
    URL=$(echo "$line" | jq -r '.url')
    BODY=$(echo "$line" | jq -r '.body')

    # Extract headers and construct curl arguments
    HEADERS=()
    while IFS= read -r header; do
        HEADERS+=("-H" "$header")
    done < <(echo "$line" | jq -r '.headers | to_entries[] | "\(.key): \(.value)"')

    # Write body to a temporary file if it exists
    if [ "$BODY" != "null" ] && [ "$BODY" != "" ]; then
        echo -n "$BODY" > "$TEMP_BODY_FILE"
        curl -X "$METHOD" "$DESTINATION$URL" "${HEADERS[@]}" --data-binary @"$TEMP_BODY_FILE"
    else
        curl -X "$METHOD" "$DESTINATION$URL" "${HEADERS[@]}"
    fi
done < "$LOG_FILE"

# Cleanup
rm -f "$TEMP_BODY_FILE"