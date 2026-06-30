migrate(
  (app) => {
    // 1. Remove orphaned categories (no valid user reference)
    try {
      app
        .db()
        .newQuery(
          "DELETE FROM asset_categories WHERE user IS NULL OR user = '' OR user NOT IN (SELECT id FROM users)",
        )
        .execute()
    } catch (e) {
      console.log('Error removing orphaned categories:', e.message)
    }

    // 2. Build a set of all valid category IDs
    const validCatIds = {}
    try {
      const cats = app.db().newQuery('SELECT id FROM asset_categories').all()
      for (let i = 0; i < cats.length; i++) {
        validCatIds[cats[i].id] = true
      }
    } catch (e) {
      console.log('Error fetching category IDs:', e.message)
    }

    // 3. Clean up asset category references pointing to non-existent categories
    try {
      const assets = app
        .db()
        .newQuery(
          "SELECT id, category FROM assets WHERE category IS NOT NULL AND category != '' AND category != '[]'",
        )
        .all()

      for (let i = 0; i < assets.length; i++) {
        const row = assets[i]
        let catIds = []
        try {
          const parsed = JSON.parse(row.category)
          if (Array.isArray(parsed)) catIds = parsed
        } catch (e) {
          continue
        }

        const validIds = []
        for (let j = 0; j < catIds.length; j++) {
          if (validCatIds[catIds[j]]) {
            validIds.push(catIds[j])
          }
        }

        if (validIds.length !== catIds.length) {
          app
            .db()
            .newQuery('UPDATE assets SET category = {:cats} WHERE id = {:id}')
            .bind({ cats: JSON.stringify(validIds), id: row.id })
            .execute()
        }
      }
    } catch (e) {
      console.log('Error cleaning asset category references:', e.message)
    }

    // 4. Fix parent_id references pointing to deleted categories
    try {
      const allCats = app.db().newQuery('SELECT id, parent_id FROM asset_categories').all()
      for (let i = 0; i < allCats.length; i++) {
        const row = allCats[i]
        if (row.parent_id && !validCatIds[row.parent_id]) {
          app
            .db()
            .newQuery('UPDATE asset_categories SET parent_id = NULL WHERE id = {:id}')
            .bind({ id: row.id })
            .execute()
        }
      }
    } catch (e) {
      console.log('Error fixing parent_id references:', e.message)
    }
  },
  (app) => {
    // Data cleanup migration is not reversible
  },
)
