var xlsx = require('node-xlsx').default
const config = {}

let instance

class XlsxUtil {
  constructor () {
    instance = xlsx
    this.instance = instance
  }
}

module.exports = new XlsxUtil().instance
