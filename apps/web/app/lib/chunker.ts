export interface Chunk {
  content: string;
  metadata: { source: string; chunk: number };
}

const MAX_CHUNK_SIZE = 2000; // ~500 tokens

/**
 * Split a markdown document into chunks for embedding.
 * Splits on ## headers, preserving document title as context in each chunk.
 * Files without ## headers become a single chunk.
 */
export function chunkMarkdown(text: string, source: string): Chunk[] {
  // Strip HTML comments
  const cleaned = text.replace(/<!--[\s\S]*?-->/g, "").trim();
  if (!cleaned) return [];

  // Extract document title (# header)
  const titleMatch = cleaned.match(/^# .+$/m);
  const title = titleMatch ? titleMatch[0] : "";

  // Split on ## headers (lookahead keeps ## with the section)
  const parts = cleaned.split(/(?=^## )/m);
  const sections: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed === title) continue;
    sections.push(trimmed);
  }

  // No ## sections → whole document is one chunk
  if (sections.length === 0) {
    return [{ content: cleaned, metadata: { source, chunk: 0 } }];
  }

  const chunks: Chunk[] = [];

  for (const section of sections) {
    // First section includes # title already; others get it prepended
    const content =
      section.startsWith("# ") && !section.startsWith("## ")
        ? section
        : title
          ? `${title}\n\n${section}`
          : section;

    if (content.length <= MAX_CHUNK_SIZE) {
      chunks.push({ content, metadata: { source, chunk: chunks.length } });
    } else {
      splitOversizedSection(section, title, chunks, source);
    }
  }

  return chunks;
}

function splitOversizedSection(
  section: string,
  title: string,
  chunks: Chunk[],
  source: string
): void {
  const header = section.match(/^##* .+$/m)?.[0] ?? "";
  const body = header ? section.slice(header.length).trim() : section;
  const paragraphs = body.split(/\n\n+/);

  const needsTitle =
    title && !(section.startsWith("# ") && !section.startsWith("## "));
  const prefix = needsTitle
    ? `${title}\n\n${header}\n\n`
    : header
      ? `${header}\n\n`
      : "";

  let acc = prefix;
  for (const para of paragraphs) {
    if (
      acc.length + para.length + 2 > MAX_CHUNK_SIZE &&
      acc.length > prefix.length
    ) {
      chunks.push({
        content: acc.trim(),
        metadata: { source, chunk: chunks.length },
      });
      acc = prefix;
    }
    acc += para + "\n\n";
  }
  if (acc.trim().length > prefix.trim().length) {
    chunks.push({
      content: acc.trim(),
      metadata: { source, chunk: chunks.length },
    });
  }
}
