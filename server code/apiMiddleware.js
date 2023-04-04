const ApiReport = require('./apiReport');

const apiReportMiddleware = (req, res, next) => {
  // Call next() to pass control to the next middleware or route handler
  next();

  // Use res.on('finish') to record the response data after it has been sent
  res.on('finish', async () => {
    const logEntry = new ApiReport({
      username: req.user.username,
      timestamp: new Date(),
      endpoint: req.url,
      http_method: req.method,
      status_code: res.statusCode
    });

    try {
      const entry = await logEntry.save();
      console.log('API log entry saved:', entry);
    } catch (err) {
      console.error('Error saving API log entry:', err);
    }
  });
};

module.exports = apiReportMiddleware;

