migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('assets')
    if (!col.fields.getByName('attachments')) {
      col.fields.add(
        new FileField({
          name: 'attachments',
          maxSelect: 20,
          maxSize: 5242880,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('assets')
    const field = col.fields.getByName('attachments')
    if (field) {
      col.fields.remove(field)
    }
    app.save(col)
  },
)
