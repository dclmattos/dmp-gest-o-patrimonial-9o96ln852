migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('receivables')
    col.fields.add(
      new RelationField({
        name: 'asset',
        collectionId: app.findCollectionByNameOrId('assets').id,
        cascadeDelete: true,
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('receivables')
    col.fields.removeByName('asset')
    app.save(col)
  },
)
