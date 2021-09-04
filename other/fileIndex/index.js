// 获取目录结构
let fs = require('fs')
let path = require('path')
const tragetDir = 'J:\\ProjectXyh\\video\\JayMV'
function dirTree(filename) {
    let stats = fs.lstatSync(filename),
        info = {
            path: filename,
            name: path.basename(filename)
        };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function (child) {
            return dirTree(filename + '/' + child);
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        info.type = "file";
    }
    return info;
}

let dirJson = dirTree(tragetDir)


let jayMVGitUrlJson = dirJson.children.map(e => {
    const name = e.name
    let list = e.children
    const urlList = list.map(e2 => {
        return `https://cdn.jsdelivr.net/gh/xyhasset/video@master/JayMV/${name}/${e2.name}/${e2.name}.m3u8`
    })
    return {
        // 是否显示多个视频左右切换
        playInOrder: list.length>1,
        name,
        count: list.length,
        urlList
    }
})
fs.writeFileSync('./output.json', JSON.stringify(jayMVGitUrlJson))
