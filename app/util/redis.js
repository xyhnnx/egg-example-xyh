/**
 * @Author: cainsyake
 * @Date:   2019-05-17
 * @Remark: Redis缓存
 */
'use strict';
const Redis = require('ioredis');
const config = {
  port: 9002, // Redis port
  host: 'localhost', // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  db: 0,
};

class RedisUtil {
  constructor() {
    this.instance = new Redis(config);
  }

  // 设置缓存
  async set(...args) {
    return this.instance.set(...args);
  }

  // 获取缓存
  async get(key) {
    return this.instance.get(key);
  }

  // defineCommand
  async defineCommand(...args) {
    return this.instance.defineCommand(...args);
  }

  // 删除
  del(...args) {
    this.instance.del(...args);
  }

  // 将一个或多个值插入到列表头部
  lpush(...args) {
    this.instance.lpush(...args);
  }

  // 在列表中添加一个或多个值
  rpush(...args) {
    this.instance.rpush(...args);
  }

  // 移出并获取列表的第一个元素
  async lpop(...args) {
    return await this.instance.lpop(...args);
  }

  // 移除列表的最后一个元素，返回值为移除的元素。
  async rpop(...args) {
    return await this.instance.rpop(...args);
  }

  // 订阅
  async subscribe(...args) {
    return await this.instance.subscribe(...args);
  }

  // 发布
  async publish(...args) {
    return await this.instance.publish(...args);
  }

  // 监听订阅消息
  on(...args) {
    return this.instance.on(...args);
  }

  // 设置过期时间
  async expire(...args) {
    return await this.instance.expire(...args);
  }

  // 执行自定义指令
  async exec(cmd, ...args) {
    return await this.instance[cmd](...args);
  }
  // 运行lua脚本 {lua脚本，key的数量，key,key2... ，value,value2...}
  // async eval(...args) {
  //   return this.instance.eval(...args);
  // }
}

module.exports = RedisUtil;
