/**
 * 1. 下载解压好ffmpeg，https://www.ffmpeg.org/download.html#build-windows
 * 2. 将解压后的bin文件夹放入系统变量path；
 *
 *命令：ffmpeg -i D:\xyh\video\test.mp4 -profile:v baseline -level 3.0 -s 640x360 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls D:\xyh\video\m3u8\test.m3u8
 * 参考链接 https://blog.csdn.net/qq_36623327/article/details/83007456
 * 参考链接 https://www.jianshu.com/p/fb4d81cfe14d
 * 参考链接 https://www.jianshu.com/p/273bdb4c240b
 *
 */

// fs.mkdirSync(pathtmp)
// fs.rmdirSync(path)

async function mp4ToM3u8 (mp4Path) {
  const fs = require('fs')
  const path = require('path')
  const fileDir = mp4Path.substring(0, mp4Path.lastIndexOf('\\'))
  const fileName = mp4Path.substring(mp4Path.lastIndexOf('\\') + 1, mp4Path.lastIndexOf('.'))
  const fileType = mp4Path.substr(mp4Path.lastIndexOf('.') + 1)
  console.log(fileDir, fileName, fileType)
  fs.mkdirSync(path.join(fileDir,fileName))
  await new Promise(((resolve, reject) => {
    const cmd = `ffmpeg -i ${mp4Path} -f segment -segment_time 10 -segment_format mpegts -segment_list ${fileDir}\\${fileName}\\${fileName}.m3u8 -c copy -bsf:v h264_mp4toannexb -map 0 ${fileDir}\\${fileName}\\%04d.ts`
    // const cmd2 = `ffmpeg -i ${mp4Path} -profile:v baseline -level 3.0 -s 640x360 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls ${fileDir}\\\\${fileName}\\\\${fileName}.m3u8`
    const {exec}  = require('child_process');
    const spawnObj = exec(cmd);
    spawnObj.stdout.on('data', function(chunk) {
      console.log('stdout-----', chunk.toString());
    });
    spawnObj.stderr.on('data', (data) => {
      console.log('stderr-----', data);
    });
    spawnObj.on('exit', (code) => {
      console.log('exit-----: ' + code);
    })
    spawnObj.on('close', function(code) {
      if(code === 0) {
        console.log('成功-----:' + code);
        resolve()
      } else {
        console.log('失败-----:' + code);
        fs.rmdirSync(path.join(fileDir,fileName))
        reject()
      }
    })
  }))
}
async function mp4FilesListToM3u8 (mp4DirName) {
  const fs = require('fs')
  const path = require('path')
  let list = fs.readdirSync(mp4DirName)
  let waitList = list.map(e => {
    return mp4ToM3u8(path.join(mp4DirName, e))
  })
  await Promise.all(waitList)
  console.log('-------over')
}
mp4FilesListToM3u8('D:\\ProjectXyh\\video-master\\JayMV\\JAY')
// mp4ToM3u8('D:\\ProjectXyh\\video-master\\JayMV\\JAY\\01.可爱女人.mkv')


