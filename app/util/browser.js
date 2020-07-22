/**
 * @Author: cainsyake
 * @Date:   2019-05-22
 * @Remark: 全局浏览器实例
 */
const puppeteer = require('puppeteer')
// 浏览器最大连接计数(超过后需重启)
const BROWSER_MAX_COUNT = 1000

/**
 * 存储浏览器信息
 * @type {{browsers: {}}}
 */
const store = {
  // 根据ID保存浏览器节点
  browsers: {}
}

/**
 * 浏览器连接工具
 */
class BrowserUtil {
  /**
   * 启动浏览器
   * @param id 调用方ID
   * @return {Promise<*>}
   */
  static async init (id) {
    // chromium启动配置 https://peter.sh/experiments/chromium-command-line-switches/
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote'
      ]
    })
    // 保存浏览器节点
    const endpoint = await browser.wsEndpoint()
    store.browsers[id] = {
      endpoint,
      count: 0
    }
    console.log(`初始化浏览器:${endpoint}`)
    return endpoint
  }

  /**
   * 重启浏览器
   * @param id 调用方ID
   * @return {Promise<void>}
   */
  static async restart (id) {
    // 先关闭浏览器
    await BrowserUtil.close(id)
    // 重新启动浏览器
    await BrowserUtil.init(id)
    console.log('重启浏览器完成')
  }

  /**
   * 连接至浏览器
   * @param id 调用方ID
   * @return {Promise<*>} 返回浏览器实例
   */
  static async connect (id = 'default') {
    let endpoint = store.browsers[id] ? store.browsers[id].endpoint : null
    // 初始化浏览器
    if (!endpoint) {
      endpoint = await BrowserUtil.init(id)
    }
    store.browsers[id].count++
    // console.log(`浏览器连接计数:${store.count}`)
    console.log(`连接到浏览器:${endpoint}`)
    return await puppeteer.connect({
      browserWSEndpoint: endpoint
    })
  }

  /**
   * 关闭浏览器
   * @param id
   * @return {Promise<void>}
   */
  static async close (id) {
    // 连接当前浏览器
    const browser = await puppeteer.connect({
      browserWSEndpoint: store.browsers[id].endpoint
    })
    // 关闭当前浏览器
    await browser.close()
    // 清空store中的节点
    delete store.browsers[id]
  }

  /**
   * 检查是否需要重启浏览器
   * @param id 调用方ID
   * @return {Promise<void>}
   */
  static async check (id = 'default') {
    if (store.browsers[id] && store.browsers[id].count > BROWSER_MAX_COUNT) {
      console.log('需要重启浏览器')
      await BrowserUtil.restart(id)
    }
  }

  /**
   * 关闭所有浏览器
   * @return {Promise<void>}
   */
  static async closeAllBrowser () {
    const ids = Object.keys(store.browsers)
    return Promise.all(ids.map(id => BrowserUtil.close(id)))
  }
}

module.exports = BrowserUtil
