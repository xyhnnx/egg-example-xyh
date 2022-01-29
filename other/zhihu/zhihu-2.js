const BrowserUtil = require('../../app/util/browser')
const fetch = require('../../app/util/fetch')

const Util = require('../../app/util/util')
const puppeteer = require('puppeteer')
const MysqlUtil = require('../../app/util/mysql')
// 创建表
const createTableEssenceAnswer = async (tableName = 't_zhihu_topics') => {
  try {
    // 创建表
    let mysqlInstance = new MysqlUtil('xyh_test')
    let res
    try {
      res = await mysqlInstance.query(`
                CREATE TABLE ${tableName}(
                     id BIGINT PRIMARY KEY AUTO_INCREMENT,
                     url text,
                     status BIGINT
                    )
              `)
    } catch (e) {
      console.log(e)
    }
    console.log(res)
  } catch (e) {
  }
}
// 创建表 t_topics
// createTableEssenceAnswer()

// 话题广场
async function topics () {
  const browser = await puppeteer.launch({
    headless: false,
    // defaultViewport貌似不起作用
    defaultViewport: {
      width: 2080,
      height: 800
    }
  })
  const page = await browser.newPage()
  await page.goto('https://www.zhihu.com/topics')
  await page.setViewport({width: 1080, height: 1000})
  const topicList = await page.evaluate(() => {
    return [ ...document.querySelectorAll('.zm-topic-cat-item') ].map(e => {
      return {
        label: e.innerText,
        value: e.getAttribute('data-id')
      }
    })
  })
  // window全局注册timeout函数
  await page.exposeFunction('timeout', time =>
    Util.timeout(time)
  )
  for (let i = 0; i < topicList.length; i++) {
    const list = await page.evaluate(async (data) => {
      document.querySelector(`.zm-topic-cat-item[data-id="${data.value}"] a`).click()
      await window.timeout(2000)

      async function loopClickQuerySelector (selector) {
        return new Promise(async (resolve, reject) => {
          let dom = document.querySelector(selector)
          while (dom !== null) {
            // 点击加载更多
            dom.click()
            await window.timeout(1000)
            const t = document.body.clientHeight
            // 页面滚动到底部
            window.scroll({top: t, left: 0, behavior: 'smooth'})
            await window.timeout(1000)
            dom = document.querySelector(selector)
          }
          resolve()
        })
      }

      await loopClickQuerySelector('.zu-button-more[aria-role="button"]')
      return [ ...document.querySelectorAll('.zh-general-list a:not(.follow)') ].map(e => e.href)
    }, topicList[i])
    let mysqlInstance = new MysqlUtil('xyh_test')
    mysqlInstance.connect()
    console.log('list.length', list.length)
    for (let i = 0; i < list.length; i++) {
      let val = list[i]
      let arr = val.split('/')
      let urlId = Number(arr[arr.length - 1])
      const countRes = await mysqlInstance.instanceQuery(`SELECT COUNT(*) FROM t_zhihu_topics WHERE url_id=${urlId}`)
      const currentCount = countRes[0]['COUNT(*)']
      if (currentCount === 0) {
        let addSql = `INSERT INTO t_zhihu_topics(url,status, url_id) VALUES(?,?,?)`
        let res = await mysqlInstance.instanceQuery(addSql, [ val, 0, urlId ])
      }
    }
    mysqlInstance.end()
    console.log('one end')
  }
  await browser.close()
}

// topics()


async function getEssence (id, offset) {
  url = `https://www.zhihu.com/api/v4/topics/${id}/feeds/essence?offset=${offset}&limit=10&include=data[?(target.type=topic_sticky_module)].target.data[?(target.type=answer)].target.content,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp;data[?(target.type=topic_sticky_module)].target.data[?(target.type=answer)].target.is_normal,comment_count,voteup_count,content,relevant_info,excerpt.author.badge[?(type=best_answerer)].topics;data[?(target.type=topic_sticky_module)].target.data[?(target.type=article)].target.content,voteup_count,comment_count,voting,author.badge[?(type=best_answerer)].topics;data[?(target.type=topic_sticky_module)].target.data[?(target.type=people)].target.answer_count,articles_count,gender,follower_count,is_followed,is_following,badge[?(type=best_answerer)].topics;data[?(target.type=answer)].target.annotation_detail,content,hermes_label,is_labeled,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,answer_type;data[?(target.type=answer)].target.author.badge[?(type=best_answerer)].topics;data[?(target.type=answer)].target.paid_info;data[?(target.type=article)].target.annotation_detail,content,hermes_label,is_labeled,author.badge[?(type=best_answerer)].topics;data[?(target.type=question)].target.annotation_detail,comment_count;`
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
      is_end: res.paging.is_end
    }
  } else {
    return false
  }
}

// 回答
async function answers () {
  let mysqlInstance = new MysqlUtil('xyh_test')
  mysqlInstance.connect()
  const countRes = await mysqlInstance.instanceQuery(`SELECT * FROM t_zhihu_topics WHERE status=0 LIMIT 1`)
  const topicItem = countRes[0]
  if (!topicItem) {
    return
  }
  console.log(topicItem)
  const id = topicItem.url_id
  let hasNext = true
  let offset = 0
  while (hasNext) {
    console.log(`id = ${id}`)
    let res = null
    for (let tryCount = 0; tryCount < 3; tryCount++) {
      try {
        res = await getEssence(id, offset)
        break
      } catch (e) {
        console.log(`getEssence第${tryCount + 1}次尝试-${url}---${e}`)
        if (tryCount === 2) {
          // 修改为异常
          await mysqlInstance.instanceQuery(`UPDATE t_zhihu_topics SET status=2 WHERE id = ${topicItem.id}`)
          await mysqlInstance.end()
          return answers()
        }
        await Util.timeout(60000)
      }
    }
    if (res) {
      if (res.is_end) {
        hasNext = false
      } else {
        offset += 10
      }
      for (let i = 0; i < res.data.length; i++) {
        const target = res.data[i].target || {}
        let voteup_count = target.voteup_count
        if (voteup_count < 1000) {
          continue;
        }
        let comment_count = target.comment_count
        let answerId = target.id
        let questionId = (target.question && target.question.id) || null
        const addArr = [ answerId, questionId, voteup_count, comment_count ]
        // if(questionId === null && target.type !== 'article') {
        //   console.log(target)
        // }
        if (!answerId && !questionId) {
          continue;
        }
        // 查询是否存在
        const countRes = await mysqlInstance.instanceQuery(`SELECT COUNT(*) FROM t_zhihu_answers WHERE question_id=${questionId} AND answer_id=${answerId}`)
        const currentCount = countRes[0]['COUNT(*)']
        if (currentCount === 0) { // 不存在则添加
          console.log('INSERT--', addArr)
          let addSql = `INSERT INTO t_zhihu_answers(answer_id,question_id, voteup_count,comment_count) VALUES(?,?,?,?)`
          let res = await mysqlInstance.instanceQuery(addSql, addArr)
        } else {
          console.log('UPDATE--', addArr)
          // 修改voteup_count 和 comment_count
          await mysqlInstance.instanceQuery(`UPDATE t_zhihu_answers SET voteup_count=${voteup_count} AND comment_count=${comment_count} WHERE question_id=${questionId} AND answer_id=${answerId}`)
        }
      }
      console.log(res.data.map(e => e.target.id).join(','))
    } else {
      hasNext = false
    }
    if(hasNext === false) {
      // 修改为完成
      await mysqlInstance.instanceQuery(`UPDATE t_zhihu_topics SET status=1 WHERE id = ${topicItem.id}`)
    }
    console.log('hasNext = ', hasNext)
    await Util.timeout(2000)
  }
  await mysqlInstance.end()
  if (hasNext === false) {
    answers()
  }
}

answers()


// 获取潜力问题
async function getPotentialAll () {
  let mysqlInstance = new MysqlUtil('xyh_test')
  mysqlInstance.connect()
  let hasNext = true
  let offset = 0
  while (hasNext) {
    console.log(`offset = ${offset}`)
    let res = null
    for (let tryCount = 0; tryCount < 3; tryCount++) {
      try {
        res = await getPotential(offset)
        break
      } catch (e) {
        console.log(`getPotential第${tryCount + 1}次尝试-${url}---${e}`)
        if (tryCount === 2) {
        }
        await Util.timeout()
      }
    }
    if (res) {
      if (res.is_end) {
        hasNext = false
      } else {
        hasNext = true
        offset += 10
      }
      for (let i = 0; i < res.data.length; i++) {
        const question = res.data[i].question || {}
        const topics = question.topics || []
        for (let j = 0; j < topics.length; j++) {
          const topicId = topics[j].url_token
          const url = `https://www.zhihu.com/topic/${topicId}`
          const addArr = [ url, topicId, 0 ]
          // 查询是否存在
          const countRes = await mysqlInstance.instanceQuery(`SELECT COUNT(*) FROM t_zhihu_topics WHERE url_id=${topicId}`)
          const currentCount = countRes[0]['COUNT(*)']
          if (currentCount === 0) { // 不存在则添加
            console.log('INSERT--', addArr)
            let addSql = `INSERT INTO t_zhihu_topics(url,url_id, status) VALUES(?,?,?)`
            let res = await mysqlInstance.instanceQuery(addSql, addArr)
          } else {
            console.log(`topicId=${topicId}已存在`)
          }
        }
      }
    } else {
      hasNext = false
    }
    console.log('hasNext = ', hasNext)
    await Util.timeout()
  }

  mysqlInstance.end()

}

// 获取潜力问题
async function getPotential (offset = 0) {
  //
  url = `https://www.zhihu.com/api/v4/creators/rank/potential?domain=0&sort_type=all&limit=20&offset=${offset}`
  const res = await fetch({
    url,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'get',
    timeout: 60000
  })
  console.log(res)
  if (res && res.data && res.data.length) {
    let data = res.data.map(e => {
      return {
        ...e
      }
    })
    return {
      data,
      is_end: res.paging.is_end
    }
  } else {
    return false
  }
}

// getPotentialAll()


// https://api.zhihu.com/answers/816451790

//

async function getAnswerInfo (answerId) {
  let res = await fetch({
    url: `https://api.zhihu.com/answers/${answerId}`
  })
  if (res && res.id) {
    const question = res.question || {}
    const author = res.author || {}
    const answer_type = res.answer_type || null
    const answer_id = res.id || null
    const created_time = res.created_time || null
    const updated_time = res.updated_time || null
    const type = res.type || null
    const question_id = question.id || null
    const question_title = question.title || null
    const question_type = question.type || null
    const author_name = author.name || null
    const author_type = author.type || null
    const author_id = author.id || null
    const obj = {
      answer_type,
      answer_id,
      created_time,
      updated_time,
      type,
      question_id,
      question_title,
      question_type,
      author_name,
      author_type,
      author_id
    }
    return obj
  }
}
// getAnswerInfo(816451790)

async function getAnswerInfoAll () {
  let mysqlInstance = new MysqlUtil('xyh_test')
  mysqlInstance.connect()
  const countRes = await mysqlInstance.instanceQuery(`SELECT * FROM t_zhihu_answers WHERE status IS null ORDER BY voteup_count DESC LIMIT 1`)
  const item = countRes[0]
  if (!item) {
    await mysqlInstance.end()
    return
  }
  if(item.voteup_count < 10000) {
    await mysqlInstance.end()
    console.log(`${new Date()}-----------------sleep 10 min-------------------`)
    await Util.timeout(10*60*1000)
    return getAnswerInfoAll()
  }
  const answer_id = item.answer_id
  console.log(`start---answer_id=${answer_id}`)
  let res = null
  let isError = false
  for (let tryCount = 0; tryCount < 3; tryCount++) {
    try {
      res = await getAnswerInfo(answer_id)
      break
    } catch (e) {
      console.log(`getAnswerInfo${tryCount + 1}次尝试--answer_id=${answer_id}---${e}`)
      if (tryCount === 2) {
        isError = true
      }
      await Util.timeout()
    }
  }

  if (res && res.answer_id && !isError) {
    try {
      const fieldArray = ['answer_type','answer_id','created_time','updated_time','type','question_id','question_title','question_type','author_name','author_type','author_id']
      let addSql = `REPLACE INTO t_zhihu_answers_info(${fieldArray.join(',')}) VALUES(${fieldArray.map(e => '?').join(',')})`
      let sqlRes = await mysqlInstance.instanceQuery(addSql, fieldArray.map(e => res[e] || null))
      console.log(`answer_id = ${answer_id} INSERT success voteup_count=${item.voteup_count}`)
    }catch (e) {
      console.log(e)
      isError = true
    }
  }
  if (isError) {
    console.log(`answer_id = ${answer_id} 获取并报存详情失败！！！`)
    // 修改为异常
    await mysqlInstance.instanceQuery(`UPDATE t_zhihu_answers SET status=2 WHERE answer_id = ${answer_id}`)
  } else {
    // 修改为成功
    await mysqlInstance.instanceQuery(`UPDATE t_zhihu_answers SET status=1 WHERE answer_id = ${answer_id}`)
  }
  await mysqlInstance.end()
  getAnswerInfoAll()
}

getAnswerInfoAll()







const sqlEssenceAnswer2md = async () => {
  let mysqlInstance = new MysqlUtil('xyh_test')
  let res = await mysqlInstance.query(`
              SELECT t_zhihu_answers.answer_id,
                     t_zhihu_answers.question_id,
                     t_zhihu_answers.voteup_count,
                     t_zhihu_answers_info.question_title,
                     t_zhihu_answers_info.author_name
              FROM t_zhihu_answers
              INNER JOIN t_zhihu_answers_info
              ON t_zhihu_answers.answer_id = t_zhihu_answers_info.answer_id
              ORDER BY t_zhihu_answers.voteup_count DESC LIMIT 10
              `)

  console.log(res)
  const list = res.map(e => {
    let url
    if(e.answer_id && e.question_id) {
      url = `https://www.zhihu.com/question/${e.question_id}/answer/${e.answer_id}`
    } else {
      url = `http://zhuanlan.zhihu.com/p/${e.answer_id}`
    }

    return {
      title: e.question_title,
      url: url,
      voteupCount: e.voteup_count,
      authorName: e.author_name,
    }
  })
  this.json2md(list, 'top')
}

// sqlEssenceAnswer2md()


const json2md = (json, fileName) => {
  let arr = []
  for (let i = 0; i < json.length; i++) {
    let item = json[i]
    let str = `${i + 1}  [${item.title}](${item.url})  
赞同数： ${((item.voteupCount/10000).toFixed(1) *1 + '万').padEnd(5,' ')}   作者： ${item.authorName}  
    
    
      
  
`
    arr.push(str)
  }
  fs.writeFileSync(path.join('./',`${fileName}.md`), arr.join(''))
  console.log('.md file read over')
}
