'use strict';
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

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

function fileCompressed(filePath, options) {
  return new Promise((resolve, reject) => {
    // 开始压缩时间
    const startCompressTime = new Date();
    const filePathZip = `/home/root/data/browser-export/zip/${options.zipDir}/${options.id}/${startCompressTime.getTime()}`;
    // 创建文件夹
    makeDir(filePathZip);

    // 创建文件输出流
    const output = fs.createWriteStream(filePathZip + `/${options.fileName}.zip`);
    const archive = archiver('zip', {
      zlib: { // 设置压缩级别
        level: 9,
      },
    });

    // 文件输出流结束
    output.on('close', async () => {
      const size = archive.pointer();
      console.log(`总共 ${size} 字节`);
      console.log('archiver完成文件的归档，文件输出流描述符已关闭');
      console.log(`压缩耗时：${new Date() - startCompressTime}ms`);
      options.logger.info(`压缩耗时：${new Date() - startCompressTime}ms`);
      // 将压缩包上传到oss
      try {
        // await uploadOss(filePathZip, options);
        // options.logger.info(`上传完成:${options.id},文件大小:${size}字节`);
        // // 删除压缩后的文件
        // delPath(filePathZip);
        // // 删除临时文件
        // delPath(filePath);
        resolve(size);
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });

    // 数据源是否耗尽
    output.on('end', function() {
      console.log('数据源已耗尽');
    });

    // 存档警告
    archive.on('warning', function(err) {

      if (err.code === 'ENOENT') {
        console.warn('stat故障和其他非阻塞错误');
        reject(err);
      } else {
        reject(err);
      }
    });

    // 存档出错
    archive.on('error', function(err) {
      reject(err);
    });

    // 通过管道方法将输出流存档到文件
    archive.pipe(output);
    fs.readdirSync(filePath)
      .forEach(fileName => {
        const filedir = filePath + '/' + fileName;
        // 追加一个文件
        // archive.file(filedir, { name: 'file4.txt' });
        // console.log(fs.createReadStream(filedir))
        try {
          archive.append(fs.createReadStream(filedir), { name: fileName });
        } catch (e) {
          reject(e);
        }
      });
    // 完成归档
    archive.finalize();
  });
}


// 删除文件夹下的文件
function delPath(path) {
  // 删除文件
  const files = fs.readdirSync(path);
  // 遍历读取到的文件列表
  files.forEach(function(filename) {
    const filedir = path + '/' + filename;
    fs.unlinkSync(filedir);
  });
  // 删除文件夹
  console.log('------------------');
  fs.rmdirSync(path);
}

// 创建文件夹
function makeDir(dirpath, del = true) {
  if (!fs.existsSync(dirpath)) {
    let pathtmp;
    dirpath.split('/')
      .forEach(function(dirname) {
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
  } else if (del) {
    // 先删除已有文件夹
    delPath(dirpath);
    // 再重新建文件夹
    makeDir(dirpath);
  }
  return true;
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

module.exports = {
  fileCompressed,
  makeDir,
  delPath,
  geFileList,
  getDirSize,
};
