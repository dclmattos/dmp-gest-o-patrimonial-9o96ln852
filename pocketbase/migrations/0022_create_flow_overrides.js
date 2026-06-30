migrate(
  (app) => {
    const collection = new Collection({
      name: 'flow_overrides',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'flow_type',
          type: 'select',
          required: true,
          values: ['receivable', 'liability'],
          maxSelect: 1,
        },
        { name: 'flow_id', type: 'text', required: true },
        { name: 'month', type: 'date', required: true },
        { name: 'amount', type: 'number' },
        { name: 'is_done', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_flow_overrides_user ON flow_overrides (user)',
        'CREATE INDEX idx_flow_overrides_lookup ON flow_overrides (flow_type, flow_id, month)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('flow_overrides'))
    } catch (_) {}
  },
)
