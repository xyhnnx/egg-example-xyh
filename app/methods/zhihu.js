'use strict'
const fetch = require('../util/fetch')
const fs = require('fs')
const Controller = require('egg').Controller
const { downloadFile, downloadFile2, makeDir, timeout } = require('../util/util');

class Zhihu {
    async index () {
        console.log('start')
        let outputDir = __dirname + '/zhihu-output'
        makeDir(outputDir)
        let offset = 0
        let flag = true
        let topicData = []
        while (flag) {
            let res = await this.getTopics(offset)
            if(res) {
                topicData.push(...res)
                offset += 20
                console.log(`topic count = ${topicData.length}`)
            } else {
                flag = false
            }
            await timeout(2000)
        }
        await fs.writeFileSync(`${outputDir}/topics.json`, JSON.stringify(topicData));
        console.log(`topics end totalCount:${topicData.length}`)
    }
    async getTopics (offset = 0) {

        const res = await fetch({
            url: 'https://www.zhihu.com/node/TopicsPlazzaListV2',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            params: {
                method: 'next',
                params: `{"topic_id":1761,"offset":${offset},"hash_id":""}`
            },
            method: 'POST',
            timeout: 60000
        })

        if (res && res.msg && res.msg.length) {
            let reg = /(?<=href=\")[^\"]+(?=\")/
            let data = res.msg.map(e => {
                return  e.match(reg)[0]
            })
            return data
        } else {
            return false
        }
    }
}

module.exports = Zhihu
