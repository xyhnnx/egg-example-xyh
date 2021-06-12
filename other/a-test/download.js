const Util = require('../../app/util/util')
const fs = require('fs')
const path = require('path');
const fetch = require('../../app/util/fetch')
const asyncPool = require('tiny-async-pool')
const distPath = 'I:\\a-test\\'
index();

async function index() {
    let downList = Util.geFileList(distPath)
    let list = require('./list.json');
    let downloadInfoList = []
    let downLoadCount = 0;
    let isError = false
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        const name = item.name + item.downUrl.substring(item.downUrl.lastIndexOf('.'))
        if (!downList.some(e => e.name === name)) {
            let url = item.downUrl;
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
    await asyncPool(50, downloadInfoList, async item => {
        try {
            await Util.downloadFileItem(item.url, item.path)
            console.log(`${item.i}.文件下载成功！ ${getTime()}`)
        } catch (e) {
            console.log(`${item.i}.文件下载失败！${e} ${getTime()}`)
            isError = true
            await Util.timeout(500)
        }
    })
    if (isError) {
        index()
    }
}

function getTime() {
    return require('../../app/util/date-time-utils').dateFormat(Date.now(), 'yyyy-MM-dd hh:mm:ss')
}