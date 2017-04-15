export default {
  'db.users.insert': afterUserCreate
};

function afterUserCreate({ name, options }, cb) {
  // console.info('afterUserCreate', name, options);
  cb();
}
