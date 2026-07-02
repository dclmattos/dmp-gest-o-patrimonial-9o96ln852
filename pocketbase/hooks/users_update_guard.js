onRecordUpdateRequest((e) => {
  const body = e.requestInfo().body || {}
  const isAdmin = e.hasSuperuserAuth() || (e.auth && e.auth.getString('role') === 'admin')

  if (isAdmin) {
    return e.next()
  }

  if ('can_edit_data' in body) {
    return e.badRequestError('Only administrators can modify edit permissions')
  }

  if ('role' in body) {
    return e.badRequestError('Only administrators can modify user roles')
  }

  return e.next()
}, 'users')
