Welcome to the AI Answer Engine project! This application leverages advanced AI models to provide answers to user queries by scraping relevant content from the web. It is built using Next.js, TypeScript, and integrates with various libraries for web scraping and AI processing.

## Features

- **AI-Powered Responses**: Utilizes Groq SDK to generate responses based on user queries.
- **Web Scraping**: Scrapes content from URLs provided by users using Cheerio and Puppeteer.
- **Rate Limiting**: Implements rate limiting using Redis to manage API usage effectively.
- **Caching**: Caches scraped content to improve performance and reduce redundant requests.

## Technologies Used

- **Next.js**: A React framework for building server-side rendered applications.
- **TypeScript**: A superset of JavaScript that adds static types.
- **Axios**: For making HTTP requests.
- **Cheerio**: For parsing and manipulating HTML.
- **Puppeteer**: For headless browser automation.
- **Redis**: For caching and rate limiting.
