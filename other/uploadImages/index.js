/*
* 将本地文件夹里的图片上传到遇见图床（https://www.hualigs.cn/user/images）
* */
var fs = require('fs')
var path = require('path')
const {execSync, exec} = require('child_process')
const {geFileList} = require('../../app/util/zip-file')
const fetch = require('../../app/util/fetch')

index()

async function index () {
  console.log(__dirname)
  let mapJsonPath = path.join(__dirname, 'jj-img-status-map.json');
  let list = JSON.parse(fs.readFileSync(mapJsonPath))
  console.log(list.length)
  for (let i = 0; i < list.length; i++) {
    let e = list[i]
    if(!e.src) { // 没有上传过
      let filePath = 'D:\\egg-example-xyh-output\\images\\jj-img\\'+e.name
      if(fs.existsSync(filePath)) {
        // 上传
        let res
        try {
          res = await uploadItem({
            path: filePath
          })
          if(res.status === 200 && res.data && res.data.code === 200 && res.data.data && res.data.data.url && res.data.data.url.distribute)  {
            e.src = res.data.data.url.distribute
            // 重新
            fs.writeFileSync(mapJsonPath, JSON.stringify(list))
            console.log(`${i}.文件上传成功！！`)
          } else {
            console.log(`${i}.upload err:`, res)
          }
        } catch (e) {
          console.log(`${i}.catch err:${e}`)
        }
      } else{
        console.log(`${i}.文件不存在`)
      }
    }else{
      console.log(`${i}.文件已上传`)
    }
  }

}

async function uploadItem (e) {

  var axios = require('axios')
  var FormData = require('form-data')
  var fs = require('fs')
  var data = new FormData()
  data.append('image', fs.createReadStream(e.path))
  data.append('apiType', 'bilibili,baidu')
  data.append('token', '2a947db4af953b020e0e8dab5ae23b2f')

  var config = {
    method: 'post',
    url: 'https://www.hualigs.cn/api/upload?image',
    headers: {
      'Cookie': 'hidove_lang=en-us; HIDOVE_SESSID=fea8923cf61aca3196e791b8f177eaea',
      ...data.getHeaders()
    },
    data: data
  }
  return axios(config)
}

