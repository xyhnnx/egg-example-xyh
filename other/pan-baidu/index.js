var axios = require('axios');
var crypto = require('crypto');
var fs = require('fs');
const urlencode = require('urlencode')
const Util = require('../../app/util/util')

/**
 * 获取token
 * @returns {Promise<string>}
 */
const getAccessToken = async () => {
  var config = {
    method: 'get',
    url: 'https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=MTDYS8yKR1b4srXmFE5xEKkK6GhPffEV&client_secret=q2z8AyqHUTPLsMc8drewQ0fYoDRqRqXg',
    headers: {
      'Cookie': 'BIDUPSID=A645E5C0BC497970044AEE4758773A09; PSTM=1640329350; BAIDUID=A645E5C0BC4979707E5EA119A0B9F0F4:FG=1'
    }
  };
  const response = await axios(config)
  console.log(response)
  return JSON.stringify(response.data)
}
console.log(getAccessToken())
console.log(urlencode('/apps/test.jpg'))
console.log(Util.getFileSize('./test.jpg'))
console.log(Util.getFileMd5('./test.jpg'))

const precreate = async () => {

}
