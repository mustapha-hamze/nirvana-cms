// Shared by ContentDetails/PageDetails upserts — auto-derived slugs (title
// unspecified by the caller) disambiguate silently on collision — e.g.
// "weekly-update" -> "weekly-update-2" — like WordPress/Drupal, since
// duplicate titles are routine and shouldn't block a content/page creator.
// Explicit, caller-provided slugs are NOT resolved here — a collision on
// those stays a hard validation error, since the creator deliberately chose
// that slug.
// Checks soft-deleted rows too: they still occupy the unique index.
//
// `DetailModel` is ContentDetails or PageDetails — both share the same
// {application, langKey, slug} unique index shape, so this one function
// covers both instead of two near-identical copies.
export async function findAvailableDetailSlug(DetailModel, { application, langKey, baseSlug }) {
  let slug = baseSlug;
  let suffix = 2;
  while (
    await DetailModel.exists({
      application,
      langKey,
      slug,
      isDeleted: { $in: [true, false] },
    })
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}
