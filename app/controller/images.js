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
    await this.ctx.render('images/list.tpl', { list: result.data.data });
  }
}

module.exports = NewsController;
