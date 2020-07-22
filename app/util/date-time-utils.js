/**
 * 时间日期工具类
 * Created by 马腾 on 2017/7/14.
 */
// 一整天毫秒数
/**
 * 时间格式化
 * @param time 毫米数时间（如：1487239492000）
 * @param format 格式（如 yyyy-MM-dd hh:mm:ss）
 * @return {*} 格式化后的时间字符串
 */
function dateFormat (time, format) {
  if (!time) {
    return
  }
  if (!format) {
    return time
  }
  const usedDate = new Date(time)
  const o = {
    // 月份
    'M+': usedDate.getMonth() + 1,
    // 日
    'd+': usedDate.getDate(),
    // 小时
    'h+': usedDate.getHours(),
    // 分
    'm+': usedDate.getMinutes(),
    // 秒
    's+': usedDate.getSeconds(),
    // 季度
    'q+': Math.floor((usedDate.getMonth() + 3) / 3),
    // 毫秒
    S: usedDate.getMilliseconds()
  }

  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (usedDate.getFullYear() + '').substr(4 - RegExp.$1.length))
  }

  for (const k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  }
  return format
}

module.exports = {dateFormat};

