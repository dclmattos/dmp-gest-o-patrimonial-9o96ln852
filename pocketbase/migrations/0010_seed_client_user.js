migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    let client

    try {
      client = app.findAuthRecordByEmail('users', 'cliente1@gmail.com')
    } catch (_) {
      client = new Record(users)
      client.setEmail('cliente1@gmail.com')
      client.setPassword('Skip@Pass')
      client.setVerified(true)
      client.set('name', 'Cliente VIP')
      client.set('role', 'user')
      app.save(client)

      const assets = app.findCollectionByNameOrId('assets')
      const a1 = new Record(assets)
      a1.set('user', client.id)
      a1.set('name', 'Casa de Praia - Cliente')
      a1.set('type', 'property')
      a1.set('currency', 'BRL')
      a1.set('current_valuation', 1500000)
      app.save(a1)

      const liabilities = app.findCollectionByNameOrId('liabilities')
      const l1 = new Record(liabilities)
      l1.set('user', client.id)
      l1.set('name', 'Financiamento Casa de Praia')
      l1.set('remaining_balance', 400000)
      l1.set('total_value', 400000)
      app.save(l1)
    }
  },
  (app) => {
    try {
      const client = app.findAuthRecordByEmail('users', 'cliente1@gmail.com')
      app.delete(client)
    } catch (_) {}
  },
)
