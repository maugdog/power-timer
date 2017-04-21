const moment = require('moment-timezone');
const tools = require('./tools.js'); // Load misc tools
const config = require('./config');
const util = require('util');

const powerSwitch = config.powerSwitch;
const startTime = '21:20:00';
const endTime = '21:25:00';

const overnightMode = moment(startTime, 'H:mm:ss').unix() > moment(endTime, 'H:mm:ss').unix();

function currentlyInTimeWindow() {
  const start = moment(startTime, 'H:mm:ss').unix();
  const end = moment(endTime, 'H:mm:ss').unix();
  const now = moment().unix();

  return overnightMode ? (now > start || now < end) : (now > start && now < end);
}

const interval = setInterval(function () {
  const shouldBeOn = currentlyInTimeWindow();
  console.log('Checking: ', moment().format('M/D/YYYY H:mm:ss'));
  if(powerSwitch.isOn && !shouldBeOn) {
    console.log(`Turning switch off: ${moment().format('M/D/YYYY H:mm:ss')}`);
    powerSwitch.setOff();
  } else if(!powerSwitch.isOn && shouldBeOn) {
    console.log(`Turning switch on: ${moment().format('M/D/YYYY H:mm:ss')}`);
    powerSwitch.setOn();
  }
}, 1000);

console.log(`Interval started with start/end: ${startTime}/${endTime}`);

/***********************************************/
/*************** GRACEFUL EXIT *****************/
/***********************************************/

const exitHandler = function(options, err) {
  clearInterval(interval);
  powerSwitch.destroy();

  if (options.cleanup) console.log('clean');
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
};

process.on('exit', exitHandler.bind(null,{cleanup:true})); // Handle app close events
process.on('SIGINT', exitHandler.bind(null, {exit:true})); // Catches ctrl+c event
process.on('uncaughtException', exitHandler.bind(null, {exit:true})); // Catches uncaught exceptions
