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
