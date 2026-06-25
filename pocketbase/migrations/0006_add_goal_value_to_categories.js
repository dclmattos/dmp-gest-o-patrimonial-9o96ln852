migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('asset_categories')
    col.fields.add(new NumberField({ name: 'goal_value', min: 0 }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('asset_categories')
    col.fields.removeByName('goal_value')
    app.save(col)
  },
)
