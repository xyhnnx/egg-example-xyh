'use strict'
const fetch = require('../../app/util/fetch')
const fs = require('fs')
const Controller = require('egg').Controller
const { downloadFile, downloadFile2, makeDir, timeout } = require('../../app/util/util');

class Zhihu {
    outputDir = '/egg-example-xyh-output' + '/zhihu-output'

    async index () {
        let topicsData = await this.getTopicsData()
        this.getEssenceData(topicsData)
    }

    async getEssenceData (topicsData) {
        topicsData = topicsData.slice(topicsData.length - 2000)
        let outputDir = this.outputDir
        makeDir(outputDir)
        makeDir(outputDir + '/essenceAnswer')
        let apiArrAll = []
        let count = 1 // 并发数量
        for (let i = 0; i < topicsData.length; i++) {
            let id = topicsData[i].split('/')[2]
            apiArrAll.push(() => {
                return this.getEssenceItemData(id)
            })
        }

        while (apiArrAll.length) {
            console.log(`------------剩余：${apiArrAll.length} 总量：${topicsData.length}------------------`)
            await Promise.all(apiArrAll.splice(0, count).map(e => e()))
        }
        console.log(`-------------------end write------------------------`)
    }

    async getEssenceItemData (id) {
        let outputDir = this.outputDir
        if (fs.existsSync(`${outputDir}/essenceAnswer/essenceAnswer_${id}.json`)) {
            let data = fs.statSync(`${outputDir}/essenceAnswer/essenceAnswer_${id}.json`)
            if (data.size < 1000) {
                console.log(`文件已存在但是是空的：essenceAnswer_${id}.json`)
            } else {
                console.log(`文件已存在：essenceAnswer_${id}.json`)
                return
            }
        }

        let essenceData = []
        let flag = true
        let url
        let isError = false
        while (flag) {
            console.log(`id = ${id},count=${essenceData.length}`)
            let res
            for (let tryCount = 0; tryCount < 3; tryCount++) {
                try {
                    res = await this.getEssence(url, id)
                    break
                } catch (e) {
                    console.log(`getEssence第${tryCount + 1}次尝试-${url}---${e}`)
                    if (tryCount === 2) {
                        let err = []
                        try {
                            err = JSON.parse(fs.readFileSync(`${outputDir}/essenceData_error.json`, 'utf-8'))
                        } catch (e) {
                            console.log('essenceData_error.json ', e)
                        }
                        err.push({id: id})
                        await fs.writeFileSync(`${outputDir}/essenceData_error.json`, JSON.stringify(err))
                        isError = true
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
            await timeout(10 + Math.random() * 20)
        }
        if(essenceData.length && !isError) {
            await fs.writeFileSync(`${outputDir}/essenceAnswer/essenceAnswer_${id}.json`, JSON.stringify(essenceData))
            console.log(`essenceAnswer_${id}.json 写入成功！count:${essenceData.length}`)
        }
    }

    async getEssence (url, id) {
        url = url || `https://www.zhihu.com/api/v4/topics/${id}/feeds/essence?include=data%5B%3F(target.type%3Dtopic_sticky_module)%5D.target.data%5B%3F(target.type%3Danswer)%5D.target.content%2Crelationship.is_authorized%2Cis_author%2Cvoting%2Cis_thanked%2Cis_nothelp%3Bdata%5B%3F(target.type%3Dtopic_sticky_module)%5D.target.data%5B%3F(target.type%3Danswer)%5D.target.is_normal%2Ccomment_count%2Cvoteup_count%2Ccontent%2Crelevant_info%2Cexcerpt.author.badge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Dtopic_sticky_module)%5D.target.data%5B%3F(target.type%3Darticle)%5D.target.content%2Cvoteup_count%2Ccomment_count%2Cvoting%2Cauthor.badge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Dtopic_sticky_module)%5D.target.data%5B%3F(target.type%3Dpeople)%5D.target.answer_count%2Carticles_count%2Cgender%2Cfollower_count%2Cis_followed%2Cis_following%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Danswer)%5D.target.annotation_detail%2Ccontent%2Chermes_label%2Cis_labeled%2Crelationship.is_authorized%2Cis_author%2Cvoting%2Cis_thanked%2Cis_nothelp%2Canswer_type%3Bdata%5B%3F(target.type%3Danswer)%5D.target.author.badge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Danswer)%5D.target.paid_info%3Bdata%5B%3F(target.type%3Darticle)%5D.target.annotation_detail%2Ccontent%2Chermes_label%2Cis_labeled%2Cauthor.badge%5B%3F(type%3Dbest_answerer)%5D.topics%3Bdata%5B%3F(target.type%3Dquestion)%5D.target.annotation_detail%2Ccomment_count%3B&&limit=10`
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
                return {
                    ...e
                }
                // if(e.target.type === 'article') { // 文章
                //     return {
                //         type: 'article',
                //         title: e.target.title,
                //         answerId: e.target.id,
                //         url: e.target.url,
                //         voteupCount: e.target.voteup_count,
                //         commentCount: e.target.comment_count,
                //         updatedTime: e.target.updated,
                //         authorName: e.target.author.name
                //     }
                // } else {
                //     return {
                //         questionTitle: e.target.question.title,
                //         questionId: e.target.question.id,
                //         answerId: e.target.id,
                //         voteupCount: e.target.voteup_count,
                //         commentCount: e.target.comment_count,
                //         updatedTime: e.target.updated_time,
                //         authorName: e.target.author.name
                //     }
                // }

            })
            return {
                data,
                nextUrl: res.paging.next
            }
        } else {
            return false
        }
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
}

let z = new Zhihu()
z.index()

class ScriptClass {
    async index() {
        console.log(process.execPath)
        console.log(process.cwd())
        await new Promise((resolve)=>{
            console.log('xxxxxfsafasfd')
            setTimeout(() => {
                console.log('xxxxx')
                resolve()
            }, 2000)
        })
        try {
            let jsonList = this.getList()
            this.json2md(jsonList)
        } catch (e) {
            console.log(e)
        }
        await new Promise((resolve)=>{
            console.log('xxxxxfsafasfd')
            setTimeout(() => {
                console.log('xxxxx')
                resolve()
            }, 10000)
        })

    }
    getList() {
        let list = geFileList(path.join(__dirname, '/essenceAnswer'))
        let allList = []
        for(let i = 0;i<list.length;i++) {
            console.log(`read index = ${i}`)
            let data = JSON.parse(fs.readFileSync(list[i].path))
            allList.push(...data)
        }
        let newList = allList.map(e => {
            if(e.target.type === 'article') { // 文章
                return {
                    title: e.target.title,
                    url: e.target.url,
                    voteupCount: e.target.voteup_count,
                    commentCount: e.target.comment_count,
                    updatedTime: e.target.updated,
                    authorName: e.target.author.name
                }
            } else {
                return {
                    title: e.target.question.title,
                    url: `https://www.zhihu.com/question/${e.target.question.id}/answer/${e.target.id}`,
                    voteupCount: e.target.voteup_count,
                    commentCount: e.target.comment_count,
                    updatedTime: e.target.updated_time,
                    authorName: e.target.author.name
                }
            }
        })
        newList.sort((a,b)=> b.voteupCount - a.voteupCount)
        console.log(newList.map(e => e.voteupCount))
        return newList.slice(0,20)
        // fs.writeFileSync('./output.json', JSON.stringify(allList))
    }
    json2md (json) {
        let arr = []
        for (let i = 0; i < json.length; i++) {
            let item = json[i]
            let str = `${i + 1}  [${item.title}](${item.url})  
获赞数： ${String(item.voteupCount).padEnd(10,' ')}   作者： ${item.authorName}  
    
    
      
  
`
            arr.push(str)
        }
        fs.writeFileSync(path.join(process.cwd(),'/output.md'), arr.join(''))
        console.log('.md file read over')
    }
}

let s = new ScriptClass()
// s.index()

module.exports = Zhihu
