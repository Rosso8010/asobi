const assert=require('assert'),C=require('./clock-game.js');
assert.equal(C.parse('5:20'),320);assert.equal(C.parse('15:40'),940);assert.equal(C.parse('23:55'),1435);for(const value of ['24:00','5:61','5:21','abc','-1:00'])assert.equal(C.parse(value),null);
let m=C.model(320,315);m.press();m.shift(1);assert.equal(m.value(),320);assert.equal(m.check(10000),false,'holding must not win');m.release(10000);assert.equal(m.check(11999),false);assert.equal(m.progress(11000),.5);assert.equal(m.check(12000),true);assert.equal(m.check(12001),false,'duplicate success');
m=C.model(940,220);m.release(0);assert.equal(m.check(5000),false,'3:40 is not 15:40');
m=C.model(0,1435);m.press();m.shift(1);m.release(50);assert.equal(m.value(),0);assert.equal(m.angles().minute,8640);assert.equal(m.angles().hour,720);assert.equal(m.check(2050),true);
m=C.model(1435,0);m.shift(-1);assert.equal(m.value(),1435);assert.equal(m.angles().minute,-30);assert.equal(m.angles().hour,-2.5);
m=C.model(320,315);m.shift(1);m.release(0);assert.equal(m.progress(1500),.75);m.press();m.shift(1);m.release(1500);assert.equal(m.check(10000),false);m.press();m.shift(-1);m.release(10000);assert.equal(m.check(11999),false);assert.equal(m.check(12000),true,'must settle again after moving');
for(let target=0;target<1440;target+=5){m=C.model(target,target-60);for(let i=0;i<12;i++)m.shift(1);assert.equal(m.value(),target);assert.equal((m.angles().hour%360+360)%360,(target*.5)%360);m.release(0);assert.equal(m.check(1999),false);assert.equal(m.check(2000),true);}
console.log('PASS clock: 288 targets, coupled hands, midnight wrap, AM/PM, hold exclusion, two-second settle and reset');
