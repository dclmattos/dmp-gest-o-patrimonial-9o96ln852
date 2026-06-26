migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('asset_categories')
    col.fields.add(
      new RelationField({
        name: 'parent_id',
        collectionId: col.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    col.addIndex('idx_asset_categories_parent', false, 'parent_id', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('asset_categories')
    col.removeIndex('idx_asset_categories_parent')
    col.fields.removeByName('parent_id')
    app.save(col)
  },
)
