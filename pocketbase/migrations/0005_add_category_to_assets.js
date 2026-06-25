migrate(
  (app) => {
    const assets = app.findCollectionByNameOrId('assets')
    const categories = app.findCollectionByNameOrId('asset_categories')

    assets.fields.add(
      new RelationField({
        name: 'category',
        collectionId: categories.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )

    assets.addIndex('idx_assets_category', false, 'category', '')
    app.save(assets)
  },
  (app) => {
    const assets = app.findCollectionByNameOrId('assets')
    assets.fields.removeByName('category')
    assets.removeIndex('idx_assets_category')
    app.save(assets)
  },
)
