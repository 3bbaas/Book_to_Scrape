/**
 * Book Scraping Script
 * This script scrapes book data from (https://books.toscrape.com) and saves it to a JSON file
 */

import { scrape, scrapeBookDetail } from './scrape.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

async function main() {
  let browser;
  let allBooks = [];
  const baseUrl = 'https://books.toscrape.com/';
  const maxPages = 20;
  let successfulPages = 0;

  console.log(chalk.green('[!] Starting book scraper...'));

  const startTime = Date.now();

  try {
    const spinner = ora('Launching browser...').start();
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
      ],
    });
    spinner.succeed('Browser launched successfully');

    const page = await browser.newPage();

    // Set a realistic user agent to avoid being blocked
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    );

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Only allow necessary resources to speed up page loading
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    for (let currPage = 1; currPage <= maxPages; currPage++) {
      try {
        const pageUrl = `${baseUrl}catalogue/page-${currPage}.html`;

        const pageSpinner = ora(`Scraping page ${currPage}/${maxPages}...`).start();

        let books = await scrape(page, pageUrl, {
          logProgress: false,
        });

        if (books.error) {
          pageSpinner.fail(`Failed to scrape page ${currPage}: ${books.message}`);
          continue;
        }

        pageSpinner.succeed(`Page ${currPage}: Found ${books.length} books`);

        const detailSpinner = ora(`Fetching detailed information for books...`).start();

        const detailPage = await browser.newPage();
        await detailPage.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        );

        await detailPage.setRequestInterception(true);
        detailPage.on('request', (request) => {
          const resourceType = request.resourceType();
          if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            request.abort();
          } else {
            request.continue();
          }
        });

        const processedBooks = [];

        for (const book of books) {
          detailSpinner.text = `Fetching details for: ${book.title}`;

          try {
            let bookUrl = book.link;

            if (!bookUrl.startsWith('http')) {
              bookUrl = new URL(bookUrl, baseUrl).href;
            }

            const bookDetails = await scrapeBookDetail(detailPage, bookUrl, {
              baseUrl: baseUrl,
              logProgress: false,
            });

            if (!bookDetails.error) {
              const new_bookDetails = {
                BookTitle: book.title,
                BookLink: bookUrl,
                BookDetails: {
                  Thumbnail: bookDetails.thumbnail,
                  Price: bookDetails.price,
                  StockInfo: bookDetails.stockInfo,
                  Rate: bookDetails.rate,
                  Category: bookDetails.category,
                  ProductInfo: bookDetails.productInfo,
                  Description: bookDetails.description,
                },
              };

              processedBooks.push(new_bookDetails);
              detailSpinner.succeed(`Fetched details for: ${book.title}`);

              const outputDir = './data/books';
              if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
              }

              const safeTitle = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              const fileName = `${safeTitle}.json`;
              fs.writeFileSync(
                path.join(outputDir, fileName),
                JSON.stringify(bookDetails, null, 2),
              );
            } else {
              detailSpinner.fail(
                `Failed to fetch details for: ${book.title} - ${bookDetails.message}`,
              );
              processedBooks.push(book);
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            console.error(chalk.red(`Error processing book "${book.title}": ${error.message}`));
            processedBooks.push(book);
          }
        }

        books = processedBooks;

        await detailPage.close();
        allBooks.push(...books);
        successfulPages++;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          chalk.red.bold('[X]') + chalk.red(` Error processing page ${currPage}: ${error.message}`),
        );
        console.error(error.stack);
      }
    }
 
    console.log(
      chalk.green.bold('[✔]') +
        chalk.green(` Successfully scraped ${allBooks.length} books from ${successfulPages} pages`),
    );
  } catch (error) {
    console.error(chalk.red.bold('[X]') + chalk.red(` Fatal error: ${error.message}`));
    console.error(error.stack);
  } finally {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const outputDir = './data';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = path.join(outputDir, `books_${dateStr}.json`);

    if (allBooks.length > 0) {
      const saveSpinner = ora('Saving results to file...').start();
      try {
        const output = {
          metadata: {
            totalBooks: allBooks.length,
            pagesScraped: successfulPages,
            scrapedAt: new Date().toISOString(),
            duration: `${duration} seconds`,
          },
          books: allBooks,
        };

        fs.writeFileSync(filename, JSON.stringify(output, null, 2));
        saveSpinner.succeed(`Results saved to ${filename}`);
      } catch (error) {
        saveSpinner.fail(`Failed to save results: ${error.message}`);
      }
    } else {
      console.log(
        chalk.yellow.bold('[!]') + chalk.yellow(' No books were scraped, skipping file creation'),
      );
    }

    if (browser) {
      const closeSpinner = ora('Closing browser...').start();
      await browser.close();
      closeSpinner.succeed('Browser closed');
    }

    console.log(chalk.blue(`[%] Total execution time: ${duration} seconds`));
  }
}

main().catch((error) => {
  console.error('Unhandled error in main function:');
  console.error(error);
  process.exit(1);
});
