/**
 * 对比一下PDFMerger 和  mergePDF（pdf-lib） 耗时
 * 结果PDFMerger 耗时更短；且产生的文件大小比较小
 */
const path = require('path')
const {PDFMerger, easyPDFmerge} = require('../../app/util/pdfbox.jar.js')
const {mergePDF} = require('../pdf-lib/index')
const sourceFiles = [
    path.resolve(__dirname, './pdf/物理.pdf'),
    path.resolve(__dirname, './pdf/test.pdf')
  ]
console.log(sourceFiles)
const outputFile = path.resolve(__dirname, 'output.pdf')


const test1 = async () => {
  const time = Date.now()
  await PDFMerger({
    sourceFiles,
    outputFile:path.resolve(__dirname, 'output1.pdf'),
  })
  console.log(`test1耗时：${Date.now() - time}ms`)
}
test1()


const test2 = async () => {
  const time = Date.now()
  await mergePDF({
    sourceFiles,
    outputFile:path.resolve(__dirname, 'output2.pdf'),
  })
  console.log(`test2耗时：${Date.now() - time}ms`)
}
test2()


const test3 = async () => {
  const time = Date.now()
  await easyPDFmerge({
    sourceFiles,
    outputFile:path.resolve(__dirname, 'output3.pdf'),
  })
  console.log(`test3耗时：${Date.now() - time}ms`)
}
test3()


// const test4 = async () => {
//   const time = Date.now()
//   const {getPDFPageCount} = require('../pdf-lib/index');
//   const count = await getPDFPageCount('./output2.pdf');
//   console.log(`test3耗时：${Date.now() - time}ms`)
//   console.log(count)
// }
// test4()


