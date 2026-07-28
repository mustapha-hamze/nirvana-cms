import { paginateList } from "../src/utils/paginateList.js";

function item(id: string, title: string, createdAt: string) {
  return { id, title, createdAt };
}

const extractors = {
  idOf: (i: ReturnType<typeof item>) => i.id,
  titleOf: (i: ReturnType<typeof item>) => i.title,
  createdAtOf: (i: ReturnType<typeof item>) => i.createdAt,
};

describe("paginateList", () => {
  const items = [
    item("aaa111", "Banana", "2024-01-03"),
    item("bbb222", "Apple", "2024-01-01"),
    item("ccc333", "Cherry", "2024-01-02"),
  ];

  test("defaults to newest-first by creation date", () => {
    const result = paginateList(items, { ...extractors, page: 1, limit: 20 });
    expect(result.items.map((i) => i.title)).toEqual(["Banana", "Cherry", "Apple"]);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(1);
  });

  test("sorts by title A→Z by default when sortBy=title", () => {
    const result = paginateList(items, { ...extractors, sortBy: "title", page: 1, limit: 20 });
    expect(result.items.map((i) => i.title)).toEqual(["Apple", "Banana", "Cherry"]);
  });

  test("reverses sort order when sortOrder=asc is given for createdAt", () => {
    const result = paginateList(items, { ...extractors, sortBy: "createdAt", sortOrder: "asc", page: 1, limit: 20 });
    expect(result.items.map((i) => i.title)).toEqual(["Apple", "Cherry", "Banana"]);
  });

  test("filters by a case-insensitive title substring", () => {
    const result = paginateList(items, { ...extractors, search: "an", page: 1, limit: 20 });
    expect(result.items.map((i) => i.title)).toEqual(["Banana"]);
    expect(result.total).toBe(1);
  });

  test("filters by a case-insensitive id substring", () => {
    const result = paginateList(items, { ...extractors, search: "BBB", page: 1, limit: 20 });
    expect(result.items.map((i) => i.title)).toEqual(["Apple"]);
  });

  test("returns nothing when the search term matches neither id nor title", () => {
    const result = paginateList(items, { ...extractors, search: "zzz", page: 1, limit: 20 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  test("paginates using page and limit", () => {
    const page1 = paginateList(items, { ...extractors, sortBy: "title", page: 1, limit: 2 });
    expect(page1.items.map((i) => i.title)).toEqual(["Apple", "Banana"]);
    expect(page1.totalPages).toBe(2);

    const page2 = paginateList(items, { ...extractors, sortBy: "title", page: 2, limit: 2 });
    expect(page2.items.map((i) => i.title)).toEqual(["Cherry"]);
  });

  test("clamps invalid page/limit values instead of throwing", () => {
    const result = paginateList(items, { ...extractors, page: -5, limit: 0 });
    expect(result.page).toBe(1);
    expect(result.limit).toBeGreaterThan(0);
    expect(result.items.length).toBe(3);
  });

  test("clamps an oversized limit to the maximum", () => {
    const result = paginateList(items, { ...extractors, limit: 99999 });
    expect(result.limit).toBe(100);
  });
});
