onRecordUpdateRequest((e) => {
  const body = e.requestInfo().body || {}
  const isAdmin = e.auth && e.auth.getString('role') === 'admin'

  if (!isAdmin && 'can_edit_data' in body) {
    return e.badRequestError('Only administrators can modify edit permissions')
  }

  return e.next()
}, 'users')
