package api

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"tubes2/searchalgo"
	"tubes2/utilities"
)

// Recipe represents a recipe from recipes.json
type Recipe struct {
	Element1     string `json:"element1"`
	Element2     string `json:"element2"`
	Result       string `json:"result"`
	IconFilename string `json:"icon_filename"`
}

// SearchRequest represents the search parameters from frontend
type SearchRequest struct {
	Algorithm       string   `json:"algorithm"`
	TargetElement   string   `json:"targetElement"`
	MultipleRecipes bool     `json:"multipleRecipes"`
	RecipeCount     int      `json:"recipeCount"`
	StartElements   []string `json:"startElements,omitempty"`
}

// ResultStep represents a step in the recipe path
type ResultStep struct {
	Element1     string `json:"element1"`
	Element2     string `json:"element2"`
	Result       string `json:"result"`
	IconFilename string `json:"icon_filename"`
}

// RecipeResult represents a single recipe result for the frontend
type RecipeResult struct {
	Path            []string     `json:"path,omitempty"`
	Steps           []ResultStep `json:"steps"`
	TargetElement   string       `json:"targetElement"`
	StartingElement string       `json:"startingElement"`
}

// SearchResult represents the response to the frontend
type SearchResult struct {
	Success bool           `json:"success"`
	Recipes []RecipeResult `json:"recipes"`
	Metrics struct {
		Time         float64 `json:"time"`
		NodesVisited int     `json:"nodesVisited"`
	} `json:"metrics"`
	LiveUpdateSteps []LiveUpdateStep `json:"liveUpdateSteps,omitempty"`
}

// LiveUpdateStep represents a step in the live update visualization
type LiveUpdateStep struct {
	Step           int           `json:"step"`
	Message        string        `json:"message"`
	PartialTree    *RecipeResult `json:"partial_tree,omitempty"`
	HighlightNodes []string      `json:"highlight_nodes"`
}

// LoadRecipesFromJSON loads recipes from the JSON file
func LoadRecipesFromJSON(filePath string) ([]Recipe, error) {
	jsonFile, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var recipes []Recipe
	err = json.Unmarshal(byteValue, &recipes)
	if err != nil {
		return nil, err
	}

	return recipes, nil
}

// FindRecipe searches for a recipe that matches the given elements
func FindRecipe(recipes []Recipe, element1, element2, result string) *Recipe {
	for _, recipe := range recipes {
		if (recipe.Element1 == element1 && recipe.Element2 == element2 && recipe.Result == result) ||
			(recipe.Element1 == element2 && recipe.Element2 == element1 && recipe.Result == result) {
			return &recipe
		}
	}
	return nil
}

// BuildRecipeFromString builds recipe steps from recipe strings (e.g., "Fire + Water => Steam")
func BuildRecipeFromString(recipeStrings []string, allRecipes []Recipe) []ResultStep {
	var steps []ResultStep

	for _, recipeStr := range recipeStrings {
		var elem1, elem2, result string
		parts := strings.Split(recipeStr, " => ")
		if len(parts) != 2 {
			log.Printf("Error parsing recipe step: invalid format %s", recipeStr)
			continue
		}

		ingredients := strings.Split(parts[0], " + ")
		if len(ingredients) != 2 {
			log.Printf("Error parsing recipe step: invalid ingredients format %s", parts[0])
			continue
		}

		elem1 = ingredients[0]
		elem2 = ingredients[1]
		result = parts[1]

		// Try to find the icon filename from allRecipes
		iconFilename := strings.ToLower(result) + ".png" // Default
		for _, recipe := range allRecipes {
			if (recipe.Element1 == elem1 && recipe.Element2 == elem2) ||
				(recipe.Element1 == elem2 && recipe.Element2 == elem1) {
				if recipe.Result == result {
					iconFilename = recipe.IconFilename
					break
				}
			}
		}

		steps = append(steps, ResultStep{
			Element1:     elem1,
			Element2:     elem2,
			Result:       result,
			IconFilename: iconFilename,
		})
	}

	return steps
}

// Helper function to extract recipe strings from a recipe tree
func extractRecipeStrings(tree utilities.RecipeTree) []string {
	var recipes []string

	// Modified to use Ingredients instead of Children
	if tree.Ingredients != nil && len(tree.Ingredients) == 2 {
		child1 := tree.Ingredients[0].Element
		child2 := tree.Ingredients[1].Element
		recipe := fmt.Sprintf("%s + %s => %s", child1, child2, tree.Element)
		recipes = append(recipes, recipe)

		// Recursively extract recipes from children
		recipes = append(recipes, extractRecipeStrings(tree.Ingredients[0])...)
		recipes = append(recipes, extractRecipeStrings(tree.Ingredients[1])...)
	}

	return recipes
}

// Helper function to extract path elements from recipe tree
func extractPathElements(tree utilities.RecipeTree) []string {
	var path []string

	// Add the current element
	path = append(path, tree.Element)

	// Modified to use Ingredients instead of Children
	if tree.Ingredients != nil && len(tree.Ingredients) == 2 {
		// Add elements from first child's path
		path = append(path, extractPathElements(tree.Ingredients[0])...)
		// Add elements from second child's path
		path = append(path, extractPathElements(tree.Ingredients[1])...)
	}

	return path
}

// Helper function to convert RecipeTrees to RecipeResults for frontend
func convertTreesToRecipeResults(trees []utilities.RecipeTree, targetElement string, allRecipes []Recipe) []RecipeResult {
	var results []RecipeResult

	for _, tree := range trees {
		// Extract the recipe steps from the tree
		recipeStrings := extractRecipeStrings(tree)

		// Convert to ResultStep format
		steps := BuildRecipeFromString(recipeStrings, allRecipes)

		// Find all the elements in the path
		var path []string
		path = extractPathElements(tree)

		// Find starting element (should be a base element)
		startingElement := "Unknown"
		if len(path) > 0 {
			startingElement = path[0]
		}

		results = append(results, RecipeResult{
			Path:            path,
			Steps:           steps,
			TargetElement:   targetElement,
			StartingElement: startingElement,
		})
	}

	return results
}

// SearchHandler handles the /api/search endpoint
func SearchHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var searchReq SearchRequest
	err := json.NewDecoder(r.Body).Decode(&searchReq)
	if err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Log the incoming request for debugging
	log.Printf("Search Request: %+v\n", searchReq)

	// Define basic elements if not provided
	if len(searchReq.StartElements) == 0 {
		searchReq.StartElements = []string{"Air", "Earth", "Fire", "Water"}
	}

	startTime := time.Now()
	var result SearchResult
	result.Success = true

	// Load recipes for building recipe steps
	workDir, _ := os.Getwd()
	recipesPath := filepath.Join(workDir, "data", "recipes.json")
	allRecipes, err := LoadRecipesFromJSON(recipesPath)
	if err != nil {
		http.Error(w, "Failed to load recipes", http.StatusInternalServerError)
		log.Printf("Error loading recipes: %v", err)
		return
	}

	// Execute the appropriate search algorithm
	if searchReq.Algorithm == "bfs" {
		trees, visited, _ := searchalgo.BFSSearch(searchReq.TargetElement, searchReq.RecipeCount)
		baseElements := searchReq.StartElements
		var allSteps []LiveUpdateStep
		for _, tree := range trees {
			steps := buildLiveUpdateStepsFromTree(tree, allRecipes, baseElements)
			allSteps = append(allSteps, steps...)
		}
		result.LiveUpdateSteps = allSteps
		// Reset callback after search
		utilities.SetLiveUpdateCallback(nil)

		if len(trees) == 0 {
			// Return an empty but successful response instead of error
			result.Success = false
			result.Recipes = []RecipeResult{}
			result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
			result.Metrics.NodesVisited = visited

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		fmt.Printf("[BFS] Visited: %d nodes\n", visited)

		// Convert trees to RecipeResult format for frontend
		result.Recipes = convertTreesToRecipeResults(trees, searchReq.TargetElement, allRecipes)
		result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
		result.Metrics.NodesVisited = visited

		// Add live update steps to the result
		log.Printf("tree: %+v\n", trees)
		log.Printf("Live update steps: %+v\n", result.LiveUpdateSteps)

	} else if searchReq.Algorithm == "dfs" {
		trees, visited := searchalgo.DFSSearch(searchReq.TargetElement, searchReq.RecipeCount)
		baseElements := searchReq.StartElements
		var allSteps []LiveUpdateStep
		for _, tree := range trees {
			steps := buildLiveUpdateStepsFromTree(tree, allRecipes, baseElements)
			allSteps = append(allSteps, steps...)
		}
		result.LiveUpdateSteps = allSteps
		// Reset callback after search
		utilities.SetLiveUpdateCallback(nil)

		if len(trees) == 0 {
			// Return an empty but successful response instead of error
			result.Success = false
			result.Recipes = []RecipeResult{}
			result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
			result.Metrics.NodesVisited = visited

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		fmt.Printf("[DFS] Visited: %d nodes\n", visited)

		// Convert trees to RecipeResult format for frontend
		result.Recipes = convertTreesToRecipeResults(trees, searchReq.TargetElement, allRecipes)
		result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
		result.Metrics.NodesVisited = visited

		// Add live update steps to the result
		log.Printf("Live update steps: %+v\n", result.LiveUpdateSteps)

	} else if searchReq.Algorithm == "bidirectional" {
		// Execute the bidirectional search algorithm
		trees, visited := searchalgo.BiDirectionalSearch(searchReq.TargetElement, searchReq.RecipeCount)

		// Reset callback after search
		utilities.SetLiveUpdateCallback(nil)

		if len(trees) == 0 {
			// Return an empty but successful response instead of error
			result.Success = false
			result.Recipes = []RecipeResult{}
			result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
			result.Metrics.NodesVisited = visited

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		fmt.Printf("[Bidirectional] Visited: %d nodes\n", visited)

		// Convert trees to RecipeResult format for frontend
		result.Recipes = convertTreesToRecipeResults(trees, searchReq.TargetElement, allRecipes)
		result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
		result.Metrics.NodesVisited = visited

		// Add live update steps to the result
		baseElements := searchReq.StartElements
		var allSteps []LiveUpdateStep
		for _, tree := range trees {
			steps := buildLiveUpdateStepsFromTree(tree, allRecipes, baseElements)
			allSteps = append(allSteps, steps...)
		}
		result.LiveUpdateSteps = allSteps
		log.Printf("Live update steps: %+v\n", result.LiveUpdateSteps)

	} else {
		// Invalid algorithm
		http.Error(w, "Unsupported algorithm", http.StatusBadRequest)
		return
	}

	// Send the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// ElementsHandler handles the /api/elements endpoint
func ElementsHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	// Load recipes from JSON file to extract all available elements
	workDir, _ := os.Getwd()
	recipesPath := filepath.Join(workDir, "data", "recipes.json")
	recipes, err := LoadRecipesFromJSON(recipesPath)
	if err != nil {
		http.Error(w, "Failed to load recipes", http.StatusInternalServerError)
		log.Printf("Error loading recipes: %v", err)
		return
	}

	// Extract all unique elements
	elementMap := make(map[string]bool)
	for _, recipe := range recipes {
		elementMap[recipe.Element1] = true
		elementMap[recipe.Element2] = true
		elementMap[recipe.Result] = true
	}

	// Convert to slice
	var elements []string
	for element := range elementMap {
		elements = append(elements, element)
	}

	// Send the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(elements)
}

// BasicElementsHandler handles the /api/elements/basic endpoint
func BasicElementsHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	// Hard-coded basic elements
	basicElements := []string{"Air", "Earth", "Fire", "Water"}

	// Send the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(basicElements)
}

func buildLiveUpdateStepsFromTree(tree utilities.RecipeTree, allRecipes []Recipe, baseElements []string) []LiveUpdateStep {
	var steps []LiveUpdateStep
	var recipeSteps []ResultStep

	stepCounter := 1

	steps = append(steps, LiveUpdateStep{
		Step:    stepCounter,
		Message: fmt.Sprintf("Starting search for %s...", tree.Element),
	})
	stepCounter++

	// Tambahkan langkah exploring basic elements
	steps = append(steps, LiveUpdateStep{
		Step:           stepCounter,
		Message:        "Exploring basic element combinations...",
		PartialTree:    &RecipeResult{TargetElement: tree.Element},
		HighlightNodes: baseElements,
	})
	stepCounter++

	var search func(node utilities.RecipeTree)
	search = func(node utilities.RecipeTree) {
		if len(node.Ingredients) == 2 {
			// Ambil nama ikon dari resep yang cocok
			icon := utilities.FindIconForRecipe(node.Ingredients[0].Element, node.Ingredients[1].Element, node.Element)

			step := ResultStep{
				Element1:     node.Ingredients[0].Element,
				Element2:     node.Ingredients[1].Element,
				Result:       node.Element,
				IconFilename: icon,
			}
			recipeSteps = append(recipeSteps, step)

			steps = append(steps, LiveUpdateStep{
				Step:    stepCounter,
				Message: fmt.Sprintf("Found combination: %s + %s = %s", step.Element1, step.Element2, step.Result),
				PartialTree: &RecipeResult{
					TargetElement: tree.Element,
					Steps:         append([]ResultStep{}, recipeSteps...),
				},
				HighlightNodes: []string{step.Element1, step.Element2, step.Result},
			})
			stepCounter++
		}

		for _, ing := range node.Ingredients {
			search(ing)
		}
	}

	search(tree)

	return steps
}
