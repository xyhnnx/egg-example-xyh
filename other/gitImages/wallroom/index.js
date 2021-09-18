// https://wallroom.io/
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const fetch = require('../../../app/util/fetch');
const {stringToFile, outputDir} = require('../../../app/util/util')
const {geFileList} = require('../../../app/util/zip-file')
let ip = 'https://wallroom.io';
let dirName = 'wallroom';

class Wall {
    async getOnePageList(id = '1920') {
        // 打开页面时间
        const startTime = new Date();
        // 渲染URL
        // let id = 'new';
        let url = `${ip}/${id}`;
        try {
            const html = await fetch({
                url,
                params: {},
                method: 'get',
                timeout: 60000,
            });
            // 载入并初始化cheerio
            let $ = cheerio.load(html);
            $('.image-list')
            let list = []
            const aList = $('.image-list a img');
            for (let i = 0; i < aList.length; i++) {
                let src = $(aList[i]).attr('data-src')
                if (!src) {
                    src = $(aList[i]).attr('src')
                }
                let hrefArr = src.split('/')
                list.push({
                    url: `${ip}${src.replace('/thumb', '')}`,
                    thumbUrl: `${ip}${src}`,
                    width: hrefArr[2].split('x')[0],
                    height: hrefArr[2].split('x')[1]
                })
            }
            stringToFile(JSON.stringify(list), `wallroom_${id}.json`, `${dirName}/pages`)
            console.log(id, '数量：', list.length)
        } catch (err) {
            // 关闭页面
            console.log(`err id=${id}`)
        }
        console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL：${url}`);
    }

    async getAllPage() {
        let arr = ['', 'new', '1920', '2560', '2880', '4k', '5k', 'dual', '8k'];
        for (let i = 0; i < arr.length; i++) {
            await this.getOnePageList(arr[i])
        }
        this.getFileList()
    }

    getFileList() {
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
