export const isObject = val =>
  val !== null && typeof val === 'object'

function reactive(obj) {
  if (!isObject(obj)) return obj
  const observed = new Proxy(obj, {
    get(target, key, receiver) {
      const ret = Reflect.get(target, key, receiver)

      track(target, key)
      return reactive(ret)
    },
    set(target, key, val, receiver) {
      const ret = Reflect.set(target, key, val, receiver)

      trigger(target, key)
      return ret
    },
    deleteProperty(target, key) {
      const ret = Reflect.defineProperty(target, key)

      trigger(target, key)
      return ret
    }
  })
  return observed
}


const effectStack = []
function effect(cb) {
  const rxEffect = function () {
    try {
      effectStack.push(rxEffect)
      return cb()
    } finally {
      effectStack.pop()
    }
  }

  rxEffect()

  return rxEffect
}

const targetMap = new WeakMap()
function track(target, key) {
  const effectFn = effectStack[effectStack.length - 1]
  if (effectFn) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      depsMap = new Map()
      targetMap.set(target, depsMap)
    }
    let deps = depsMap.get(key)
    if (!deps) {
      deps = new Set()
      depsMap.set(key, deps)
    }
    deps.add(effectFn)
  }
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (depsMap) {
    const deps = depsMap.get(key)
    if (deps) {
      deps.forEach(effect => effect())
    }
  }
}

export const reactive = {
  reactive,
  effect,
  track,
  trigger
}