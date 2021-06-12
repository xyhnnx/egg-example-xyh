/*
* 将本地文件夹里的图片上传到遇见图床（https://www.hualigs.cn/user/images）
* */
let fs = require('fs')
let path = require('path')
const {execSync, exec} = require('child_process')
const {geFileList, timeout} = require('../../app/util/util')
const fetch = require('../../app/util/fetch')
const {dateFormat} = require('../../app/util/date-time-utils')
index()


async function index () {
  console.log(__dirname)
  let mapJsonPath = path.join(__dirname, 'jj-img-status-map.json');
  let list = JSON.parse(fs.readFileSync(mapJsonPath))
  console.log(list.length)
  let isError = false
  for (let i = 0; i < list.length; i++) {
    let e = list[i]
    if (!e.src) { // 没有上传过
      let filePath = 'G:\\ProjectXyh\\jj-img\\' + e.name
      if (fs.existsSync(filePath)) {
        // 上传
        let res
        try {
          res = await uploadItem({
            path: filePath
          })
          if (res.status === 200 && res.data && res.data.code === 200 && res.data.data && res.data.data.url && res.data.data.url.distribute) {
            e.src = res.data.data.url.distribute
            // 重新
            fs.writeFileSync(mapJsonPath, JSON.stringify(list))
            console.log(`${getTime()}${i}.文件上传成功！！`)
          } else {
            console.log(`${getTime()}${i}.upload err:`, res)
            isError = true
            await timeout(5000)
          }
        } catch (e) {
          console.log(`${getTime()}${i}.catch err:${e}`)
          isError = true
        }
      } else {
        console.log(`${getTime()}${i}.文件不存在`)
      }
    } else {
      console.log(`${getTime()}${i}.文件已上传`)
    }
  }
  if (isError) {
    index()
  }

}


async function uploadItem (e) {

  let axios = require('axios')
  let FormData = require('form-data')
  let fs = require('fs')
  let data = new FormData()
  data.append('image', fs.createReadStream(e.path))
  data.append('apiType', 'bilibili,baidu')
  data.append('token', '2a947db4af953b020e0e8dab5ae23b2f')

  let config = {
    method: 'post',
    url: 'https://www.hualigs.cn/api/upload?image',
    headers: {
      'Cookie': 'hidove_lang=en-us; HIDOVE_SESSID=fea8923cf61aca3196e791b8f177eaea',
      ...data.getHeaders()
    },
    data
  }
  return axios(config)
}

function getTime() {
  return dateFormat(Date.now(), 'yyyy-MM-dd hh:mm:ss')
}
