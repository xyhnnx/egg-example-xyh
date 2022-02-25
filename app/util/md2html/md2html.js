/**
 * 将当前目录下的md文件夹里的md文件；编译成html文件并输出到.vuepress/public/html文件夹下面
 */
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const {marked} = require('marked')
const {getFileList, templateCompile1} = require('../util')


/**
 * 将inputPath文件夹的md文件转为HTML文件输出到outputPath文件夹下
 * @param theme ：markdown文件的主题
 * @param inputPath ： md文件的文件夹
 * @param outputPath： 输出的HTML的文件夹
 */
const md2html = ({theme, inputPath, outputPath}) => {
    const themeStr =  fs.readFileSync(`./html-component/${theme}.css`, 'utf-8')
    const fileList = getFileList(inputPath)
    for (let i = 0; i < fileList.length; i++) {
        const item = fileList[i]
        const templateHtml = fs.readFileSync('./html-component/index.html')
        const htmlName = item.name.replace('.md','')
        const contextData = {
            title: htmlName,
            mdHtml: marked(fs.readFileSync(item.path, 'utf-8')),
            css: themeStr
        }
        const compiledHtml = templateCompile1(templateHtml, contextData)
        fs.writeFileSync(`${outputPath}/${htmlName}.html`, compiledHtml)
    }
}

md2html({
    theme: 'theme1',
    inputPath: path.resolve(__dirname, './md'),
    outputPath: path.resolve('../../docs/.vuepress/public/html')
})



