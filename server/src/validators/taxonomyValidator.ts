import mongoose from "mongoose";

interface CountableModel {
  countDocuments: (filter: Record<string, unknown>) => Promise<number>;
}

// Shared by Content create/update — categories/tags are shared across every
// language of a Content item (see Content model comment), so they must all
// belong to the same application as the content.
export async function validateIdsInApplication(
  Model: CountableModel,
  ids: unknown,
  applicationId: any,
): Promise<boolean> {
  if (!Array.isArray(ids)) return false;
  if (ids.length === 0) return true;
  // Reject anything that isn't a plain ObjectId string before it reaches the
  // query — a client-supplied id array can otherwise carry query-operator
  // shapes (e.g. {"$ne": null}) into $in.
  if (!ids.every((id) => typeof id === "string" && mongoose.isValidObjectId(id))) {
    return false;
  }
  const uniqueCount = new Set(ids.map(String)).size;
  const found = await Model.countDocuments({
    _id: { $in: ids as string[] },
    application: applicationId,
  });
  return found === uniqueCount;
}
