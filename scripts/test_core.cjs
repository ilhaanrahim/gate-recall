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
// Initials survive old and new backups; invalid input cannot enter the profile.
assert.equal(C.normalizeInitials(' ir '),'IR');
assert.equal(C.normalizeInitials('é2'),'É2');
assert.equal(C.normalizeInitials('GR!!'),null);
assert.equal(C.normalizeInitials(''),null);
const oldBackup=C.safeProgress({app:'gate-recall',version:1,state:{questions:{q1:{note:'keep this note'}},settings:{hideRecent:true}}},new Set(['q1']),new Set());
assert.equal(oldBackup.questions.q1.note,'keep this note');
assert.equal(oldBackup.settings.initials,undefined);
const newBackup=C.safeProgress({app:'gate-recall',version:1,state:{settings:{initials:' il ',initialsUpdated:now}}},new Set(),new Set());
assert.equal(newBackup.settings.initials,'IL');
assert.equal(newBackup.settings.initialsUpdated,now);
assert.equal(C.safeProgress({app:'gate-recall',version:1,state:{settings:{initials:'<img>'}}},new Set(),new Set()).settings.initials,undefined);
// Notes are grouped by subject, preserving question links and full text; blanks and unknown IDs are ignored.
const questions=new Map([['q1',{id:'q1',subtopicId:'t1'}],['q2',{id:'q2',subtopicId:'t2'}],['q3',{id:'q3',subtopicId:'t1'}]]);
const topics=new Map([['t1',{subject:'Math'}],['t2',{subject:'OS'}]]);
const journal=C.questionNotesBySubject({q1:{note:'line 1\nline 2',updated:1},q2:{note:'OS note',updated:2},q3:{note:'newer',updated:3},unknown:{note:'orphan'},blank:{note:'  '}},questions,topics,['Math','OS']);
assert.deepEqual(journal.map(group=>[group.subject,group.notes.map(entry=>entry.question.id)]),[['Math',['q3','q1']],['OS',['q2']]]);
assert.equal(journal[0].notes[1].note,'line 1\nline 2');
console.log('Profile and notes checks passed: legacy backups, initials validation and subject grouping.');
