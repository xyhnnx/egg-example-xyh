/**
 * @Author: cainsyake
 * @Date:   2019-05-18
 * @Remark: 工具方法
 */
const os = require('os');
const crypto = require('crypto');
const redisExec = null; // 是个接口
const mainRedis = null; // 是个接口
const request = require('request');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
archiver.registerFormat('zip-encrypted', require("archiver-zip-encrypted"));


const outputDir = 'd:/egg-example-xyh-output'

// Promise队列库
const Queue = require('promise-queue-plus');
// 答题卡 队列实例 第一个参数是最大同时执行量
const redisQueueInstance = Queue(2, {
  retry: 0,
  retryIsJump: false,
  timeout: 0
});

// web URL 拼接
const webUrlSplicing = (url, params) => {
  if(!(Object.keys(params).length)) {
    return url
  }
  const paramArray = Object.entries(params)
    .map(paramItemArr => `${paramItemArr[0]}=${paramItemArr[1]}`);
  const paramString = paramArray.join('&');
  return `${url}?${paramString}`;
};

// 把一个数组按照一定长度分割成若干数组
function arrayGroup(array, subGroupLength) {
  let index = 0;
  const newArray = [];
  while (index < array.length) {
    newArray.push(array.slice(index, index += subGroupLength));
  }
  return newArray;
}

// 获取服务器IP
const getServerIP = () => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    if (interfaces.hasOwnProperty(devName)) {
      const iface = interfaces[devName];
      for (const alias of iface) {
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address;
        }
      }
    }
  }
};

// 获取服务器主机名
const getServerHostName = () => {
  return os.hostname();
};

// 获取当前进程
const getServerPid = () => {
  return process.pid;
};


// 调用主服务的redis执行操作
const mainRedisUtil = async (...args) => {
  return new Promise(async (resolve, reject) => {
    // 错误次数
    let errorTimes = 0;

    const fnc = async () => {
      try {
        return await redisQueueInstance.go(async () => {
          return await mainRedis({ args, key: 'browser-export_1556595646707_9732' });
        });
      } catch (e) {
        errorTimes++;
        console.log(`重试次数:${errorTimes}`);
        if (errorTimes < 3) {
          return await fnc();
        }
        throw new Error(`连续3次请求失败:${JSON.stringify(args)}`);

      }
    };

    try {
      const res = await fnc();
      if (res && res.status === 0) {
        resolve(res.data);
      } else {
        reject(new Error(res.message));
      }
    } catch (e) {
      reject(e);
    }
  });
  // return await redisQueueInstance.go(async () => {
  //   return await mainRedis({args, key: `browser-export_1556595646707_9732`})
  // })
};

// 延时
const timeout = async (time = 1000) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

function delFile (filePath) {
  fs.unlinkSync(filePath);
}
// 创建文件夹
function makeDir(dirpath, delExists = false) {
  if (!fs.existsSync(dirpath)) {
    let pathtmp;
    dirpath.split('/').forEach(function(dirname) {
      if (pathtmp) {
        pathtmp = path.join(pathtmp, dirname);
      } else {
        // 如果在linux系统中，第一个dirname的值为空，所以赋值为"/"
        if (dirname) {
          pathtmp = dirname;
        } else {
          pathtmp = '/';
        }
      }
      if (!fs.existsSync(pathtmp)) {
        if (!fs.mkdirSync(pathtmp)) {
          return false;
        }
      }
    });
  } else {
    if (delExists) {
      // 先删除已有文件夹
      delPath(dirpath);
      // 再重新建文件夹
      makeDir(dirpath)
    }
  }
  return true;
}
/*
* list[]
* {
*   url: 必选，
*   fileType: 可选
*   fileName: 可选
* }
* */
async function downloadFile(list, dirName, batch = true) {
  const fileDir = `${outputDir}/${dirName || 'default'}/`
  makeDir(fileDir)
  let arr = []
  for (let i = 0; i < list.length; i++) {
    let promiseItem = new Promise((resolve, reject) => {
      let item = list[i];
      let url = item.url;
      if (url) {
        let fileName = item.fileName || url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('.')) || (1000 + i)
        let fileType = item.fileType || url.substring(url.lastIndexOf('.') + 1);
        request(url)
          .pipe(fs.createWriteStream(path.join(fileDir, `${fileName}.${fileType}`)))
          .on('close', () => {
            console.log(`${url}--下载完毕`);
            resolve()
          })
      }
    })
    arr.push(promiseItem)
  }
  if (batch) { // 如果是并发
    return Promise.all(arr)
  } else {
    for (let i = 0; i < arr.length; i++) {
      await arr[i]
    }
  }
}
async function downloadFile2(list, dirName, batch = true) {
  const fileDir = `${outputDir}/${dirName || 'default'}/`
  makeDir(fileDir)
  let sizeObj = {}
  let arr = []
  for (let i = 0; i < list.length; i++) {
    let item = list[i]
    let url = item.url
    let fileName = item.fileName || url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('.')) || (1000 + i)
    let fileType = item.fileType || url.substring(url.lastIndexOf('.') + 1);
    let promiseItem = new Promise((resolve, reject) => {
      const https = require('https')
      const fs = require('fs');
      const url = item.url
      let savePath = path.join(fileDir, `${fileName}.${fileType}`)
      https.get(url, function(res) {
        let imgData = "";
        res.setEncoding("binary"); // 一定要设置response的编码为binary否则会下载下来的图片打不开
        res.on("data", function(chunk) { // 这步是我百度来的。。。。
          imgData += chunk;
        });

        res.on("end", function() {
          if (imgData.length < 500) { // 小于500字节 太小就不要了
            console.log(`${url}--文件太小不要了`);
            resolve()
            return;
          }
          if (sizeObj[imgData.length]) { // 根据文件大小相同判断重复
            console.log(`${url}--文件重复`);
            resolve()
            return
          }
          sizeObj[imgData.length] = 1
          fs.writeFile(savePath, imgData, "binary", function(err) {
            if (err) {
              console.log(`${url}--下载失败2`);
              reject()
            }
            resolve()
            console.log(`${url}--下载成功2`);
          });
        });
      });
    })
    arr.push(promiseItem)
  }
  if (batch) { // 如果是并发
    return Promise.all(arr)
  } else {
    for (let i = 0; i < arr.length; i++) {
      await arr[i]
    }
  }
}

async function downloadFileItem(url, writeFilePath) {
  const fetch = require('./fetch')
  let res = await fetch({
    url,
    method: 'get',
    responseType: "arraybuffer"
  })
  fs.writeFileSync(writeFilePath, res, 'binary')
}

function stringToFile (str, fileName, dirName = 'def') {
  let fullDir = outputDir + '/' + dirName
  makeDir(fullDir)
  fs.writeFileSync(path.join(fullDir, `/${fileName}`), str)
}

// 把路径统一标准化为（如：将D:/test\\test.png --> D:/test/test.png）
function getStandardFilePath (path) {
  return path.replace(/\\/g, "/")
}

// 根据文件路径获取文件名称
function getFilenameInfoByPath (filePath) {
  let template = filePath.split('/')[filePath.split('/').length - 1]
  let fileName = template.split('\\')[template.split('\\').length - 1]
  const fileSuffix = fileName.toString().substr(fileName.lastIndexOf('.') + 1)
  const fileNameNoSuffix = fileName.slice(0, fileName.lastIndexOf('.'))
  const fileDir = path.join(filePath, '../')
  return {
    fileName,
    fileNameNoSuffix,
    fileSuffix,
    fileDir: getStandardFilePath(fileDir)
  }
}


/**
 * 获取一段buffer的md5
 * @param buffer
 * @returns {string}
 */

const getBufferMd5 = (buffer) => {
  var fsHash = crypto.createHash('md5');
  fsHash.update(buffer);
  var md5 = fsHash.digest('hex');
  console.log("buffer的MD5是：%s", md5);
  return md5
}

/**
 * 获取文件的md5
 * @param localFilePath
 * @returns {string}
 */

const getFileMd5 = (localFilePath = './test.jpg') => {
//读取一个Buffer
  var buffer = fs.readFileSync(localFilePath);
  return getBufferMd5(buffer)
}

/**
 * 获取文件大小
 * @param localFilePath
 * @returns {number}
 */
const getFileSize = (localFilePath = './test.jpg') => {
  const states = fs.statSync(localFilePath);
  console.log(states)
  console.log(`文件大小为：${states.size}`)
  return states.size
}




/**
 * 文件压缩及上传
 * @param filePath
 * @param options: {
 *     zipDir 压缩文件所在目录
 *     id 此次导出的id
 *     fileName 文件名
 *     ossPrefix OSS路径前缀
 *     logger 日志
 * }
 * @returns {Promise<any>}
 */


// 删除文件夹下的文件以及文件夹
function delPath(path) {
  // 删除文件
  const files = fs.readdirSync(path);
  // 遍历读取到的文件列表
  files.forEach(function (filename) {
    const currentPath = path + '/' + filename
    const states = fs.statSync(currentPath);
    if (states.isDirectory()) {
      delPath(currentPath)
    } else {
      fs.unlinkSync(currentPath);
    }
  });
  // 删除文件夹
  fs.rmdirSync(path);
}


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

// 获取文件夹大小
function getDirSize(path) {
  let size = 0;
  geFileList(path)
  .forEach(e => {
    size += e.size;
  });
  return size;
}
// 文件目录树
function dirTree(filename) {
  let stats = fs.lstatSync(filename),
    info = {
      path: filename,
      name: path.basename(filename)
    };

  if (stats.isDirectory()) {
    info.type = "folder";
    info.children = fs.readdirSync(filename).map(function (child) {
      return dirTree(path.join(filename, child));
    });
  } else {
    // Assuming it's a file. In real life it could be a symlink or
    // something else!
    info.type = "file";
  }
  return info;
}

// dirTree('D:\\home\\root\\data\\browser-export\\wrong-download-v3\\pdf')

/**
 * 打包文件夹
 * 注意： outFilePath文件不能在inputDirPath文件夹内
 * @param inputDirPath 要打包成zip的文件夹
 * @param outFilePath 打包后的zip文件;如  D:/test/test.zip
 * @returns {Promise<unknown>}
 */
function zipDir (inputDirPath, outFilePath, password) {
  return new Promise((resolve, reject) => {
    let template = inputDirPath.split('/')[inputDirPath.split('/').length - 1]
    let inputDirPathDirName = template.split('\\')[template.split('\\').length - 1]
    // 开始压缩时间
    const startCompressTime = new Date()
    // 创建文件输出流
    const output = fs.createWriteStream(outFilePath);
    let archive
    if(password) {
      archive = archiver.create('zip-encrypted', {zlib: {level: 8}, encryptionMethod: 'aes256', password});
    } else {
      archive = archiver('zip', {
        zlib: {level: 1} // 设置压缩级别
      })
    }


    // 文件输出流结束
    output.on('close', async () => {
      const size = archive.pointer()
      console.log(`总共 ${size} 字节`)
      console.log('archiver完成文件的归档，文件输出流描述符已关闭')
      console.log(`压缩耗时：${new Date() - startCompressTime}ms`)
      resolve(size)
    })

    // 数据源是否耗尽
    output.on('end', function () {
      console.log('数据源已耗尽')
    })

    // 存档警告
    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        console.warn('stat故障和其他非阻塞错误')
        reject(err)
      } else {
        reject(err)
      }
    })

    // 存档出错
    archive.on('error', function (err) {
      reject(err)
    })

    // 通过管道方法将输出流存档到文件
    archive.pipe(output);
    fs.readdirSync(inputDirPath).forEach(fileName => {
      const filedir = path.join(inputDirPath, fileName)
      try {
        const states = fs.statSync(filedir);
        if (states.isDirectory()) { // 如果是文件夹
          archive.directory(`${filedir}/`, fileName);
        } else {
          archive.append(fs.createReadStream(filedir), {name: fileName})
        }
      } catch (e) {
        reject(e)
      }
    })
    // 完成归档
    archive.finalize()
  })
}
// zipDir('D:\\home\\xyh-test', 'D:\\home\\', '123')


/**
 * 模板引擎 方法1
 * 使用node的vm 模块
 */
const  templateCompile1 = (template, data) => {
  const vm = require('vm')
  return vm.runInNewContext(`\`${template}\``, data)
}
/**
 * 模板引擎 方法2
 * 使用new function的方法
 */
const  templateCompile2 = (template, data) => {
  const fun = new Function(`${Object.keys(data).join(',')}`, `return \`${template}\``)
  return fun(...Object.values(data))
}
// const data = templateCompile1('---${name}==', {name: 'xxxcccfsdf'})
// console.log(data)


module.exports = {
  makeDir,
  getStandardFilePath,
  zipDir,
  delPath,
  getFileList:geFileList,
  geFileList,
  getDirSize,
  getBufferMd5,
  getFileMd5,
  getFileSize,
  webUrlSplicing,
  arrayGroup,
  mainRedisUtil,
  getServerHostName,
  getServerIP,
  getServerPid,
  timeout,
  downloadFile,
  downloadFile2,
  outputDir,
  stringToFile,
  delFile,
  getFilenameInfoByPath,
  dirTree,
  downloadFileItem
};
