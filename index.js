const express = require('express')
const bodyParser = require('body-parser')
const { User, Token, InvalidTokenError } = require('./services')
const { ClientRequest, ServerResponse } = require('http')
const { register, createRequestInjector, inject } = require('./di')
const app = express()

register([
  User,
  { provide: 'app', useValue: app },
  { provide: 'config.token', useValue: { secret: 'test me', validFor: '24h' } }
])

app.use(bodyParser.json())
app.use(createRequestInjector([
  Token
]))

app.get('/session', inject(ClientRequest, ServerResponse, User, Token, async (req, res, user, token) => {
  const details = await token.parse()
  res.send(details)
}))

app.post('/session', inject(ClientRequest, ServerResponse, Token, async (req, res, token) => {
  const accessToken = await token.create({ userId: Date.now() })

  res.send({ accessToken })
}))

app.use((error, req, res, next) => {
  if (error instanceof InvalidTokenError) {
    return res.status(401).send({ message: error.message })
  }

  next(error)
})

app.listen(3000, () => {
  console.log('app started on 3000 port')
})
