var WebTorrent = require('webtorrent')
var moment = require('moment')

var client = new WebTorrent()
const path = 'D:\\egg-example-xyh-output\\torrent'
var magnetURI = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent'
// var magnetURI = 'https://webtorrent.io/torrents/sintel.torrent'
client.add(magnetURI, { path: path }, function (torrent) {

  // Torrents can contain many files. Let's use the .mp4 file
  var file = torrent.files.find(function (file) {
    return file.name.endsWith('.mp4')
  })

  // Trigger statistics refresh
  torrent.on('done', onDone)
  const timer = setInterval(onProgress, 500)
  onProgress()

  // Statistics
  function onProgress () {
    // Peers
    const $numPeers = torrent.numPeers + (torrent.numPeers === 1 ? ' peer' : ' peers')

    // Progress
    var percent = Math.round(torrent.progress * 100 * 100) / 100
    const $percent = percent + '%'
    const $downloaded = prettyBytes(torrent.downloaded)
    const $total = prettyBytes(torrent.length)

    // Remaining time
    var remaining
    if (torrent.done) {
      remaining = 'Done.'
    } else {
      remaining = moment.duration(torrent.timeRemaining / 1000, 'seconds').humanize()
      remaining = remaining[0].toUpperCase() + remaining.substring(1) + ' remaining.'
    }
    const $remaining = remaining

    // Speed rates
    const  $downloadSpeed = prettyBytes(torrent.downloadSpeed) + '/s'
    const  $uploadSpeed = prettyBytes(torrent.uploadSpeed) + '/s'
    console.clear()
    console.log('$numPeers', $numPeers)
    console.log('$percent', $percent)
    console.log('$downloaded', $downloaded)
    console.log('$total', $total)
    console.log('$remaining', $remaining)
    console.log('$downloadSpeed', $downloadSpeed)
    console.log('$uploadSpeed', $uploadSpeed)
  }
  function onDone () {
    onProgress()
    clearInterval(timer)
    console.log('---onDone---')
  }
})


// Human readable bytes util
function prettyBytes(num) {
  var exponent, unit, neg = num < 0, units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  if (neg) num = -num
  if (num < 1) return (neg ? '-' : '') + num + ' B'
  exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
  num = Number((num / Math.pow(1000, exponent)).toFixed(2))
  unit = units[exponent]
  return (neg ? '-' : '') + num + ' ' + unit
}
