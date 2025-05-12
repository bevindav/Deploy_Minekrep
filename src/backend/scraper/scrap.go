package scraper

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/PuerkitoBio/goquery"
)

type Recipe struct {
	Element1     string `json:"element1"`
	Element2     string `json:"element2"`
	Result       string `json:"result"`
	IconFilename string `json:"icon_filename"`
}

func ScrapeIfNeeded(filepath string) {
	if _, err := os.Stat(filepath); err == nil {
		log.Println("recipes.json already exists, skipping scraping.")
		return
	}

	log.Println("recipes.json not found, starting scraping...")

	baseURL := "https://little-alchemy.fandom.com"
	elementPageURL := baseURL + "/wiki/Elements_(Little_Alchemy_2)"
	os.MkdirAll("data", os.ModePerm)

	mythsSet := make(map[string]bool)

	elementLinks := getElementLinks(elementPageURL, baseURL)

	var allRecipes []Recipe
	var mutex sync.Mutex
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 10)

	for _, link := range elementLinks {
		wg.Add(1)
		semaphore <- struct{}{}

		go func(url string) {
			defer wg.Done()
			defer func() { <-semaphore }()

			recipes := scrapeElementPage(url, mythsSet)
			mutex.Lock()
			allRecipes = append(allRecipes, recipes...)
			mutex.Unlock()
		}(link)
	}
	wg.Wait()

	var filteredRecipes []Recipe
	for _, r := range allRecipes {
		if mythsSet[r.Element1] || mythsSet[r.Element2] || mythsSet[r.Result] {
			continue
		}
		filteredRecipes = append(filteredRecipes, r)
	}

	err := saveToJSON(filteredRecipes, filepath)
	if err != nil {
		log.Println("Error saving scraped data:", err)
	} else {
		log.Println("Scraping complete, data saved to", filepath)
	}
}

func getElementLinks(url, baseURL string) []string {
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")

	res, _ := client.Do(req)
	defer res.Body.Close()

	doc, _ := goquery.NewDocumentFromReader(res.Body)

	links := make(map[string]bool)
	doc.Find("a").Each(func(_ int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if exists && strings.HasPrefix(href, "/wiki/") &&
			!strings.Contains(href, ":") && !strings.Contains(href, "#") {
			fullURL := baseURL + href
			links[fullURL] = true
		}
	})

	var uniqueLinks []string
	for link := range links {
		// Skip Myth and Monsters (blm keexclude)
		if strings.Contains(strings.ToLower(link), "myths_and_monsters") {
			continue
		}
		uniqueLinks = append(uniqueLinks, link)
	}
	return uniqueLinks
}

func scrapeElementPage(url string, mythsSet map[string]bool) []Recipe {
	var recipes []Recipe
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")

	res, _ := client.Do(req)
	defer res.Body.Close()

	doc, _ := goquery.NewDocumentFromReader(res.Body)

	// Skip if categorized under "Myths and Monsters"
	isMyths := false
	doc.Find("#articleCategories a").Each(func(_ int, s *goquery.Selection) {
		if strings.Contains(strings.ToLower(s.Text()), "myths and monsters") {
			isMyths = true
		}
	})

	pageTitle := strings.TrimSpace(doc.Find("h1.page-header__title").Text())
	if isMyths {
		mythsSet[pageTitle] = true
		return recipes
	}

	iconFilename := strings.ToLower(strings.ReplaceAll(pageTitle, " ", "_")) + ".png"

	found := false
	doc.Find(".mw-parser-output").Children().Each(func(i int, s *goquery.Selection) {
		if goquery.NodeName(s) == "h2" && strings.Contains(s.Text(), "Recipes") {
			found = true
			return
		}

		if found && goquery.NodeName(s) == "ul" {
			s.Find("li").Each(func(_ int, li *goquery.Selection) {
				text := li.Text()
				if strings.Contains(text, "+") {
					parts := strings.Split(text, "+")
					if len(parts) == 2 {
						element1 := strings.TrimSpace(parts[0])
						element2 := strings.TrimSpace(parts[1])
						recipes = append(recipes, Recipe{
							Element1:     element1,
							Element2:     element2,
							Result:       pageTitle,
							IconFilename: iconFilename,
						})
					}
				}
			})
			found = false
		}
	})
	return recipes
}

func saveToJSON(data []Recipe, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(data)
}
