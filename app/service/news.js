// app/service/news.js
'use strict';
const Service = require('egg').Service;
// Redis工具
const RedisUtil = require('../util/redis');
// Redis实例
let redis = null;

class NewsService extends Service {
  async list() {
    if (!redis) {
      redis = new RedisUtil();
      this.logger.info('创建Redis实例');
    }
    const res = await redis.exec('lrange', 'newList', 0, -1);
    const arr = [];
    if (res && res.length) {
      res.forEach(e => {
        const data = JSON.parse(e);
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
      // await redis.exec('hset', 'hash-test', 'title', data.title);
      // const restest1 = await redis.exec('hgetall', 'hash-test'); // 获取所有
      // console.log(restest1, 'res1')
      // const res1 = await redis.exec('hget', 'hash-test', 'title'); // 获取key为title的value

      const res = await redis.exec('lrange', 'newList', 0, -1); // 获取list所有
      const arr = [];
      res.forEach((e, index) => {
        arr.push(`key-${index}`, e);
      });
      // Hmset 命令用于同时将多个 field-value (字段-值)对设置到哈希表中。
      await redis.exec('hmset', 'xyh-hash-1', ...arr);
      const res1 = await redis.exec('hgetall', 'xyh-hash-1'); // 获取所有哈希
      console.log('----------------res1');
      console.log(res1);
    }
  }
}

module.exports = NewsService;
