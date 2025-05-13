package searchalgo

import (
	"fmt"
	"sync"
	"tubes2/utilities"
)

const MaxDepth = 40

func BiDirectionalSearch(target string, maxRecipes int) ([]utilities.RecipeTree, int) {
	counter := &SafeCounter{v: 0}

	if utilities.IsBaseElement(target) {
		tree := utilities.RecipeTree{Element: target}
		return []utilities.RecipeTree{tree}, 0
	}

	recipeList, exists := utilities.Recipes[target]
	if !exists || len(recipeList) == 0 {
		fmt.Printf("Target element '%s' doesn't exist or can't be created\n", target)
		return nil, 0
	}

	var allResults []utilities.RecipeTree
	var mutex sync.Mutex

	forwardQueue := []*utilities.Node{}
	backwardQueue := []*utilities.Node{}

	var forwardVisitedMap sync.Map // map[string]map[string][]string
	var backwardVisitedMap sync.Map

	globalForwardVisited := map[string]bool{}
	globalBackwardVisited := map[string]bool{}

	startNode := &utilities.Node{
		Element:     target,
		Path:        []string{target},
		Visited:     map[string]bool{target: true},
		Depth:       0,
		Ingredients: map[string][]string{},
	}
	forwardQueue = append(forwardQueue, startNode)
	globalForwardVisited[target] = true

	for _, base := range utilities.BaseElements {
		node := &utilities.Node{
			Element:     base,
			Path:        []string{base},
			Visited:     map[string]bool{base: true},
			Depth:       0,
			Ingredients: map[string][]string{},
		}
		backwardQueue = append(backwardQueue, node)
		globalBackwardVisited[base] = true
		backwardVisitedMap.Store(base, map[string][]string{})
	}

	recipesFound := 0

	for len(forwardQueue) > 0 && len(backwardQueue) > 0 && (maxRecipes <= 0 || recipesFound < maxRecipes) {
		// Forward phase
		fq := forwardQueue
		forwardQueue = []*utilities.Node{}
		for _, node := range fq {
			counter.Inc()
			if node.Depth >= MaxDepth {
				continue
			}
			if recipes, ok := utilities.Recipes[node.Element]; ok {
				for _, recipe := range recipes {
					e1, e2 := recipe.Element1, recipe.Element2

					v, _ := forwardVisitedMap.LoadOrStore(node.Element, map[string][]string{})
					elemMap := v.(map[string][]string)
					elemMap[fmt.Sprintf("%s+%s", e1, e2)] = []string{e1, e2}
					forwardVisitedMap.Store(node.Element, elemMap)

					utilities.TrackLiveUpdate(node.Element, node.Path, map[string][]string{node.Element: {e1, e2}})

					if hasInMap(&backwardVisitedMap, e1) || hasInMap(&backwardVisitedMap, e2) {
						complete := buildCompleteRecipe(target, []string{e1, e2}, e1, e2, mapFromSync(&forwardVisitedMap), mapFromSync(&backwardVisitedMap))
						tree := utilities.BuildRecipeTree(target, complete)

						mutex.Lock()
						allResults = append(allResults, tree)
						recipesFound++
						mutex.Unlock()

						if maxRecipes > 0 && recipesFound >= maxRecipes {
							return allResults, counter.Value()
						}
					}

					for _, elem := range []string{e1, e2} {
						if !globalForwardVisited[elem] && !utilities.IsBaseElement(elem) {
							globalForwardVisited[elem] = true
							forwardQueue = append(forwardQueue, &utilities.Node{
								Element:     elem,
								Path:        append(copySlice(node.Path), elem),
								Depth:       node.Depth + 1,
								Ingredients: copyIngredients(node.Ingredients),
							})
						}
					}
				}
			}
		}

		// Backward phase
		bq := backwardQueue
		backwardQueue = []*utilities.Node{}
		for _, node := range bq {
			counter.Inc()
			if node.Depth >= MaxDepth {
				continue
			}
			for result, recipes := range utilities.Recipes {
				for _, recipe := range recipes {
					if recipe.Element1 != node.Element && recipe.Element2 != node.Element {
						continue
					}
					other := recipe.Element2
					if recipe.Element2 == node.Element {
						other = recipe.Element1
					}
					if globalBackwardVisited[result] {
						continue
					}
					globalBackwardVisited[result] = true

					newIng := copyIngredients(node.Ingredients)
					newIng[result] = []string{node.Element, other}

					v, _ := backwardVisitedMap.LoadOrStore(result, map[string][]string{})
					elemMap := v.(map[string][]string)
					elemMap[fmt.Sprintf("%s+%s", node.Element, other)] = []string{node.Element, other}
					backwardVisitedMap.Store(result, elemMap)

					utilities.TrackLiveUpdate(result, append(copySlice(node.Path), result), map[string][]string{result: {node.Element, other}})

					if hasInMap(&forwardVisitedMap, result) {
						complete := buildCompleteRecipe(target, []string{recipe.Element1, recipe.Element2}, node.Element, other, mapFromSync(&forwardVisitedMap), mapFromSync(&backwardVisitedMap))
						tree := utilities.BuildRecipeTree(target, complete)

						mutex.Lock()
						allResults = append(allResults, tree)
						recipesFound++
						mutex.Unlock()

						if maxRecipes > 0 && recipesFound >= maxRecipes {
							return allResults, counter.Value()
						}
					}

					if !globalBackwardVisited[other] && !utilities.IsBaseElement(other) {
						backwardQueue = append(backwardQueue, &utilities.Node{
							Element:     other,
							Path:        append(copySlice(node.Path), result),
							Depth:       node.Depth + 1,
							Ingredients: newIng,
						})
					}
				}
			}
		}
	}

	return allResults, counter.Value()
}

func buildCompleteRecipe(
	target string,
	forwardIngredients []string,
	backwardE1, backwardE2 string,
	forwardVisited, backwardVisited map[string]map[string][]string,
) map[string][]string {
	complete := map[string][]string{}
	complete[target] = forwardIngredients

	var expand func(string)
	expand = func(elem string) {
		if _, exists := complete[elem]; exists || utilities.IsBaseElement(elem) {
			return
		}

		var ingredients []string
		if m, ok := backwardVisited[elem]; ok {
			for _, v := range m {
				ingredients = v
				break
			}
		}
		if len(ingredients) == 0 {
			if m, ok := forwardVisited[elem]; ok {
				for _, v := range m {
					ingredients = v
					break
				}
			}
		}

		if len(ingredients) == 2 {
			complete[elem] = ingredients
			expand(ingredients[0])
			expand(ingredients[1])
		} else {
			if recipes, ok := utilities.Recipes[elem]; ok {
				for _, r := range recipes {
					ingredients = []string{r.Element1, r.Element2}
					complete[elem] = ingredients
					expand(ingredients[0])
					expand(ingredients[1])
					break
				}
			} else {
				fmt.Printf("Warning: Could not find ingredients for element %s\n", elem)
			}
		}
	}

	for _, ing := range forwardIngredients {
		expand(ing)
	}

	return complete
}

func hasInMap(m *sync.Map, key string) bool {
	_, ok := m.Load(key)
	return ok
}

func mapFromSync(m *sync.Map) map[string]map[string][]string {
	result := make(map[string]map[string][]string)
	m.Range(func(key, value any) bool {
		k := key.(string)
		v := value.(map[string][]string)
		result[k] = v
		return true
	})
	return result
}

func copySlice(slice []string) []string {
	result := make([]string, len(slice))
	copy(result, slice)
	return result
}

func copyIngredients(original map[string][]string) map[string][]string {
	copyMap := make(map[string][]string)
	for k, v := range original {
		copyMap[k] = append([]string{}, v...)
	}
	return copyMap
}
