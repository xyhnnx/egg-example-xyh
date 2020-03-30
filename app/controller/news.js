'use strict';

const Controller = require('egg').Controller;

class NewsController extends Controller {
  // new 列表
  async list() {
    const ctx = this.ctx;
    const page = ctx.query.page || 1;
    const newsList = await ctx.service.news.list(page);
    // console.log(this.ctx.isIOS)
    console.log(this.app.appData);
    await this.ctx.render('news/list.tpl', { list: newsList });
  }

  // new 详情
  async detail() {
    const ctx = this.ctx;
    const id = ctx.query.newId || 0;
    let data = null;
    if (id) {
      data = await ctx.service.news.detail(id);
    }
    await this.ctx.render('news/detail.tpl', { detail: data });
  }

  async editData() {
    const ctx = this.ctx;
    const req = ctx.request.body
    await ctx.service.news.editData(req);
    ctx.body = {
      status: 0,
      message: 'success',
    };
  }
}

module.exports = NewsController;
