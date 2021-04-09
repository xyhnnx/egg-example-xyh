// app/service/news.js
'use strict';
const Service = require('egg').Service;
const path = require('path');
// const request = require('request');
const fs = require('fs');
const cheerio = require('cheerio');
const fetch = require('../util/fetch');
// 浏览器连接工具`
const BrowserUtil = require('../util/browser');
const { dateFormat } = require('../util/date-time-utils');
const { downloadFile, downloadFile2, makeDir, timeout } = require('../util/util');

// const http = (uri) => {
//   return new Promise((resolve, reject) => {
//     request({
//       uri: uri,
//       method: 'GET'
//     }, (err, response, body) => {
//       if (err) {
//         console.log(err)
//         reject(err)
//       }
//       resolve(body)
//     })
//   })
// }

const Zhihu = require('../methods/zhihu/zhihu.js')
class ImagesService extends Service {
  async test(data) {
    // this.downloadDatabaseJsonImg()
    // this.json2html2pdf()
    new Zhihu().index()
  }
  async json2html2pdf () {
    let {subject} = require('./subject')
    let {writeFile, html2Pdf} = require('./common')
    let articleArr = Object.values(subject)
    let dir1 = `${this.app.appData.outputDir}/article/html`
    let dir2 = `${this.app.appData.outputDir}/article/pdf`
    makeDir(dir1)
    makeDir(dir2)
    for (let i = 0; i < articleArr.length; i++) {
      let htmlSaveUrl = `${dir1}/${i + 1}.html`
      let flag = await writeFile(htmlSaveUrl, articleArr[i])
      if (flag) {
        console.log(`${i + 1}.html写入成功！`)
        try {
          await html2Pdf(__dirname.substr(0, 2) + htmlSaveUrl, `${dir2}`, `${i + 1}`)
          console.log(`${i + 1}.pdf写入成功！`)
        } catch (e) {
          console.log(`${i + 1}.pdf写入失败！--${e}`)
          break
        }
      } else {
        console.log(`${i + 1}.html写入失败！`)
        break
      }
    }
  }
  async downloadDatabaseJsonImg () {
    function getDatabaseArr () {
      console.log()
      let stringData = fs.readFileSync(path.join(__dirname, './database_export.json'), 'utf-8')
      let databaseArr = []
      stringData.split('\n').forEach(e => {
        if (e) {
          databaseArr.push(JSON.parse(e))
        }
      })
      return databaseArr
    }
    let databaseArr = getDatabaseArr().map((e, i) => {
      return {
        url: e.src.replace('1920x1080', 'UHD'),
        fileName: e.createTime.$date.substr(0, 10) + '-' + i,
        fileType: 'jpg'
      }
    })
    let savePath = `wallpapersHDDatabase`
    // 下载文件到本地
    await downloadFile(databaseArr, savePath)
    console.log(databaseArr)
  }
  async getPageImages0(data) {
    console.log('data=', data);
    let returnData;
    // 浏览器
    let browser;
    try {
      // 重新连接至浏览器
      browser = await BrowserUtil.connect('page-image');
    } catch (err) {
      this.logger.info(`连接至浏览器报错: ${JSON.stringify(err)}`);
      try {
        await BrowserUtil.init('page-image');
        browser = await BrowserUtil.connect('page-image');
      } catch (err2) {
        const text = `重启浏览器失败，原因:${JSON.stringify(err2)}`;
        this.logger.info(text);
      }
    }
    const page = await browser.newPage();

    // 打开页面时间
    const startTime = new Date();
    // 渲染URL
    let url = null;
    try {
      // 渲染页JS异常
      page.on('pageerror', async meg => {
        await page.close();
        this.logger.info(meg);
      });
      // 渲染页console事件
      // page.on('console', (msg) => {
      //   msg.args().forEach(msgItem => {
      //     console.log(msgItem._remoteObject.value)
      //   })
      // })

      url = `https://image.baidu.com/search/index?tn=baiduimage&ipn=r&ct=201326592&cl=2&lm=-1&st=-1&fr=&sf=1&fmq=1567133149621_R&pv=&ic=0&nc=1&z=0&hd=0&latest=0&copyright=0&se=1&showtab=0&fb=0&width=&height=&face=0&istype=2&ie=utf-8&sid=&word=${data.search}`;
      console.log(`渲染URL：${url}`);
      // await page.setCookie({name: 'token', value: JSON.stringify(token), url: config.webUrl})
      // 可设置页面宽高大一些；就会多获取数据
      page.setViewport({ width: 2000, height: 1000 });
      await page.goto(url, { timeout: 60000, waitUntil: 'networkidle2' });
      returnData = await page.evaluate(() => {
        // eslint-disable-next-line no-undef
        const imgdom = Array.from(document.getElementsByTagName('img'));
        const arr = [];
        imgdom.forEach(e => {
          const src = e.getAttribute('src');
          if (src.startsWith('http')) {
            arr.push({
              src
            });
          }
        });
        return arr;
      });
      // 等待页面渲染完成 #render-finish
      // await page.waitForSelector('#renderFinish', {visible: true, timeout: data.timeout})
      // 生成pdf
      // await page.pdf()
      // 关闭页面
      await page.close();
      // 断开浏览器连接
      browser.disconnect();
    } catch (err) {
      this.logger.error(`page发生错误：${url}`);
      // 关闭页面
      await page.close();
      // 断开浏览器连接
      browser.disconnect();
      // 抛出异常
      throw err;
    }
    console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL：${url}`);
    return {
      data: returnData
    };
  }
  // 获取一杯电影
  async getPageImages2(data) {
    let returnData;

    // 打开页面时间
    const startTime = new Date();
    // 渲染URL
    const url = 'http://100.xiaobeidy.com';
    try {
      // 使用request.js库发送get请求
      // const html = await http(url)
      const html = await fetch({
        url,
        params: {
          s: data.search
        },
        method: 'get',
        timeout: 60000,
      });
      // 载入并初始化cheerio
      const $ = cheerio.load(html);
      // 取出目标节点，即带article-list-link css类的<a>
      const linksDom = $('.excerpt .focus');
      const fetchPages = [];
      // // 遍历dom集数组
      linksDom.each((index, item) => {
        fetchPages.push(
          fetch({
            url: $(item).attr('href'),
            method: 'get',
            timeout: 600000,
          })
        );
      });
      console.log(`开始请求${fetchPages.length}个页面`);
      const pageDetailArr = await Promise.all(fetchPages);
      console.log(`请求${pageDetailArr.length}个页面结束`);
      const dataArr = pageDetailArr.map((html, index) => {
        try {
          console.log(`正在爬取第${index + 1}个页面数据`);
          const $ = cheerio.load(html);
          // 取出目标节点，即带article-list-link css类的<a>
          const $mainDom = $($('.content-wrap')[0]);
          const webUrl = $mainDom.find('.article-title').find('a').attr('href');
          const title = $mainDom.find('.article-title').text();
          const time = $mainDom.find('.article-meta .item').text().slice(0, 10);
          const imgSrc = $mainDom.find('.article-content img').eq(1).attr('src');
          const resource = [];
          $($mainDom.find('.article-content').html().split('<hr>')[1]).find('a').each((index, item) => {
            resource.push({
              src: $(item).attr('href'),
              text: $(item).parent().text()
            });
          });

          return {
            webUrl,
            title,
            time,
            imgSrc,
            resource
          };
        } catch (e) {
          console.log(`爬取第${index + 1}个页面出错`);
          return false;
        }
      });
      returnData = dataArr.filter(e => !!e);
    } catch (err) {
      this.logger.error(`page发生错误：${url}`);
      // 关闭页面
      // 断开浏览器连接
      // 抛出异常
      throw err;
    }
    console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL：${url}`);
    return {
      data: returnData
    };
  }

  // 下载bing图片
  async getPageImages3(data) {
    console.log('data=', data);
    let returnData;
    // 浏览器
    // 渲染URL
    // const prefix = `https://6d65-me-oacid-1300610701.tcb.qcloud.la`;
    const prefix = `http://cdn.mrabit.com`;

    try {
      let stop = false;
      let nowTime = new Date().getTime();
      let arr = []
      while (!stop) {
        let timeStr = dateFormat(nowTime, 'yyyy-MM-dd')
        // let url = `${prefix}/BING/${timeStr}.jpg`
        let url = `${prefix}/1920.${timeStr}.jpg`
        arr.push({
          src: url,
          label: timeStr,
          url,
          fileName: `${timeStr}`
        })
        nowTime = nowTime - (24 * 60 * 60 * 1000)
        if (nowTime < new Date('2016-09-23').getTime()) {
          stop = true
        }
      }
      // 下载文件到本地
      await downloadFile(arr)
      // returnData = arr
    } catch (err) {
      this.logger.error('getPageImages3发生错误');
    }
    return {
      data: returnData
    };
  }

  // 下载bing图片
  async getPageImages4(data) {
    console.log('data4=', data);
    let returnData = []
    this.downImage2()
    return {
      data: returnData
    };
  }

  async downImage1 () {
    const url = `https://uploadbeta.com/api/pictures/random/?key=%E6%8E%A8%E5%A5%B3%E9%83%8E&t=${new Date().getTime()}`
    try {
      // for (let i = 0; i < 10; i++) {
      //
      // }

      console.log('saveImg--------------')
      const fs = require('fs');
      const http = require('http');
      const fetch = require('../util/fetch')
      let res = await fetch({
        url,
        timeout: 0
      })
      console.log('res----', res)
      if (res) {
        makeDir(this.app.appData.outputDir)
        let savePath = `${this.app.appData.outputDir}/${new Date().getTime()}.jpg`
        const writer = fs.createWriteStream(savePath);
        res.pipe(writer);
        // fs.writeFile(savePath, res, 'binary', function (err) {
        //   console.log('保存图片成功' + savePath)
        // })
      }

      console.log(this.app.appData.outputDir)
      makeDir(this.app.appData.outputDir)
      this.saveImg(url, `${this.app.appData.outputDir}/${new Date().getTime()}.jpg`)
    } catch (err) {
      this.logger.error('downImage1');
    }
  }
  async downImage2 () {
    for (let i = 0; i < 5000; i++) {
      let list = []
      let name = Date.now()
      list.push(
        {
          url: `https://uploadbeta.com/api/pictures/random/?key=%E6%8E%A8%E5%A5%B3%E9%83%8E&t=${name}`,
          fileName: name,
          fileType: 'png'
        }
      )
      await downloadFile2(list, 'mm3', false)
      await timeout(100)
    }
  }
  async saveImg(url, path) {

  }
  /* ----------------------获取知乎作答图片-start--------------- */
  // 获取话题下面的精选 count个问题和回答
  async getZhituQuestions (topicId, count = 35) {
    // 渲染URL
    const url = `https://www.zhihu.com/api/v4/topics/${topicId || '19602490'}/feeds/essence`;
    const getData = async (offset, limit) => {
      const res = await fetch({
        url,
        params: {
          include: 'data[?(target.type=topic_sticky_module)].target.data[?(target.type=answer)].target.content,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp;data[?(target.type=topic_sticky_module)].target.data[?(target.type=answer)].target.is_normal,comment_count,voteup_count,content,relevant_info,excerpt.author.badge[?(type=best_answerer)].topics;data[?(target.type=topic_sticky_module)].target.data[?(target.type=article)].target.content,voteup_count,comment_count,voting,author.badge[?(type=best_answerer)].topics;data[?(target.type=topic_sticky_module)].target.data[?(target.type=people)].target.answer_count,articles_count,gender,follower_count,is_followed,is_following,badge[?(type=best_answerer)].topics;data[?(target.type=answer)].target.annotation_detail,content,hermes_label,is_labeled,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,answer_type;data[?(target.type=answer)].target.author.badge[?(type=best_answerer)].topics;data[?(target.type=answer)].target.paid_info;data[?(target.type=article)].target.annotation_detail,content,hermes_label,is_labeled,author.badge[?(type=best_answerer)].topics;data[?(target.type=question)].target.annotation_detail,comment_count;',
          offset,
          limit // 这个最多10条
        },
        method: 'get',
        timeout: 60000,
      });
      let answerList = []
      if (res && res.data && res.data.length) {
        res.data.forEach(e => {
          // 点赞数大约 10000
          if (e.target.voteup_count > 0) {
            answerList.push({
              questionId: e.target.question.id,
              answerId: e.target.id,
              answerUpNum: e.target.voteup_count
            })
          }
        })
      }
      return answerList
    }
    let arr = []
    let len = Math.ceil(count / 10)
    for (let i = 0; i < len; i++) {
      let offset = 10 * i
      let limit = 10
      if (i === len - 1 && count % 10 !== 0) {
        limit = count % 10
      }
      arr.push(getData(offset, limit))
    }
    let allResArr = await Promise.all(arr)
    let allQuesIds = []
    allResArr.forEach(e => {
      allQuesIds.push(...e)
    })
    return allQuesIds // Array.from(new Set(allQuesIds))
  }
  // 获取知乎图片
  async getZhituAnswerItemImage(data) {
    let returnData;
    // 打开页面时间
    const startTime = new Date();
    // 渲染URL
    const url = `https://www.zhihu.com/question/${data.questionId}/answer/${data.answerId}`;
    try {
      // 使用request.js库发送get请求
      // const html = await http(url)
      const html = await fetch({
        url,
        params: {},
        method: 'get',
        timeout: 60000,
      });
      // 载入并初始化cheerio
      returnData = html
      const $ = cheerio.load(html);
      let $box = $('.QuestionAnswer-content').eq(0);
      let $info = $box.find('.AnswerItem').eq(0);
      let dataZop = JSON.parse($info.attr('data-zop'));
      // let dataZaExtraModule = JSON.parse($info.attr('data-za-extra-module'));
      let answerId = dataZop.itemId;
      let questionName = dataZop.title;
      let authorName = dataZop.authorName;
      let questionId //  = dataZaExtraModule.card.content.parent_token;
      // 点赞数
      let answerUpNum //  = dataZaExtraModule.card.content.upvote_num;
      // NumberBoard-itemValue 问题关注数
      let questionFollowNum = $('.NumberBoard-itemValue').eq(0).attr('title');
      let questionReadNum = $('.NumberBoard-itemValue').eq(1).attr('title');
      let authorImg = $box.find('.AuthorInfo-avatar').eq(0).attr('src');
      let $domBadgeText = $box.find('.AuthorInfo-badgeText').eq(0);
      let authorBadgeText = $domBadgeText && $domBadgeText.text();
      let answerImgList = [];
      let imgDomlist = $box.find('.RichContent--unescapable').eq(0).find('img');
      let editTimeText = $box.find('.ContentItem-time').eq(0).find('span').eq(0).text();
      for (let i = 0; i < imgDomlist.length; i++) {
        let imgDomItem = $(imgDomlist[i]);
        // 原始图片url
        let originalUrl = imgDomItem.attr('data-original');
        if (originalUrl) {
          answerImgList.push(originalUrl);
        }
      }
      let saveData = {
        questionId: data.questionId,
        questionName,
        questionFollowNum, // 问题关注数
        questionReadNum, // 问题浏览量
        answerId,
        answerUpNum: data.answerUpNum, // 回答点赞数
        answerImgList,
        authorName,
        authorImg,
        authorBadgeText,
        editTimeText
      };
      returnData = saveData;
    } catch (err) {
      this.logger.error(`page发生错误：${url}`);
      // 关闭页面
      // 断开浏览器连接
      // 抛出异常
      throw err;
    }
    console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL：${url}`);
    return returnData
  }

  // 获取知乎作答图片
  async getZhituAnswerImages(data) {
    let returnData;
    // 打开页面时间
    const startTime = new Date();
    try {
      let questionAnswerIds = await this.getZhituQuestions(data.topicId, 50)
      let allRes = await Promise.all(
        questionAnswerIds.map(e => {
          return this.getZhituAnswerItemImage(e)
        })
      )
      returnData = allRes
    } catch (err) {
      this.logger.error(`page发生错误`);
      throw err;
    }
    console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL`);
    return {
      data: returnData
    }
  }
  /* ----------------------获取知乎作答图片end--------------- */
  /* ----------------------获取豆瓣电影 start--------------- */
  async getMovieList (data) {
    let returnData;
    // 打开页面时间
    const startTime = new Date();
    // 渲染URL
    const url = `https://movie.douban.com/top250`;
    try {
      console.log('------1', data)
      const fetchParams = {
        url,
        params: {
          start: data.start
        },
        method: 'get',
        timeout: 60000,
      }
      console.log('------2')
      const html = await fetch(fetchParams);
      console.log('------3')
      console.log(html)
      // 载入并初始化cheerio
      const $ = cheerio.load(html);
      let $list = $('.grid_view .item')
      console.log($list.length)
      let saveData = []
      for (let i = 0; i < $list.length; i++) {
        console.log(`------------------第${i + 1}个------------`)
        let $item = $($list[i])
        let url = $item.find('.info a').attr('href');
        let index = Number($item.find('.pic em').text())
        let coverImgSrc = $item.find('.pic img').attr('src')
        let name = $item.find('.info a span').eq(0).text()
        let totalName = $item.find('.info a').text()
        let infoList = $item.find('.info .bd p').eq(0).text().split('\n')
        let actorText = infoList[1].trim()
        let typeText = infoList[2].trim()
        let score = $item.find('.info .rating_num').text()
        let commitCount = $item.find('.star span').last().text()
        let oneWord = $item.find('.info .quote .inq').text()
        let detailData = {}
        detailData = await this.getMovieDetail({
          url
        })
        await timeout(1000 + i)

        saveData.push({
          url,
          movieId: url.split('/')[url.split('/').length - 2],
          index,
          coverImgSrc,
          name,
          totalName,
          actorText,
          typeText,
          score,
          commitCount,
          oneWord,
          ...detailData
        })
      }
      returnData = saveData;
    } catch (err) {
      this.logger.error(`---page发生错误--：${url}`);
      // 关闭页面
      // 断开浏览器连接
      // 抛出异常
      throw err;
    }
    console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL：${url}`);
    return returnData
  }

  async getMovieDetail (data) {
    let returnData;
    // 打开页面时间
    const startTime = new Date();
    // 渲染URL
    const url = data.url
    console.log('data.url', url)
    try {
      // 使用request.js库发送get请求
      // const html = await http(url)
      const html = await fetch({
        url,
        params: {
        },
        method: 'get',
        timeout: 60000,
      });
      // 载入并初始化cheerio
      const $ = cheerio.load(html);
      let saveData = {
        desc: $('#link-report span[property]').text().replace(/\s+/g, "")
      }
      returnData = saveData;
    } catch (err) {
      this.logger.error(`page发生错误：${url}`);
      // 关闭页面
      // 断开浏览器连接
      // 抛出异常
      throw err;
    }
    console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL：${url}`);
    return returnData
  }
  // 获取豆瓣电影
  async getDoubanMovie(data) {
    if (this.bingJson2Md) {
      this.bingJson2Md()
      return
    }
    // 先生成json文件；再把json转md
    if (this.json2md) {
      this.json2md()
      return
    }
    let returnData = []
    // 打开页面时间
    const startTime = new Date();
    try {
      let arr = []
      for (let i = 0; i < 1; i += 25) {
        arr.push(
          this.getMovieList({
            start: i
          })
        )
      }
      let res = await Promise.all(arr)
      if (res && res.length) {
        res.forEach(e => {
          if (e.length) {
            returnData.push(...e)
          }
        })
      }
      makeDir(`${this.app.appData.outputDir}/top250`)
      fs.writeFile(`${this.app.appData.outputDir}/top250/output.json`, JSON.stringify(returnData), function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log('写入成功！！！')
        }
      });
    } catch (err) {
      this.logger.error(`page发生错误`);
      throw err;
    }
    console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL`);
    return {
      data: returnData
    }
  }
  json2md () {
    fs.readFile(`${this.app.appData.outputDir}/top250/output.json`, "utf-8", (err, data) => {
      let json = JSON.parse(data);
      let arr = []
      for (let i = 0; i < json.length; i++) {
        let item = json[i]
/*      let str = `<h5>${item.index}. ${item.name}</h5>
        <table border="0">
            <tr>
                <td valign="top">
                    <img style="display: block;width: 100%;" src="${item.coverImgSrc}" alt="">
                </td>
                <td valign="top">
                    <p> ${item.actorText}</p>
                    <p>${item.typeText}  </p>
                    <p>${item.score}评分: ${item.commitCount}</p>
                </td>
            </tr>
        </table>
        <p>${item.desc}</p>
        <hr>`
******/

        let str = `## ${item.index}. ${item.name}
![${item.name}](${item.coverImgSrc})  
${item.actorText}  
${item.typeText}  
${item.score}评分 ${item.commitCount}  
\`${item.oneWord}\`
> ${item.desc}  
------
`
        arr.push(str)
      }
      fs.writeFile(`${this.app.appData.outputDir}/top250/output.md`, arr.join(''), function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log('md写入成功！！！')
        }
      });
    })
  }
  /* ----------------------获取豆瓣电影 end--------------- */

  // bing壁纸
  async bingWallpapers () {
    const fetchParams = {
      // 第几页 / 一页几条数据
      url: 'https://blog.mrabit.com/bing/get_img_lists/1/2000',
      params: {},
      method: 'get',
      timeout: 60000,
    }
    const res = await fetch(fetchParams);
    makeDir(`${this.app.appData.outputDir}/bing`)
    fs.writeFile(`${this.app.appData.outputDir}/bing/imageList.json`, JSON.stringify(res.result.img_list), function(err) {
      if (err) {
        console.log(err)
      } else {
        console.log('imageList.Json写入成功！！！')
      }
    });
  }
  bingJson2Md () {
    fs.readFile(`${this.app.appData.outputDir}/bing/imageList.json`, "utf-8", (err, data) => {
      let json = JSON.parse(data);
      let arr = []
      for (let i = 0; i < json.length; i++) {
        if (i > 10) break;
        let item = json[i]
        let str = `![${item.img_time}](${item.img_url.replace('http', 'https')} "${item.img_time}")  
\`${item.img_title}\`  
`
        arr.push(str)
      }
      fs.writeFile(`${this.app.appData.outputDir}/bing/output2.md`, arr.join(''), function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log('bing / output.md写入成功！！！')
        }
      });
    })
  }
}


module.exports = ImagesService;
