const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer');
// 生产pdf的浏览器
let browser
async function writeFile (url, data) {
  return new Promise(resolve => {
    // 写入文件内容（如果文件不存在会创建一个文件）
    // 传递了追加参数 { 'flag': 'w' } console.log(path.join(__dirname, 'out-test/preload.js'))
    fs.writeFile(url, data, {flag: 'w', encoding: 'utf-8'}, function (err) {
      if (err) {
        console.log(`文件写入失败-${err}`)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

// html转pdf
async function html2Pdf(htmlUrl, savePdfPath, savePdfName) {
  if (!browser) {
    browser = await puppeteer.launch();
  }
  const page = await browser.newPage();
  await page.setViewport({
    width: 200,
    height: 1000
  })
  // networkidle2: consider navigation to be finished when there are no more than 2 network connections for at least 500 ms.
  // 这里的htmlUrl要是盘符开头 D:
  await page.goto(htmlUrl, {waitUntil: 'networkidle2'});
  let savePath = path.join(savePdfPath, savePdfName + '.pdf')
  await page.pdf({path: savePath, format: 'A4'});
  await page.close()
}

module.exports = {
  writeFile,
  html2Pdf
}
