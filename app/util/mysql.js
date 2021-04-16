var mysql = require('mysql')
const config = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  port: '3306',
  charset: 'utf8mb4'
}
const config0 = {
  host: '192.168.0.20',
  user: 'root',
  password: 'dongni',
  port: '50101'
}
let instance

class MysqlUtil {
  constructor (database) {
    // if (instance) return instance
    if (database) {
      config.database = database
    }
    instance = mysql.createConnection(config)
    this.instance = instance
  }

  // 创建数据库
  async createBaseData (baseDataName) {
    if(!baseDataName) {
      return
    }
    let sql = `CREATE DATABASE ${baseDataName}`
    return new Promise(((resolve, reject) => {
      this.instance.query(sql, (err, res) => {
        if (err) {
          reject(err)
        } else {
          console.log('创建数据库成功',res)
          resolve()
        }
      })
    }))

  }

  async query (...args) {
    return new Promise(((resolve, reject) => {
      this.instance.connect()
      this.instance.query(...args,  (err,result) => {
        if(err){
          console.log(err)
          resolve(false)
        } else {
          resolve(result)
        }
        this.instance.end()
      })
    }))
  }
  connect () {
    this.instance.connect()
  }
  end () {
    this.instance.end()
  }
}

async function f1 () { // 创建数据库
  let mysqlInstance = new MysqlUtil()
  mysqlInstance.instance.connect()
  await mysqlInstance.createBaseData('xyh_test2')
  mysqlInstance.instance.end()
}
// f1()

async function f2 () { // 获取
  let mysqlInstance = new MysqlUtil('exam_test')
  let res = await mysqlInstance.query(`
    SELECT * FROM t_wrong_tag
  `)
  console.log(res)
}
// f2()

async function f3 () { // 创建表
  let mysqlInstance = new MysqlUtil('xyh_test')
  let res = await mysqlInstance.query(`
    CREATE TABLE t_test2(id int AUTO_INCREMENT,age INT,PRIMARY KEY(id))
  `)
  console.log(res)
}
// f3()

async function f4 () { // 插入数据
  for(let i = 0;i<10;i++) {
    var  addSql = 'INSERT INTO t_test1(id,age) VALUES(0,?)';
    var  addSqlParams = [i];
    let mysqlInstance = new MysqlUtil('xyh_test')
    let res = await mysqlInstance.query(addSql, addSqlParams)
  }
}
// f4()

// async function f5 () { // 插入数据
//   var modSql = 'UPDATE t_test1 SET name = ?,url = ? WHERE Id = ?';
//   var modSqlParams = ['菜鸟移动站', 'https://m.runoob.com',6];
//   let mysqlInstance = new MysqlUtil('xyh_test')
//   let res = await mysqlInstance.query(addSql, addSqlParams)
//   console.log(res)
// }
// f5()

module.exports = MysqlUtil
