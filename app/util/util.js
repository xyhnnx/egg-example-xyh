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
const outputDir = '/egg-example-xyh-output'
async function downloadFile(list) {
  const fileDir = `${outputDir}/bing/`
  makeDir(fileDir)
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    let url = item.url;
    if (url) {
      let fileName = item.fileName || url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('.')) || (1000 + i)
      let fileType = url.substring(url.lastIndexOf('.') + 1);
      let stream = fs.createWriteStream(path.join(fileDir, `${fileName}.${fileType}`));
      request(url)
        .pipe(stream)
        .on('close', () => {
          console.log(`${url}--下载完毕`);
        });
    }
  }
}

module.exports = {
  webUrlSplicing,
  arrayGroup,
  mainRedisUtil,
  getServerHostName,
  getServerIP,
  getServerPid,
  timeout,
  downloadFile
};
