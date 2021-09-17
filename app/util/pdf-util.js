/**
 * @Author: cainsyake
 * @Date:   2019-04-23
 * @Remark: 合并PDF
 */

const mergeUtil = require('easy-pdf-merge')
const config = require('../../config/temp-config').content
const token = require('../util/token')
const {exec} = require('child_process');

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
  return new Promise(async (resolve, reject) => {
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
      page.on('console', async msg => {
        if (msg.type() === 'error') {
          const err = `通过console.error监听到页面发生错误，页面URL:${url}`
          if (data.logger) {
            data.logger.error(err)
          }
          // throw new Error(err)
          reject(err)
        }
      })

      url = data.url
      await page.setCookie({name: 'token', value: JSON.stringify(token), url: config.webUrl})
      await page.goto(url, {timeout: data.timeout || 60000})
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
      reject(err)
    }
    // 开启耗时统计
    if (data.config && data.config.timeStatistics) {
      if (data.logger) {
        data.logger.info(`生成单个PDF文件统计,耗时: ${new Date() - startTime}ms，渲染页URL：${data.url}`)
      }
    }
    resolve()
  })
}

/**
 * 使用 pdfbox.jar对pdf文件拆分(https://pdfbox.apache.org/2.0/commandline.html)
 * @param params
 * - pdfLocalPath     要处理的pdf本地路径
 * - split            pdf 的每个拆分部分的页数。
 * - startPage        要开始的页面 (包含开始页)
 * - endPage          要停止的页面。(包含停止页)
 */
const PDFSplit = async (params = {
  pdfLocalPath: 'D:\\home\\xyh-test\\question.pdf',
  split: 1,
  startPage: 1,
  endPage: 1,
}) => {
  console.log('__dirname', __dirname)
  const cmd = `java -jar ${__dirname}\\pdfbox.jar PDFSplit -split ${params.split} -startPage ${params.startPage} -endPage ${params.endPage} ${params.pdfLocalPath}`

  await new Promise((resolve, reject) => {
    const spawnObj = exec(cmd);
    spawnObj.stdout.on('data', function (chunk) {
      console.log('stdout-----', chunk.toString());
    });
    spawnObj.stderr.on('data', data => {
      console.log('stderr-----', data);
    });
    spawnObj.on('exit', code => {
      console.log('exit-----: ' + code);
    })
    spawnObj.on('close', code => {
      if (code === 0) {
        console.log('成功-----' + code);
        resolve(true)
      } else {
        console.log('失败-----' + code);
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(false)
      }
    })
  })
}

/**
 * 使用 pdfbox.jar对pdf文件转图片(https://pdfbox.apache.org/2.0/commandline.html)
 * @param params
 * - pdfLocalPath     要处理的pdf本地路径
 * - imageType        要写入的图像类型。目前只有 jpg 或 png。
 * - startPage        要开始的页面 (包含开始页)
 * - endPage          要停止的页面。(包含停止页)
 */
const PDFToImage = async (params = {
  pdfLocalPath: 'D:\\home\\xyh-test\\question.pdf',
  imageType: 'png',
  outputPrefix: 'output',
  startPage: 1,
  endPage: 3,
}) => {
  console.log('__dirname', __dirname)
  const cmd = `java -jar ${__dirname}\\pdfbox.jar PDFToImage -imageType ${params.imageType} -startPage ${params.startPage} -endPage ${params.endPage} ${params.pdfLocalPath}`

  await new Promise((resolve, reject) => {
    const spawnObj = exec(cmd);
    spawnObj.stdout.on('data', function (chunk) {
      console.log('stdout-----', chunk.toString());
    });
    spawnObj.stderr.on('data', data => {
      console.log('stderr-----', data);
    });
    spawnObj.on('exit', code => {
      console.log('exit-----: ' + code);
    })
    spawnObj.on('close', code => {
      if (code === 0) {
        console.log('成功-----' + code);
        resolve(true)
      } else {
        console.log('失败-----' + code);
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(false)
      }
    })
  })
}

const utils = {
  PDFSplit,
  PDFToImage,
  merge,
  generate
}

module.exports = utils
