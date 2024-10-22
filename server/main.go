package main

import (
    "fmt"
    "log"
    "net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello from your mobile game's backend!")
}

func main() {
    http.HandleFunc("/", helloHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}

