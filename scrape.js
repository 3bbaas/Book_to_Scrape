/**
 * Scrapes books data from (https://books.toscrape.com)
 * @param {Page} page - Page Object
 * @param {string} url - URL
 * @param {Object} options - Configs
 * @returns {Array} - Books
 */

export const scrape = async (page, url, options = {}) => {
  const defaultOptions = {
    timeout: 5000,
    logProgress: false,
    waitUntil: 'networkidle2',
    categoryUrl: 'https://books.toscrape.com/catalogue/',
  };

  const config = { ...defaultOptions, ...options };

  try {
    await page.setDefaultNavigationTimeout(config.timeout);

    if (config.logProgress) {
      console.log(`# Navigating to ${url}`);
    }

    const response = await page.goto(url, { waitUntil: config.waitUntil });

    if (!response || !response.ok()) {
      const status = response ? response.status() : 'unknown';
      throw new Error(`Failed to load page: HTTP status ${status}`);
    }

    const title = await page.title();
    if (config.logProgress) {
      console.log(`# Page loaded: "${title}"`);
    }

    const books = await page.evaluate(() => {
      const bookElements = document.querySelectorAll('.product_pod');
      if (bookElements.length === 0) {
        return [];
      }
      return Array.from(bookElements).map((book) => {
        const titleElement = book.querySelector('h3 a');
        const priceElement = book.querySelector('.price_color');
        const stockElement = book.querySelector('.instock.availability');
        const ratingElement = book.querySelector('.star-rating');
        const thumbnailElement = book.querySelector('div a img');

        const bookHref = titleElement ? titleElement.getAttribute('href') : '';

        return {
          title: titleElement ? titleElement.getAttribute('title') : 'Unknown Title',
          price: priceElement ? priceElement.textContent : 'Unknown Price',
          stock: stockElement ? 'InStock' : 'Out of Stock',
          rate: ratingElement ? ratingElement.className.split(' ')[1] : 'No Rating',
          link: bookHref,
          thumbnail: thumbnailElement ? thumbnailElement.getAttribute('src') : null,
        };
      });
    });

    if (config.logProgress) {
      console.log(`# Scraped ${books.length} books`);
    }

    const processedBooks = books.map((book) => {
      book.link = defaultOptions.categoryUrl + book.link;
      // console.log('=====================> ' + book.link);

      return book;
    });

    return processedBooks;
  } catch (error) {
    console.error(`[X] Error while scraping ${url}: ${error.message}`);
    return {
      error: true,
      message: error.message,
      url,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Scrapes detailed information for book from (https://books.toscrape.com/catalogue/<..book name ..>/)
 * @param {Page} page - Page Object
 * @param {string} url - URL
 * @param {Object} options - Configs
 * @returns {Object} - Book details
 */
export const scrapeBookDetail = async (page, url, options = {}) => {
  const defaultOptions = {
    timeout: 5000,
    logProgress: false,
    waitUntil: 'networkidle2',
    baseUrl: 'https://books.toscrape.com/',
  };

  const config = { ...defaultOptions, ...options };

  try {
    await page.setDefaultNavigationTimeout(config.timeout);

    if (config.logProgress) {
      console.log(`# Navigating to book detail: ${url}`);
    }

    let fullUrl = url;
    if (!url.startsWith('http')) {
      fullUrl = new URL(url, config.baseUrl).toString();
    }

    const response = await page.goto(fullUrl, { waitUntil: config.waitUntil });

    if (!response || !response.ok()) {
      const status = response ? response.status() : 'unknown';
      throw new Error(`Failed to load book detail page: HTTP status ${status}`);
    }

    const pageTitle = await page.title();
    if (config.logProgress) {
      console.log(`# Book detail page loaded: "${pageTitle}"`);
    }

    const bookDetails = await page.evaluate(() => {
      const thumbnailImg = document.querySelector('.item.active img');
      const thumbnail = thumbnailImg ? thumbnailImg.getAttribute('src') : null;

      const title = document.querySelector('.product_main h1').textContent.trim();
      const price = document.querySelector('.price_color').textContent.trim();
      const availability = document.querySelector('.instock.availability').textContent.trim();
      const inStock = availability && availability.includes('In stock') ? true : false;
      const stockText = inStock ? availability.replace(/[^\d]/g, '') : 'Out of Stock';

      const ratingElement = document.querySelector('.star-rating');
      const rate = ratingElement ? ratingElement.className.split(' ')[1] : 'No Rating';

      const descriptionEl = document.querySelector('#product_description + p');
      const description = descriptionEl
        ? descriptionEl.textContent.trim()
        : 'No description available';

      const tableRows = document.querySelectorAll('table.table-striped tr');
      const productInfo = {};

      tableRows.forEach((row) => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (th && td) {
          productInfo[th.textContent.trim()] = td.textContent.trim();
        }
      });

      const categoryElement = document.querySelector('.breadcrumb li:nth-child(3) a');
      const category = categoryElement ? categoryElement.textContent.trim() : 'Unknown Category';

      return {
        thumbnail,
        title,
        price,
        stockInfo: {
          inStock,
          quantity: stockText,
          availability,
        },
        rate,
        category,
        productInfo,
        description,
        scrapedAt: new Date().toISOString(),
      };
    });
    bookDetails.thumbnail =
      defaultOptions.baseUrl + bookDetails.thumbnail.replace(/^(\.\.\/)+/, '');
    // console.log('=====================> ' + bookDetails.thumbnail);

    if (config.logProgress) {
      console.log(`# Successfully scraped details for book: "${bookDetails.title}"`);
    }

    return bookDetails;
  } catch (error) {
    console.error(`[X] Error while scraping book detail ${url}: ${error.message}`);
    return {
      error: true,
      message: error.message,
      url,
      timestamp: new Date().toISOString(),
    };
  }
};
