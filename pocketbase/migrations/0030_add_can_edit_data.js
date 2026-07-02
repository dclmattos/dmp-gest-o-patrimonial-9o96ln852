migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('can_edit_data')) {
      users.fields.add(new BoolField({ name: 'can_edit_data' }))
    }
    app.save(users)

    const writeRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || (user = @request.auth.id && @request.auth.can_edit_data = true))"
    const readRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)"

    const collections = [
      'assets',
      'liabilities',
      'receivables',
      'valuation_history',
      'asset_categories',
    ]

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.listRule = readRule
      col.viewRule = readRule
      col.createRule = writeRule
      col.updateRule = writeRule
      col.deleteRule = writeRule
      app.save(col)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (users.fields.getByName('can_edit_data')) {
      users.fields.removeByName('can_edit_data')
      app.save(users)
    }

    const rule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)"
    const collections = [
      'assets',
      'liabilities',
      'receivables',
      'valuation_history',
      'asset_categories',
    ]

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.listRule = rule
      col.viewRule = rule
      col.createRule = rule
      col.updateRule = rule
      col.deleteRule = rule
      app.save(col)
    }
  },
)
