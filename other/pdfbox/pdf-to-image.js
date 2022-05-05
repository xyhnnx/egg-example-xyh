const pdfbox = require('../../app/util/pdfbox.jar.js')
const { geFileList} = require('../../app/util/util')
async function test () {
  const fileList = geFileList('d:\\Users\\86173\\Desktop\\临时\\PDF')
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
