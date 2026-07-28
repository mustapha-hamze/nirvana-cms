interface DetailMetadata {
  metadata: {
    keywords: string[];
    author: string;
    description: string;
  };
}

// Shared by ContentDetails/PageDetails upserts. Applies only the metadata
// subfields the caller actually sent, so a partial update (e.g. just
// `author`) doesn't wipe out keywords/description.
export function applyMetadata(detail: DetailMetadata, metadata: unknown): void {
  if (!metadata || typeof metadata !== "object") return;
  const input = metadata as Record<string, unknown>;
  if (input.keywords !== undefined) {
    detail.metadata.keywords = Array.isArray(input.keywords)
      ? input.keywords.map((k) => String(k).trim()).filter(Boolean)
      : [];
  }
  if (input.author !== undefined) detail.metadata.author = String(input.author).trim();
  if (input.description !== undefined) detail.metadata.description = String(input.description).trim();
}
