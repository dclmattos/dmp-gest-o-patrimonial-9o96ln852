migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('asset_categories')
    if (!col.fields.getByName('sort_order')) {
      col.fields.add(new NumberField({ name: 'sort_order' }))
    }
    app.save(col)

    // Seed default sort_order based on creation order to ensure consistent initial state
    const records = app.findRecordsByFilter('asset_categories', '', 'created')
    for (let i = 0; i < records.length; i++) {
      records[i].set('sort_order', i + 1)
      app.saveNoValidate(records[i])
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('asset_categories')
    col.fields.removeByName('sort_order')
    app.save(col)
  },
)
