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

const LEGACY_TYPE_MAPPING: Record<string, string> = {
  Imóveis: 'property',
  Veículos: 'vehicle',
  Investimentos: 'investment',
  Internacional: 'international',
}

export function getChildCategoryIds(categories: any[], parentId: string): string[] {
  const children = categories.filter((c) => c.parent_id === parentId)
  return children.reduce<string[]>((acc, child) => {
    return [...acc, child.id, ...getChildCategoryIds(categories, child.id)]
  }, [])
}

export function assetMatchesCategoryRecursive(
  asset: any,
  categoryId: string,
  allCategories: any[],
): boolean {
  const assetCategoryIds = getAssetCategoryIds(asset)
  if (assetCategoryIds.includes(categoryId)) return true
  const childIds = getChildCategoryIds(allCategories, categoryId)
  return assetCategoryIds.some((id) => childIds.includes(id))
}

export function assetMatchesType(asset: any, selectedType: string, assetTypes: any[]): boolean {
  if (asset.type === selectedType) return true
  for (const t of assetTypes) {
    if (t.id === asset.type_ref && LEGACY_TYPE_MAPPING[t.name] === selectedType) {
      return true
    }
  }
  return false
}
