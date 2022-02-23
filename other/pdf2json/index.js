/**
 * pdf2json的简单用法
 * 参考链接
 * https://github.com/modesty/pdf2json
 */

const fs = require('fs')
const path = require('path')
const PDFParser = require("pdf2json");

const index = async () => {
  const pdfParser = new PDFParser();
  pdfParser.loadPDF("./test-origin.pdf");
  pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
  pdfParser.on("pdfParser_dataReady", pdfData => {
    pdfData.Pages.forEach(e => {
      if(e.Texts && e.Texts.length) {
        e.Texts.forEach(e2 => {
          if(e2.R && e2.R.length) {
            e2.R.forEach(e3 => {
              console.log(decodeURI(e3.T))
            })
          }
        })
      }
    })
  });

}
index()
