/*图片压缩*/
const Util = require('../../app/util/util')
const fs = require('fs')
const path = require('path')
const images = require('images');
// 要压缩的图片文件夹
let originDir = 'D:\\egg-example-xyh-output\\test\\'
// 压缩后的图片存放的文件夹
let distDir = 'D:\\egg-example-xyh-output\\test_compress\\'

index()

async function index () {
  let list = Util.geFileList(originDir)
  for (let i = 0; i < list.length; i++) {
    let e = list[i]
    console.log(e)
    if(!fs.existsSync(distDir + e.name)) {
      await new Promise((resolve, reject) => {
        try {
          images(originDir + e.name) //Load image from file
          //加载图像文件
          .size(500) //Geometric scaling the image to 400 pixels width
          //等比缩放图像到400像素宽
          // .draw(images("logo.png"), 10, 10) //Drawn logo at coordinates (10,10)
          //在(10,10)处绘制Logo
          .save(distDir + e.name, { //Save the image to a file, with the quality of 50
            quality : 100 //保存图片到文件,图片质量为50
          });
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    } else{
      console.log(`${i}. 图片已压缩`)
    }
  }
}
