/*
* 将本地文件夹里的图片上传到聚合图床（https://www.superbed.cn/）
* */
let fs = require('fs')
let path = require('path')
const {execSync, exec} = require('child_process')
const {geFileList, timeout} = require('../../app/util/util')
const fetch = require('../../app/util/fetch')

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
          let count = list.filter(e => `${e.src}`.startsWith('https://pic.imgdb.cn')).length
          console.log('已经上传聚合图床数量=' + count)
          if (count >= 999) {
            return
          }
          res = await uploadItem({
            path: filePath
          })
          if (res.status === 200 && res.data && res.data.err === 0 && res.data.url) {
            e.src = res.data.url
            // 重新
            fs.writeFileSync(mapJsonPath, JSON.stringify(list))
            console.log(`${i}.文件上传成功！！`)
          } else {
            console.log(`${i}.upload err:`, res)
            isError = true
          }
        } catch (e) {
          console.log(`${i}.catch err:${e}`)
          isError = true
        }
        await timeout(6000)
      } else {
        console.log(`${i}.文件不存在`)
      }
    } else {
      console.log(`${i}.文件已上传`)
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
  data.append('file', fs.createReadStream(e.path))
  data.append('token', '60a4899915ba4ff78fd4cf5f5aeca44d')
  data.append('categories', 'jj-image-tmp')

  let config = {
    method: 'post',
    url: 'https://api.superbed.cn/upload',
    headers: {
      // 'Cookie': 'hidove_lang=en-us; HIDOVE_SESSID=fea8923cf61aca3196e791b8f177eaea',
      ...data.getHeaders()
    },
    data
  }
  return axios(config)
}

