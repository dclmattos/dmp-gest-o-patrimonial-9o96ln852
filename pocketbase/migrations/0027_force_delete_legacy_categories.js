migrate(
  (app) => {
    var targetNames = ['Capital U$', 'Ativos Líquidos $']

    var targetCatIds = []
    try {
      var cats = app
        .db()
        .newQuery('SELECT id, name FROM asset_categories WHERE name IN ({:n0}, {:n1})')
        .bind({ n0: targetNames[0], n1: targetNames[1] })
        .all()
      for (var i = 0; i < cats.length; i++) {
        targetCatIds.push(cats[i].id)
      }
    } catch (e) {
      console.log('Error finding legacy categories:', e.message)
    }

    if (targetCatIds.length === 0) return

    var targetIdSet = {}
    for (var j = 0; j < targetCatIds.length; j++) {
      targetIdSet[targetCatIds[j]] = true
    }

    try {
      var assets = app
        .db()
        .newQuery(
          "SELECT id, category FROM assets WHERE category IS NOT NULL AND category != '' AND category != '[]'",
        )
        .all()

      for (var k = 0; k < assets.length; k++) {
        var row = assets[k]
        var catIds = []
        try {
          var parsed = JSON.parse(row.category)
          if (Array.isArray(parsed)) catIds = parsed
        } catch (e) {
          continue
        }

        var hasTarget = false
        for (var m = 0; m < catIds.length; m++) {
          if (targetIdSet[catIds[m]]) {
            hasTarget = true
            break
          }
        }
        if (!hasTarget) continue

        var remainingIds = []
        for (var n = 0; n < catIds.length; n++) {
          if (!targetIdSet[catIds[n]]) {
            remainingIds.push(catIds[n])
          }
        }

        app
          .db()
          .newQuery('UPDATE assets SET category = {:cats} WHERE id = {:id}')
          .bind({ cats: JSON.stringify(remainingIds), id: row.id })
          .execute()
      }
    } catch (e) {
      console.log('Error clearing asset category references:', e.message)
    }

    try {
      var childCats = app
        .db()
        .newQuery('SELECT id FROM asset_categories WHERE parent_id IN ({:p0}, {:p1})')
        .bind({ p0: targetCatIds[0] || '', p1: targetCatIds[1] || '' })
        .all()
      for (var p = 0; p < childCats.length; p++) {
        app
          .db()
          .newQuery('UPDATE asset_categories SET parent_id = NULL WHERE id = {:id}')
          .bind({ id: childCats[p].id })
          .execute()
      }
    } catch (e) {
      console.log('Error fixing child parent_id references:', e.message)
    }

    for (var q = 0; q < targetCatIds.length; q++) {
      try {
        var record = app.findRecordById('asset_categories', targetCatIds[q])
        app.delete(record)
      } catch (e) {
        console.log('Could not delete category:', targetCatIds[q], e.message)
      }
    }
  },
  (app) => {
    // Force deletion migration is not reversible
  },
)
