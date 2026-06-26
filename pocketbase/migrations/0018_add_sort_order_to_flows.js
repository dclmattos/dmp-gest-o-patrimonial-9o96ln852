migrate(
  (app) => {
    const receivables = app.findCollectionByNameOrId('receivables')
    if (!receivables.fields.getByName('sort_order')) {
      receivables.fields.add(new NumberField({ name: 'sort_order' }))
    }
    app.save(receivables)

    const liabilities = app.findCollectionByNameOrId('liabilities')
    if (!liabilities.fields.getByName('sort_order')) {
      liabilities.fields.add(new NumberField({ name: 'sort_order' }))
    }
    app.save(liabilities)

    try {
      const recs = app.findRecordsByFilter('receivables', '', 'created')
      for (let i = 0; i < recs.length; i++) {
        recs[i].set('sort_order', i + 1)
        app.saveNoValidate(recs[i])
      }
    } catch (err) {}

    try {
      const liabs = app.findRecordsByFilter('liabilities', '', 'created')
      for (let i = 0; i < liabs.length; i++) {
        liabs[i].set('sort_order', i + 1)
        app.saveNoValidate(liabs[i])
      }
    } catch (err) {}
  },
  (app) => {
    try {
      const receivables = app.findCollectionByNameOrId('receivables')
      receivables.fields.removeByName('sort_order')
      app.save(receivables)
    } catch (err) {}

    try {
      const liabilities = app.findCollectionByNameOrId('liabilities')
      liabilities.fields.removeByName('sort_order')
      app.save(liabilities)
    } catch (err) {}
  },
)
