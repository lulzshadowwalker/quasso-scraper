package scraper

import "context"

type Scraper interface {
	Name() string
	CanHandle(url string) bool
	Scrape(ctx context.Context, url string) (*Result, error)
}

type Result struct {
	URL  string
	Data map[string]any
	// maybe we could stream the response instead
	HTML string
}
