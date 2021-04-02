/**
 * 统一的异步请求发送处理，使用axios库
 *
 */
const axios = require('axios')

// 创建axios实例
const fetch = axios.create({
  timeout: 60000 // 请求超时时间
})

// request拦截器
fetch.interceptors.request.use(config => {
  // 通知后台，这是白名单接口，不检验权限
  // config.headers['2f67f9e3-3f64-40ea-af83-cc103739f26e'] = '4fa6be18-9134-4134-b5b3-2c1d584fc266'

  return config
})

// 响应拦截器
fetch.interceptors.response.use(
  response => {
    // 抛出接口数据
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

module.exports = fetch;
