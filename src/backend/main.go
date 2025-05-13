package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"tubes2/api"
	"tubes2/scraper"
	"tubes2/utilities"
)

func main() {
	// Ensure data directory exists
	workDir, _ := os.Getwd()
	recipesPath := filepath.Join(workDir, "data", "recipes.json")
	scraper.ScrapeIfNeeded(recipesPath)
 
	// Command line flags
	utilities.LoadRecipes("data/recipes.json")
	portPtr := flag.String("port", "8080", "Port for the server to listen on")
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

	// Serve static files for the frontend
	workDir, _ := os.Getwd()
	staticDir := filepath.Join(workDir, "static")
	fileServer := http.FileServer(http.Dir(staticDir))
	mux.Handle("/", fileServer)

	// Start the server
	addr := ":" + port
	log.Printf("Server started on http://localhost%s", addr)
	log.Printf("API endpoints: /api/search, /api/elements, /api/elements/basic")
	log.Fatal(http.ListenAndServe(addr, mux))
}
