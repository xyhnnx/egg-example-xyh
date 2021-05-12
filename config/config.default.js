/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1585205294404_5120';

  // add your middleware config here
  // 这里配置了gzip中间件；会在每次刷新页面时候执行middleware/gzip方法
  // config.middleware = [ 'gzip' ];
  // config.gzip = {
  //   threshold: 1024, // 小于 1k 的响应体不压缩
  // };
  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };
  config.rundir = '/tmp';
  // 日志目录
  config.logger = {
    dir: '/tmp',
    appLogName: `${appInfo.name}-web.log`,
    coreLogName: 'egg-web.log',
    agentLogName: 'egg-agent.log',
    errorLogName: 'common-error.log',
    outputJSON: true,
  }

  // 添加 news 的配置项
  config.news = {
    pageSize: 5,
    serverUrl: 'https://hacker-news.firebaseio.com/v0',
  };
  // 添加 view 配置
  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.tpl': 'nunjucks',
    },
  };

  config.security = {
    csrf: {
      enable: false,
    },
  }

  return {
    ...config,
    ...userConfig,
  };
};
