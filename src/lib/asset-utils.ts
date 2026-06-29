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
  'Investimentos BR': 'investment',
  Internacional: 'international',
  'Participações Societárias': 'equity',
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

function matchesBaseType(asset: any, baseType: string, assetTypes: any[]): boolean {
  if (asset.type === baseType) return true
  for (const t of assetTypes) {
    if (t.id === asset.type_ref && LEGACY_TYPE_MAPPING[t.name] === baseType) {
      return true
    }
  }
  return false
}

export function assetMatchesType(asset: any, selectedType: string, assetTypes: any[]): boolean {
  if (selectedType === 'investment') {
    return matchesBaseType(asset, 'investment', assetTypes) && asset.currency === 'BRL'
  }
  if (selectedType === 'international') {
    if (matchesBaseType(asset, 'international', assetTypes)) return true
    return matchesBaseType(asset, 'investment', assetTypes) && asset.currency !== 'BRL'
  }
  return matchesBaseType(asset, selectedType, assetTypes)
}

const BASE_TYPES = ['property', 'vehicle', 'investment', 'international', 'equity']

export function getAssetBaseType(asset: any, assetTypes: any[]): string | null {
  let baseType: string | null = null
  if (asset.type && BASE_TYPES.includes(asset.type)) {
    baseType = asset.type
  } else if (asset.type_ref) {
    const customType = assetTypes.find((t) => t.id === asset.type_ref)
    if (customType && LEGACY_TYPE_MAPPING[customType.name]) {
      baseType = LEGACY_TYPE_MAPPING[customType.name]
    }
  }
  if (baseType === 'investment' && asset.currency && asset.currency !== 'BRL') {
    return 'international'
  }
  return baseType || asset.type || null
}
