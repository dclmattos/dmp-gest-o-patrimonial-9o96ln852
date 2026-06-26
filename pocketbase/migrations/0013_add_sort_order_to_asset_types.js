migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('asset_types')
    if (!col.fields.getByName('sort_order')) {
      col.fields.add(new NumberField({ name: 'sort_order' }))
    }
    app.save(col)

    // Seed default sort_order
    const records = app.findRecordsByFilter('asset_types', '', 'created')
    for (let i = 0; i < records.length; i++) {
      records[i].set('sort_order', i + 1)
      app.saveNoValidate(records[i])
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('asset_types')
    col.fields.removeByName('sort_order')
    app.save(col)
  },
)
