migrate(
  (app) => {
    const assets = new Collection({
      name: 'assets',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['property', 'vehicle', 'investment', 'international'],
          maxSelect: 1,
        },
        { name: 'subtype', type: 'text' },
        {
          name: 'currency',
          type: 'select',
          required: true,
          values: ['BRL', 'USD', 'EUR'],
          maxSelect: 1,
        },
        { name: 'current_valuation', type: 'number', required: true },
        { name: 'purchase_price', type: 'number' },
        { name: 'acquisition_date', type: 'date' },
        { name: 'location', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'embedding', type: 'vector', dimensions: 1536 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_assets_user ON assets (user)',
        'CREATE INDEX idx_assets_type ON assets (type)',
      ],
    })
    app.save(assets)

    const liabilities = new Collection({
      name: 'liabilities',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'total_value', type: 'number' },
        { name: 'remaining_balance', type: 'number', required: true },
        { name: 'monthly_installment', type: 'number' },
        { name: 'due_date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(liabilities)

    const receivables = new Collection({
      name: 'receivables',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'source', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'expected_date', type: 'date' },
        {
          name: 'frequency',
          type: 'select',
          values: ['one-time', 'monthly', 'quarterly', 'yearly'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(receivables)

    const valuation_history = new Collection({
      name: 'valuation_history',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'asset', type: 'relation', required: true, collectionId: assets.id, maxSelect: 1 },
        { name: 'value', type: 'number', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(valuation_history)
  },
  (app) => {
    ;['valuation_history', 'receivables', 'liabilities', 'assets'].forEach((name) => {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    })
  },
)
