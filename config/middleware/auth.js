import Account from '../../server/models/accounts';

export default
function authMiddleware(req, res, next) {
  if (!req.auth || !req.auth._id) {
    return next();
  }

  return Account.findById(req.auth._id).then((user) => {
    if (!user) {
      return next();
    }
    return next(null, user);
  }, err => next(err));
}
