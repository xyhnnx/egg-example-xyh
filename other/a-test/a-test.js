// https://24fuk.com/Html/110/index-1.html
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const fetch = require('../../app/util/fetch');
const {stringToFile, outputDir} = require('../../app/util/util')
const {geFileList} = require('../../app/util/zip-file')
let ip = 'https://27fuk.com';
let dirName = 'a-test';

class Test {
    async getOnePageList(pageNo = 1, id) {
        // 打开页面时间
        const startTime = new Date();
        // 渲染URL
        let id1 = id;
        let url = `${ip}/Html/${id1}/index-${pageNo}.html`;
        if (pageNo === 1) {
            url = `${ip}/Html/${id1}/index.html`;
        }
        try {
            const html = await fetch({
                url,
                params: {},
                method: 'get',
                timeout: 60000,
            });
            // 载入并初始化cheerio
            let $ = cheerio.load(html);
            // 取出目标节点，即带article-list-link css类的<a>
            let list = []
            const aList = $('.list1_obxobx a');
            for (let i = 0; i < aList.length; i++) {
                let detailUrl = $(aList[i]).attr('href')
                let detailHtml = await fetch({
                    url: `${ip}${detailUrl}`,
                    params: {},
                    method: 'get',
                    timeout: 60000,
                });
                $ = cheerio.load(detailHtml);
                let title = $('.film_title').text();
                let line = detailHtml.split('\n').find(e => e.trim().startsWith('var down_url'))
                let downUrl = eval(line.trim() + 'down_url')
                // var down_domain_arr = [
                //     "https://992do08.com",
                //     "https://992do09.com"
                //
                // ];
                let down_domain_x = "https://992di00.com";
                downUrl = downUrl.replace("https://d.220zx.com", down_domain_x);
                list.push({
                    name: title,
                    downUrl
                })
            }

            stringToFile(JSON.stringify(list), `${id1}_${pageNo}.json`, dirName)
        } catch (err) {
            // 关闭页面
            console.log(`err id=${id} pageNo=${pageNo}`)
        }
        console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL：${url}`);
    }

    async getAllPage() {
        // 110 112
        // 90 31
        let arr = [
            // { // wm
            //     id: 110,
            //     pageNo: 112
            // },
            // { // hq
            //     id: 90,
            //     pageNo: 31
            // },
            // { // gc
            //     id: 60,
            //     pageNo: 182
            // },
            // { // Sj
            //     id: 61,
            //     pageNo: 66
            // },
            // { // jdsj
            //     id: 109,
            //     pageNo: 31
            // },
            // { // dm
            //     id: 101,
            //     pageNo: 30
            // },
            // { // zp
            //     id: 89,
            //     pageNo: 91
            // },
            { // whzb
                id: 91,
                pageNo: 60
            },
            // { // snrq
            //     id: 111,
            //     pageNo: 31
            // },
            // { // yscj
            //     id: 113,
            //     pageNo: 31
            // },
        ]
        for (let i1 = 0; i1 < arr.length; i1++) {
            let item = arr[i1]
            for (let i = 1; i <= item.pageNo; i++) {
                this.getOnePageList(i, item.id)
            }
        }
    }

    getFileList() {
        let list = geFileList(path.join(outputDir, dirName))
        let allList = []
        for (let i = 0; i < list.length; i++) {
            let data = JSON.parse(fs.readFileSync(list[i].path))
            allList.push(...data)
        }
        stringToFile(JSON.stringify(allList), `all.json`, dirName + '-all')
    }
}

let test = new Test()

test.getFileList()
