const assert = require('assert')
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
// Database Name
const defaultDbName = 'xyh_test';

const envEnum = {
  analysis_test: {
    url: 'mongodb://analysisTest:Analysis2015@8.129.70.148:34352/analysis_test'
  },
  xyh_test: {
    url: 'mongodb://localhost:27017/xyh_test'
  },
  analysis_prod: {
  // 对密码中的@使用16进制进行URL编码：%40
    url: `mongodb://analysis:Analysis!#%402019@8.129.130.189:34352/analysis`
  }
}




class MongoUtil {
  constructor (env) {
    // if (instance) return instance
    let args = envEnum[env] || envEnum['xyh_test']
    this.client = new MongoClient(args.url)
  }
  // 插入多条数据
  async insertMany(arr, collectionName) {
    let res
    try {
      await this.client.connect()
      const db = this.client.db();
      const collection = db.collection(collectionName);
      res = await collection.insertMany(arr)
    } finally {
      this.client.close();
    }
    return res
  }
  // 查询数据
  async find(whereObj, collectionName) {
    let res
    try {
      await this.client.connect()
      const db = this.client.db();
      const collection = db.collection(collectionName);
      res = await collection.find(whereObj).toArray()
    } finally {
      this.client.close();
    }
    return res
  }
  // 更新一条数据
  async updateOne(whereObj, updateObj, collectionName) {
    let res
    try {
      await this.client.connect()
      const db = this.client.db();
      const collection = db.collection(collectionName);
      res = await collection.updateOne(whereObj, {$set: updateObj})
    } finally {
      this.client.close();
    }
    return res
  }
}

let f1 = async () => {
  let m = new MongoUtil()
  let res
  try{
    res = await m.insertMany([{test:1}],'t_answer_all_completed')
  } catch (e) {
    console.log(e,'xxx')
  }
  console.log(res)
}
let f2 = async () => {
  let m = new MongoUtil()
  let res
  try{
    res = await m.find({},'t_answer_all_completed')
  } catch (e) {
    console.log(e)
  }
  console.log(res)
}
let f3 = async () => {
  let m = new MongoUtil()
  let res
  try{
    res = await m.updateOne({},{a: 9},'t_answer_all_completed')
  } catch (e) {
    console.log(e)
  }
  console.log(res)
}

module.exports  = MongoUtil


