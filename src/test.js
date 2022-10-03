var rpio = require('rpio');
rpio.init({
  gpiomem: true,
  mapping: 'physical',
  close_on_exit: true
});
rpio.open(29, rpio.INPUT, rpio.PULL_DOWN);
rpio.open(31, rpio.INPUT, rpio.PULL_DOWN);
rpio.open(33, rpio.INPUT, rpio.PULL_DOWN);

setInterval(() => {
  console.log('pin 29 >>> ', rpio.read(29));
  console.log('pin 31 >>> ', rpio.read(31));
  console.log('pin 33 >>> ', rpio.read(33));
}, 100);
