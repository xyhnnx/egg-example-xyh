const path = require('path')
// 生成PDF文件
const generatePdf = async (data) => {
  const page = await data.browser.newPage()

  // 打开页面时间
  const startTime = new Date()
  let url
  try {
    // 渲染页JS异常
    page.on('pageerror', async meg => {
      await page.close()
      console.log(meg)
    })
    // 渲染页console事件
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(new Error(`通过console.error监听到页面发生错误，页面URL:${url}`))
        msg.args().forEach(msgItem => {
          console.log(msgItem._remoteObject.value)
        })
      }
    })

    url = data.url
    console.log(`渲染URL：${url}`)
    // await page.setCookie({name: 'token', value: JSON.stringify(token), url: config.webUrl})
    await page.goto(url).catch(err => {
      console.log('goto:err', err)
      console.log(err)
    })
    try {
      // 等待页面渲染完成 #render-finish
      await page.waitForSelector('#renderFinish', {visible: true, timeout: 1000 * 60})
    } catch (e) {
      console.log('waitForSelector:err', e)
      console.log(e)
    }


    // 生成pdf
    await page.pdf(data.pdfOptions)
    // 关闭页面
    await page.close()
    // 断开浏览器连接
    data.browser.disconnect()
  } catch (err) {
    console.log(err)
    console.log(`生成PDF时发生错误：${url}`)

    // 关闭页面
    await page.close()
    // 断开浏览器连接
    data.browser.disconnect()
    // 抛出异常
    throw err
  }
  console.log(`生成单个PDF文件统计,耗时: ${new Date() - startTime}ms，渲染页URL：${url}`)
}

const html2pdf = async (params) => {
  const {makeDir, webUrlSplicing} = require('../../app/util/util')
  const BrowserUtil = require('../../app/util/browser')
  const browserId = `html2pdf-${Date.now()}`
  // 重新连接至浏览器
  const time1 = Date.now()
  const browser = await BrowserUtil.connect(browserId)
  console.log(`BrowserUtil.connect time ${(Date.now() - time1) / 1000}s`)
  try {
    // 临时存放单个PDF文件路径
    const dirPath = params.dirPath || '/egg-example-xyh-output/html2pdf.js'
    const safeFileName = params.fileName || `${new Date().getTime()}.pdf`
    // 创建临时文件夹
    makeDir(dirPath)

    // 安全的文件名(fileName中含有特殊字符)

    // 供修改的pdf参数
    const pdfOptionsBase = {
      // a4, a3
      format: 'a4',
      // 指定视口是否处于横向模式
      landscape: false,
    }
    if (params.pdfOption) {
      Object.keys(params.pdfOption).forEach(key => {
        if (pdfOptionsBase[key] !== undefined) {
          pdfOptionsBase[key] = params.pdfOption[key]
        }
      })
    }
    let footerTemplate = `
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
    // PDF生成选项
    const pdfOptions = {
      ...pdfOptionsBase,
      path: `${dirPath}/${safeFileName}`,
      footerTemplate,
      displayHeaderFooter: false,
      printBackground: true,
      margin: {
        top: '0px',
        bottom: '40px',
        left: '0px',
        right: '0px'
      }
    }

    let webUrl = params.url
    // if (!`${params.url}`.startsWith('http')) {
    //   webUrl = `${config.webUrl}${params.url}`
    // }
    const url = webUrlSplicing(
      webUrl,
      params.params || {}
    )
    console.log(`准备开始生成PDF:url=${url}`)
    try {
      const generatePdfParams = {
        pdfOptions,
        browser,
        url
      }
      await generatePdf(generatePdfParams)
    } catch (err) {
      console.log(err)
      // 抛出异常
      throw err
    }
  } finally {
    BrowserUtil.close(browserId)
  }
}

html2pdf({
  url: path.join(__dirname, 'test.html'),
  fileName: 'test.pdf'
})


