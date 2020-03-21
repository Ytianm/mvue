/**
 * 迷你Vue
 */
class MVue {
  constructor(options) {
    this.el = options.el
    this.options = options
    this.data = options.data;
    this.methods = options.methods
    this.observer(this.data) // 添加数据劫持
    new Compile(this.el, this)
  }

  observer(obj) {
    if (!obj || typeof obj !== 'object') {
      return
    }
    Object.keys(obj).forEach(key => {
      this.defineReactive(obj, key, obj[key])
      this.proxyData(key) // 将属性代理到MVue的data上，即可通过this.xx访问xx属性，不需要加.data.xx
    })
  }

  defineReactive(obj, key, value) {
    let dep = new Dep() // 每个被劫持的属性添加一个订阅器，管理其订阅者
    Object.defineProperty(obj, key, {
      get() {
        console.log('data-get')
        dep.addSub() // 添加到订阅器
        return value
      },
      set(newVal) {
        if (value !== newVal) {
          console.log('data-set')
          value = newVal
          dep.notify() // 通知订阅器
        }
      }
    })
  }

  proxyData(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.data[key]
      },
      set(newVal) {
        this.data[key] = newVal
      }
    })
  }
}


/**
 * 订阅器，收集属性的所有依赖（订阅者）
 */
class Dep {
  constructor() {
    this.subs = [] // 存放订阅者
  }

  addSub() { // 收集
    if (Dep.target) {
      this.subs.push(Dep.target)
    }
  }

  notify() { // 通知订阅者更新
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}
Dep.target = null // ??


/**
 * 订阅者
 */
class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm
    this.key = key
    this.cb = cb
    this.get()
  }

  get() {
    Dep.target = this // 当前实例
    let value = this.vm[this.key] // 触发get
    Dep.target = null
    return value
  }

  update() {
    this.cb && this.cb.call(this.vm, this.vm.data[this.key])
  }
}