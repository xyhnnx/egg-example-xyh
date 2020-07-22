'use strict';

const Controller = require('egg').Controller;

class NewsController extends Controller {
  async list() {
    const ctx = this.ctx;
    // 示例：请求一个 npm 模块信息
    const result = await ctx.curl('https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&ct=201326592&is=&fp=result&cl=2&lm=-1&ie=utf-8&oe=utf-8&adpicid=&st=-1&z=&ic=0&hd=&latest=&copyright=&s=&se=&tab=&width=&height=&face=0&istype=2&qc=&nc=1&fr=&expermode=&force=&pn=180&rn=30&gsm=b4&1585279645461=', {
      // 自动解析 JSON response
      dataType: 'json',
      // 3 秒超时
      timeout: 3000,
      data: {
        word: ctx.query.search,
      },
    });
    result.data.data.forEach(e => {
      e.src = e.thumbURL
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
}

module.exports = NewsController;
