/**
 * @Author: cainsyake
 * @Date:   2019-04-23
 * @Remark: 合并PDF
 */

const mergeUtil = require('easy-pdf-merge')
const config = require('../../config/temp-config').content
const token = require('../util/token')

// 合并PDF
const merge = (sourceFiles, outputFile) => {
  return new Promise(resolve => {
    const startTime = new Date()
    mergeUtil(sourceFiles, outputFile, err => {
      // 合并失败
      if (err) {
        // 抛出异常
        resolve({
          status: 1,
          err
        })
      } else {
        // 合并成功
        const endTime = new Date()
        // 返回合并耗时
        resolve({
          status: 0,
          time: endTime - startTime
        })
      }
    })
  })
}

// 生成PDF
const generate = async data => {
  const page = await data.browser.newPage()

  // 打开页面时间
  const startTime = new Date()
  // 渲染URL
  let url = null
  try {
    // 渲染页JS异常
    page.on('pageerror', async meg => {
      await page.close()
      if (data.logger) {
        data.logger.error(meg)
      }
    })
    // 渲染页console事件
    // page.on('console', (msg) => {
    //   msg.args().forEach(msgItem => {
    //     console.log(msgItem._remoteObject.value)
    //   })
    // })

    url = data.url
    console.log(`渲染URL：${url}`)
    await page.setCookie({name: 'token', value: JSON.stringify(token), url: config.webUrl})
    await page.goto(url, {timeout: 60000})
    // 等待页面渲染完成 #render-finish
    await page.waitForSelector('#renderFinish', {visible: true, timeout: data.timeout})
    // 生成pdf
    await page.pdf(data.pdfOptions)
    // 关闭页面
    await page.close()
    // 断开浏览器连接
    data.browser.disconnect()
  } catch (err) {
    if (data.logger) {
      data.logger.error(err)
      data.logger.error(`生成PDF时发生错误：${url}`)
    }

    // 关闭页面
    await page.close()
    // 断开浏览器连接
    data.browser.disconnect()
    // 抛出异常
    throw err
  }
  // 开启耗时统计
  if (data.config && data.config.timeStatistics) {
    if (data.logger) {
      data.logger.info(`生成单个PDF文件统计,耗时: ${new Date() - startTime}ms，渲染页URL：${data.url}`)
    }
  }
}

const utils = {
  merge,
  generate
}

module.exports = utils
