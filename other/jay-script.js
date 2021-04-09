//获取项目工程里的图片

var fs = require('fs');//引用文件系统模块
// const NodeID3 = require('node-id3')
function readFileList(path, filesList) {
    var files = fs.readdirSync(path);
    files.forEach(function (itm, index) {
        var stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + itm + "/", filesList)
        } else {

            var obj = {};//定义一个对象存放文件的路径和名字
            obj.path = path;//路径
            obj.filename = itm//名字
            filesList.push(obj);
        }

    })

}
var getFiles = {
    //获取文件夹下的所有文件
    getFileList: function (path) {
        var filesList = [];
        readFileList(path, filesList);
        return filesList;
    },
};
async function operaFile() {
    //获取文件夹下的所有歌曲文件名
    let srcPath = './歌曲All/'
    let distPath = './歌曲All1/'
    // fs.mkdirSync(distPath)
    let musicList = []
    let allFileList = getFiles.getFileList(srcPath);
    for(let i = 0; i<allFileList.length;i++) {
        let e = allFileList[i]
        let index = i
        // if(!e.filename.includes(' - ') && e.filename.includes('-')) {
        // 	fs.rename(`${e.path}${e.filename}`,`${e.path}${e.filename.replace('-', ' - ')}`, () => {})
        // }
        // let lastName = e.filename.slice(e.filename.lastIndexOf('.') + 1)
        // if(lastName.toUpperCase() === 'MP3') {
        // 	fs.copyFileSync(`${e.path}${e.filename}`, `${distPath}${e.filename.replace('- .', '- ')}`)
        // }
        let lastName = e.filename.slice(e.filename.lastIndexOf('.') + 1)
        let newFileName = `${index}.${lastName}`
        // let info = await new Promise((resolve, reject) => {
        //     NodeID3.read(`${e.path}${e.filename}`,(err, tags) => {
        //         resolve(tags)
        //     })
        // })
        // console.log(info.title)
        fs.copyFileSync(`${e.path}${e.filename}`, `${distPath}${newFileName}`)
        console.log('copy'+ index)
        musicList.push({
            name: e.filename.slice(0, e.filename.lastIndexOf('.')),
            fileID: newFileName
        })
    }
    console.log('copy over')

    let str = ''
    musicList.forEach(e => {
        str += JSON.stringify(e)
    })
    fs.writeFile('./output.json', str, function(err){
        if(err) {
            console.log(err)
        } else {
            console.log('写入成功！！！')
        }
    });
}

operaFile()
