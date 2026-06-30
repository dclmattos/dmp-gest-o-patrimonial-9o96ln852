migrate(
  (app) => {
    const receivables = app.findCollectionByNameOrId('receivables')
    if (!receivables.fields.getByName('is_done')) {
      receivables.fields.add(new BoolField({ name: 'is_done' }))
    }
    app.save(receivables)

    const liabilities = app.findCollectionByNameOrId('liabilities')
    if (!liabilities.fields.getByName('is_done')) {
      liabilities.fields.add(new BoolField({ name: 'is_done' }))
    }
    app.save(liabilities)
  },
  (app) => {
    const receivables = app.findCollectionByNameOrId('receivables')
    receivables.fields.removeByName('is_done')
    app.save(receivables)

    const liabilities = app.findCollectionByNameOrId('liabilities')
    liabilities.fields.removeByName('is_done')
    app.save(liabilities)
  },
)
