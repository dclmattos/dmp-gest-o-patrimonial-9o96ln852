migrate(
  (app) => {
    const typesCol = app.findCollectionByNameOrId('asset_types')

    const defaultTypes = [
      {
        id: 'sysproperty0000',
        name: 'Imóveis',
        icon: 'Building2',
        is_system: true,
        old_type: 'property',
      },
      {
        id: 'sysvehicle00000',
        name: 'Veículos',
        icon: 'Car',
        is_system: true,
        old_type: 'vehicle',
      },
      {
        id: 'sysinvestment00',
        name: 'Investimentos BR',
        icon: 'TrendingUp',
        is_system: true,
        old_type: 'investment',
      },
      {
        id: 'sysinternat0000',
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
      'sysproperty0000',
      'sysvehicle00000',
      'sysinvestment00',
      'sysinternat0000',
    ]
    for (const id of defaultTypes) {
      try {
        const record = app.findRecordById('asset_types', id)
        app.delete(record)
      } catch (_) {}
    }
  },
)
