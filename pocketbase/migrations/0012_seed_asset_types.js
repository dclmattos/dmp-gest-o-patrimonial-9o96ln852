migrate(
  (app) => {
    const typesCol = app.findCollectionByNameOrId('asset_types')

    const defaultTypes = [
      {
        id: 'system_property',
        name: 'Imóveis',
        icon: 'Building2',
        is_system: true,
        old_type: 'property',
      },
      { id: 'system_vehicle', name: 'Veículos', icon: 'Car', is_system: true, old_type: 'vehicle' },
      {
        id: 'system_investment',
        name: 'Investimentos BR',
        icon: 'TrendingUp',
        is_system: true,
        old_type: 'investment',
      },
      {
        id: 'system_internat',
        name: 'Internacional',
        icon: 'Globe',
        is_system: true,
        old_type: 'international',
      },
    ]

    for (const t of defaultTypes) {
      try {
        app.findRecordById('asset_types', t.id)
      } catch (_) {
        const record = new Record(typesCol)
        record.set('id', t.id)
        record.set('name', t.name)
        record.set('icon', t.icon)
        record.set('is_system', t.is_system)
        app.save(record)
      }
    }

    // Migrate existing assets
    const assets = app.findRecordsByFilter('assets', '1=1', '', 10000, 0)
    for (const asset of assets) {
      const oldType = asset.getString('type')
      if (oldType && !asset.getString('type_ref')) {
        const matched = defaultTypes.find((dt) => dt.old_type === oldType)
        if (matched) {
          asset.set('type_ref', matched.id)
          app.save(asset)
        }
      }
    }
  },
  (app) => {
    const defaultTypes = [
      'system_property',
      'system_vehicle',
      'system_investment',
      'system_internat',
    ]
    for (const id of defaultTypes) {
      try {
        const record = app.findRecordById('asset_types', id)
        app.delete(record)
      } catch (_) {}
    }
  },
)
