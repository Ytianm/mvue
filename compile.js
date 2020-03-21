/**
 * 渲染页面
 */
class Compile {
  constructor(el, vm) {
    this.$el = document.querySelector(el)
    this.$vm = vm

    if (this.$el) {
      this.fragment = this.node2Fragment(this.$el) // 转换成文档片段
      this.compile(this.fragment) // 编译html
      this.$el.appendChild(this.fragment)
    }
  }

  // node - 文档片段
  node2Fragment(el) {
    let fragment = document.createDocumentFragment() // 创建空白文档片段

    let child
    while (child = el.firstChild) {
      fragment.appendChild(child) // 把el的节点拼到文档片段中
    }

    return fragment
  }

  // 编译
  compile(el) {
    let childNodes = el.childNodes
    Array.from(childNodes).forEach(node => { // 遍历子节点
      if (this.isElement(node)) { // 元素节点
        const attrs = node.attributes;
        Array.from(attrs).forEach(attr => { // 遍历元素属性
          const attrName = attr.name
          const attrVal = attr.value
          if (this.isCommand(attrName)) { // 是mvue指令
            const dirName = attrName.substring(2) // 指令类型
            this[dirName] && this[dirName](node, this.$vm, attrVal)
          } else if (this.isEvent(attrName)) { // 事件
            const eventName = attrName.substring(1)
            this.eventHandler(node, attrVal, eventName)
          }
        })
      } else if (this.isText(node)) { // 文本节点，插值
        this.compileText(node)
      }

      if (node.childNodes && node.childNodes.length > 0) { // 子节点的子节点
        this.compile(node) // 递归
      }
    })
  }

  // 视图更新，注册对应的指令回调方法
  update(node, vm, dirName, attrVal) {
    const dataValue = vm.data[attrVal]
    const updateFn = this[dirName + 'Updater']
    updateFn && updateFn(node, dataValue)

    // 添加订阅
    new Watcher(this.$vm, attrVal, value => {
      console.log(attrVal + ':' + value);
      updateFn && updateFn(node, value) // 模型更新->更新视图
    })
  }

  // m-model
  model(node, vm, attrVal) {
    this.update(node, vm, 'model', attrVal)

    // 视图更新->更新模型
    node.addEventListener('input', e => {
      vm.data[attrVal] = e.target.value
    })
  }

  // m-model指令回调方法
  modelUpdater(node, value) {
    node.value = value
  }

  // 插值表达式
  compileText(node) {
    this.update(node, this.$vm, 'text', RegExp.$1) // RegExp.$1可以取到node正则中第一个匹配的值（第一个括号里）
  }

  // 插值表达式渲染方法
  textUpdater(node, value) {
    node.textContent = value
  }

  // 事件
  eventHandler(node, attrVal, eventName) {
    const fn = this.$vm.methods && this.$vm.methods[attrVal]
    node.addEventListener(eventName, fn.bind(this.$vm))
  }

  // 判断是否是指令
  isCommand(name) {
    return name.indexOf('m-') === 0
  }

  // 判断是否是事件
  isEvent(name) {
    return name.indexOf('@') === 0
  }

  // 判断是否是元素节点
  isElement(node) {
    return node.nodeType === 1
  }

  // 判断是否是文本节点，同时带有插值符号{{}}
  isText(node) {
    return node.nodeType === 3 && /^\{\{(.*)\}\}$/.test(node.textContent)
  }
}