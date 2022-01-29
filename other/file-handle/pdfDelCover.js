const Util = require('../../app/util/util')
const pdfbox = require('../../app/util/pdfbox.jar.js')
const fs = require('fs')


/**
 * 指定文件夹里的pdf去掉第一页
 */
const index = () => {
  Util.geFileList('D:\\干货\\111111').forEach((e, i) => {
    pdfbox.PDFSplit(
      {
        pdfLocalPath: e.path,
        split: 10000,
        startPage: 2,
        endPage: 10000,
        outputPrefix: e.path,
      }
    )
  })


}
index()

