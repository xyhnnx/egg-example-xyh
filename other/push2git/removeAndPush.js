/*
* 将其他文件夹(originDir)的图片分批移动到这个项目targetDir()下；并自动提交至git
* 因为gitee仓库的容量限制；
* 改方法不可行
* */


const originDir = 'J:\\jj-img\\origin'
const targetDir = 'J:\\ProjectXyh\\images\\jj\\origin'

let fs = require('fs');
let path = require('path');
const {execSync, exec} = require('child_process');
// 延时
const timeout = async (time = 1000) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};


// 获取文件夹下所有文件
function geFileList(path) {
    const filesList = [];
    readFile(path, filesList);
    return filesList;
}

// 遍历读取文件
function readFile(path, filesList) {
    const files = fs.readdirSync(path); // 需要用到同步读取
    files.forEach(walk);

    function walk(file) {
        const states = fs.statSync(path + '/' + file);
        if (states.isDirectory()) {
            readFile(path + '/' + file, filesList);
        } else {
            // 创建一个对象保存信息
            const obj = {};
            obj.size = states.size; // 文件大小，以字节为单位
            obj.name = file; // 文件名
            obj.path = path + '/' + file; // 文件绝对路径
            filesList.push(obj);
        }
    }
}


async function removeFile() {
    let fileList = geFileList(originDir)
    let count = fileList.length
    if (count <= 0) {
        return
    }
    console.log(`剩余数量${count}`)
    const addCount = 100
    fileList = fileList.filter((e, i) => i < addCount)
    for (let i = 0; i < fileList.length; i++) {
        let e = fileList[i]
        let sourceFile = e.path;
        let destPath = targetDir + '\\' + e.name;
        fs.renameSync(sourceFile, destPath);
    }
    let cmd = `cd ${targetDir} && git add . && git commit -m addjjimg剩余${count - addCount} && git push`
    let success
    for (let i = 0; i < 10; i++) {
        if (i > 0) {
            console.log(`第${i + 1}次尝试`)
        }
        success = false
        try {
            success = await new Promise((resolve, reject) => {
                const spawnObj = exec(cmd);
                spawnObj.stdout.on('data', function (chunk) {
                    console.log('stdout-----', chunk.toString());
                    if (chunk.toString().includes('to publish your local commits')) {
                        console.log('-----------------true')
                        cmd = `cd ${targetDir} && git push`
                    }
                });
                spawnObj.stderr.on('data', (data) => {
                    console.log('stderr-----', data);
                    if (data.includes('OpenSSL SSL_read: Connection was reset, errno 10054')) {
                        cmd = `cd ${targetDir} && git push`
                    }
                });
                spawnObj.on('exit', (code) => {
                    console.log('exit-----: ' + code);
                })
                spawnObj.on('close', function (code) {
                    if (code === 0) {
                        console.log('成功-----:' + code);
                        resolve(true)
                    } else {
                        console.log('失败-----:' + code);
                        reject(false)
                    }
                })
            })
        } catch (e) {
            success = false
            console.log('catch:', e)
        }
        if (success) {
            break
        } else {
            await timeout(5000)
        }
    }
    await timeout(1000)
    if (success) {
        console.log('提交成功---')
        removeFile()
    }

}

removeFile()


