import test from "node:test";
import assert from "node:assert/strict";

const TAVILY_API_URL = "https://api.tavily.com/search";

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

function buildSearchRequestBody(query: string, numResults: number = 5) {
  return {
    api_key: "test-key",
    query,
    search_depth: "advanced",
    max_results: numResults,
    include_answer: true,
    include_images: false,
  };
}

function parseSearchResults(data: {
  answer?: string;
  results?: Array<{ title?: string; url?: string; content?: string }>;
}): string[] {
  const results: string[] = [];

  if (data.answer) {
    results.push(`Answer: ${data.answer}`);
  }

  if (data.results && data.results.length > 0) {
    for (const result of data.results) {
      results.push(`- ${result.title}: ${result.url}`);
    }
  }

  return results;
}

test("isValidUrl returns true for valid https URLs", () => {
  assert.equal(isValidUrl("https://example.com"), true);
  assert.equal(isValidUrl("https://example.com/path"), true);
  assert.equal(isValidUrl("https://example.com/path?query=value"), true);
});

test("isValidUrl returns true for valid http URLs", () => {
  assert.equal(isValidUrl("http://example.com"), true);
});

test("isValidUrl returns false for invalid URLs", () => {
  assert.equal(isValidUrl("not-a-url"), false);
  assert.equal(isValidUrl(""), false);
});

test("normalizeUrl adds https to URLs without protocol", () => {
  assert.equal(normalizeUrl("example.com"), "https://example.com");
  assert.equal(normalizeUrl("example.com/path"), "https://example.com/path");
});

test("normalizeUrl preserves URLs with protocol", () => {
  assert.equal(normalizeUrl("https://example.com"), "https://example.com");
  assert.equal(normalizeUrl("http://example.com"), "http://example.com");
});

test("extractDomain returns hostname from URL", () => {
  assert.equal(extractDomain("https://example.com"), "example.com");
  assert.equal(extractDomain("https://example.com/path"), "example.com");
  assert.equal(extractDomain("https://sub.example.com"), "sub.example.com");
});

test("extractDomain returns null for invalid URLs", () => {
  assert.equal(extractDomain("not-a-url"), null);
  assert.equal(extractDomain(""), null);
});

test("buildSearchRequestBody creates correct structure", () => {
  const body = buildSearchRequestBody("test query", 10);

  assert.equal(body.query, "test query");
  assert.equal(body.max_results, 10);
  assert.equal(body.search_depth, "advanced");
  assert.equal(body.include_answer, true);
  assert.equal(body.include_images, false);
});

test("buildSearchRequestBody uses default numResults", () => {
  const body = buildSearchRequestBody("test");

  assert.equal(body.max_results, 5);
});

test("parseSearchResults extracts answer and results", () => {
  const data = {
    answer: "This is the answer",
    results: [
      { title: "Result 1", url: "https://example1.com", content: "Content 1" },
      { title: "Result 2", url: "https://example2.com", content: "Content 2" },
    ],
  };

  const results = parseSearchResults(data);

  assert.equal(results.length, 3);
  assert.ok(results[0].includes("This is the answer"));
  assert.ok(results[1].includes("Result 1"));
  assert.ok(results[2].includes("Result 2"));
});

test("parseSearchResults handles empty data", () => {
  const results = parseSearchResults({});

  assert.equal(results.length, 0);
});

test("parseSearchResults handles missing answer", () => {
  const data = {
    results: [{ title: "Result 1", url: "https://example.com" }],
  };

  const results = parseSearchResults(data);

  assert.equal(results.length, 1);
  assert.ok(results[0].includes("Result 1"));
});

test("parseSearchResults handles missing results", () => {
  const data = { answer: "Only answer" };

  const results = parseSearchResults(data);

  assert.equal(results.length, 1);
  assert.ok(results[0].includes("Only answer"));
});
