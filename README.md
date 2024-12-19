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
- **Redis**: For caching and rate limiting.

## ToDos
- **Puppeteer**: for Google search feature/headless browsing
- **AI agents**: GROQ + GEMINI (https://ai.google.dev/gemini-api/docs/models/gemini)
- **Nextjs Server Actions**: to secure api endpoints (https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Build a comprehensive solution to extract content from any kind of URL or data source, such as YouTube videos, PDFs, CSV files, and images
- Generate visualizations from the data such as bar charts, line charts, histograms, etc.
- Implement a hierarchical web crawler that starts at a given URL and identifies all relevant links on the page (e.g., hyperlinks, embedded media links, and scrapes the content from those links as well) - **Firecrawl**: https://www.firecrawl.dev/ 

