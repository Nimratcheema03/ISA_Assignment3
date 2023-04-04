const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const apiReportSchema = new Schema({
 username: String,
  timestamp: Date,
  endpoint: String,
  http_method: String,
  status_code: Number,
  response_time: Number

});

const ApiReport = mongoose.model('ApiReport', apiReportSchema);

module.exports = ApiReport;
