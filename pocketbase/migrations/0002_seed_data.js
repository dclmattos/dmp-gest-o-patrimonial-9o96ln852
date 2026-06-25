migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'dclmattos@gmail.com')
      return // already seeded
    } catch (_) {}

    const user = new Record(users)
    user.setEmail('dclmattos@gmail.com')
    user.setPassword('Skip@Pass')
    user.setVerified(true)
    user.set('name', 'VIP User')
    app.save(user)

    const assets = app.findCollectionByNameOrId('assets')
    const a1 = new Record(assets)
    a1.set('user', user.id)
    a1.set('name', 'Apartamento em SP')
    a1.set('type', 'property')
    a1.set('subtype', 'Apartamento')
    a1.set('currency', 'BRL')
    a1.set('current_valuation', 2500000)
    a1.set('purchase_price', 2000000)
    app.save(a1)

    const a2 = new Record(assets)
    a2.set('user', user.id)
    a2.set('name', 'Portfolio Internacional')
    a2.set('type', 'international')
    a2.set('subtype', 'Ações')
    a2.set('currency', 'USD')
    a2.set('current_valuation', 150000)
    a2.set('purchase_price', 100000)
    app.save(a2)

    const a3 = new Record(assets)
    a3.set('user', user.id)
    a3.set('name', 'Porsche 911')
    a3.set('type', 'vehicle')
    a3.set('subtype', 'Carro')
    a3.set('currency', 'BRL')
    a3.set('current_valuation', 900000)
    a3.set('purchase_price', 900000)
    app.save(a3)

    const a4 = new Record(assets)
    a4.set('user', user.id)
    a4.set('name', 'Fazenda Mato Grosso')
    a4.set('type', 'property')
    a4.set('subtype', 'Propriedade Rural')
    a4.set('currency', 'BRL')
    a4.set('current_valuation', 12000000)
    a4.set('purchase_price', 10000000)
    app.save(a4)

    const liabilities = app.findCollectionByNameOrId('liabilities')
    const l1 = new Record(liabilities)
    l1.set('user', user.id)
    l1.set('name', 'Financiamento Porsche')
    l1.set('total_value', 500000)
    l1.set('remaining_balance', 300000)
    l1.set('monthly_installment', 15000)
    app.save(l1)

    const rec = app.findCollectionByNameOrId('receivables')
    const r1 = new Record(rec)
    r1.set('user', user.id)
    r1.set('source', 'Aluguel Apartamento SP')
    r1.set('amount', 12000)
    r1.set('frequency', 'monthly')
    app.save(r1)

    const vHistory = app.findCollectionByNameOrId('valuation_history')
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const rec = new Record(vHistory)
      rec.set('user', user.id)
      rec.set('asset', a1.id)
      rec.set('value', 2000000 + (500000 * (6 - i)) / 6)
      rec.set('date', d.toISOString())
      app.save(rec)
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'dclmattos@gmail.com')
      app.delete(user)
    } catch (_) {}
  },
)
