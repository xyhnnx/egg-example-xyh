/**
 * @Author: cainsyake
 * @Date:   2019-05-18
 * @Remark: 工具方法
 */
const os = require('os');
const redisExec = null; // 是个接口
const mainRedis = null; // 是个接口
const request = require('request');
const fs = require('fs');
const path = require('path');
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
// 删除文件夹下的文件
function delPath(path) {
  // 删除文件
  const files = fs.readdirSync(path);
  // 遍历读取到的文件列表
  files.forEach(function(filename) {
    const filedir = path + '/' + filename;
    fs.unlinkSync(filedir);
  });
  fs.rmdirSync(path);
}
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
    fileDir
  }
}
module.exports = {
  ...require('./zip-file'),
  webUrlSplicing,
  arrayGroup,
  mainRedisUtil,
  getServerHostName,
  getServerIP,
  getServerPid,
  timeout,
  makeDir,
  downloadFile,
  downloadFile2,
  outputDir,
  stringToFile,
  delFile,
  getFilenameInfoByPath,
  downloadFileItem
};
