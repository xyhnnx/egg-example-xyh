const pdfbox = require('../../app/util/pdfbox.jar.js')
const {getFilenameInfoByPath, geFileList} = require('../../app/util/util')
console.log(pdfbox)
console.log(getFilenameInfoByPath('app/util/pdf\\box.jar.js'))
// pdfbox.PDFMerger({
//   pdfFileList: [
//     'D:/阿里云盘/test/cover.pdf',
//     'D:/阿里云盘/test/《云上朗读者》.pdf'
//   ],
//   outputFile: 'D:/阿里云盘/test/merge/output.pdf'
// })
async function test () {
  let fileList = geFileList('D:/阿里云盘/test')
  for (let i = 0; i < fileList.length; i++) {
    let filePath = fileList[i].path
    let outputFilePath = filePath.replace('/test/','/test-output/')
    try {
      await pdfbox.PDFMerger({
        pdfFileList: [
          'D:/阿里云盘/test.pdf',
          filePath
        ],
        outputFile: outputFilePath
      })
    }catch (e) {
      console.log(`失败：---${filePath}`)
    }
  }
}

test()
