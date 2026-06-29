onRecordAfterUpdateSuccess((e) => {
  const fields = [
    'name',
    'type',
    'subtype',
    'location',
    'notes',
    'modality',
    'contract_info',
    'corporate_details',
  ]
  const changed = fields.some((f) => e.record.getString(f) !== e.record.original().getString(f))
  if (!changed) return e.next()

  const text = fields
    .map((f) => e.record.getString(f))
    .filter(Boolean)
    .join('\n\n')
    .trim()
  if (!text) return e.next()

  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('assets', e.record.id)
    record.set('embedding', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    console.log('embedding failed for asset ' + e.record.id, err.message)
  }
  return e.next()
}, 'assets')
