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

type Recipe struct {
	Element1     string `json:"element1"`
	Element2     string `json:"element2"`
	Result       string `json:"result"`
	IconFilename string `json:"icon_filename"`
}

type SearchRequest struct {
	Algorithm       string   `json:"algorithm"`
	TargetElement   string   `json:"targetElement"`
	MultipleRecipes bool     `json:"multipleRecipes"`
	RecipeCount     int      `json:"recipeCount"`
	StartElements   []string `json:"startElements,omitempty"`
}

type ResultStep struct {
	Element1     string `json:"element1"`
	Element2     string `json:"element2"`
	Result       string `json:"result"`
	IconFilename string `json:"icon_filename"`
}

type RecipeResult struct {
	Path            []string     `json:"path,omitempty"`
	Steps           []ResultStep `json:"steps"`
	TargetElement   string       `json:"targetElement"`
	StartingElement string       `json:"startingElement"`
}

type SearchResult struct {
	Success bool           `json:"success"`
	Recipes []RecipeResult `json:"recipes"`
	Metrics struct {
		Time         float64 `json:"time"`
		NodesVisited int     `json:"nodesVisited"`
	} `json:"metrics"`
	LiveUpdateSteps []LiveUpdateStep `json:"liveUpdateSteps,omitempty"`
}

type LiveUpdateStep struct {
	Step           int           `json:"step"`
	Message        string        `json:"message"`
	PartialTree    *RecipeResult `json:"partial_tree,omitempty"`
	HighlightNodes []string      `json:"highlight_nodes"`
}

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

func FindRecipe(recipes []Recipe, element1, element2, result string) *Recipe {
	for _, recipe := range recipes {
		if (recipe.Element1 == element1 && recipe.Element2 == element2 && recipe.Result == result) ||
			(recipe.Element1 == element2 && recipe.Element2 == element1 && recipe.Result == result) {
			return &recipe
		}
	}
	return nil
}

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

func extractRecipeStrings(tree utilities.RecipeTree) []string {
	var recipes []string

	if tree.Ingredients != nil && len(tree.Ingredients) == 2 {
		child1 := tree.Ingredients[0].Element
		child2 := tree.Ingredients[1].Element
		recipe := fmt.Sprintf("%s + %s => %s", child1, child2, tree.Element)
		recipes = append(recipes, recipe)

		recipes = append(recipes, extractRecipeStrings(tree.Ingredients[0])...)
		recipes = append(recipes, extractRecipeStrings(tree.Ingredients[1])...)
	}

	return recipes
}

func extractPathElements(tree utilities.RecipeTree) []string {
	var path []string

	path = append(path, tree.Element)

	if tree.Ingredients != nil && len(tree.Ingredients) == 2 {
		path = append(path, extractPathElements(tree.Ingredients[0])...)
		path = append(path, extractPathElements(tree.Ingredients[1])...)
	}

	return path
}

func convertTreesToRecipeResults(trees []utilities.RecipeTree, targetElement string, allRecipes []Recipe) []RecipeResult {
	var results []RecipeResult

	for _, tree := range trees {
		recipeStrings := extractRecipeStrings(tree)

		steps := BuildRecipeFromString(recipeStrings, allRecipes)

		var path []string
		path = extractPathElements(tree)

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

func SearchHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

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

	log.Printf("Search Request: %+v\n", searchReq)

	if len(searchReq.StartElements) == 0 {
		searchReq.StartElements = []string{"Air", "Earth", "Fire", "Water"}
	}

	startTime := time.Now()
	var result SearchResult
	result.Success = true

	workDir, _ := os.Getwd()
	recipesPath := filepath.Join(workDir, "data", "recipes.json")
	allRecipes, err := LoadRecipesFromJSON(recipesPath)
	if err != nil {
		http.Error(w, "Failed to load recipes", http.StatusInternalServerError)
		log.Printf("Error loading recipes: %v", err)
		return
	}

	if searchReq.Algorithm == "bfs" {
		trees, visited, _ := searchalgo.BFSSearch(searchReq.TargetElement, searchReq.RecipeCount)
		baseElements := searchReq.StartElements
		var allSteps []LiveUpdateStep
		for _, tree := range trees {
			steps := buildLiveUpdateStepsFromTreeWithAlgorithm(tree, allRecipes, baseElements, searchReq.Algorithm)
			allSteps = append(allSteps, steps...)
		}
		result.LiveUpdateSteps = allSteps
		utilities.SetLiveUpdateCallback(nil)

		if len(trees) == 0 {
			result.Success = false
			result.Recipes = []RecipeResult{}
			result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
			result.Metrics.NodesVisited = visited

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		fmt.Printf("[BFS] Visited: %d nodes\n", visited)

		result.Recipes = convertTreesToRecipeResults(trees, searchReq.TargetElement, allRecipes)
		result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
		result.Metrics.NodesVisited = visited

		log.Printf("tree: %+v\n", trees)
		log.Printf("Live update steps: %+v\n", result.LiveUpdateSteps)

	} else if searchReq.Algorithm == "dfs" {
		trees, visited := searchalgo.DFSSearch(searchReq.TargetElement, searchReq.RecipeCount)
		baseElements := searchReq.StartElements
		var allSteps []LiveUpdateStep
		for _, tree := range trees {
			steps := buildLiveUpdateStepsFromTreeWithAlgorithm(tree, allRecipes, baseElements, searchReq.Algorithm)
			allSteps = append(allSteps, steps...)
		}
		result.LiveUpdateSteps = allSteps
		utilities.SetLiveUpdateCallback(nil)

		if len(trees) == 0 {
			result.Success = false
			result.Recipes = []RecipeResult{}
			result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
			result.Metrics.NodesVisited = visited

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		fmt.Printf("[DFS] Visited: %d nodes\n", visited)

		result.Recipes = convertTreesToRecipeResults(trees, searchReq.TargetElement, allRecipes)
		result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
		result.Metrics.NodesVisited = visited

		log.Printf("tree: %+v\n", trees)
		log.Printf("Live update steps: %+v\n", result.LiveUpdateSteps)

	} else if searchReq.Algorithm == "bidirectional" {
		trees, visited := searchalgo.BiDirectionalSearch(searchReq.TargetElement, searchReq.RecipeCount)

		utilities.SetLiveUpdateCallback(nil)

		if len(trees) == 0 {
			result.Success = false
			result.Recipes = []RecipeResult{}
			result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
			result.Metrics.NodesVisited = visited

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)
			return
		}

		fmt.Printf("[Bidirectional] Visited: %d nodes\n", visited)

		result.Recipes = convertTreesToRecipeResults(trees, searchReq.TargetElement, allRecipes)
		result.Metrics.Time = float64(time.Since(startTime).Milliseconds())
		result.Metrics.NodesVisited = visited

		baseElements := searchReq.StartElements
		var allSteps []LiveUpdateStep
		for _, tree := range trees {
			steps := buildLiveUpdateStepsFromTreeWithAlgorithm(tree, allRecipes, baseElements, searchReq.Algorithm)
			allSteps = append(allSteps, steps...)
		}
		result.LiveUpdateSteps = allSteps
		log.Printf("tree: %+v\n", trees)
		log.Printf("Live update steps: %+v\n", result.LiveUpdateSteps)

	} else {
		http.Error(w, "Unsupported algorithm", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func ElementsHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	workDir, _ := os.Getwd()
	recipesPath := filepath.Join(workDir, "data", "recipes.json")
	recipes, err := LoadRecipesFromJSON(recipesPath)
	if err != nil {
		http.Error(w, "Failed to load recipes", http.StatusInternalServerError)
		log.Printf("Error loading recipes: %v", err)
		return
	}

	elementMap := make(map[string]bool)
	for _, recipe := range recipes {
		elementMap[recipe.Element1] = true
		elementMap[recipe.Element2] = true
		elementMap[recipe.Result] = true
	}

	var elements []string
	for element := range elementMap {
		elements = append(elements, element)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(elements)
}

func BasicElementsHandler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	basicElements := []string{"Air", "Earth", "Fire", "Water"}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(basicElements)
}

func buildLiveUpdateStepsForAlgorithm(algorithm string, targetElement string, baseElements []string) []LiveUpdateStep {
	var steps []LiveUpdateStep
	stepCounter := 1

	steps = append(steps, LiveUpdateStep{
		Step:           stepCounter,
		Message:        fmt.Sprintf("Starting search for %s using %s algorithm...", targetElement, strings.ToUpper(algorithm)),
		HighlightNodes: []string{},
	})
	stepCounter++

	// Step eksplorasi elemen dasar untuk semua algoritma
	steps = append(steps, LiveUpdateStep{
		Step:           stepCounter,
		Message:        "Exploring basic element combinations...",
		PartialTree:    &RecipeResult{TargetElement: targetElement},
		HighlightNodes: baseElements,
	})
	stepCounter++

	// Setup callback untuk merekam langkah-langkah specific ke algoritme
	utilities.SetLiveUpdateCallback(func(element string, path []string, found map[string][]string) {
		// Buat pesan yang sesuai dengan algoritma
		var message string
		switch algorithm {
		case "bfs":
			message = fmt.Sprintf("BFS: Exploring element %s", element)
		case "dfs":
			message = fmt.Sprintf("DFS: Exploring element %s", element)
		case "bidirectional":
			// Untuk bidirectional, tentukan arah pencarian
			direction := "forward"
			// Jika element ada di dalam found dan kunci "backward" ada, kemungkinan ini dari arah backward
			if found != nil {
				if _, exists := found["backward"]; exists {
					for _, elem := range found["backward"] {
						if elem == element {
							direction = "backward"
							break
						}
					}
				}
			}
			message = fmt.Sprintf("Bidirectional (%s): Exploring element %s", direction, element)
		}

		// Tambahkan langkah ke steps
		steps = append(steps, LiveUpdateStep{
			Step:           stepCounter,
			Message:        message,
			HighlightNodes: append([]string{element}, path...),
		})
		stepCounter++
	})

	return steps
}

func buildLiveUpdateStepsFromTreeWithAlgorithm(tree utilities.RecipeTree, allRecipes []Recipe, baseElements []string, algorithm string) []LiveUpdateStep {
	steps := buildLiveUpdateStepsForAlgorithm(algorithm, tree.Element, baseElements)

	// Tambahkan langkah-langkah penemuan resep dari tree
	stepCounter := len(steps) + 1
	var recipeSteps []ResultStep

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

			// Buat pesan yang sesuai dengan algoritma
			var message string
			switch algorithm {
			case "bfs":
				message = fmt.Sprintf("BFS found combination: %s + %s = %s", step.Element1, step.Element2, step.Result)
			case "dfs":
				message = fmt.Sprintf("DFS found combination: %s + %s = %s", step.Element1, step.Element2, step.Result)
			case "bidirectional":
				message = fmt.Sprintf("Bidirectional search found combination: %s + %s = %s", step.Element1, step.Element2, step.Result)
			default:
				message = fmt.Sprintf("Found combination: %s + %s = %s", step.Element1, step.Element2, step.Result)
			}

			steps = append(steps, LiveUpdateStep{
				Step:    stepCounter,
				Message: message,
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
