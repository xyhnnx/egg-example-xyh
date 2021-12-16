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
          return answers()
        }
        await Util.timeout()
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
        let comment_count = target.comment_count
        let answerId = target.id
        let questionId = (target.question && target.question.id) || null
        const addArr = [ answerId, questionId, voteup_count, comment_count ]
        // if(questionId === null && target.type !== 'article') {
        //   console.log(target)
        // }
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
      // 修改为完成
      await mysqlInstance.instanceQuery(`UPDATE t_zhihu_topics SET status=1 WHERE id = ${topicItem.id}`)
    }
    console.log('hasNext = ', hasNext)
    await Util.timeout()
  }
  await mysqlInstance.end()
  if (hasNext === false) {
    answers()
  }
}

answers()
