migrate(
  (app) => {
    const collections = [
      'assets',
      'liabilities',
      'receivables',
      'valuation_history',
      'asset_categories',
    ]
    const adminOrOwnerRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)"

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.listRule = adminOrOwnerRule
      col.viewRule = adminOrOwnerRule
      col.createRule = adminOrOwnerRule
      col.updateRule = adminOrOwnerRule
      col.deleteRule = adminOrOwnerRule
      app.save(col)
    }

    const users = app.findCollectionByNameOrId('users')
    const userRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"
    users.listRule = userRule
    users.viewRule = userRule
    users.updateRule = userRule
    users.deleteRule = userRule
    app.save(users)
  },
  (app) => {
    const collections = [
      'assets',
      'liabilities',
      'receivables',
      'valuation_history',
      'asset_categories',
    ]
    const ownerRule = "@request.auth.id != '' && user = @request.auth.id"

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.listRule = ownerRule
      col.viewRule = ownerRule
      col.createRule = ownerRule
      col.updateRule = ownerRule
      col.deleteRule = ownerRule
      app.save(col)
    }

    const users = app.findCollectionByNameOrId('users')
    const userRule = 'id = @request.auth.id'
    users.listRule = userRule
    users.viewRule = userRule
    users.updateRule = userRule
    users.deleteRule = userRule
    app.save(users)
  },
)
