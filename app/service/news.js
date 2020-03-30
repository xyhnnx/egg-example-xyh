// app/service/news.js
'use strict';
const Service = require('egg').Service;
// Redis工具
const RedisUtil = require('../util/redis');
// Redis实例
let redis = null;

class NewsService extends Service {
  async list() {
    // read config
    // const { serverUrl, pageSize } = this.config.news;
    //
    // // use build-in http client to GET hacker-news api
    // const { data: idList } = await this.ctx.curl(`${serverUrl}/topstories.json`, {
    //   data: {
    //     orderBy: '"$key"',
    //     startAt: `"${pageSize * (page - 1)}"`,
    //     endAt: `"${pageSize * page - 1}"`,
    //   },
    //   dataType: 'json',
    // });
    //
    // // parallel GET detail
    // const newsList = await Promise.all(
    //   Object.keys(idList).map(key => {
    //     const url = `${serverUrl}/item/${idList[key]}.json`;
    //     return this.ctx.curl(url, { dataType: 'json' });
    //   })
    // );
    // return newsList.map(res => res.data);
    if (!redis) {
      redis = new RedisUtil();
      this.logger.info('创建Redis实例');
    }
    const res = await redis.exec('lrange', 'newList', 0, -1);
    const arr = []
    if (res && res.length) {
      res.forEach(e => {
        const data = JSON.parse(e)
        arr.push({
          label: data.title,
          value: data.content,
        });
      });
    }
    return arr;
  }

  async detail(id) {
    console.log(id);
  }

  async editData(data) {
    if (data) { // 这里将数据存入redis
      // 创建Redis实例
      if (!redis) {
        redis = new RedisUtil();
        this.logger.info('创建Redis实例');
      }
      // redis.del('newList');
      redis.rpush('newList', JSON.stringify(data));
      // const res = await redis.exec('lrange', 'newList', 0, -1);
      // console.log(res);
    }
  }
}

module.exports = NewsService;
