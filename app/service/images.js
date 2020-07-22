// app/service/news.js
'use strict';
const Service = require('egg').Service;
const path = require('path');
// 浏览器连接工具
const BrowserUtil = require('../util/browser');

class ImagesService extends Service {
  async getPageImages(data) {
    console.log('data=',data)
    let returnData;
    // 浏览器
    let browser;
    try {
      // 重新连接至浏览器
      browser = await BrowserUtil.connect('page-image');
    } catch (err) {
      this.logger.info(`连接至浏览器报错: ${JSON.stringify(err)}`);
      try {
        this.logger.info('重启浏览器成功');
        await BrowserUtil.init('wrongTopic');
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

      url = 'https://image.baidu.com/search/index?tn=baiduimage&ipn=r&ct=201326592&cl=2&lm=-1&st=-1&fr=&sf=1&fmq=1567133149621_R&pv=&ic=0&nc=1&z=0&hd=0&latest=0&copyright=0&se=1&showtab=0&fb=0&width=&height=&face=0&istype=2&ie=utf-8&sid=&word=%E5%A3%81%E7%BA%B8';
      console.log(`渲染URL：${url}`);
      // await page.setCookie({name: 'token', value: JSON.stringify(token), url: config.webUrl})
      await page.goto(url, { timeout: 60000 });
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
    }
  }
}

module.exports = ImagesService;
