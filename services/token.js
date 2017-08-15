const { ClientRequest } = require('http')
const promisify = require('util').promisify
const jwt = require('jsonwebtoken')

class InvalidTokenError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = new Error(message).stack
    }
  }
}

class Token {
  static get inject() {
    return [ClientRequest, 'config.token']
  }

  constructor(req, config) {
    this.token = req.headers.authorization || req.query.t
    this.config = config
    this.details = null
  }

  parse() {
    return new Promise((resolve, reject) => {
      if (this.details) {
        return resolve(this.details)
      }

      jwt.verify(this.token, this.config.secret, (error, decoded) => {
        if (error) {
          return reject(new InvalidTokenError(error.message))
        }

        this.details = decoded
        resolve(decoded)
      })
    })
  }

  create(payload = {}) {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, this.config.secret, {
        expiresIn: this.config.validFor
      }, (error, token) => {
        if (error) {
          return reject(new InvalidTokenError(error.message))
        }

        resolve(token)
      })
    })
  }
}

module.exports = { Token, InvalidTokenError }
