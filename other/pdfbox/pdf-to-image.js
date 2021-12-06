const pdfbox = require('../../app/util/pdfbox.jar.js')
const { geFileList} = require('../../app/util/util')
async function test () {
  const fileList = geFileList('D:/dingding/错题本样例')
  for(let i = 0;i<fileList.length;i++) {
    const e = fileList[i]
    await pdfbox.PDFToImage({
      pdfLocalPath: e.path,
      imageType: 'png',
      startPage: 1,
      endPage: 100,
    })
  }
}
test()
