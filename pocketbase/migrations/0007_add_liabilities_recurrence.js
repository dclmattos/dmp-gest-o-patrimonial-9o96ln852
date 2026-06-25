migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('liabilities')

    col.fields.add(new DateField({ name: 'start_date' }))
    col.fields.add(new BoolField({ name: 'is_recurring' }))
    col.fields.add(new NumberField({ name: 'monthly_due_day', min: 1, max: 31 }))
    col.fields.add(new DateField({ name: 'end_date' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('liabilities')

    col.fields.removeByName('start_date')
    col.fields.removeByName('is_recurring')
    col.fields.removeByName('monthly_due_day')
    col.fields.removeByName('end_date')

    app.save(col)
  },
)
