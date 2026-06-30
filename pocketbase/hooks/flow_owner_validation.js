onRecordCreateRequest(
  (e) => {
    const assetId = e.record.getString('asset')
    if (!assetId) return e.next()

    try {
      const asset = $app.findRecordById('assets', assetId)
      const assetOwner = asset.getString('user')
      if (assetOwner) {
        e.record.set('user', assetOwner)
      }
    } catch (err) {
      $app
        .logger()
        .error(
          'flow_owner_validation: failed to set owner from asset',
          'assetId',
          assetId,
          'error',
          err.message,
        )
    }

    return e.next()
  },
  'receivables',
  'liabilities',
)
