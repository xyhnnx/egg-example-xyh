const Util = require('../../app/util/util')
const pdfbox = require('../../app/util/pdfbox.jar.js')
const fs = require('fs')

const config = {
  coverHtml: `${__dirname}/cover.html`,
  coverPdf: `${__dirname}/cover.pdf`,
  getPasswordImg: `${__dirname}/img/get-password.png`,
  catchDir: 'D:/home/egg-example-xyh-catch',
  handleDir: 'D:/干货整理',
  outputDir: 'D:/干货整理-output',
  password: 'xtx666'
}


/**
 * 1 cover.html 转为cover.pdf,放在当前文件下
 */
const {html2pdf} = require('../../app/util/html2pdf')
// html2pdf({
//   url: `${__dirname}/cover.html`,
//   fileName: 'cover.pdf',
//   dirPath: __dirname
// })

/**
 * 将cover.pdf 和 需要加封面的PDF文件合并
 * @param filePath
 * @param outputFilePath
 * @returns {Promise<void>}
 */
async function pdfAddCover (filePath, outputFilePath) {
  return await pdfbox.PDFMerger({
    pdfFileList: [
      config.coverPdf,
      filePath
    ],
    outputFile: outputFilePath
  })
}

/**
 * 把config.handleDir 文件夹里的PDF文件；统一添加封面；并加密 最后输出到config.outputDir
 * @returns {Promise<void>}
 */
async function index () {
  let fileList = Util.geFileList(config.handleDir)
  for (let i = 0; i < fileList.length; i++) {
    const item = fileList[i]
    let filePath = item.path
    let name = item.name
    const itemInfo = Util.getFilenameInfoByPath(item.path)
    const catchDir = `${config.catchDir}/${itemInfo.fileNameNoSuffix}`
    const catchDirInner = `${config.catchDir}/${itemInfo.fileNameNoSuffix}/${itemInfo.fileNameNoSuffix}`
    Util.makeDir(catchDirInner)
    try {
      await pdfAddCover(filePath, `${catchDirInner}/${itemInfo.fileName}`)
      await Util.zipDir(catchDirInner, `${catchDir}/${itemInfo.fileNameNoSuffix}.zip`, config.password)
      Util.delPath(catchDirInner)
      fs.copyFileSync(config.getPasswordImg, `${catchDir}/解密密码.png`)
      let outputDirPath = `${itemInfo.fileDir.replace(config.handleDir,config.outputDir)}`
      Util.makeDir(outputDirPath)
      await Util.zipDir(catchDir, `${outputDirPath}${itemInfo.fileNameNoSuffix}.zip`)
      Util.delPath(catchDir)
    }catch (e) {
      console.log(`失败：---${e}`)
    }
    const distDir = `${config.catchDir}/${itemInfo.fileNameNoSuffix}`
  }
}

index()
