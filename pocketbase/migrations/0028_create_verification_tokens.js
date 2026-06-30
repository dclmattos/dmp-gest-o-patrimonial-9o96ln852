migrate(
  (app) => {
    const collection = new Collection({
      name: 'verification_tokens',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'email', type: 'text', required: true },
        { name: 'code', type: 'text', required: true },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'expires_at', type: 'date', required: true },
        { name: 'used', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_verification_tokens_email ON verification_tokens (email)',
        'CREATE INDEX idx_verification_tokens_lookup ON verification_tokens (email, used, created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('verification_tokens'))
    } catch (_) {}
  },
)
