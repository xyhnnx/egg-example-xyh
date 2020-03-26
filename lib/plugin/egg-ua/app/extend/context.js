// app/extend/context.js
'use strict';
module.exports = {
  //  this.ctx.isIOS可以访问到这个的值
  get isIOS() {
    const iosReg = /iphone|ipad|ipod/i;
    return iosReg.test(this.get('user-agent'));
  },
};
