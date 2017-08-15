const { Container, All, NewInstance, Lazy, Parent, Factory, Optional } = require('aurelia-dependency-injection')
const { ClientRequest, ServerResponse } = require('http')
require('reflect-metadata')
const CONTAINER_FIELD = Symbol('request container')
const CONTAINER = new Container()

function registerProviderIn(container, provider) {
  if (provider.useFactory) {
    const factory = (...args) => provider.useFactory(...args)
    factory.inject = provider.deps
    container.registerSingleton(provider.provide, factory)
  } else if (provider.useClass) {
    container.registerSingleton(provider.provide, provider.useClass)
  } else if (provider.useExisting) {
    container.registerAlias(provider.provide, provider.useExisting)
  } else if (provider.useValue) {
    container.registerInstance(provider.provide, provider.useValue)
  } else if (typeof provider === 'function') {
    container.registerSingleton(provider)
  } else {
    throw new TypeError('Unknown provider type')
  }
}

function registerAll(container, providers) {
  providers.forEach(provider => registerProviderIn(container, provider))
  return container
}

module.exports = {
  All, NewInstance, Lazy, Parent, Factory, Optional,

  register(providers) {
    registerAll(CONTAINER, providers)
  },

  createRequestInjector(providers = []) {
    return function(req, res, next) {
      const container = CONTAINER.createChild()
      container.registerInstance(ClientRequest, req)
      container.registerInstance(ServerResponse, res)
      req[CONTAINER_FIELD] = registerAll(container, providers)
      next()
    }
  },

  inject(...args) {
    const handler = args.pop()

    return function(req, res, next) {
      try {
        const container = req[CONTAINER_FIELD]
        const deps = args.map(container.get, container)
        const result = handler(...deps)
        Promise.resolve(result).then(() => next(), next)
      } catch (error) {
        next(error)
      }
    }
  }
}
