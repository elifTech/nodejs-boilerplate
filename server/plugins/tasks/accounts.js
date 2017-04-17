export default {
  'db.accounts.insert': afterAccountCreate
};

function afterAccountCreate(service, { name, options }, cb) {
  // console.info('afterUserCreate', name, options);
  cb();
}
