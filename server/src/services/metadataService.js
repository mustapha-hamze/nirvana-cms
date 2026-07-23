// Shared by ContentDetails/PageDetails upserts. Applies only the metadata
// subfields the caller actually sent, so a partial update (e.g. just
// `author`) doesn't wipe out keywords/description.
export function applyMetadata(detail, metadata) {
  if (!metadata || typeof metadata !== "object") return;
  if (metadata.keywords !== undefined) {
    detail.metadata.keywords = Array.isArray(metadata.keywords)
      ? metadata.keywords.map((k) => String(k).trim()).filter(Boolean)
      : [];
  }
  if (metadata.author !== undefined) detail.metadata.author = String(metadata.author).trim();
  if (metadata.description !== undefined) detail.metadata.description = String(metadata.description).trim();
}
