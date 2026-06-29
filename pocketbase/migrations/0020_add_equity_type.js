migrate(
  (app) => {
    const assets = app.findCollectionByNameOrId('assets')

    assets.fields.removeByName('type')
    assets.fields.add(
      new SelectField({
        name: 'type',
        values: ['property', 'vehicle', 'investment', 'international', 'equity'],
        maxSelect: 1,
      }),
    )

    if (!assets.fields.getByName('equity_percentage')) {
      assets.fields.add(new NumberField({ name: 'equity_percentage', min: 0, max: 100 }))
    }
    if (!assets.fields.getByName('modality')) {
      assets.fields.add(new TextField({ name: 'modality' }))
    }
    if (!assets.fields.getByName('contract_info')) {
      assets.fields.add(new TextField({ name: 'contract_info' }))
    }
    if (!assets.fields.getByName('corporate_details')) {
      assets.fields.add(new TextField({ name: 'corporate_details' }))
    }

    app.save(assets)

    try {
      app.findFirstRecordByData('asset_types', 'name', 'Participações Societárias')
    } catch (_) {
      const typesCol = app.findCollectionByNameOrId('asset_types')
      const record = new Record(typesCol)
      record.set('name', 'Participações Societárias')
      record.set('icon', 'Building2')
      record.set('is_system', true)
      const existing = app.findRecordsByFilter(
        'asset_types',
        'is_system = true',
        '-sort_order',
        1,
        0,
      )
      const maxSort = existing.length > 0 ? existing[0].getNumber('sort_order') || 0 : 0
      record.set('sort_order', maxSort + 1)
      app.save(record)
    }
  },
  (app) => {
    const assets = app.findCollectionByNameOrId('assets')
    assets.fields.removeByName('equity_percentage')
    assets.fields.removeByName('modality')
    assets.fields.removeByName('contract_info')
    assets.fields.removeByName('corporate_details')
    assets.fields.removeByName('type')
    assets.fields.add(
      new SelectField({
        name: 'type',
        values: ['property', 'vehicle', 'investment', 'international'],
        maxSelect: 1,
      }),
    )
    app.save(assets)
    try {
      const record = app.findFirstRecordByData('asset_types', 'name', 'Participações Societárias')
      app.delete(record)
    } catch (_) {}
  },
)
