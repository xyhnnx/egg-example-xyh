const Util = require('../../app/util/util')
const fs = require('fs')
const path = require('path');
const fetch = require('../../app/util/fetch')
const asyncPool = require('tiny-async-pool')
const distPath = 'I:\\zm-img\\'

index();

async function index() {
    let downList = Util.geFileList(distPath)
    let list = require('./zm-images.json');
    let downloadInfoList = []
    let downLoadCount = 0;
    let isError = false
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        let splitArr = `${item.src}`.split('/')
        const name = splitArr[splitArr.length - 1]
        if (!downList.some(e => e.name === name)) {
            let url = item.src
            downloadInfoList.push({
                url,
                path: `${distPath}${name}`,
                i
            })
        } else {
            console.log(`${i}.文件已下载 ${getTime()}`)
            downLoadCount++
        }
    }
    console.log(`
    已经下载数量: ${downLoadCount}
    未经下载数量: ${list.length - downLoadCount}
    `)
    // 控制下载并发
    await asyncPool(10, downloadInfoList, async item => {
        try {
            await Util.downloadFileItem(item.url, item.path)
            console.log(`${item.i}.文件下载成功！ ${getTime()}`)
        } catch (e) {
            console.log(`${item.i}.文件下载失败！${e} ${getTime()}`)
            isError = true
            await Util.timeout(10000)
        }
    })
    if (isError) {
        index()
    }
}

function getTime() {
    return require('../../app/util/date-time-utils').dateFormat(Date.now(), 'yyyy-MM-dd hh:mm:ss')
}


// function shuffle(list) {
//     const _ = require('lodash')
//     return _.shuffle(list);
// }
//
// shuffle([{a: 1}, {a: 2}, {a: 3}, {a: 4}])
