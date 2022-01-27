//const xlsx = require('xlsx');//原生的xlsx,但不支持表格的样式设置 test
const _ = require('lodash')//引入lodash辅助工具
const fs = require('fs')//引入fs模块用于读取文件流
// const xlsx = require('xlsx-style')//选择使用xlsx-style可以设置表格样式
const Util = require('../app/util/util')
function test () {
  console.log('接受到的result风格参数  =  ', req.params.id)
  //excel的导出
  //先定义需要导出的字段

  let _headers = [ 'id', 'name', 'age', 'country', 'remark' ]
  let _data = [ {
    id: '1',
    name: '无敌浩克',
    age: '17',
    country: 'China',
    remark: 'hello'
  },
    {
      id: '2',
      name: '钢铁侠',
      age: '18',
      country: 'America',
      remark: 'world'
    },
    {
      id: '3',
      name: '灭霸',
      age: '19',
      country: 'CSH',
      remark: 'CSDN'
    },
    {
      id: '4',
      name: '美国队长',
      age: '20',
      country: 'CSH',
      remark: 'CSDN'
    }
  ]

  let headersExport = _headers

  .map((v, i) => _.assign({}, {v: v, position: String.fromCharCode(65 + i) + 1}))

  .reduce((prev, next) => _.assign({}, prev, {
    [next.position]: {
      v: next.v, s: {
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      }
    }
  }), {})

  let dataExport = _data

  .map((v, i) => _headers.map((k, j) => _.assign({}, {v: v[k], position: String.fromCharCode(65 + j) + (i + 2)})))

  .reduce((prev, next) => prev.concat(next))

  .reduce((prev, next) => _.assign({}, prev, {
    [next.position]: {
      v: next.v, s: {
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      }
    }
  }), {})

  // 合并 headersExport 和 dataExport
  const output = _.assign({}, headersExport, dataExport)
  console.log(output.A1)
  // 获取所有单元格的位置
  const outputPos = _.keys(output)
  // 计算出范围
  const ref = outputPos[0] + ':' + outputPos[outputPos.length - 1]

  // 构建 workbook 对象
  const wb = {
    SheetNames: [ 'Sheet' ],
    Sheets: {
      'Sheet': _.assign({}, output, {'!ref': ref})
    }
  }

  const strs = 'output.xlsx'
  // 导出 Excel
  const buffer = xlsx.writeFile(wb, strs, {type: 'buffer'})
  console.log(buffer)
}

// test()

function test2 () {
  const list = Util.geFileList('D:\\干货整理\\Python精品学习书籍').map(e => e.name)
  console.log(list)
}
test2()
