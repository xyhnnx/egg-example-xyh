const {exec} = require('child_process');
const path = require('path');
const { makeDir, geFileList } = require('../../app/util/util')

/**
 * 使用 pdfbox.jar对pdf文件转图片(https://pdfbox.apache.org/2.0/commandline.html)
 * @param params
 * - pdfLocalPath     要处理的pdf本地路径
 * - imageType        要写入的图像类型。目前只有 jpg 或 png。
 * - startPage        要开始的页面 (包含开始页)
 * - endPage          要停止的页面。(包含停止页)
 */
const PDFToImage = async (params = {
  pdfLocalPath: 'D:/dingding/错题本样例/90109_1班_樊宇栋_九年级数学.pdf',
  imageType: 'png',
  startPage: 1,
  endPage: 100,
}) => {
  console.log(params.pdfLocalPath)
  let fileName = params.pdfLocalPath.split('/')[params.pdfLocalPath.split('/').length - 1]
  const outputPrefix = path.resolve(params.pdfLocalPath, '../', fileName.slice(0, fileName.lastIndexOf('.')))
  console.log('outputPrefix', outputPrefix)
  makeDir(outputPrefix)
  console.log('__dirname', __dirname)
  const cmd = `java -jar ${__dirname}\\pdfbox.jar PDFToImage -imageType ${params.imageType} -startPage ${params.startPage} -endPage ${params.endPage} -outputPrefix ${outputPrefix}\\ -dpi 300 ${params.pdfLocalPath} `

  await new Promise((resolve, reject) => {
    const spawnObj = exec(cmd);
    spawnObj.stdout.on('data', function (chunk) {
      console.log('stdout-----', chunk.toString());
    });
    spawnObj.stderr.on('data', data => {
      console.log('stderr-----', data);
    });
    spawnObj.on('exit', code => {
      console.log('exit-----: ' + code);
    })
    spawnObj.on('close', code => {
      if (code === 0) {
        console.log('成功-----' + code);
        resolve(true)
      } else {
        console.log('失败-----' + code);
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(false)
      }
    })
  })
}


/**
 * 使用 pdfbox.jar对pdf文件拆分(https://pdfbox.apache.org/2.0/commandline.html)
 * @param params
 *  inputFile		要覆盖的 PDF 文件。
 *  defaultOverlay.pdf		默认覆盖文件
 *  -odd oddPageOverlay.pdf		用于奇数页的覆盖文件。
 *  -even evenPageOverlay.pdf		用于偶数页的覆盖文件。
 *  -first firstPageOverlay.pdf		用于第一页的覆盖文件。
 *  -last lastPageOverlay.pdf		用于最后一页的覆盖文件。
 *  -page pageNumber specificPageOverlay.pdf		用于给定页码的覆盖文件可能会出现多次。
 *  -position	background	在哪里放置覆盖，前景(foreground)或背景(background).
 *  outputFile		生成的pdf文件。
 *
 例（question.pdf的偶数页用test-index.pdf覆盖）： params = {
  inputFile: 'D:\\home\\xyh-test\\question.pdf',
  evenPageOverlay: 'D:\\home\\xyh-test\\test-index.pdf',
  position: 'foreground',
  outputFile: 'D:\\home\\xyh-test\\question-output.pdf'
}
 */
const OverlayPDF = async (params = {
  inputFile: 'D:\\home\\xyh-test\\question.pdf',
  evenPageOverlay: 'D:\\home\\xyh-test\\test-index.pdf',
  position: 'foreground',
  outputFile: 'D:\\home\\xyh-test\\question-output.pdf'
}) => {
  if (!params.inputFile || !params.outputFile) {
    console.log('请传入要覆盖的PDF文件和要生成的PDF文件的完整路径！')
    return
  }
  const arr = [
    `${params.inputFile}`
  ]
  if (params.defaultOverlay) {
    arr.push(`${params.defaultOverlay}`)
  }
  if (params.oddPageOverlay) {
    arr.push(`-odd ${params.oddPageOverlay}`)
  }
  if (params.evenPageOverlay) {
    arr.push(`-even ${params.evenPageOverlay}`)
  }
  if (params.position) {
    arr.push(`-position ${params.position}`)
  }
  if (params.outputFile) {
    arr.push(`${params.outputFile}`)
  }
  const jarPath = path.resolve(__dirname, 'pdfbox.jar')
  const cmd = `java -jar ${jarPath} OverlayPDF ${arr.join(' ')}`
  console.log(cmd)
  await new Promise((resolve, reject) => {
    const spawnObj = exec(cmd);
    spawnObj.stdout.on('data', function (chunk) {
      console.log('stdout-----', chunk.toString());
    });
    spawnObj.stderr.on('data', data => {
      console.log('stderr-----', data);
    });
    spawnObj.on('exit', code => {
      console.log('exit-----: ' + code);
    })
    spawnObj.on('close', code => {
      if (code === 0) {
        console.log('成功-----' + code);
        resolve(true)
      } else {
        console.log('失败-----' + code);
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(code)
      }
    })
  })
}



/**
 * 使用 pdfbox.jar对pdf文件拆分(https://pdfbox.apache.org/2.0/commandline.html)
 * @param params
 * - pdfLocalPath     要处理的pdf本地路径
 * - split            pdf 的每个拆分部分的页数。
 * - startPage        要开始的页面 (包含开始页)
 * - endPage          要停止的页面。(包含停止页)
 */
const PDFSplit = async (params = {
  pdfLocalPath: 'D:\\home\\xyh-test\\question.pdf',
  split: 1,
  startPage: 1,
  endPage: 100,
}) => {
  console.log('__dirname', __dirname)
  const cmd = `java -jar ${__dirname}\\pdfbox.jar PDFSplit -split ${params.split} -startPage ${params.startPage} -endPage ${params.endPage} ${params.pdfLocalPath}`

  await new Promise((resolve, reject) => {
    const spawnObj = exec(cmd);
    spawnObj.stdout.on('data', function (chunk) {
      console.log('stdout-----', chunk.toString());
    });
    spawnObj.stderr.on('data', data => {
      console.log('stderr-----', data);
    });
    spawnObj.on('exit', code => {
      console.log('exit-----: ' + code);
    })
    spawnObj.on('close', code => {
      if (code === 0) {
        console.log('成功-----' + code);
        resolve(true)
      } else {
        console.log('失败-----' + code);
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(false)
      }
    })
  })
}

const utils = {
  PDFSplit,
  OverlayPDF,
  PDFToImage,
}
module.exports = utils


// async function test () {
//   const fileList = geFileList('D:/dingding/错题本样例')
//   for(let i = 0;i<fileList.length;i++) {
//     const e = fileList[i]
//     await PDFToImage({
//       pdfLocalPath: e.path,
//       imageType: 'png',
//       startPage: 1,
//       endPage: 100,
//     })
//   }
// }
// test()
