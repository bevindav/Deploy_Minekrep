package utilities

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

func IsBaseElement(element string) bool {
	for _, base := range BaseElements {
		if element == base {
			return true
		}
	}
	return false
}

func BuildRecipeTree(element string, ingredients map[string][]string) RecipeTree {
	tree := RecipeTree{Element: element}
	
	if ingList, exists := ingredients[element]; exists {
		for _, ing := range ingList {
			tree.Ingredients = append(tree.Ingredients, BuildRecipeTree(ing, ingredients))
		}
	}
	
	return tree
}

func CalculateTreeDepth(tree RecipeTree) int {
	if len(tree.Ingredients) == 0 {
		return 1
	}
	
	maxDepth := 0
	for _, ing := range tree.Ingredients {
		depth := CalculateTreeDepth(ing)
		if depth > maxDepth {
			maxDepth = depth
		}
	}
	
	return maxDepth + 1
}

func PrintRecipeTree(tree RecipeTree, indent string) {
	fmt.Printf("%s%s\n", indent, tree.Element)
	if len(tree.Ingredients) > 0 {
		fmt.Printf("%s└─ combines:\n", indent)
		for i, ing := range tree.Ingredients {
			if i == len(tree.Ingredients)-1 {
				PrintRecipeTree(ing, indent+"   ")
			} else {
				PrintRecipeTree(ing, indent+"│  ")
			}
		}
	}
}

func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func IsSameRecipeTree(tree1, tree2 RecipeTree) bool {
    if tree1.Element != tree2.Element {
        return false
    }
    
    if len(tree1.Ingredients) != len(tree2.Ingredients) {
        return false
    }
    
    if len(tree1.Ingredients) == 2 && len(tree2.Ingredients) == 2 {
        normalOrder := IsSameRecipeTree(tree1.Ingredients[0], tree2.Ingredients[0]) &&
                       IsSameRecipeTree(tree1.Ingredients[1], tree2.Ingredients[1])
        
        reversedOrder := IsSameRecipeTree(tree1.Ingredients[0], tree2.Ingredients[1]) &&
                         IsSameRecipeTree(tree1.Ingredients[1], tree2.Ingredients[0])
        
        return normalOrder || reversedOrder
    }
    
    for i := range tree1.Ingredients {
        if !IsSameRecipeTree(tree1.Ingredients[i], tree2.Ingredients[i]) {
            return false
        }
    }
    
    return true
}

func CopyMap(original map[string][]string) map[string][]string {
    newMap := make(map[string][]string)
    for k, v := range original {
        newSlice := make([]string, len(v))
        copy(newSlice, v)
        newMap[k] = newSlice
    }
    return newMap
}

func initializeTiers() {
	for _, element := range BaseElements {
		Tiers[element] = 1
	}
	queue := make([]string, 0)
    queue = append(queue, BaseElements...)
    processed := make(map[string]bool)
    
    for _, elem := range BaseElements {
        processed[elem] = true
    }
	for len(queue) > 0 {
        current := queue[0]
        queue = queue[1:]
        
        for result, loadedRecipes := range Recipes {
            if processed[result] {
                continue 
            }
            
            for _, recipe := range loadedRecipes {
                if (recipe.Element1 == current || recipe.Element2 == current) {
 
                    if tier1, ok1 := Tiers[recipe.Element1]; ok1 {
                        if tier2, ok2 := Tiers[recipe.Element2]; ok2 {
                            resultTier := Max(tier1, tier2) + 1
                            existingTier, exists := Tiers[result]
                            
                            if !exists || resultTier < existingTier {
                                Tiers[result] = resultTier
                                if !processed[result] {
                                    queue = append(queue, result)
                                }
                            }
                            
                            processed[result] = true
                        }
                    }
                }
            }
        }
    }
}

func LoadRecipes(filePath string) {
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Printf("Failed to open file: %v\n", err)
		return
	}
	defer file.Close()

	var loadedRecipes []Recipe
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&loadedRecipes); err != nil {
		fmt.Printf("Failed to decode JSON: %v\n", err)
		return
	}

	for _, r := range loadedRecipes {
		Recipes[r.Result] = append(Recipes[r.Result], r)
	}
	
	initializeTiers()

	fmt.Printf("Loaded %d recipes.\n", len(loadedRecipes))
}

// tracking search progress
var LiveUpdateCallback func(element string, path []string, found map[string][]string)
var liveUpdateMutex sync.Mutex

// sets callback function for live updates
func SetLiveUpdateCallback(callback func(element string, path []string, found map[string][]string)) {
    liveUpdateMutex.Lock()
    defer liveUpdateMutex.Unlock()
    LiveUpdateCallback = callback
}

// calls the callback function for live updates
func TrackLiveUpdate(element string, path []string, found map[string][]string) {
	liveUpdateMutex.Lock()
	defer liveUpdateMutex.Unlock()
	if LiveUpdateCallback != nil {
		LiveUpdateCallback(element, path, found)
	}
}

func FindIconForRecipe(element1, element2, result string) string {
	if recipes, exists := Recipes[result]; exists {
		for _, r := range recipes {
			if (r.Element1 == element1 && r.Element2 == element2) ||
			   (r.Element1 == element2 && r.Element2 == element1) {
				return r.IconFilename
			}
		}
	}
	return "unknown.png"
}