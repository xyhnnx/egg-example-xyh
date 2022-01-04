'use strict';
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
archiver.registerFormat('zip-encrypted', require("archiver-zip-encrypted"));
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
 * 注意： outDirPath文件夹不能在inputDirPath文件夹内
 * @param inputDirPath 要打包成zip的文件夹
 * @param outDirPath 打包后的zip文件存放的位置
 * @returns {Promise<unknown>}
 */
function zipDir (inputDirPath, outDirPath, password) {
  return new Promise((resolve, reject) => {
    let template = inputDirPath.split('/')[inputDirPath.split('/').length - 1]
    let inputDirPathDirName = template.split('\\')[template.split('\\').length - 1]
    // 开始压缩时间
    const startCompressTime = new Date()
    let filePathZip
    if (outDirPath) {
      // 不存在则创建文件夹
      if (!fs.existsSync(outDirPath)) {
        makeDir(outDirPath)
      }
      filePathZip = path.join(outDirPath, `${inputDirPathDirName}.zip`)
    } else {
      filePathZip = path.join(inputDirPath, '../', `${inputDirPathDirName}.zip`)
    }
    // 创建文件输出流
    const output = fs.createWriteStream(filePathZip);
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
zipDir('D:\\home\\xyh-test', 'D:\\home\\', '123')

module.exports = {
  makeDir,
  delPath,
  geFileList,
  getDirSize,
};
