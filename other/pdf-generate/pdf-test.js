const path = require('path')
const {delPath, makeDir} = require('../../app/util/util')
const BrowserUtil = require('../../app/util/browser')

// 删除文件夹下的文件
// function delPath(path) {
//   const fs = require('fs')
//   // 删除文件
//   const files = fs.readdirSync(path);
//   // 遍历读取到的文件列表
//   files.forEach(function (filename) {
//     const filedir = path + '/' + filename;
//     fs.unlinkSync(filedir);
//   });
//   // 删除文件夹
//   console.log('------------------')
//   fs.rmdirSync(path);
// }

// function makeDir(dirpath, del = true) {
//   const fs = require('fs')
//   const path = require('path')
//   if (!fs.existsSync(dirpath)) {
//     let pathtmp;
//     dirpath.split('/').forEach(function (dirname) {
//       if (pathtmp) {
//         pathtmp = path.join(pathtmp, dirname);
//       } else {
//         // 如果在linux系统中，第一个dirname的值为空，所以赋值为"/"
//         if (dirname) {
//           pathtmp = dirname;
//         } else {
//           pathtmp = '/';
//         }
//       }
//       if (!fs.existsSync(pathtmp)) {
//         if (!fs.mkdirSync(pathtmp)) {
//           return false;
//         }
//       }
//     });
//   } else if (del) {
//     // 先删除已有文件夹
//     delPath(dirpath);
//     // 再重新建文件夹
//     makeDir(dirpath)
//   }
//   return true;
// }
// 生成PDF
const generate = async data => {
  return new Promise(async (resolve, reject) => {
    const page = await data.browser.newPage()
    console.log('page._emulationManager._client.send', page._emulationManager._client.send)
    // page._emulationManager._client.send(
    //   'Emulation.setDefaultBackgroundColorOverride',
    //   { color: { r: 0, g: 0, b: 0, a: 0.5 } }
    // );
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
      // await page.setCookie({name: 'token', value: JSON.stringify(token), url})
      await page.goto(url, {timeout: data.timeout || 60000}).catch(err => {
        if (data.logger) {
          data.logger.error(err)
        }
      })
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
// 渲染PDF
const renderPdf = async (url, outputDir, fileName = 'test1.pdf') => {
  // const url = `http://localhost:8098/wrong-download/render/question?recommendationId=${recommendationId}&courseName=`
  // const url = 'http://localhost:8098'
  // const url = 'http://localhost:8098/wrong-download/render/teacher-question?courseName=%E7%89%A9%E7%90%86&wrongBookId=241&modifyDateTime=1641371789000&fileSize&fileStatus=3&paperName=2021%E5%B9%B4%E4%B8%8B%E5%AD%A6%E6%9C%9F%E6%96%87%E6%98%9F%E4%B8%AD%E5%AD%A6%E4%B9%9D%E5%B9%B4%E7%BA%A7%E4%B8%8A%E8%B4%A8%E9%87%8F%E8%B0%83%E7%A0%94%E4%B8%89&fileUrl=&courseId=15&paperId=1341863071236469&teacherKey=1341863071236469-15'
  // url = path.join(__dirname, 'test.html')
  // 临时存放单个PDF文件路径
  const dirPath = outputDir || '/home/xyh-test/'

  console.log('1')
  // 浏览器连接工具
  const generatePdf = generate
  console.log('2')


  const resData = {
    status: 0,
    message: []
  }
  // 任务相关信息

  // eslint-disable-next-line no-unused-vars
  // 临时wrongBookId


  // 创建临时文件夹
  makeDir(dirPath, false)

  // 获取学生数据

  // 渲染结果（包含渲染、上传至OSS、删除本地文件）

  // PDF生成选项
  let pdfOptions = null
  const footerTemplate = `
        <style>
          .footer-box {
            margin: 0 auto;
            text-align: right;
            font-size: 9px;
            font-family: KaiTi,serif;
            border-top: 1px solid #979797;
            width: 100%;
          }
          .footer-item {
            background-color: #D8D8D8!important;
            display: inline-block;
            padding: 0 40px;
          }
        </style>
        <section class="footer-box">
           <span class="footer-item pageNumber" ></span>
        </section>`
  const headerTemplate = `
        <style>
          .header-section {
            margin: 0 auto;
            font-size: 9px;
            font-family: KaiTi,serif;
          }
          .exam-name {
            padding-left: 30px;
            text-align: center;
          }
        </style>
        <section class="header-section">
            <div class="exam-name"></div>
        </section>`
  pdfOptions = {
    path: `${dirPath}/${fileName}`,
    format: 'a4',
    landscape: false,
    displayHeaderFooter: false,
    printBackground: true,
    // headerTemplate,
    // footerTemplate,
    margin: {
      top: '0px',
      bottom: '0px',
      left: '0px',
      right: '0px'
    }
  }
  // 浏览器
  let browser = null
  try {
    // 重新连接至浏览器
    const time1 = Date.now()
    await BrowserUtil.init('wrongDownloadV3')
    console.log(`init time = ${(Date.now() - time1) / 1000}s`)
    const time2 = Date.now()
    browser = await BrowserUtil.connect('wrongDownloadV3')
    console.log(`connect time = ${(Date.now() - time2) / 1000}s`)

  } catch (err) {
    console.log(`连接至浏览器报错: ${JSON.stringify(err)}`)
    try {
      console.log(`重启浏览器成功,`)
      await BrowserUtil.init('wrongDownloadV3')
      browser = await BrowserUtil.connect('wrongDownloadV3')
    } catch (err2) {
      const text = `重启浏览器失败，原因:${JSON.stringify(err2)}`
      console.log(text)
      resData.status = 1
      resData.message.push(text)
      return resData
    }
  }
  // 渲染页URL
  try {
    console.log(`开始渲染PDF---${url}`)
    // 调用封装的生成PDF方法
    await generatePdf({
      browser,
      pdfOptions,
      url,
      timeout: 120 * 1000,
    })
    console.log(`渲染PDF完毕---${url}`)
    // 删除本地文件
    // delPath(dirPath)
  } catch (err) {
    const text = `渲染PDF失败: ${err},url:${url}`
    console.log(text)
    resData.status = 1
    resData.message.push(text)
  } finally {
    BrowserUtil.close('wrongDownloadV3')
  }
  return resData
}

renderPdf(path.join(__dirname, 'print-demo.html'), __dirname, 'test.pdf')
