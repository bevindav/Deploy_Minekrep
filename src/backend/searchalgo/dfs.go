package searchalgo

import (
    "fmt"
    "sync"
    "tubes2/utilities"
)

// Atomic counter untuk visited
type SafeCounter struct {
    v   int
    mux sync.Mutex
}

func (c *SafeCounter) Inc() {
	c.mux.Lock()
	c.v++
	c.mux.Unlock()
}

func (c *SafeCounter) Value() int {
    c.mux.Lock()
    defer c.mux.Unlock()
    return c.v
}

func DFSSearch(target string, maxRecipes int) ([]utilities.RecipeTree, int) {
    counter := &SafeCounter{v: 0}
    
    if utilities.IsBaseElement(target) {
        tree := utilities.RecipeTree{Element: target}
        return []utilities.RecipeTree{tree}, 0
    }

    if _, exists := utilities.Recipes[target]; !exists {
        fmt.Printf("Target element '%s' doesn't exist or can't be created\n", target)
        return nil, 0
    }

    var mu sync.Mutex
    var allResults []utilities.RecipeTree
    
    recipeList, _ := utilities.Recipes[target]
    
    var wg sync.WaitGroup
    
    sem := make(chan struct{}, 8) 
    
    fmt.Printf("Found %d direct recipes for '%s'\n", len(recipeList), target)
    
    for i, recipe := range recipeList {
        if maxRecipes > 0 && len(allResults) >= maxRecipes {
            break
        }
        
        e1 := recipe.Element1
        e2 := recipe.Element2
        
        e1Tier, e1Exists := utilities.Tiers[e1]
        e2Tier, e2Exists := utilities.Tiers[e2]
        targetTier, targetExists := utilities.Tiers[target]
        
        if e1Exists && e2Exists && targetExists && 
           (e1Tier >= targetTier || e2Tier >= targetTier) {
            fmt.Printf("Skipping recipe #%d (%s + %s => %s) [tier violation]\n", 
                i+1, e1, e2, target)
            continue
        }

        wg.Add(1)
        sem <- struct{}{}
        
        go func(idx int, rec utilities.Recipe) {
            defer func() {
                <-sem 
                wg.Done()
            }()
            
            e1 := rec.Element1
            e2 := rec.Element2
            
            fmt.Printf("Exploring recipe #%d: %s + %s => %s\n", 
                idx+1, e1, e2, target)
            
            var recipeCombinations []map[string][]string
            
            baseMap := make(map[string][]string)
            baseMap[target] = []string{e1, e2}


            // Send first live update for target
            // utilities.TrackLiveUpdate(target, []string{target}, baseMap)


            ExploreAllCombinations(e1, e2, baseMap, &recipeCombinations, counter)
            
            validCount := 0
            
            for _, found := range recipeCombinations {
                valid := true
                for elem, ingredients := range found {
                    if utilities.IsBaseElement(elem) {
                        continue
                    }
                    for _, ing := range ingredients {
                        if !utilities.IsBaseElement(ing) && found[ing] == nil {
                            valid = false
                            break
                        }
                    }
                    if !valid {
                        break
                    }
                }
                
                if valid {
                    validCount++
                    recipeTree := utilities.BuildRecipeTree(target, found)
                    
                    mu.Lock()
                    isUnique := true
                    
                    for _, existingTree := range allResults {
                        if utilities.IsSameRecipeTree(recipeTree, existingTree) {
                            isUnique = false
                            break
                        }
                    }
                    if isUnique && (maxRecipes <= 0 || len(allResults) < maxRecipes) {
                        allResults = append(allResults, recipeTree)
                        fmt.Printf("  Adding unique recipe #%d from combination #%d for %s\n", 
                            len(allResults), validCount, target)
                    }
                    mu.Unlock()
                }
            }
            
            fmt.Printf("Recipe #%d (%s + %s => %s) exploration complete. Found %d valid combination(s)\n", 
                idx+1, e1, e2, target, validCount)
                
        }(i, recipe)
    }
    
    wg.Wait()
    
    fmt.Printf("All recipe explorations complete. Found %d unique recipe(s)\n", len(allResults))
    return allResults, counter.Value()
}

// func buildPathFromIngredients(ingredients map[string][]string, current string) []string {
//     path := []string{current}
//     visited := make(map[string]bool)
//     visited[current] = true
    
//     var buildPath func(element string)
//     buildPath = func(element string) {
//         if visited[element] {
//             return
//         }
//         visited[element] = true
//         path = append(path, element)
        
//         if ingList, exists := ingredients[element]; exists {
//             for _, ing := range ingList {
//                 buildPath(ing)
//             }
//         }
//     }
    
//     if ingList, exists := ingredients[current]; exists {
//         for _, ing := range ingList {
//             buildPath(ing)
//         }
//     }
    
//     return path
// }

func ExploreAllCombinations(e1, e2 string, baseMap map[string][]string, results *[]map[string][]string, counter *SafeCounter) {
    counter.Inc()
    
    e1Maps := ExploreElementRecipes(e1, utilities.CopyMap(baseMap), counter)
    
    for _, map1 := range e1Maps {
        // Send live update after exploring e1
        // path := []string{e1}
        // for k := range map1 {
        //     if k != e1 {
        //         path = append(path, k)
        //     }
        // }
        // utilities.TrackLiveUpdate(e1, path, map1)

        e2Maps := ExploreElementRecipes(e2, utilities.CopyMap(map1), counter)
        
        for _, completeMap := range e2Maps {
            *results = append(*results, completeMap)
            // Send live update after exploring e2 and completing the map
            // completePath := []string{e2}
            // for k := range completeMap {
            //     if k != e2 {
            //         completePath = append(completePath, k)
            //     }
            // }
            // utilities.TrackLiveUpdate(e2, completePath, completeMap)
        }
    }
}

func ExploreElementRecipes(element string, currentMap map[string][]string, counter *SafeCounter) []map[string][]string {
    // Send live update when exploring a new element
    // if _, ok := currentMap[element]; !ok && !utilities.IsBaseElement(element) {
    //     path := []string{element}
    //     utilities.TrackLiveUpdate(element, path, currentMap)
    // }

    if utilities.IsBaseElement(element) {
        return []map[string][]string{currentMap}
    }
    
    if _, ok := currentMap[element]; ok {
        return []map[string][]string{currentMap}
    }
    
    counter.Inc()
    
    recipeList, exists := utilities.Recipes[element]
    if !exists {
        return nil 
    }
    
    var results []map[string][]string
    
    for _, recipe := range recipeList {
        e1 := recipe.Element1
        e2 := recipe.Element2
        
        if utilities.Tiers[e1] >= utilities.Tiers[element] || utilities.Tiers[e2] >= utilities.Tiers[element] {
            continue
        }
        
        newMap := utilities.CopyMap(currentMap)
        newMap[element] = []string{e1, e2}
        
// Send live update when selecting a recipe
        // path := []string{element, e1, e2}
        // utilities.TrackLiveUpdate(element, path, newMap)

        e1Maps := ExploreElementRecipes(e1, utilities.CopyMap(newMap), counter)
        
        for _, map1 := range e1Maps {
            // Track updates between e1 and e2 exploration
            // midPath := []string{element, e1}
            // for k := range map1 {
            //     if k != element && k != e1 {
            //         midPath = append(midPath, k)
            //     }
            // }
            // utilities.TrackLiveUpdate(e1, midPath, map1)

            e2Maps := ExploreElementRecipes(e2, utilities.CopyMap(map1), counter)
            
            // for _, validMap := range e2Maps {
            //     results = append(results, validMap)
                
            //     // Send update when a complete branch is found
            //     finalPath := []string{element}
            //     for k := range validMap {
            //         if k != element {
            //             finalPath = append(finalPath, k)
            //         }
            //     }
            //     utilities.TrackLiveUpdate(element, finalPath, validMap)
            // }

            results = append(results, e2Maps...)
        }
    }
    
    return results
}