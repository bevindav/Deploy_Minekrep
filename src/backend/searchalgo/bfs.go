package searchalgo

import (
	"fmt"
	"sync"
	"tubes2/utilities"
)

// bfs search for recipes
func BFSSearch(target string, maxRecipes int) ([]utilities.RecipeTree, int, []utilities.Step) {
	visited := 0
	var liveSteps []utilities.Step

	if utilities.IsBaseElement(target) {
		tree := utilities.RecipeTree{Element: target}
		return []utilities.RecipeTree{tree}, visited, liveSteps
	}

	// check if target is a valid element
	recipeList, exists := utilities.Recipes[target]
	if !exists || len(recipeList) == 0 {
		fmt.Printf("Target element '%s' doesn't exist or can't be created\n", target)
		return nil, visited, liveSteps
	}
	targetTier, targetTierExists := utilities.Tiers[target]
	if !targetTierExists {
		fmt.Printf("Target element '%s' does not have a valid tier\n", target)
		return nil, visited, liveSteps
	}

	var allResults []utilities.RecipeTree
	foundCount := 0

	if maxRecipes <= 1 {
		for _, recipe := range recipeList {
			if maxRecipes > 0 && foundCount >= maxRecipes {
				break
			}

			// tier checking
			e1, e2 := recipe.Element1, recipe.Element2
			e1Tier, ok1 := utilities.Tiers[e1]
			e2Tier, ok2 := utilities.Tiers[e2]
			if ok1 && ok2 && (e1Tier >= targetTier || e2Tier >= targetTier) {
				continue
			}

			found := make(map[string][]string)
			found[target] = []string{e1, e2}

			visitCount := 0
			if processRecipe(e1, e2, found, &visitCount, &liveSteps, targetTier) {
				visited += visitCount
				recipeTree := utilities.BuildRecipeTree(target, found)
				allResults = append(allResults, recipeTree)
				foundCount++
			} else {
				visited += visitCount
			}
		}
	} else { // multithreading for multiple recipes
		var wg sync.WaitGroup
		var mu sync.Mutex
		resultCount := 0

		for _, recipe := range recipeList {
			if resultCount >= maxRecipes {
				break
			}

			// tier checking
			e1, e2 := recipe.Element1, recipe.Element2
			e1Tier, ok1 := utilities.Tiers[e1]
			e2Tier, ok2 := utilities.Tiers[e2]
			if ok1 && ok2 && (e1Tier >= targetTier || e2Tier >= targetTier) {
				continue
			}

			wg.Add(1)
			go func(r utilities.Recipe) {
				defer wg.Done()

				mu.Lock()
				if resultCount >= maxRecipes {
					mu.Unlock()
					return
				}
				mu.Unlock()

				e1 := r.Element1
				e2 := r.Element2

				found := make(map[string][]string)
				found[target] = []string{e1, e2}

				localVisitCount := 0
				if processRecipe(e1, e2, found, &localVisitCount, &liveSteps, targetTier) {
					mu.Lock()
					defer mu.Unlock()

					if resultCount >= maxRecipes {
						return
					}

					visited += localVisitCount
					recipeTree := utilities.BuildRecipeTree(target, found)
					allResults = append(allResults, recipeTree)
					resultCount++
				} else {
					mu.Lock()
					visited += localVisitCount
					mu.Unlock()
				}
			}(recipe)
		}

		wg.Wait()
		foundCount = resultCount
	}

	if maxRecipes > 0 && foundCount < maxRecipes {
		fmt.Printf("Note: Only found %d recipe(s) for '%s' while %d were requested.\n",
			foundCount, target, maxRecipes)
	}

	return allResults, visited, liveSteps
}

// process recipe based on the BFS algorithm
func processRecipe(e1 string, e2 string, found map[string][]string, visitCount *int, steps *[]utilities.Step, targetTier int) bool {
	queue := []string{}

	if !utilities.IsBaseElement(e1) && found[e1] == nil {
		queue = append(queue, e1)
	}

	if !utilities.IsBaseElement(e2) && found[e2] == nil {
		queue = append(queue, e2)
	}

	if len(queue) == 0 {
		return true
	}

	for len(queue) > 0 {
		element := queue[0]
		queue = queue[1:]
		*visitCount++

		if found[element] != nil {
			continue
		}

		recipeList, exists := utilities.Recipes[element]
		if !exists || len(recipeList) == 0 {
			return false
		}

		elementTier, tierExists := utilities.Tiers[element]
		if !tierExists {
			return false
		}

		elementProcessed := false
		for _, recipe := range recipeList {
			ing1 := recipe.Element1
			ing2 := recipe.Element2
			ing1Tier, ok1 := utilities.Tiers[ing1]
			ing2Tier, ok2 := utilities.Tiers[ing2]

			if ok1 && ok2 && (ing1Tier >= elementTier || ing2Tier >= elementTier || ing1Tier >= targetTier || ing2Tier >= targetTier) {
				continue
			}

			found[element] = []string{ing1, ing2}

			if !utilities.IsBaseElement(ing1) && found[ing1] == nil {
				queue = append(queue, ing1)
			}

			if !utilities.IsBaseElement(ing2) && found[ing2] == nil {
				queue = append(queue, ing2)
			}

			*steps = append(*steps, utilities.Step{
				Current:  element,
				Queue:    append([]string{}, queue...),
				Element1: ing1,
				Element2: ing2,
				Result:   element,
			})

			elementProcessed = true
			break
		}

		if !elementProcessed {
			return false
		}
	}

	for elem, ingredients := range found {
		if utilities.IsBaseElement(elem) {
			continue
		}
		for _, ing := range ingredients {
			if !utilities.IsBaseElement(ing) && found[ing] == nil {
				return false
			}
		}
	}

	return true
}
