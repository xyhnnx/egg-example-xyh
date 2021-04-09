//获取项目工程里的图片

var fs = require('fs');//引用文件系统模块
function getDatebaseArr () {
    let stringData = fs.readFileSync('./database_export.json','utf-8')
    let databaseArr = []
    stringData.split('\n').forEach(e => {
        if(e) {
            databaseArr.push(JSON.parse(e))
        }
    })
    return databaseArr
}

function bingJson2Md (json) {
    let arr = []
    for (let i = 0; i < json.length; i++) {
        let item = json[i]
        let str = `![${item.createTime.$date.substr(0, 10)}](${item.src} "${item.createTime.$date.substr(0, 10)}")
\`${item.title}\`  
[无水印大图链接](${item.src.replace('1920x1080', 'UHD')})
------
`
        arr.push(str)
    }
    fs.writeFile(`./output.md`, arr.join(''), function(err) {
        if (err) {
            console.log(err)
        } else {
            console.log('bing / output.md写入成功！！！')
        }
    });
}
let databaseArr = getDatebaseArr()
bingJson2Md(databaseArr)
console.log(databaseArr.length)
