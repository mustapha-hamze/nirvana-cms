// Shared by Content create/update — categories/tags are shared across every
// language of a Content item (see Content model comment), so they must all
// belong to the same application as the content.
export async function validateIdsInApplication(Model, ids, applicationId) {
  if (!Array.isArray(ids)) return false;
  if (ids.length === 0) return true;
  const uniqueCount = new Set(ids.map(String)).size;
  const found = await Model.countDocuments({
    _id: { $in: ids },
    application: applicationId,
  });
  return found === uniqueCount;
}
