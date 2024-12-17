import axios from "axios";
import * as cheerio from "cheerio";
import { Logger } from "./logger";
import { Redis } from "@upstash/redis";

const logger = new Logger("scraper");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache TTL in seconds (7 days)
const CACHE_TTL = 7 * (24 * 60 * 60);
const MAX_CACHE_SIZE = 1024000; // 1 MB Limit for Cached Content

export const urlPattern =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

// Function to clean text content
function cleanText(text: string) {
  return text.replace(/\s+/g, " ").replace(/\n+/g, " ").trim();
}

// Function to scrape content from a URL
export async function scrapeUrl(url: string) {
  try {
    logger.info(`Starting scrape process for URL: ${url}`);

    // Check Cache for URL
    const cached = await getCachedContent(url);
    if (cached) {
      logger.info(`Returning cached content for URL: ${url}`);
      return cached;  // Return immediately if cached content exists
    }

    logger.info(`Cache miss - Scraping content for URL: ${url}`);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    // Remove script tags, style tags, and comments
    $("script").remove();
    $("style").remove();
    $("noscript").remove();
    $("iframe").remove();
    // Extract useful information
    const title = $("title").text();
    const metaDescription = $('meta[name="description"]').attr("content") || "";
    const h1 = $("h1")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const h2 = $("h2")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    // Get text from important elements
    const articleText = $("article")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const mainText = $("main")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const contentText = $('.content, #content, [class*="content"]')
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    // Get all paragraph text
    const paragraphs = $("p")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    // Get list items
    const listItems = $("li")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    // Combine all content
    let combinedContent = [
      title,
      metaDescription,
      h1,
      h2,
      articleText,
      mainText,
      contentText,
      paragraphs,
      listItems,
    ].join(" ");
    // Clean and truncate the content
    combinedContent = cleanText(combinedContent).slice(0, 50000);

    const finalResponse = {
      url,
      title: cleanText(title),
      headings: {
        h1: cleanText(h1),
        h2: cleanText(h2),
      },
      metaDescription: cleanText(metaDescription),
      content: combinedContent,
      error: null,
    };

    await cacheContent(url, finalResponse);
    return finalResponse;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return {
      url,
      title: "",
      headings: { h1: "", h2: "" },
      metaDescription: "",
      content: "",
      error: "Failed to scrape URL",
    };
  }
}

export interface ScrapedContent {
  url: string;
  title: string;
  headings: {
    h1: string;
    h2: string;
  };
  metaDescription: string;
  content: string;
  error: string | null;
  cachedAt?: number;
}

// Validation function for ScrapedContent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidScrapedContent(data: any): data is ScrapedContent {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.url === "string" &&
    typeof data.title === "string" &&
    typeof data.headings === "object" &&
    typeof data.headings.h1 === "string" &&
    typeof data.headings.h2 === "string" &&
    typeof data.metaDescription === "string" &&
    typeof data.content === "string" &&
    (data.error === null || typeof data.error === "string")
  );
}

// Function get cache key for a URL with sanitization
function getCacheKey(url: string): string {
  if (typeof url !== 'string') {
    throw new Error(`Invalid URL type: expected string, got ${typeof url}`);
  }
  const sanitizedUrl = url.substring(0, 100); // Limit to key length
  return `scrape:${sanitizedUrl}`;
}

// Function to get cached content with error handling
async function getCachedContent(url: string): Promise<ScrapedContent | null> {
  try {
    const cacheKey = getCacheKey(url);
    logger.info(`Checking cache for key: ${cacheKey}`);
    const cached = await redis.get(cacheKey);

    if (!cached) {
      logger.info(`Cache miss - No cached content found for: ${url}`);
      return null;
    }

    logger.info(`Cache hit - Found cached content for: ${url}`);

    // Handle both string and object responses from Redis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    if (typeof cached === "string") {
      try {
        parsed = JSON.parse(cached);
      } catch (parseError) {
        logger.error(`JSON parse error for cached content: ${parseError}`);
        await redis.del(cacheKey);
        return null;
      }
    } else {
      parsed = cached;
    }

    if (isValidScrapedContent(parsed)) {
      const age = Date.now() - (parsed.cachedAt || 0);
      logger.info(`Cached content age: ${Math.round(age / 1000 / 60)} minutes`);
      return parsed;
    }

    logger.warn(`Invalid cached content format for URL: ${url}`);
    await redis.del(cacheKey);
    return null;
  } catch (error) {
    logger.error(`Cache retrieval error: ${error}`);
    return null;
  }
}

// Function to cache scraped content with error handling
async function cacheContent(
  url: string,
  content: ScrapedContent
): Promise<void> {
  try {
    const cacheKey = getCacheKey(url);
    content.cachedAt = Date.now();

    // Validate content before serializing
    if (!isValidScrapedContent(content)) {
      logger.error(`Attempted to cache invalid content format for URL: ${url}`);
      return;
    }

    const serialized = JSON.stringify(content);

    if (serialized.length > MAX_CACHE_SIZE) {
      logger.warn(
        `Attempted to cache content over size limit for URL: ${url} (${serialized.length} bytes)`
      );
      return;
    }

    await redis.set(cacheKey, serialized, { ex: CACHE_TTL });

    logger.info(
      `Successfully cached content for URL: ${url} (${serialized.length} bytes, TTL: ${CACHE_TTL}s)`
    );
  } catch (error) {
    logger.error(`Cache storage error: ${error}`);
  }
}
