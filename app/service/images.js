// app/service/news.js
'use strict';
const Service = require('egg').Service;
// const path = require('path');
// const request = require('request');
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

class ImagesService extends Service {
  async getPageImages(data) {
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
    const prefix = `https://6d65-me-oacid-1300610701.tcb.qcloud.la`;
    try {
      let stop = false;
      let nowTime = new Date().getTime();
      let arr = []
      while (!stop) {
        let timeStr = dateFormat(nowTime, 'yyyyMMdd')
        let url = `${prefix}/BING/${timeStr}.jpg`
        arr.push({
          src: url,
          label: timeStr,
          url
        })
        nowTime = nowTime - (24 * 60 * 60 * 1000)
        if (nowTime <= new Date('2019-01-01').getTime()) {
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
              answerId: e.target.id
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
  // 获取知乎作答图片
  async getZhituAnswerImages(data) {
    let returnData;

    // 打开页面时间
    const startTime = new Date();
    try {
      let questionAnswerIds = await this.getZhituQuestions(data.topicId, 50)
      returnData = questionAnswerIds
    } catch (err) {
      this.logger.error(`page发生错误`);
      throw err;
    }
    console.log(`页面耗时: ${new Date() - startTime}ms，渲染页URL`);
    return {
      data: returnData
    };
  }
}

module.exports = ImagesService;
