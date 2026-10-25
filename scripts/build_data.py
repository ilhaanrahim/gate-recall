"""Assemble validated static catalogue and offline manifest; no network calls."""
from pathlib import Path
import json,re,collections
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'dist'
order=[('Engineering Mathematics','Discrete mathematics: logic, sets, relations, functions, partial orders, lattices, monoids, groups, graphs and combinatorics. Linear algebra, calculus, probability and statistics.'),('Digital Logic','Boolean algebra and minimization: algebraic technique, Karnaugh map and tabular method. Combinational and sequential circuits. Fixed and floating-point number representation and arithmetic.'),('Computer Organization and Architecture','Instruction sets and addressing modes. ALU and control units. Memory interfacing and hierarchy, cache mapping and performance. Interrupts and DMA. Pipelining and hazards.'),('Programming and Data Structures','Programming in C and recursion. Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps and graphs.'),('Algorithms','Searching, sorting, hashing, asymptotic worst-case time and space complexity. Greedy, dynamic programming and divide-and-conquer. Graph traversals, MSTs and shortest paths.'),('Theory of Computation','Regular expressions and finite automata. CFGs, PDAs, regular and context-free languages, pumping lemma. Turing machines and undecidability.'),('Compiler Design','Lexical analysis, parsing, syntax-directed translation, runtime environments and intermediate code. Local optimization, constant propagation, liveness and common-subexpression elimination.'),('Operating System','System calls, processes, threads, IPC, concurrency, synchronization and deadlock. CPU and I/O scheduling. Memory, virtual memory and file systems.'),('Databases','ER and relational models, relational algebra, tuple calculus and SQL. Constraints and normal forms. File organization, indexing, B/B+ trees, transactions and concurrency control.'),('Computer Networks','Layering, switching and performance. Error detection, MAC and Ethernet. Distance-vector and link-state routing. IPv4, fragmentation, CIDR and NAT. TCP flow/congestion control, sockets, DNS and HTTP.'),('General Aptitude','Additional coverage from your books: quantitative, analytical, spatial and verbal aptitude. This section is separate from the supplied two-page CS syllabus.')]
topics=[];questions=[];volumes=[];allnotes={}
for v in (1,2,3):
 raw=json.loads((ROOT/f'content/extracted{v}.json').read_text());notes=json.loads((ROOT/f'content/volume{v}.json').read_text())
 noteMap={x['id']:x for x in notes}
 assert len(noteMap)==len(raw['topics']),(v,len(noteMap),len(raw['topics']))
 assert not raw['issues'],raw['issues']
 for source in raw['topics']:
  assert source['id'] in noteMap,source['id']
  t={**source,**noteMap[source['id']]}
  assert t['subject'] in [x[0] for x in order],t['subject']
  for k in ('title','group','cue','theory','recall','pitfall','originalNotes'):assert t.get(k),(t['id'],k)
  assert isinstance(t['theory'],list) and len(t['theory'])>=2,t['id']
  for p in range(t['originalNotes']['startPage'],t['originalNotes']['endPage']+1):assert (OUT/f'notes/v{v}/{p}.webp').exists(),(t['id'],p)
  topics.append(t)
 for q in raw['questions']:
  if 'Practice' in q['exam']:q['paper']='Practice';q['year']=None
  # Keep source classifications, but identify multiple-select keys reliably.
  if q['type']=='MCQ' and re.fullmatch(r'[A-E](?:\s*[;,]\s*[A-E])+',q['answer'] or ''):q['type']='MSQ'
  for im in q['images']:assert (OUT/im['src']).exists(),q['id']
  questions.append(q)
 volumes.append({'volume':v,'pages':raw['pages'],'count':len(raw['questions'])})
assert len(questions)==len({q['id'] for q in questions})==3823
assert len(topics)==472
# The source topic names are retained for traceability and search.
years=[q['year'] for q in questions if q['year']]
data={'version':1,'subjects':[{'name':n,'syllabus':s} for n,s in order],'topics':topics,'questions':questions,'meta':{'minYear':min(years),'maxYear':max(years),'volumes':volumes,'date':'2026-10-25','sourceQuestionEntries':len(questions),'corrections':sum(bool(t.get('correction')) for t in topics)}}
(OUT/'data').mkdir(exist_ok=True)
(OUT/'data/catalog.js').write_text('window.GATE_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
assets=[]
for folder in ['questions','notes','books']:
 for p in sorted((OUT/folder).rglob('*')):
  if p.is_file():assets.append({'path':p.relative_to(OUT).as_posix(),'bytes':p.stat().st_size})
(OUT/'data/assets.js').write_text('window.GATE_ASSETS='+json.dumps(assets,separators=(',',':'))+';\n')
print(json.dumps({'questions':len(questions),'topics':len(topics),'subjects':len(order),'papers':dict(collections.Counter(q['paper'] for q in questions)),'types':dict(collections.Counter(q['type'] for q in questions)),'years':[min(years),max(years)],'corrections':data['meta']['corrections'],'assetMB':round(sum(a['bytes'] for a in assets)/1048576,1),'assets':len(assets)}))
