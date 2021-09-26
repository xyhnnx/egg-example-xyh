// https://wall.alphacoders.com/featured.php?quickload=9890&page=1
const path = require('path')
const fs = require('fs')
const cheerio = require('cheerio')
const fetch = require('../../../app/util/fetch')
const {stringToFile, outputDir} = require('../../../app/util/util')
const {geFileList} = require('../../../app/util/zip-file')
let ip = 'https://wall.alphacoders.com/featured.php'
let dirName = 'wall.alphacoders.com'

class Wall {
    async getOnePageList (id, pageNo = 1) {
        // 打开页面时间
        const startTime = new Date()
        // 渲染URL
        // let id = 'new';
        let url = `${ip}`
        try {
            console.log(id, pageNo)
            const html = await fetch({
                url,
                params: {
                    quickload: id,
                    page: pageNo
                },
                method: 'get',
                timeout: 60000
            })
            // 载入并初始化cheerio
            let $ = cheerio.load(html)
            const imgList = $('.thumb-container-big .img-responsive')
            if (imgList.length === 0) {
                return false
            }
            const whList = $('.thumb-container-big .thumb-info span')
            let list = []
            for (let i = 0; i < imgList.length; i++) {
                let src = $(imgList[i]).attr('src')
                let wh = $(whList[i]).html().split('x')
                list.push({
                    url: src.replace('thumbbig-', ''),
                    thumbUrl: src,
                    width: Number(wh[0]),
                    height: Number(wh[1])
                })
            }
            stringToFile(JSON.stringify(list), `${id}_${pageNo}.json`, `${dirName}/pages`)
            console.log(id, '数量：', list.length)
            return true
        } catch (err) {
            // 关闭页面
            console.log(`err id=${id}`)
            return false
        }
        console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL：${url}`)
    }

    async getAllPage () {
        let success = true
        let pageNo = 1
        do {
            // 9889, 9890 9888 15000
            success = await this.getOnePageList(9891, pageNo)
            pageNo++
        } while (success)
        // this.getFileList()
    }

    getFileList () {
        let list = geFileList(path.join(outputDir, dirName))
        let allList = []
        for (let i = 0; i < list.length; i++) {
            let data = JSON.parse(fs.readFileSync(list[i].path))
            allList.push(...data)
        }
        stringToFile(JSON.stringify(allList), `pages_all.json`, dirName)
    }

}

let w = new Wall()
w.getAllPage()
