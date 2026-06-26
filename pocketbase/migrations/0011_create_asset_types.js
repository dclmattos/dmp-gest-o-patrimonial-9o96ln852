migrate(
  (app) => {
    const collection = new Collection({
      name: 'asset_types',
      type: 'base',
      listRule: "@request.auth.id != '' && (user = @request.auth.id || is_system = true)",
      viewRule: "@request.auth.id != '' && (user = @request.auth.id || is_system = true)",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id && is_system = false",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id && is_system = false",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'icon', type: 'text' },
        {
          name: 'user',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'is_system', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_asset_types_user ON asset_types (user)'],
    })
    app.save(collection)

    const assets = app.findCollectionByNameOrId('assets')
    const typeField = assets.fields.getByName('type')
    if (typeField) {
      typeField.required = false
    }

    assets.fields.add(
      new RelationField({
        name: 'type_ref',
        collectionId: collection.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(assets)
  },
  (app) => {
    const assets = app.findCollectionByNameOrId('assets')
    assets.fields.removeByName('type_ref')
    app.save(assets)

    const collection = app.findCollectionByNameOrId('asset_types')
    app.delete(collection)
  },
)
