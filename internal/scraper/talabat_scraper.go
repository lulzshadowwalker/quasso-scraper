package scraper

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type TalabatScraper struct{}

func NewTalabatScraper() *TalabatScraper {
	return &TalabatScraper{}
}

func (s *TalabatScraper) Name() string {
	return "Talabat"
}

func (s *TalabatScraper) CanHandle(url string) bool {
	return strings.Contains(url, "talabat.com")
}

func (s *TalabatScraper) Scrape(ctx context.Context, url string) (*Result, error) {
	res, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to scrape Talabat: %s", res.Status)
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var jsonData map[string]any
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}

	scriptTag := doc.Find("script#__NEXT_DATA__[type='application/json']")
	if scriptTag.Length() == 0 {
		return nil, fmt.Errorf("failed to find __NEXT_DATA__ script tag")
	}

	scriptContent := scriptTag.Text()
	if err := json.Unmarshal([]byte(scriptContent), &jsonData); err != nil {
		return nil, fmt.Errorf("failed to parse JSON from __NEXT_DATA__ script tag: %v", err)
	}

	return &Result{
		URL:  url,
		Data: jsonData,
		HTML: string(body),
	}, nil
}
