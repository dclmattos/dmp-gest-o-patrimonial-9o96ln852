import { isSameMonth, startOfMonth } from 'date-fns'

export function findOverride(
  overrides: any[],
  flowId: string,
  flowType: string,
  month: Date,
): any | null {
  return (
    overrides.find(
      (o) =>
        o.flow_id === flowId && o.flow_type === flowType && isSameMonth(new Date(o.month), month),
    ) || null
  )
}

export function getAssetName(record: any, assets: any[]): string {
  if (!record.asset) return ''
  const asset = assets.find((a) => a.id === record.asset)
  return asset?.name || ''
}

export function getBaseDescription(
  record: any,
  type: 'receivable' | 'liability',
  assets: any[],
): string {
  const baseName = type === 'receivable' ? record.source : record.name
  const assetName = getAssetName(record, assets)
  return assetName ? `${baseName} — ${assetName}` : baseName
}

export function getDisplayDescription(
  record: any,
  type: 'receivable' | 'liability',
  override: any | null,
  assets: any[],
): string {
  if (override?.description) return override.description
  return getBaseDescription(record, type, assets)
}

export function getBaseAmount(record: any, type: 'receivable' | 'liability'): number {
  if (type === 'receivable') return record.amount || 0
  return record.monthly_installment || record.remaining_balance || 0
}

export function shouldShowInMonth(
  record: any,
  type: 'receivable' | 'liability',
  month: Date,
): boolean {
  if (type === 'liability') {
    if (record.is_recurring) return true
    if (record.due_date) return isSameMonth(new Date(record.due_date), month)
    return true
  }
  const freq = record.frequency || 'monthly'
  if (freq === 'one-time') {
    return record.expected_date ? isSameMonth(new Date(record.expected_date), month) : true
  }
  if (freq === 'monthly') return true
  if (freq === 'quarterly') {
    if (!record.expected_date) return true
    const start = startOfMonth(new Date(record.expected_date))
    const diff =
      (month.getFullYear() - start.getFullYear()) * 12 + (month.getMonth() - start.getMonth())
    return diff >= 0 && diff % 3 === 0
  }
  if (freq === 'yearly') {
    if (!record.expected_date) return true
    const start = startOfMonth(new Date(record.expected_date))
    return month.getMonth() === start.getMonth() && month.getFullYear() >= start.getFullYear()
  }
  return true
}
