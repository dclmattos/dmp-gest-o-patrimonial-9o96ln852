export function getAssetCategoryIds(asset: any): string[] {
  if (!asset.category) return []
  if (Array.isArray(asset.category)) return asset.category
  return [asset.category]
}

export function getAssetCategories(asset: any, allCategories?: any[]): any[] {
  const expanded = asset.expand?.category
  if (expanded) {
    return Array.isArray(expanded) ? expanded : [expanded]
  }
  const ids = getAssetCategoryIds(asset)
  if (!allCategories || ids.length === 0) return []
  return ids.map((id) => allCategories.find((c) => c.id === id)).filter((c): c is any => Boolean(c))
}

export function assetHasCategory(asset: any, categoryId: string): boolean {
  return getAssetCategoryIds(asset).includes(categoryId)
}

export function assetHasAnyCategory(asset: any): boolean {
  return getAssetCategoryIds(asset).length > 0
}
