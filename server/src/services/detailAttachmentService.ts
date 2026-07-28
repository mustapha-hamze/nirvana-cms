// Shared by the Content/Page admin list and single-item endpoints — attaches
// each parent's per-language detail rows as a `details` array, in one query
// covering every parent rather than one query per parent (no N+1).
//
// `parentField` is 'content' or 'page' — the field on DetailModel that
// references the parent. `application` is included in the filter even
// though `{ [parentField]: { $in: parentIds } }` alone is already sufficient
// to scope the results correctly (every parentId already belongs to this
// application) — DetailModel denormalizes `application` precisely so a
// filter like this one can use it instead of relying solely on an $in over
// potentially many ids.
interface DetailModelLike {
  find: (filter: Record<string, unknown>) => { sort: (order: Record<string, 1 | -1>) => Promise<any[]> };
}

interface ParentLike {
  _id: unknown;
  toObject: () => Record<string, unknown>;
}

export async function attachDetailsToParents(
  DetailModel: DetailModelLike,
  parentField: "content" | "page",
  parents: ParentLike[],
  { application, langKey, status }: { application?: any; langKey?: string; status?: string } = {},
) {
  const parentIds = parents.map((p) => p._id);
  const filter: Record<string, unknown> = { application, [parentField]: { $in: parentIds } };
  if (langKey) filter.langKey = langKey;
  if (status) filter.status = status;

  const details = await DetailModel.find(filter).sort({ langKey: 1 });

  const byParentId = new Map<string, any[]>();
  for (const detail of details) {
    const key = detail[parentField].toString();
    if (!byParentId.has(key)) byParentId.set(key, []);
    byParentId.get(key)!.push(detail);
  }

  return parents.map((p) => ({
    ...p.toObject(),
    details: byParentId.get((p._id as { toString(): string }).toString()) ?? [],
  }));
}
