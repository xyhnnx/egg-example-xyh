// 烟花
// appid = 'wxbd91f8843b8685c9'
// secret = '30271b6ac74f1f326140c7124a96efd2'
// env = 'test-xyh-top250'
//
// wallpapers
// appid = 'wxdeca305114732d6e'
// secret = '44fe20e01ec6eb0d429faa0cd19bb1b7'
// env = 'test-xyh'
const app1 = {
  appid: 'wxbd91f8843b8685c9',
  secret: '30271b6ac74f1f326140c7124a96efd2',
  env: 'test-xyh-top250',
}
const app2 = {
  appid: 'wxdeca305114732d6e',
  secret: '44fe20e01ec6eb0d429faa0cd19bb1b7',
  env: 'test-xyh',
}

const fetch = require('../../app/util/fetch')
class WxCloud {
  // 烟花
  appid = ''
  secret = ''
  env = ''
  access_token = ''
  constructor (appid, secret, env) {
    this.appid = appid
    this.secret = secret
    this.env = env
  }
  async init () {
    await this.getAccessToken()
  }
  async getAccessToken () {
    let res = await fetch({
      url: 'https://api.weixin.qq.com/cgi-bin/token',
      params: {
        grant_type: 'client_credential',
        appid: this.appid,
        secret: this.secret,
      }
    })
    this.access_token = res.access_token
    console.log(res)
  }
  // 获取集合信息
  async databaseCollectionGet() {
    let res = await fetch({
      url: 'https://api.weixin.qq.com/tcb/databasecollectionget',
      params: {
        access_token: this.access_token
      },
      data: {
        env: this.env
      },
      method: 'post'
    })
    console.log(res)
    return res
  }
  // 新增集合
  async databaseCollectionAdd() {
    let collection_name = 'test'
    let res = await fetch({
      url: 'https://api.weixin.qq.com/tcb/databasecollectionadd',
      params: {
        access_token: this.access_token
      },
      data: {
        env: this.env,
        collection_name
      },
      method: 'post'
    })
    console.log(res)
    return res
  }
  // 数据库导出
  async databaseMigrateExport(collection_name) {
    let res = await fetch({
      url: 'https://api.weixin.qq.com/tcb/databasemigrateexport',
      params: {
        access_token: this.access_token
      },
      data: {
        env: this.env,
        file_path: 'export',
        file_type: 1,
        query: `
          db.collection("${collection_name}").where({done:null}).limit(10).get()
        `
      },
      method: 'post'
    })
    console.log(res)
    return res
  }
  // 数据库迁移状态查询(数据库导出状态查询， 根据databaseMigrateExport 返回的job_id获取下载链接)
  async databaseMigrateQueryInfo(job_id) {
    let res = await fetch({
      url: 'https://api.weixin.qq.com/tcb/databasemigratequeryinfo',
      params: {
        access_token: this.access_token
      },
      data: {
        env: this.env,
        job_id
      },
      method: 'post'
    })
    console.log(res)
    return res
  }
}

(async function () {
  let cloud = new WxCloud(app2.appid, app2.secret,app2.env)
  await cloud.init()
  let res = await cloud.databaseMigrateExport('101970758')
  cloud.databaseMigrateQueryInfo(res.job_id)
})()
