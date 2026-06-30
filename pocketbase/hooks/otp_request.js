routerAdd('POST', '/backend/v1/otp/request', (e) => {
  const body = e.requestInfo().body || {}
  const email = (body.email || '').trim().toLowerCase()
  if (!email) return e.badRequestError('Email é obrigatório')

  let userRecord
  try {
    userRecord = $app.findAuthRecordByEmail('users', email)
  } catch (_) {
    return e.json(200, { success: true, message: 'Se o email existir, um código foi enviado' })
  }

  const code = $security.randomStringWithAlphabet(6, '0123456789')

  try {
    $app
      .db()
      .newQuery('UPDATE verification_tokens SET used = 1 WHERE email = {:email} AND used = 0')
      .bind({ email: email })
      .execute()
  } catch (_) {}

  const col = $app.findCollectionByNameOrId('verification_tokens')
  const token = new Record(col)
  token.set('email', email)
  token.set('code', code)
  token.set('user', userRecord.id)

  const expires = new Date()
  expires.setMinutes(expires.getMinutes() + 10)
  token.set('expires_at', expires.toISOString())
  token.set('used', false)
  $app.save(token)

  const htmlContent =
    '<div style="font-family:Helvetica,sans-serif;background:#0a0a0a;padding:40px;">' +
    '<div style="max-width:400px;margin:0 auto;background:#111;border:1px solid #222;padding:32px;">' +
    '<p style="color:#d4a843;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 24px;">DMP Gestão Patrimonial</p>' +
    '<p style="color:#888;font-size:13px;margin:0 0 16px;">Seu código de acesso único:</p>' +
    '<div style="font-size:36px;font-weight:300;letter-spacing:12px;color:#fff;text-align:center;padding:24px 0;background:#0a0a0a;border:1px solid #222;margin:0 0 16px;">' +
    code +
    '</div>' +
    '<p style="color:#555;font-size:11px;margin:0;">Este código expira em 10 minutos. Não compartilhe com terceiros.</p>' +
    '</div></div>'

  const textContent =
    'DMP Gestão Patrimonial\n\nSeu código de acesso único: ' +
    code +
    '\n\nEste código expira em 10 minutos.'

  try {
    $app.newMailClient().send({
      from: { address: 'noreply@dmp.com', name: 'DMP Gestão Patrimonial' },
      to: [{ address: email }],
      subject: 'Código de Acesso · DMP',
      html: htmlContent,
      text: textContent,
    })
  } catch (mailErr) {
    $app
      .logger()
      .info('OTP code generated (email send attempted)', 'email', email, 'error', mailErr.message)
  }

  return e.json(200, { success: true, message: 'Se o email existir, um código foi enviado' })
})
