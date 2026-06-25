onRecordDeleteRequest((e) => {
  try {
    const historyRecords = $app.findRecordsByFilter(
      'valuation_history',
      `asset = "${e.record.id}"`,
      '',
      10000,
      0,
    )
    for (const record of historyRecords) {
      $app.delete(record)
    }
  } catch (err) {
    $app
      .logger()
      .error('Error cascading asset deletion', 'assetId', e.record.id, 'error', err.message)
  }
  return e.next()
}, 'assets')
