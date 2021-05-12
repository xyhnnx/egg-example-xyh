const fs = require('fs');
const path = require('path');
const images = require('images');
const gm = require('gm');
const sizeOf = require('image-size');
const Util = require('../../app/util/util');
sizeOf.setConcurrency(123456)


let files = Util.geFileList(path.join(Util.outputDir, '/jj-wallpapers/jj-img'));
let imgInfoList = []
let errorImgList = []
files.forEach((e, index) => {
    if (e.path.endsWith(').jpg')) {
        Util.delFile(e.path)
        console.log(e.path)
    } else if (index >= 0) {
        let dimensions
        try {
            dimensions = sizeOf(e.path)
            imgInfoList.push({
                name: e.name,
                width: dimensions.width,
                height: dimensions.height
            })
        } catch (err) {
            errorImgList.push(e.name)
            console.log('error---index=', index)
        }
        if (dimensions) {
            console.log(index, '-------------', dimensions.width, dimensions.height)
        }
        // imgInfoList.push({
        //     name: e.name,
        //     width: sizeInfo.width(),
        //     height: sizeInfo.height()
        // })
        // gm(e.path).size(function (err, size) {
        //         if (!err) {
        //             console.log('width = ' + size.width);
        //             console.log('height = ' + size.height);
        //         } else {
        //             console.log(err)
        //         }
        //     })
    }
})
console.log(imgInfoList);
Util.stringToFile(JSON.stringify(imgInfoList),'jj-img-map.json','jj-wallpapers')