package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/a-h/templ"
	"github.com/joho/godotenv"
	"github.com/templui/templui-quickstart/assets"
	"github.com/templui/templui-quickstart/internal/scraper"
	"github.com/templui/templui-quickstart/ui/pages"
)

func main() {
	InitDotEnv()
	mux := http.NewServeMux()
	SetupAssetsRoutes(mux)
	mux.Handle("GET /", templ.Handler(pages.Landing()))
	mux.HandleFunc("GET /scrape", scrape)
	fmt.Println("Server is running on http://localhost:3000")
	http.ListenAndServe(":3000", mux)
}

func scrape(w http.ResponseWriter, r *http.Request) {
	u := r.URL.Query().Get("url")
	if u == "" {
		http.Error(w, "Missing url query parameter", http.StatusBadRequest)
		return
	}

	if _, err := url.Parse(u); err != nil {
		http.Error(w, "URL query parameter provided but is invalid ", http.StatusBadRequest)
		return
	}

	scrapers := []scraper.Scraper{scraper.NewTalabatScraper()}
	var scraper *scraper.Scraper
	for _, s := range scrapers {
		if !s.CanHandle(u) {
			continue
		}

		scraper = &s
	}

	if scraper == nil {
		http.Error(w, "No scraper found for the provided URL", http.StatusBadRequest)
		return
	}

	result, err := (*scraper).Scrape(r.Context(), u)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error scraping the URL: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	var resposne map[string]any = map[string]any{
		"url":  result.URL,
		"data": result.Data,
		"html": result.HTML,
	}

	if err := json.NewEncoder(w).Encode(resposne); err != nil {
		http.Error(w, fmt.Sprintf("Error encoding response: %v", err), http.StatusInternalServerError)
		return
	}
}

func InitDotEnv() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file")
	}
}

func SetupAssetsRoutes(mux *http.ServeMux) {
	var isDevelopment = os.Getenv("GO_ENV") != "production"

	assetHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isDevelopment {
			w.Header().Set("Cache-Control", "no-store")
		}

		var fs http.Handler
		if isDevelopment {
			fs = http.FileServer(http.Dir("./assets"))
		} else {
			fs = http.FileServer(http.FS(assets.Assets))
		}

		fs.ServeHTTP(w, r)
	})

	mux.Handle("GET /assets/", http.StripPrefix("/assets/", assetHandler))
}
