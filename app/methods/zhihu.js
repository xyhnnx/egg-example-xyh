'use strict'
const fetch = require('../util/fetch')
const fs = require('fs')
const Controller = require('egg').Controller
const { downloadFile, downloadFile2, makeDir, timeout } = require('../util/util');

class Zhihu {
    outputDir = __dirname + '/zhihu-output'

    async index () {
        let topicsData = await this.getTopicsData()
        console.log(topicsData.length)
        this.getEssenceData(topicsData)
    }

    async getTopicsData () {
        let outputDir = this.outputDir
        makeDir(outputDir)
        if (!fs.existsSync(`${outputDir}/topics.json`)) {
            console.log('start')
            let topicIds = [ '1761', '3324', '833', '99', '69', '113', '304', '13908', '570', '2955', '988', '388', '285', '686', '444', '1537', '19800', '253', '4196', '8437', '2253', '4217', '2143', '1538', '1740', '237', '112', '445', '1027', '215', '68', '75', '395' ]
            // let topicIds = [1761]
            let topicData = []
            let err = []
            for (let i = 0; i < topicIds.length; i++) {
                let offset = 0
                let flag = true
                while (flag) {
                    let topicId = topicIds[i]
                    console.log(`topicId = ${topicId}, offset = ${offset}, count = ${topicData.length}`)
                    let res
                    for (let tryCount = 0; tryCount < 3; tryCount++) {
                        try {
                            res = await this.getTopics(offset, topicId)
                            break
                        } catch (e) {
                            console.log(`getTopics第${tryCount + 1}次尝试`)
                            if (tryCount === 2) {
                                err.push({topicId: topicId})
                                let data = JSON.stringify(Array.from(new Set(topicData)))
                                await fs.writeFileSync(`${outputDir}/topics.json`, data)
                                await fs.writeFileSync(`${outputDir}/topics_error.json`, JSON.stringify(err))
                            }
                            await timeout()
                        }
                    }
                    if (res) {
                        topicData.push(...res)
                        offset += 20

                    } else {
                        flag = false
                    }
                    await timeout(2000 + Math.random() * 100)
                }
            }
            console.log(`totalCount:${topicData.length}`)
            let data = JSON.stringify(Array.from(new Set(topicData)))
            await fs.writeFileSync(`${outputDir}/topics.json`, data)
            console.log(`end write totalCount:${data.length}`)
        }
        let topicsData = fs.readFileSync(`${outputDir}/topics.json`, 'utf-8')
        return JSON.parse(topicsData)
    }

    async getTopics (offset = 0, topicId) {

        const res = await fetch({
            url: 'https://www.zhihu.com/node/TopicsPlazzaListV2',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            params: {
                method: 'next',
                params: `{"topic_id":${topicId},"offset":${offset},"hash_id":""}`
            },
            method: 'POST',
            timeout: 60000
        })

        if (res && res.msg && res.msg.length) {
            let reg = /(?<=href=\")[^\"]+(?=\")/
            let data = res.msg.map(e => {
                return e.match(reg)[0]
            })
            return data
        } else {
            return false
        }
    }
    async getEssenceData (topicsData) {
        let outputDir = this.outputDir
        makeDir(outputDir)
        if (!fs.existsSync(`${outputDir}/essenceAnswer.json`)) {
            console.log('getEssenceData-start')
            let essenceData = []
            let err = []
            for (let i = 0; i < 1; i++) {
                let flag = true
                let url;
                while (flag) {
                    let id = topicsData[i].split('/')[2]
                    console.log(`id = ${id}, index = ${i}, essenceDataCount = ${essenceData.length}`)
                    let res
                    for (let tryCount = 0; tryCount < 3; tryCount++) {
                        try {
                            res = await this.getEssence(url, id)
                            break
                        } catch (e) {
                            console.log(`getEssence第${tryCount + 1}次尝试-${url}---${e}`)
                            if (tryCount === 2) {
                                err.push({id: id})
                                let data = essenceData
                                await fs.writeFileSync(`${outputDir}/essenceData.json`, JSON.stringify(data))
                                await fs.writeFileSync(`${outputDir}/essenceData_error.json`, JSON.stringify(err))
                            }
                            await timeout()
                        }
                    }
                    if (res) {
                        essenceData.push(...res.data)
                        url = res.nextUrl
                    } else {
                        flag = false
                    }
                    await timeout(2000 + Math.random() * 100)
                }
            }
            console.log(`essenceData-totalCount:${essenceData.length}`)
            let data = essenceData
            await fs.writeFileSync(`${outputDir}/essenceData.json`, JSON.stringify(data))
            console.log(`end write totalCount:${data.length}`)
        }
        let essenceData = fs.readFileSync(`${outputDir}/essenceData.json`, 'utf-8')
        return essenceData
    }
    async getEssence (url, id) {
        url = url || `https://www.zhihu.com/api/v4/topics/${id}/feeds/essence?include=data%5B%3F(target.type%3Dtopic_sticky_module)%5D.target.data%5B%3F(target.type%3Danswer)%5D.target.content%2Crelationship.is_authorized%2Cis_author%2Cvoting%2Cis_thanked%2Cis_nothelp%3Bdata%5B%3F(target.type%3Dtopic_sticky_module)%5D.target.data%5B%3F(target.type%3Danswer)%5D.target.is_normal%2Ccomment_count%2Cvoteup_count%2Ccontent%2Crelevant_info%2Cexcerpt.author.badge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Dtopic_sticky_module)%5D.target.data%5B%3F(target.type%3Darticle)%5D.target.content%2Cvoteup_count%2Ccomment_count%2Cvoting%2Cauthor.badge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Dtopic_sticky_module)%5D.target.data%5B%3F(target.type%3Dpeople)%5D.target.answer_count%2Carticles_count%2Cgender%2Cfollower_count%2Cis_followed%2Cis_following%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Danswer)%5D.target.annotation_detail%2Ccontent%2Chermes_label%2Cis_labeled%2Crelationship.is_authorized%2Cis_author%2Cvoting%2Cis_thanked%2Cis_nothelp%2Canswer_type%3Bdata%5B%3F(target.type%3Danswer)%5D.target.author.badge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Danswer)%5D.target.paid_info%3Bdata%5B%3F(target.type%3Darticle)%5D.target.annotation_detail%2Ccontent%2Chermes_label%2Cis_labeled%2Cauthor.badge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Dquestion)%5D.target.annotation_detail%2Ccomment_count%3B&limit=10`
        const res = await fetch({
            url,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'get',
            timeout: 60000
        })
        if (res && res.data && res.data.length) {
            let data = res.data.map(e => {
                if(e.target.type === 'article') { // 文章
                    return {
                        type: 'article',
                        title: e.target.title
                        answerId: e.target.id,
                        url: e.target.url,
                        voteupCount: e.target.voteup_count,
                        commentCount: e.target.comment_count,
                        updatedTime: e.target.updated
                    }
                } else {
                    return {
                        questionTitle: e.target.question.title,
                        questionId: e.target.question.id,
                        answerId: e.target.id,
                        voteupCount: e.target.voteup_count,
                        commentCount: e.target.comment_count,
                        updatedTime: e.target.updated_time
                    }
                }

            })
            return {
                data,
                nextUrl: res.paging.next
            }
        } else {
            return false
        }
    }
}

module.exports = Zhihu
