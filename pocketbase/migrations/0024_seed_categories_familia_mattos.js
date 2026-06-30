migrate(
  (app) => {
    let targetUser = null

    try {
      const matches = app.findRecordsByFilter('users', 'name = "Família Mattos"', '', 1, 0)
      if (matches.length > 0) targetUser = matches[0]
    } catch (_) {}

    if (!targetUser) {
      try {
        const matches = app.findRecordsByFilter('users', 'name ~ "Mattos"', '', 10, 0)
        if (matches.length > 0) targetUser = matches[0]
      } catch (_) {}
    }

    if (!targetUser) {
      try {
        targetUser = app.findAuthRecordByEmail('_pb_users_auth_', 'dclmattos@gmail.com')
      } catch (_) {}
    }

    if (!targetUser) return

    const userId = targetUser.id
    const catCollection = app.findCollectionByNameOrId('asset_categories')

    let existing = []
    try {
      existing = app.findRecordsByFilter('asset_categories', 'user = "' + userId + '"', '', 100, 0)
    } catch (_) {}

    if (existing.length > 0) return

    var defaults = [
      { name: 'Imóveis', color: '#3b82f6', icon: 'Home', sort_order: 1 },
      { name: 'Veículos', color: '#22c55e', icon: 'Car', sort_order: 2 },
      { name: 'Investimentos', color: '#f59e0b', icon: 'Briefcase', sort_order: 3 },
      { name: 'Reserva de Emergência', color: '#ef4444', icon: 'PiggyBank', sort_order: 4 },
    ]

    for (var i = 0; i < defaults.length; i++) {
      var d = defaults[i]
      var record = new Record(catCollection)
      record.set('user', userId)
      record.set('name', d.name)
      record.set('color', d.color)
      record.set('icon', d.icon)
      record.set('sort_order', d.sort_order)
      record.set('goal_value', 0)
      app.save(record)
    }
  },
  (app) => {
    var targetUser = null

    try {
      var matches = app.findRecordsByFilter('users', 'name = "Família Mattos"', '', 1, 0)
      if (matches.length > 0) targetUser = matches[0]
    } catch (_) {}

    if (!targetUser) {
      try {
        var matches2 = app.findRecordsByFilter('users', 'name ~ "Mattos"', '', 10, 0)
        if (matches2.length > 0) targetUser = matches2[0]
      } catch (_) {}
    }

    if (!targetUser) {
      try {
        targetUser = app.findAuthRecordByEmail('_pb_users_auth_', 'dclmattos@gmail.com')
      } catch (_) {}
    }

    if (!targetUser) return

    var names = ['Imóveis', 'Veículos', 'Investimentos', 'Reserva de Emergência']
    try {
      var cats = app.findRecordsByFilter(
        'asset_categories',
        'user = "' + targetUser.id + '"',
        '',
        100,
        0,
      )
      for (var i = 0; i < cats.length; i++) {
        if (names.indexOf(cats[i].getString('name')) !== -1) {
          app.delete(cats[i])
        }
      }
    } catch (_) {}
  },
)
