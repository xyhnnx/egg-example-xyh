'use strict';

const Controller = require('egg').Controller;
const fetch = require('../util/fetch')
async function getSearchImg(params = {}) {
  return fetch({
    url: 'https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&ct=201326592&is=&fp=result&queryWord=%E7%BE%8E%E5%A5%B3&cl=2&lm=-1&ie=utf-8&oe=utf-8&adpicid=&st=-1&z=9&ic=0&hd=0&latest=0&copyright=0&s=&se=&tab=&width=0&height=0&face=0&istype=2&qc=&nc=1&fr=&expermode=&force=&gsm=1e&1595420111298=',
    params,
    method: 'get',
    timeout: 3000,
    // headers: {
    // }
  })
}
class NewsController extends Controller {
  async list() {
    const ctx = this.ctx;
    // 示例：请求一个 npm 模块信息
    const result = await getSearchImg({
      word: ctx.query.search,
      rn: 60, // pageSize 最大60
      pn: 0 // 第几个开始跳
    })
    result.data.forEach(e => {
      e.src = e.hoverURL
    })
    console.log('result', result)
    await this.ctx.render('images/list.tpl', { list: result.data });
  }
  async list2() {
    const ctx = this.ctx;
    // 示例：请求一个 npm 模块信息
    const result = await ctx.curl('https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&ct=201326592&is=&fp=result&queryWord=%E7%BE%8E%E5%A5%B3&cl=2&lm=-1&ie=utf-8&oe=utf-8&adpicid=&st=-1&z=9&ic=0&hd=0&latest=0&copyright=0&s=&se=&tab=&width=0&height=0&face=0&istype=2&qc=&nc=1&fr=&expermode=&force=&gsm=1e&1595420111298=', {
      // 自动解析 JSON response
      dataType: 'json',
      // 3 秒超时
      timeout: 3000,
      data: {
        word: ctx.query.search,
        rn: 60, // pageSize
        pn: 0 // 第几个开始跳
      },
    });
    result.data.data.forEach(e => {
      e.src = e.hoverURL
    })
    await this.ctx.render('images/list.tpl', { list: result.data.data });
  }

  async getPageImages() {
    const { ctx } = this;
    // const data = ctx.request.body
    const data = ctx.query;
    // 参数校验
    const paramsList = [ 'search' ]
    let paramsCheck = true;
    for (const item of paramsList) {
      if (!data[item]) {
        paramsCheck = false;
      }
    }
    try {
      // 通过参数检查
      if (paramsCheck) {
        const result = await ctx.service.images.getPageImages(data);
        // 如果要渲染
        await this.ctx.render('images/list.tpl', { list: result.data });
        // ctx.body = {
        //   status: 0,
        //   message: '获取成功',
        //   data: result
        // };
      } else {
        ctx.body = {
          status: 1,
          message: '参数不完整',
          data: null
        };
      }
    } catch (e) {
      ctx.body = {
        status: 1,
        message: '服务器内部错误',
        data: e
      };
    }
  }
  async getPageImages2() {
    const { ctx } = this;
    // const data = ctx.request.body
    const data = ctx.query;
    // 参数校验
    const paramsList = [ 'search' ]
    let paramsCheck = true;
    for (const item of paramsList) {
      if (!data[item]) {
        paramsCheck = false;
      }
    }
    try {
      // 通过参数检查
      if (paramsCheck) {
        const result = await ctx.service.images.getPageImages2(data);
        // 如果要渲染
        // await this.ctx.render('images/list.tpl', { list: result.data });
        ctx.body = {
          status: 0,
          message: '获取成功',
          data: result
        };
      } else {
        ctx.body = {
          status: 1,
          message: '参数不完整',
          data: null
        };
      }
    } catch (e) {
      ctx.body = {
        status: 1,
        message: '服务器内部错误',
        data: e
      };
    }
  }
  async getPageImages3() {
    const { ctx } = this;
    // const data = ctx.request.body
    const data = ctx.query;
    try {
      const result = await ctx.service.images.getPageImages3(data);
      // 如果要渲染
      await this.ctx.render('images/list.tpl', { list: result.data });
    } catch (e) {
      ctx.body = {
        status: 1,
        message: '服务器内部错误',
        data: e
      };
    }
  }
  async getPageImages4() {
    const { ctx } = this;
    // const data = ctx.request.body
    const data = ctx.query;
    try {
      const result = await ctx.service.images.getPageImages4(data);
      // 如果要渲染
      await this.ctx.render('images/list.tpl', { list: result.data });
    } catch (e) {
      ctx.body = {
        status: 1,
        message: '服务器内部错误',
        data: e
      };
    }
  }
  async getZhituAnswerImages() {
    const { ctx } = this;
    // const data = ctx.request.body
    const data = ctx.query;
    // 参数校验
    const paramsList = [ 'topicId' ]
    let paramsCheck = true;
    for (const item of paramsList) {
      if (!data[item]) {
        paramsCheck = false;
      }
    }
    try {
      // 通过参数检查
      if (paramsCheck) {
        const result = await ctx.service.images.getZhituAnswerImages(data);
        // 如果要渲染
        // await this.ctx.render('images/list.tpl', { list: result.data });
        ctx.body = {
          status: 0,
          message: '获取成功',
          data: result
        };
      } else {
        ctx.body = {
          status: 1,
          message: '参数不完整',
          data: null
        };
      }
    } catch (e) {
      ctx.body = {
        status: 1,
        message: '服务器内部错误',
        data: e
      };
    }
  }
}

module.exports = NewsController;
