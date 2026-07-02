routerAdd('POST', '/backend/v1/password/reset', (e) => {
  const body = e.requestInfo().body || {}
  const email = (body.email || '').trim().toLowerCase()
  const code = (body.code || '').trim()
  const newPassword = (body.new_password || '').trim()

  if (!email || !code || !newPassword) {
    return e.badRequestError('Email, código e nova senha são obrigatórios')
  }

  if (newPassword.length < 8) {
    return e.badRequestError('A senha deve ter no mínimo 8 caracteres')
  }

  let tokens
  try {
    var safeEmail = email.replace(/'/g, "''")
    tokens = $app.findRecordsByFilter(
      'verification_tokens',
      "email = '" + safeEmail + "' && used = false",
      '-created',
      1,
      0,
    )
  } catch (_) {
    return e.badRequestError('Código inválido ou expirado')
  }

  if (!tokens || tokens.length === 0) {
    return e.badRequestError('Código inválido ou expirado')
  }

  var token = tokens[0]

  if (token.getString('code') !== code) {
    return e.badRequestError('Código inválido ou expirado')
  }

  var expiresStr = token.getString('expires_at')
  var expiresTime = new Date(expiresStr).getTime()
  var nowTime = new Date().getTime()
  if (isNaN(expiresTime) || expiresTime < nowTime) {
    return e.badRequestError('Código inválido ou expirado')
  }

  token.set('used', true)
  $app.save(token)

  var userId = token.getString('user')
  if (!userId) {
    return e.badRequestError('Código inválido ou expirado')
  }

  var userRecord
  try {
    userRecord = $app.findRecordById('users', userId)
  } catch (_) {
    return e.badRequestError('Código inválido ou expirado')
  }

  userRecord.setPassword(newPassword)
  $app.save(userRecord)

  return e.json(200, { success: true, message: 'Senha atualizada com sucesso' })
})
