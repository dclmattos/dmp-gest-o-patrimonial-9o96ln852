onRecordAfterCreateSuccess((e) => {
  const text = [
    e.record.getString('name'),
    e.record.getString('type'),
    e.record.getString('subtype'),
    e.record.getString('location'),
    e.record.getString('notes'),
  ]
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
