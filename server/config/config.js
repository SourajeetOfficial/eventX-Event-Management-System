module.exports = {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4000,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '30d',
    mongoURI: process.env.MONGO_URI
  };