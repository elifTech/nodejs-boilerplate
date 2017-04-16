export default {
  'db.accounts.insert': afterAccountCreate
};

function afterAccountCreate({ name, options }, cb) {
  // console.info('afterUserCreate', name, options);
  cb();
}
