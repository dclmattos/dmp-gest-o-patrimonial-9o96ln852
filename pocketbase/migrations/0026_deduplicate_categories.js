migrate(
  (app) => {
    var duplicates = []
    try {
      duplicates = app
        .db()
        .newQuery(
          'SELECT name, user, COUNT(*) as cnt ' +
            'FROM asset_categories ' +
            "WHERE name IS NOT NULL AND name != '' AND user IS NOT NULL AND user != '' " +
            'GROUP BY name, user ' +
            'HAVING cnt > 1',
        )
        .all()
    } catch (e) {
      console.log('Error finding duplicates:', e.message)
    }

    for (var i = 0; i < duplicates.length; i++) {
      var dup = duplicates[i]

      var cats = []
      try {
        cats = app
          .db()
          .newQuery(
            'SELECT id FROM asset_categories WHERE name = {:name} AND user = {:user} ORDER BY created ASC',
          )
          .bind({ name: dup.name, user: dup.user })
          .all()
      } catch (e) {
        console.log('Error fetching category group:', e.message)
        continue
      }

      if (cats.length <= 1) continue

      var primaryId = cats[0].id
      var duplicateIds = []
      for (var j = 1; j < cats.length; j++) {
        duplicateIds.push(cats[j].id)
      }

      for (var k = 0; k < duplicateIds.length; k++) {
        var dupId = duplicateIds[k]

        var allAssets = []
        try {
          allAssets = app.db().newQuery('SELECT id, category FROM assets').all()
        } catch (e) {
          console.log('Error fetching assets:', e.message)
          continue
        }

        for (var m = 0; m < allAssets.length; m++) {
          var asset = allAssets[m]
          var catIds = []
          try {
            var parsed = JSON.parse(asset.category)
            if (Array.isArray(parsed)) catIds = parsed
          } catch (e) {
            continue
          }

          var hasDup = false
          for (var n = 0; n < catIds.length; n++) {
            if (catIds[n] === dupId) {
              hasDup = true
              break
            }
          }
          if (!hasDup) continue

          var newCatIds = []
          var seen = {}
          for (var p = 0; p < catIds.length; p++) {
            var mappedId = catIds[p] === dupId ? primaryId : catIds[p]
            if (!seen[mappedId]) {
              seen[mappedId] = true
              newCatIds.push(mappedId)
            }
          }

          app
            .db()
            .newQuery('UPDATE assets SET category = {:cats} WHERE id = {:id}')
            .bind({ cats: JSON.stringify(newCatIds), id: asset.id })
            .execute()
        }

        try {
          var childCats = app
            .db()
            .newQuery('SELECT id FROM asset_categories WHERE parent_id = {:pid}')
            .bind({ pid: dupId })
            .all()
          for (var q = 0; q < childCats.length; q++) {
            app
              .db()
              .newQuery('UPDATE asset_categories SET parent_id = {:pid} WHERE id = {:id}')
              .bind({ pid: primaryId, id: childCats[q].id })
              .execute()
          }
        } catch (e) {
          console.log('Error updating child parent_id:', e.message)
        }

        try {
          var record = app.findRecordById('asset_categories', dupId)
          app.delete(record)
        } catch (e) {
          console.log('Could not delete duplicate category:', dupId, e.message)
        }
      }
    }
  },
  (app) => {
    // Data deduplication migration is not reversible
  },
)
