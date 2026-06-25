migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'user'],
          maxSelect: 1,
          required: true,
        }),
      )
    }

    app.save(users)

    // Default all existing users to admin (ensures dclmattos@gmail.com is admin)
    const records = app.findRecordsByFilter('users', '1=1', '', 1000, 0)
    for (const record of records) {
      record.set('role', 'admin')
      app.saveNoValidate(record)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
      app.save(users)
    }
  },
)
