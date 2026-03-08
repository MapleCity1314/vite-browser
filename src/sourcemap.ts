import { SourceMapConsumer } from "source-map-js";

type MappedLocation = {
  file: string;
  line: number;
  column: number;
  snippet?: string;
};

const consumers = new Map<string, SourceMapConsumer | null>();
type FetchImpl = typeof fetch;

export async function resolveViaSourceMap(
  origin: string,
  fileUrl: string,
  line: number,
  column: number,
  includeSnippet = false,
  fetchImpl: FetchImpl = fetch,
): Promise<MappedLocation | null> {
  const consumer = await loadConsumer(origin, fileUrl, fetchImpl);
  if (!consumer) return null;

  const position = consumer.originalPositionFor({
    line,
    column: Math.max(0, column - 1),
  });

  if (!position.source || position.line == null || position.column == null) return null;

  const mapped: MappedLocation = {
    file: cleanSource(position.source),
    line: position.line,
    column: position.column + 1,
  };

  if (includeSnippet) {
    mapped.snippet = snippetFor(consumer, position.source, position.line);
  }

  return mapped;
}

export function clearSourceMapCache() {
  consumers.clear();
}

async function loadConsumer(
  origin: string,
  fileUrl: string,
  fetchImpl: FetchImpl,
): Promise<SourceMapConsumer | null> {
  const candidates = buildMapCandidates(origin, fileUrl);

  for (const url of candidates) {
    if (consumers.has(url)) {
      const cached = consumers.get(url);
      if (cached) return cached;
      continue;
    }

    const response = await fetchImpl(url, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (!response?.ok) {
      consumers.set(url, null);
      continue;
    }

    const map = await response.json().catch(() => null);
    if (!map) {
      consumers.set(url, null);
      continue;
    }

    const consumer = new SourceMapConsumer(map);
    consumers.set(url, consumer);
    return consumer;
  }

  return null;
}

export function buildMapCandidates(origin: string, fileUrl: string): string[] {
  const url = new URL(fileUrl, origin);
  const basePath = `${url.pathname}.map`;
  const withSearch = url.search ? `${basePath}${url.search}` : basePath;

  // Try preserving query first (Vite often keeps cache-busting query params).
  return [`${origin}${withSearch}`, `${origin}${basePath}`];
}

export function cleanSource(source: string): string {
  const decoded = decodeURIComponent(source.replace(/^file:\/\//, ""));
  const nodeModulesIndex = decoded.lastIndexOf("/node_modules/");
  if (nodeModulesIndex >= 0) return decoded.slice(nodeModulesIndex + 1);
  return decoded;
}

export function snippetFor(
  consumer: SourceMapConsumer,
  source: string,
  line: number,
): string | undefined {
  const content = consumer.sourceContentFor(source, true);
  if (!content) return undefined;

  const lines = content.split(/\r?\n/);
  const sourceLine = lines[line - 1];
  if (!sourceLine) return undefined;
  return `${line} | ${sourceLine.trim()}`;
}
