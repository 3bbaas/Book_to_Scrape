# Books To Scrape - Web Scraper

A Node.js web scraper built with Puppeteer to extract book information from the [Books to Scrape](https://books.toscrape.com/) demo website.

## About the Target Website

[Books to Scrape](https://books.toscrape.com/) is a demo website specifically designed for web scraping practice and education purposes:

- **Total Books**: 1000 books in the catalog
- **Pagination**: Yes, with 50 pages
- **Items per page**: 20 books maximum per page
- **JavaScript Required**: No

**Note**: This is a demo website for web scraping purposes. Prices and ratings are randomly assigned and have no real meaning.

## Project Overview

This project demonstrates how to scrape book data from a catalog website, including both list pages and individual detail pages. The scraper collects comprehensive information about each book, including title, price, availability, ratings, descriptions, and other metadata.

## Features

- Scrapes multiple pages from the book catalog
- Extracts detailed information for each book
- Handles relative URLs properly
- Saves individual book data as separate JSON files
- Compiles all book data into a single JSON file with metadata
- Includes error handling and logging
- Displays progress with visual spinners in the terminal

## Data Extracted

For each book, the following information is extracted:

- Title
- Price
- Stock information (availability and quantity)
- Rating
- Category
- Product information (UPC, tax, etc.)
- Description
- Thumbnail image URL
- Book URL

## Project Structure

- `index.js` - Main script that orchestrates the scraping process
- `scrape.js` - Module containing the core scraping functions
- `package.json` - Project dependencies and configuration
- `data/` - Directory containing scraped data
  - `books/` - Individual JSON files for each book
  - `books_[timestamp].json` - Combined data for all scraped books

## Technical Implementation

The scraper uses several techniques to efficiently extract data:

- Browser automation with Puppeteer
- Request interception to speed up page loading
- Page evaluation to extract data from the DOM
- URL handling for both relative and absolute paths
- Parallel processing with multiple browser pages
- Rate limiting to avoid overloading the target server

## Requirements

- Node.js v14.0.0 or higher
- NPM or Yarn package manager

## Dependencies

- [puppeteer](https://www.npmjs.com/package/puppeteer) - Headless Chrome browser automation
- [chalk](https://www.npmjs.com/package/chalk) - Terminal text styling
- [ora](https://www.npmjs.com/package/ora) - Terminal spinners


## Installation

```bash
git clone https://github.com/3bbaas/Book_to_Scrape.git
cd Book_to_Scrape

npm install
```

## Usage

Run the scraper with the default settings:

```bash
npm run scrape
```

Or use the Node.js command directly:

```bash
node index.js
```

Debug mode:

```bash
npm run scrape:debug
```

## Configuration

You can modify the following constants in `index.js` to adjust the scraper's behavior:

- `maxPages` - Number of pages to scrape (default: 20)
- `baseUrl` - Base URL of the target website

## Performance

The scraper is configured to:

- Block unnecessary resources (images, stylesheets) to speed up page loading
- Add small delays between requests to avoid overwhelming the server
- Process pages sequentially but book details in parallel
- Close browser resources properly after use

## Output

The scraper generates two types of output:

1. **Individual book files**: JSON files for each book in the `data/books/` directory
2. **Combined data file**: A single JSON file with all scraped books and metadata in the `data/` directory

The combined data file contains:

```json
{
  "metadata": {
    "totalBooks": 400,
    "pagesScraped": 20,
    "scrapedAt": "2025-06-19T00:00:00.000Z",
    "duration": "60.00 seconds"
  },
  "books": [
    {
      "BookTitle": "Book Title",
      "BookLink": "https://books.toscrape.com/catalogue/book-title_123/index.html",
      "BookDetails": {
        "Thumbnail": "https://books.toscrape.com/media/cache/...",
        "Price": "£99.99",
        "StockInfo": { "inStock": true, "quantity": "22", "availability": "In stock (22 available)" },
        "Rate": "Three",
        "Category": "Fiction",
        "ProductInfo": { "UPC": "123456789", "Product Type": "Books", /* ... */ },
        "Description": "Book description text goes here..."
      }
    },
    // More books...
  ]
}
```

## Terminal Output

When running the scraper, you will see output similar to:

```
[!] Starting book scraper...
✔ Browser launched successfully
✔ Page 1: Found 20 books
✔ Fetched details for: A Light in the Attic
✔ Fetched details for: Tipping the Velvet
✔ Fetched details for: Soumission
...
[✔] Successfully scraped 400 books from 20 pages
✔ Results saved to data\books_2025-06-19T01-45-37.json
✔ Browser closed
[%] Total execution time: 186.42 seconds
```

[![Watch the demo](https://raw.githubusercontent.com/3bbaas/Book_to_Scrape/main/assets/thumbnail.png)](https://raw.githubusercontent.com/3bbaas/Book_to_Scrape/main/assets/demo.mp4)

## Notes

- This project is for educational purposes only
- The data directory contains scraped data for the first 20 pages only (~400 books)
- For larger scraping projects, consider implementing more robust rate limiting and proxies

## Limitations

- The current implementation does not handle pagination beyond the set limit
- No retry mechanism for failed requests
- No database integration (data is stored in JSON files only)

## Disclaimer

This project is created for educational purposes only to demonstrate web scraping techniques on a website specifically designed for scraping practice. The data collected is not used for any commercial purpose. There is no license attached to this project, and it is not intended for redistribution or commercial use.
