export default {
  has: hasFeature
};

function hasFeature(featureId) {
  return (req, res, next) => {
    if (req.fflip.has(featureId)) {
      return next();
    }

    return res.status(403).json({ message: 'Feature turned off', feature: featureId });
  };
}
