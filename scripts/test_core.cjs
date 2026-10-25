const assert=require('node:assert/strict');const C=require('../dist/core.js');
// Actual book-key formats, including wrapping and multiple acceptable intervals.
assert.equal(C.grade('A;B;D','D;B;A','MSQ'),true);
assert.equal(C.grade('A;B;D','A;B','MSQ'),false);
assert.equal(C.grade('4.24 : 4.26','4.25','NAT'),true);
assert.equal(C.grade('4.24 : 4.26','4.3','NAT'),false);
assert.equal(C.grade('13.3:13.3;13.5:13.5','13.5','NAT'),true);
assert.equal(C.grade('N/A','A','MCQ'),null);
assert.equal(C.grade('TBA','0.3','NAT'),null);
assert.equal(C.grade('0.99','0.99','NAT'),true);
assert.equal(C.grade('B','','MCQ'),null);
assert.equal(C.grade('N/A','proof','Descriptive'),null);
const now=1700000000000;let s=C.schedule({},'good',now);assert.equal(s.due,now+3*C.DAY);s=C.schedule(s,'hard',now);assert.equal(s.interval,4);s=C.schedule(s,'again',now);assert.equal(s.due,now+600000);assert.equal(s.reviews,3);
assert.throws(()=>C.safeProgress({state:{}},new Set(),new Set()));
const imported=C.safeProgress({app:'gate-recall',version:1,state:{questions:{q1:{note:'x'.repeat(20000),draft:'A',result:'correct',due:now,flag:true},malicious:{note:'bad'}},cards:{t1:{rating:'easy',reviews:4}},settings:{hideRecent:true},sessions:[{date:'2026-10-25',count:2},{date:'junk',count:7}]}},new Set(['q1']),new Set(['t1']));assert.equal(imported.questions.q1.note.length,10000);assert.equal(imported.questions.malicious,undefined);assert.equal(imported.sessions.length,1);assert.equal(imported.cards.t1.rating,'easy');console.log('Core checks passed: MCQ/MSQ/NAT, missing keys, review dates and backup validation.');
