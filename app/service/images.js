// app/service/news.js
'use strict';
const Service = require('egg').Service;

class ImagesService extends Service {
  async getPageImages(data) {
    return { data };
  }
}

module.exports = ImagesService;
