/**
 * @Author: cainsyake
 * @Date:   2019-05-18
 * @Remark: 工具方法
 */
const os = require('os')
const redisExec = require('../api/api').redisExec
const mainRedis = require('../api/api').mainRedis

// Promise队列库
const Queue = require('promise-queue-plus')
// 答题卡 队列实例 第一个参数是最大同时执行量
const redisQueueInstance = Queue(2, {
  retry: 0,
  retryIsJump: false,
  timeout: 0
})

// web URL 拼接
const webUrlSplicing = (url, params) => {
  const paramArray = Object.entries(params).map(paramItemArr => `${paramItemArr[0]}=${paramItemArr[1]}`)
  const paramString = paramArray.join('&')
  return `${url}?${paramString}`
}

// 把一个数组按照一定长度分割成若干数组
function arrayGroup(array, subGroupLength) {
  let index = 0
  const newArray = []
  while (index < array.length) {
    newArray.push(array.slice(index, index += subGroupLength))
  }
  return newArray
}

// 获取服务器IP
const getServerIP = () => {
  const interfaces = os.networkInterfaces()
  for (const devName in interfaces) {
    if (interfaces.hasOwnProperty(devName)) {
      const iface = interfaces[devName]
      for (const alias of iface) {
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address
        }
      }
    }
  }
}

// 获取服务器主机名
const getServerHostName = () => {
  return os.hostname()
}

// 获取当前进程
const getServerPid = () => {
  return process.pid
}


// 调用主服务的redis执行操作
const mainRedisUtil = async (...args) => {
  return new Promise(async (resolve, reject) => {
    // 错误次数
    let errorTimes = 0

    const fnc = async () => {
      try {
        return await redisQueueInstance.go(async () => {
          return await mainRedis({args, key: 'browser-export_1556595646707_9732'})
        })
      } catch (e) {
        errorTimes++
        console.log(`重试次数:${errorTimes}`)
        if (errorTimes < 3) {
          return await fnc()
        }
        throw new Error(`连续3次请求失败:${JSON.stringify(args)}`)

      }
    }

    try {
      const res = await fnc()
      if (res && res.status === 0) {
        resolve(res.data)
      } else {
        reject(new Error(res.message))
      }
    } catch (e) {
      reject(e)
    }
  })
  // return await redisQueueInstance.go(async () => {
  //   return await mainRedis({args, key: `browser-export_1556595646707_9732`})
  // })
}

// 延时
const timeout = async (time = 1000) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

module.exports = {
  webUrlSplicing,
  arrayGroup,
  mainRedisUtil,
  getServerHostName,
  getServerIP,
  getServerPid,
  timeout
}
