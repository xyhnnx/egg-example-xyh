'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  // 这里指定某个路由单独调用gizp中间件
  // const gzip = app.middleware.gzip({ threshold: 1024 });
  // router.get('/needgzip', gzip, controller.news.list);
  router.get('/news', controller.news.list);
  router.get('/new-detail', controller.news.detail);
  router.post('/new-detail', controller.news.editData);
  router.get('/images', controller.images.list);
  router.get('/page-images', controller.images.getPageImages);
  // router.post('createPost', '/api/posts', controller.post.create);
};
