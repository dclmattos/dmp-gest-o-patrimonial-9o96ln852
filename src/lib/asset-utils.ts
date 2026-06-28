export function getAssetCategoryIds(asset: any): string[] {
  if (!asset.category) return []
  if (Array.isArray(asset.category)) return asset.category
  return [asset.category]
}

export function assetHasCategory(asset: any, categoryId: string): boolean {
  return getAssetCategoryIds(asset).includes(categoryId)
}

export function assetHasAnyCategory(asset: any): boolean {
  return getAssetCategoryIds(asset).length > 0
}
