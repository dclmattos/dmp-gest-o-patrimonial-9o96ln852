routerAdd('POST', '/backend/v1/otp/verify', (e) => {
  const body = e.requestInfo().body || {}
  const email = (body.email || '').trim().toLowerCase()
  const code = (body.code || '').trim()

  if (!email || !code) return e.badRequestError('Email e código são obrigatórios')

  let tokens
  try {
    const safeEmail = email.replace(/'/g, "''")
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

  const token = tokens[0]

  if (token.getString('code') !== code) {
    return e.badRequestError('Código inválido ou expirado')
  }

  const expiresStr = token.getString('expires_at')
  const expiresTime = new Date(expiresStr).getTime()
  const nowTime = new Date().getTime()
  if (isNaN(expiresTime) || expiresTime < nowTime) {
    return e.badRequestError('Código inválido ou expirado')
  }

  token.set('used', true)
  $app.save(token)

  try {
    $app
      .db()
      .newQuery('UPDATE verification_tokens SET used = 1 WHERE email = {:email} AND used = 0')
      .bind({ email: email })
      .execute()
  } catch (_) {}

  let userRecord
  try {
    userRecord = $app.findRecordById('users', token.getString('user'))
  } catch (_) {
    return e.badRequestError('Código inválido ou expirado')
  }

  return $apis.recordAuthResponse(e, userRecord)
})
