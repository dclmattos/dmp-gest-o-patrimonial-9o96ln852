migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('flow_overrides')
    if (!col.fields.getByName('description')) {
      col.fields.add(new TextField({ name: 'description' }))
    }
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('flow_overrides')
      const field = col.fields.getByName('description')
      if (field) col.fields.remove(field)
      app.save(col)
    } catch (_) {}
  },
)
