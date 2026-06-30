export function sortAlphabetically<T>(items: T[], field: keyof T): T[] {
  return [...items].sort((a, b) => {
    const av = String(a[field] ?? '').toLowerCase()
    const bv = String(b[field] ?? '').toLowerCase()
    return av.localeCompare(bv, 'pt-BR')
  })
}

export function sortByName<T extends { name?: string }>(items: T[]): T[] {
  return sortAlphabetically(items, 'name')
}

export function sortBySource<T extends { source?: string }>(items: T[]): T[] {
  return sortAlphabetically(items, 'source')
}

export function sortBySortOrderThenName<T extends { sort_order?: number; name?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const sa = a.sort_order ?? 0
    const sb = b.sort_order ?? 0
    if (sa !== sb) return sa - sb
    return String(a.name ?? '')
      .toLowerCase()
      .localeCompare(String(b.name ?? '').toLowerCase(), 'pt-BR')
  })
}

export interface HierarchicalCategoryItem {
  category: any
  parentName: string | null
  depth: number
}

export function buildHierarchicalList(categories: any[]): HierarchicalCategoryItem[] {
  const roots = categories.filter((c) => !c.parent_id)
  const result: HierarchicalCategoryItem[] = []

  for (const root of sortBySortOrderThenName(roots)) {
    result.push({ category: root, parentName: null, depth: 0 })
    const children = categories.filter((c) => c.parent_id === root.id)
    for (const child of sortBySortOrderThenName(children)) {
      result.push({ category: child, parentName: root.name, depth: 1 })
    }
  }

  const rootIds = new Set(roots.map((r) => r.id))
  const orphans = categories.filter((c) => c.parent_id && !rootIds.has(c.parent_id))
  for (const orphan of sortBySortOrderThenName(orphans)) {
    result.push({ category: orphan, parentName: null, depth: 0 })
  }

  return result
}
