const Util = require('../../app/util/util')
const pdfbox = require('../../app/util/pdfbox.jar.js')
const fs = require('fs')

const func = (info, textArray = '', deepIndex) => {
  if(deepIndex === 0) {
    textArray.push(`
# ${info.name}
---    
`)
  } else {
    let space = ''
    for(let i = 0;i<deepIndex;i++) {
      space += `  `
    }
    let name
    if(info.type === 'file') {
      name = `${info.name}`
    } else {
      name = info.name
    }
    textArray.push(`${space}- ${name}
`)
  }
  if(info.children && info.children.length) {
    for(let i = 0;i<info.children.length;i++) {
      func(info.children[i], textArray, deepIndex + 1)
    }
  }
}

const index = () => {
  const info = Util.dirTree('D:\\干货整理')
  console.log(info)
  let textArray = []
  for(let i = 0;i<info.children.length;i++) {
    func(info.children[i], textArray, 0)
  }
  console.log(textArray.join(''))
  fs.writeFileSync(`./output/test.md`, textArray.join(''))
}



index()
