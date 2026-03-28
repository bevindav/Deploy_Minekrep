package main

import (
	_ "embed"
	"flag"
	"log"
	"net/http"
	"os"
	"tubes2/api"
	"tubes2/utilities"
)

//go:embed data/recipes.json
var embeddedRecipes []byte

func main() {
	// Command line flags
	if err := utilities.LoadRecipesFromBytes(embeddedRecipes); err != nil {
		log.Fatalf("Failed to load embedded recipes: %v", err)
	}

	defaultPort := os.Getenv("PORT")
	if defaultPort == "" {
		defaultPort = "8080"
	}
	portPtr := flag.String("port", defaultPort, "Port for the server to listen on")
	modePtr := flag.String("mode", "server", "Mode to run (server or test)")
	flag.Parse()

	// if _, err := os.Stat(recipesPath); os.IsNotExist(err) {
	// 	log.Fatalf("Recipes file not found: %s\nMake sure the 'data' directory with 'recipes.json' exists", recipesPath)
	// }

	// Run in the specified mode
	if *modePtr == "server" {
		// Start the server
		runServer(*portPtr)
	} else {
		log.Fatalf("Invalid mode: %s. Use 'server'", *modePtr)
	}
}

func runServer(port string) {
	// Set up API routes
	mux := http.NewServeMux()
	mux.HandleFunc("/api/search", api.SearchHandler)
	mux.HandleFunc("/api/elements", api.ElementsHandler)
	mux.HandleFunc("/api/elements/basic", api.BasicElementsHandler)

	// Start the server
	addr := ":" + port
	log.Printf("Server started on http://localhost%s", addr)
	log.Printf("API endpoints: /api/search, /api/elements, /api/elements/basic")
	log.Fatal(http.ListenAndServe(addr, mux))
}
