migrate(
  (app) => {
    const assets = app.findCollectionByNameOrId('assets')
    const categories = app.findCollectionByNameOrId('asset_categories')

    let existingData = []
    try {
      existingData = app
        .db()
        .newQuery("SELECT id, category FROM assets WHERE category IS NOT NULL AND category != ''")
        .all()
    } catch (e) {
      console.log('No existing category data to migrate')
    }

    assets.fields.removeByName('category')
    assets.fields.add(
      new RelationField({
        name: 'category',
        collectionId: categories.id,
        maxSelect: 20,
        cascadeDelete: false,
      }),
    )
    assets.addIndex('idx_assets_category', false, 'category', '')
    app.save(assets)

    for (const row of existingData) {
      const catId = row.category
      if (catId && typeof catId === 'string') {
        app
          .db()
          .newQuery('UPDATE assets SET category = {:cats} WHERE id = {:id}')
          .bind({ cats: JSON.stringify([catId]), id: row.id })
          .execute()
      }
    }
  },
  (app) => {
    const assets = app.findCollectionByNameOrId('assets')
    const categories = app.findCollectionByNameOrId('asset_categories')

    let existingData = []
    try {
      existingData = app
        .db()
        .newQuery("SELECT id, category FROM assets WHERE category IS NOT NULL AND category != ''")
        .all()
    } catch (e) {}

    assets.fields.removeByName('category')
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

    for (const row of existingData) {
      const catIds = row.category
      if (catIds && typeof catIds === 'string') {
        try {
          const parsed = JSON.parse(catIds)
          if (Array.isArray(parsed) && parsed.length > 0) {
            app
              .db()
              .newQuery('UPDATE assets SET category = {:cat} WHERE id = {:id}')
              .bind({ cat: parsed[0], id: row.id })
              .execute()
          }
        } catch (e) {}
      }
    }
  },
)
