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
  // 1 在浏览器打开此页面
  // 2 然后在页面上授权登录；然后改页面会重定向到一个有access_token的页面
  // https://openapi.baidu.com/oauth/2.0/authorize?response_type=token&client_id=L6g70tBRRIXLsY0Z3HwKqlRE&redirect_uri=oob&scope=netdisk
}
/**
 * 获取userInfo
 * @param access_token
 * @returns {Promise<void>}
 */
const getUserInfo = async (access_token = '123.e05eaafa151dbf1b05ba366d0a8d7d14.Ymg9xrXnntNwA90QmTNpOl8bNM9Z8yhbGAUEsmD.drAsjw') => {
  var axios = require('axios');
  var config = {
    method: 'get',
    url: 'https://pan.baidu.com/rest/2.0/xpan/nas?method=uinfo',
    params: {
      'access_token':access_token
    }
  };
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });

}

console.log(getUserInfo())
console.log(urlencode('/apps/test.jpg'))
console.log(Util.getFileSize('./test.jpg'))
console.log(Util.getFileMd5('./test.jpg'))

const precreate = async () => {

}
