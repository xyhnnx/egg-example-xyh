/**
* pdf-lib的简单用法
* 参考链接
 * https://pdf-lib.js.org/docs/api/
 * https://github.com/Hopding/pdf-lib
 */

const fs = require('fs')
const path = require('path')
const pdfLib = require('pdf-lib')
const fontkit = require('@pdf-lib/fontkit');
const {PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib')

const index = async () => {
  const pdfBuff = fs.readFileSync('./test-origin.pdf')
  const pdfDoc = await PDFDocument.load(pdfBuff)
  console.log(pdfDoc.getPages()[0].doc)
}
index()

/**
 * 新建一个新空白的PDF
 */
const createBlankPage = async () => {
  const pdfDoc = await PDFDocument.create()
// Add a blank page to the document
  const page = pdfDoc.addPage()
  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('./output/bankPDF.pdf', pdfBytes)
}

/**
 * 获取PDF页码总数
 */
const getPageCount = async () => {
  const PDFBuffer = fs.readFileSync('./test-origin.pdf')
  const pdfDoc = await PDFDocument.load(PDFBuffer)
  const count = pdfDoc.getPageCount()
  console.log(`pdf页码数：${count}`)
}
/**
 * 获取PDF 每页的宽高
 */
const getPDFPagesSize = async () => {
  const PDFBuffer = fs.readFileSync('./test-origin.pdf')
  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(PDFBuffer)
  const pages = pdfDoc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const size = pages[i].getSize()
    console.log(size)
  }
}

/**
 * PDF指定位置添加页码
 */
const PDFAddPageNumber = async () => {
  const PDFBuffer = fs.readFileSync('./test-origin.pdf')
  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(PDFBuffer)

  /**
   * 中文字体的解决方法
   * 中文字体不支持；这样首先要安装@pdf-lib/fontkit，然后引入fontkit，然后注册fontkit
   详见 https://github.com/Hopding/pdf-lib/issues/1010
   */
  pdfDoc.registerFontkit(fontkit)
  const fontBit = fs.readFileSync('./font/simhei.ttf')
  const font = await pdfDoc.embedFont(fontBit)
  const pages = pdfDoc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()
    page.drawText(`第${i}页，共${pages.length}页`, {
      x: width - 100,
      y: 20,
      size: 12,
      font: font,
      color: rgb(0,0,0),
      rotate: degrees(0),
      opacity: 0.5
    })
  }
  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('./output/test-addPageNumber.pdf', pdfBytes)
}

/**
 * 在PDF上创建一个form表单
 */
const createForm = async () => {

// Create a new PDFDocument
  const pdfDoc = await PDFDocument.create()

// Add a blank page to the document
  const page = pdfDoc.addPage([550, 750])

// Get the form so we can add fields to it
  const form = pdfDoc.getForm()

// Add the superhero text field and description
  page.drawText('Enter your favorite superhero:', { x: 50, y: 700, size: 20 })

  const superheroField = form.createTextField('favorite.superhero')
  superheroField.setText('One Punch Man')
  superheroField.addToPage(page, { x: 55, y: 640 })

// Add the rocket radio group, labels, and description
  page.drawText('Select your favorite rocket:', { x: 50, y: 600, size: 20 })

  page.drawText('Falcon Heavy', { x: 120, y: 560, size: 18 })
  page.drawText('Saturn IV', { x: 120, y: 500, size: 18 })
  page.drawText('Delta IV Heavy', { x: 340, y: 560, size: 18 })
  page.drawText('Space Launch System', { x: 340, y: 500, size: 18 })

  const rocketField = form.createRadioGroup('favorite.rocket')
  rocketField.addOptionToPage('Falcon Heavy', page, { x: 55, y: 540 })
  rocketField.addOptionToPage('Saturn IV', page, { x: 55, y: 480 })
  rocketField.addOptionToPage('Delta IV Heavy', page, { x: 275, y: 540 })
  rocketField.addOptionToPage('Space Launch System', page, { x: 275, y: 480 })
  rocketField.select('Saturn IV')

// Add the gundam check boxes, labels, and description
  page.drawText('Select your favorite gundams:', { x: 50, y: 440, size: 20 })

  page.drawText('Exia', { x: 120, y: 400, size: 18 })
  page.drawText('Kyrios', { x: 120, y: 340, size: 18 })
  page.drawText('Virtue', { x: 340, y: 400, size: 18 })
  page.drawText('Dynames', { x: 340, y: 340, size: 18 })

  const exiaField = form.createCheckBox('gundam.exia')
  const kyriosField = form.createCheckBox('gundam.kyrios')
  const virtueField = form.createCheckBox('gundam.virtue')
  const dynamesField = form.createCheckBox('gundam.dynames')

  exiaField.addToPage(page, { x: 55, y: 380 })
  kyriosField.addToPage(page, { x: 55, y: 320 })
  virtueField.addToPage(page, { x: 275, y: 380 })
  dynamesField.addToPage(page, { x: 275, y: 320 })

  exiaField.check()
  dynamesField.check()

// Add the planet dropdown and description
  page.drawText('Select your favorite planet*:', { x: 50, y: 280, size: 20 })

  const planetsField = form.createDropdown('favorite.planet')
  planetsField.addOptions(['Venus', 'Earth', 'Mars', 'Pluto'])
  planetsField.select('Pluto')
  planetsField.addToPage(page, { x: 55, y: 220 })

// Add the person option list and description
  page.drawText('Select your favorite person:', { x: 50, y: 180, size: 18 })

  const personField = form.createOptionList('favorite.person')
  personField.addOptions([
    'Julius Caesar',
    'Ada Lovelace',
    'Cleopatra',
    'Aaron Burr',
    'Mark Antony',
  ])
  personField.select('Ada Lovelace')
  personField.addToPage(page, { x: 55, y: 70 })

// Just saying...
  page.drawText(`* Pluto should be a planet too!`, { x: 15, y: 15, size: 15 })

// Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('./output/createForm.pdf', pdfBytes)
// For example, `pdfBytes` can be:
//   • Written to a file in Node
//   • Downloaded from the browser
//   • Rendered in an <iframe>
}

/**
 * 挑选PDF的指定页码；生成一份新的pdf
 */
const copyPages = async () => {
  const pdfDoc = await PDFDocument.create()
  const originPdfDoc = await PDFDocument.load(fs.readFileSync('./test-origin.pdf'))
  const originPDFPages = originPdfDoc.getPages()

  const [lastPage] = await pdfDoc.copyPages(originPdfDoc, [originPDFPages.length - 1])
  const [firstPage] = await pdfDoc.copyPages(originPdfDoc, [0])
  // 先把最后一页加进入
  pdfDoc.addPage(lastPage)
  // 再把第一页添加到index为0的位置
  pdfDoc.insertPage(0, firstPage)

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('./output/test-fist_last.pdf', pdfBytes)
}

/**
 * pdf里添加图片
 */
const embedImages = async () => {
// These should be Uint8Arrays or ArrayBuffers
// This data can be obtained in a number of different ways
// If your running in a Node environment, you could use fs.readFile()
// In the browser, you could make a fetch() call and use res.arrayBuffer()
  const jpgImageBytes = fs.readFileSync('./images/a.jpg')
  const pngImageBytes = fs.readFileSync('./images/b.png')

// Create a new PDFDocument
  const pdfDoc = await PDFDocument.create()

// Embed the JPG image bytes and PNG image bytes
  const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
  const pngImage = await pdfDoc.embedPng(pngImageBytes)

// Get the width/height of the JPG image scaled down to 25% of its original size
  const jpgDims = jpgImage.scale(0.25)

// Get the width/height of the PNG image scaled down to 50% of its original size
  const pngDims = pngImage.scale(0.5)

// Add a blank page to the document
  const page = pdfDoc.addPage()

// Draw the JPG image in the center of the page
  page.drawImage(jpgImage, {
    x: page.getWidth() / 2 - jpgDims.width / 2,
    y: page.getHeight() / 2 - jpgDims.height / 2,
    width: jpgDims.width,
    height: jpgDims.height,
  })

// Draw the PNG image near the lower right corner of the JPG image
  page.drawImage(pngImage, {
    x: page.getWidth() / 2 - pngDims.width / 2 + 75,
    y: page.getHeight() / 2 - pngDims.height,
    width: pngDims.width,
    height: pngDims.height,
  })

// Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('./output/test-add_image.pdf', pdfBytes)
}

/**
 * 挑选pdf的某一页的指定位置内容；生成一份新的pdf
 */
const embedPDFPages = async () => {
  const americanFlagPdfBytes = fs.readFileSync('./pdf/american_flag.pdf')
  const usConstitutionPdfBytes = fs.readFileSync('./pdf/us_constitution.pdf')

// Create a new PDFDocument
  const pdfDoc = await PDFDocument.create()

// Embed the American flag PDF bytes
  const [americanFlag] = await pdfDoc.embedPdf(americanFlagPdfBytes)

// Load the U.S. constitution PDF bytes
  const usConstitutionPdf = await PDFDocument.load(usConstitutionPdfBytes)

// Embed the second page of the constitution and clip the preamble
  const preamble = await pdfDoc.embedPage(usConstitutionPdf.getPages()[1], {
    left: 55,
    bottom: 485,
    right: 300,
    top: 575,
  })

// Get the width/height of the American flag PDF scaled down to 30% of
// its original size
  const americanFlagDims = americanFlag.scale(0.3)

// Get the width/height of the preamble clipping scaled up to 225% of
// its original size
  const preambleDims = preamble.scale(2.25)

// Add a blank page to the document
  const page = pdfDoc.addPage()

// Draw the American flag image in the center top of the page
  page.drawPage(americanFlag, {
    ...americanFlagDims,
    x: page.getWidth() / 2 - americanFlagDims.width / 2,
    y: page.getHeight() - americanFlagDims.height - 150,
  })

// Draw the preamble clipping in the center bottom of the page
  page.drawPage(preamble, {
    ...preambleDims,
    x: page.getWidth() / 2 - preambleDims.width / 2,
    y: page.getHeight() / 2 - preambleDims.height / 2 - 50,
  })

// Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('./output/test-embed_pdf_pages.pdf', pdfBytes)
}




