'use strict'
const fetch = require('../../app/util/fetch')
const fs = require('fs')
const path = require('path')
const Controller = require('egg').Controller
const {downloadFile, downloadFile2, makeDir, timeout} = require('../../app/util/util')
const {dateFormat} = require('../../app/util/date-time-utils')
const {geFileList} = require('../../app/util/zip-file')
const MysqlUtil = require('../../app/util/mysql')
class Zhihu {
    outputDir = '/egg-example-xyh-output' + '/zhihu-output'

    async index1 () {
        let topicsData = await this.getTopicsData()
        this.getEssenceData(topicsData)
    }

    async getEssenceData (topicsData) {
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

    async index2 () {
        console.log(process.execPath)
        console.log(process.cwd())
        try {
            let jsonList = this.getList()
            this.json2md(jsonList)
        } catch (e) {
            console.log(e)
        }
    }
    getList() {
        let list = geFileList(path.join(this.outputDir, '/essenceAnswer'))
        let allList = []
        for(let i = 0;i<list.length;i++) {
            console.log(`------ ${i}/${list.length}-------`)
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
        fs.writeFileSync(path.join(this.outputDir, '/essenceAnswerList.json'), JSON.stringify(newList))
        return newList
    }
    json2md (json, fileName) {
        let arr = []
        for (let i = 0; i < json.length; i++) {
            let item = json[i]
            let str = `${i + 1}  [${item.title}](${item.url})  
赞同数： ${((item.voteupCount/10000).toFixed(1) *1 + '万').padEnd(10,' ')}   作者： ${item.authorName}  
    
    
      
  
`
            arr.push(str)
        }
        fs.writeFileSync(path.join(this.outputDir,`/${fileName}.md`), arr.join(''))
        console.log('.md file read over')
    }

    async createTableTopics () {
        try{
            // 创建表
            let mysqlInstance = new MysqlUtil('xyh_test')
            let res = await mysqlInstance.query(`
                CREATE TABLE t_topics(id int AUTO_INCREMENT,url VARCHAR(255),PRIMARY KEY(id))
              `)
            console.log(res)
        } catch (e) {
        }
    }
    async topicsJson2sql () {
        let data = await this.getTopicsData()
        console.log(data.length)
        let mysql = new MysqlUtil('xyh_test')
        let instance = mysql.instance
        instance.connect()
        for(let i = 0;i<data.length;i++) {
            var  addSql = 'INSERT INTO t_topics(id,url) VALUES(0,?)';
            var  addSqlParams = [data[i]];
            await new Promise((resolve => {
               instance.query(addSql, addSqlParams,(err, res) =>{
                   resolve()
               })
            }))
            console.log(`${i}/${data.length}`)
        }
        instance.end()
    }
    async createTableEssenceAnswer (tableName = 't_answer_10000') {
        try{
            // 创建表
            let mysqlInstance = new MysqlUtil('xyh_test')
            let res
            try{
                res = await mysqlInstance.query(`
                CREATE TABLE ${tableName}(
                     answer_id BIGINT PRIMARY KEY,
                     content MEDIUMTEXT,
                     url text,
                     type text,
                     title text,
                     voteup_count BIGINT,
                     comment_count BIGINT,
                     updated_time DATETIME,
                     created_time DATETIME,
                     author_name text,
                     author_img text,
                     excerpt TEXT,
                     question_id BIGINT,
                     headline LONGTEXT
                    )
              `)
            }catch (e) {
                console.log(e)
            }
            console.log(res)
        } catch (e) {
        }
    }

    combineAnswer (e) {
        let item
        if(e.target.type === 'article') { // 文章
            item =  {
                type: e.target.type,
                title: e.target.title,
                url: e.target.url,
                voteup_count: e.target.voteup_count,
                comment_count: e.target.comment_count,
                updated_time: e.target.updated,
                created_time: e.target.created,
                author_name: e.target.author.name,
                author_img: e.target.author.avatar_url_template,
                excerpt: e.target.excerpt,
                content: e.target.content,
                answer_id: e.target.id,
                headline: e.target.author.headline
            }
        } else {
            item = {
                type: e.target.type,
                title: e.target.question.title,
                url: `https://www.zhihu.com/question/${e.target.question.id}/answer/${e.target.id}`,
                voteup_count: e.target.voteup_count,
                comment_count: e.target.comment_count,
                updated_time: e.target.updated_time,
                created_time: e.target.created_time,
                author_name: e.target.author.name,
                author_img: e.target.author.avatar_url_template,
                excerpt: e.target.excerpt,
                content: e.target.content,
                answer_id: e.target.id,
                question_id: e.target.question.id,
                headline: e.target.author.headline
            }
        }
        return item
    }

    async essenceAnswer2sql () {

        let mysql = new MysqlUtil('xyh_test')
        let gtCount = 1000
        let sqlTableName = `t_answer_${gtCount}`
        let instance = mysql.instance
        instance.connect()

        let list = geFileList(path.join(this.outputDir, '/essenceAnswer'))
        let listIndex = await new Promise((resolve => {
            instance.query(`select idx from t_answer_progress_index WHERE table_name = '${sqlTableName}'`,(err, res) =>{
                if(err) {
                    console.log(err)
                }
                resolve(res[0].idx || 0)
            })
        }))
        for(let i = 0;i<list.length;i++) {
            if(i < listIndex) {
                continue
            }
            let time1 = Date.now()
            // 记录进度
            let  addSql = `replace INTO t_answer_progress_index(table_name, idx) VALUES(?,?)`;
            let  addSqlParams = [sqlTableName, i];
            await new Promise((resolve => {
                instance.query(addSql, addSqlParams,(err, res) =>{
                    if(err) {
                        console.log(err)
                    }
                    resolve()
                })
            }))

            let data = JSON.parse(fs.readFileSync(list[i].path))
            let requestArr = []
            for(let i2 = 0;i2<data.length;i2++) {
                let e = data[i2]
                let item = this.combineAnswer(e)
                let requestItem = async (item) => {
                    item.updated_time = dateFormat(new Date(item.updated_time * 1000).getTime(),'yyyy-MM-dd hh:mm:ss')
                    item.created_time = dateFormat(new Date(item.created_time * 1000).getTime(), 'yyyy-MM-dd hh:mm:ss')
                    item.title = String(item.title)
                    let {type, title, url,voteup_count,comment_count,updated_time,created_time,author_name,author_img,excerpt,content,answer_id,question_id,headline} = item
                    let  addSql = `replace INTO ${sqlTableName}(type, title, url,voteup_count,comment_count,updated_time,created_time,author_name,author_img,excerpt,content,answer_id,question_id,headline) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                    let  addSqlParams = [type, title, url,voteup_count,comment_count,updated_time,created_time,author_name,author_img,excerpt,content,answer_id,question_id,headline];
                    await new Promise((resolve => {
                        instance.query(addSql, addSqlParams,(err, res) =>{
                            if(err) {
                                console.log(err)
                                let  addSql = 'INSERT INTO t_answer_err(id,i1,i2) VALUES(0,?,?)';
                                let  addSqlParams = [i,i2];
                                instance.query(addSql, addSqlParams,(err, res) =>{
                                })
                            }
                            resolve()
                        })
                    }))
                }
                // > 100000
                if(item.voteup_count >= gtCount) {
                    requestArr.push(()=> {
                        return requestItem(item)
                    })
                }
                // console.log(`内：${i2}/${data.length} ---------- 外：${i}/${list.length}`)
            }
            console.log(`${requestArr.length}条数据  ${i}/${list.length}`)
            await Promise.all(requestArr.map(e => e()))
            console.log(`${requestArr.length}条数据  耗时${(Date.now()-time1) / 1000}s-------- ${i}/${list.length}`)
        }
        instance.end()
    }

    async sqlEssenceAnswer2md () {
        let mysqlInstance = new MysqlUtil('xyh_test')
        let res = await mysqlInstance.query(`
                SELECT 
                title,url,voteup_count as voteupCount,author_name as authorName 
                from t_answer_50000 group by answer_id ORDER BY voteup_count DESC 
              `)
        this.json2md(res, 'answer_50000')
    }

    async sqlEssenceAnswerXlsx () {
        const tableName = 't_answer_100000'
        let mysqlInstance = new MysqlUtil('xyh_test')
        let res = await mysqlInstance.query(`
                SELECT 
                title,url,voteup_count as voteupCount,author_name as authorName 
                from ${tableName} group by answer_id ORDER BY voteup_count DESC 
              `)
        this.json2xlsx(res, tableName)
    }

    json2xlsx (json, fileName='test') {
        const xlsx = require('../../app/util/xlsx')
        const data = [['标题','作者','赞同数','链接']]
        json.forEach(e => {
            data.push([e.title,e.authorName,e.voteupCount,e.url])
        })
        var buffer = xlsx.build([ {name: fileName, data} ]) // Returns a buffer
        fs.writeFileSync(path.join(this.outputDir, `/${fileName}1.xlsx`), buffer)
        console.log('.xlsx file read over')
    }


}
// total 553879 462155
let z = new Zhihu()
z.essenceAnswer2sql()
module.exports = Zhihu
