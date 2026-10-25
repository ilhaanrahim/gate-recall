"""Rebuild source-faithful question cards from the supplied PDF books.
Requires PyMuPDF and Pillow. Original PDFs are inputs, never modified.
"""
from pathlib import Path
import fitz, re, json, shutil, sys
from PIL import Image
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
INPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'inputs'
OUT = ROOT / 'dist'
SCALE = 2.4
FLAGS = fitz.TEXTFLAGS_DICT & ~fitz.TEXT_PRESERVE_IMAGES

def lines(page):
    return [(line['bbox'], ''.join(s['text'] for s in line['spans']).strip())
            for block in page.get_text('dict', flags=FLAGS)['blocks']
            for line in block.get('lines', [])]

def save_crop(doc, pi, y0, y1, filename):
    if (OUT / filename).exists():
        with Image.open(OUT / filename) as im:
            return {'src':filename,'width':im.width,'height':im.height,'page':pi+1}
    page = doc[pi]
    clip = fitz.Rect(40, max(0,y0), page.rect.width-24, min(page.rect.height,y1))
    pix = page.get_pixmap(matrix=fitz.Matrix(SCALE,SCALE), clip=clip, alpha=False)
    im = Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    im.save(OUT / filename, 'WEBP', quality=88, method=4)
    return {'src':filename, 'width':im.width,'height':im.height,'page':pi+1}

def extract(v):
    filename = f'filter1_volume{v}.pdf'
    doc = fitz.open(INPUT / filename)
    toc = doc.get_toc()
    chapters=[]; topics=[]; chapter=None
    for level,title,page in toc:
        m = re.match(r'^(\d+) (.*?) \((\d+)\)$', title)
        t = re.match(r'^(\d+\.\d+) (.*?) \((\d+)\)$', title)
        if level==1 and m:
            chapter={'id':f'v{v}-{m[1]}','volume':v,'title':m[2],'expected':int(m[3]),'startPage':page,'notes':[]}
            chapters.append(chapter)
        elif t and chapter:
            topics.append({'id':f'v{v}-{t[1]}','sourceCode':t[1],'sourceTitle':t[2],'expected':int(t[3]),'volume':v,'page':page,'chapterId':chapter['id']})
        elif chapter and title=='Answer Keys': chapter['keyPage']=page
        elif chapter and level==2: chapter['notes'].append({'title':title,'page':page})
    all_lines = [lines(p) for p in doc]
    starts=[]
    for pi,ls in enumerate(all_lines):
        for bbox,s in ls:
            inline = re.match(r'^(\d+\.\d+\.\d+)\s+(.+GATE.+)$',s)
            if inline and bbox[0]<90:
                starts.append({'code':inline[1],'page':pi,'y':bbox[1],'header':inline[2]})
                continue
            if re.fullmatch(r'\d+\.\d+\.\d+',s) and bbox[0]<90:
                head = [t for bb,t in ls if abs(bb[1]-bbox[1])<2 and bb[0]>72 and re.search(r'GATE|ISRO|TIFR|UGC|ISI|CMI|NET|BARC|DRDO|IIIT|PGEE|JEST|NIELIT',t)]
                if head: starts.append({'code':s,'page':pi,'y':bbox[1],'header':' '.join(head)})
    keys={}; keypages={}
    for ci,c in enumerate(chapters):
        end=chapters[ci+1]['startPage']-1 if ci+1<len(chapters) else len(doc)
        for pi in range(c['keyPage']-1,end):
            txt=doc[pi].get_text()
            if pi==c['keyPage']-1: txt=txt.split('Answer Keys\n',1)[-1]
            matches=list(re.finditer(r'(?m)^(\d+\.\d+\.\d+)(?=\s|$)',txt))
            for mi,m in enumerate(matches):
                value=txt[m.end():matches[mi+1].start() if mi+1<len(matches) else len(txt)]
                keys[m[1]]=' '.join(value.split());keypages[m[1]]=pi+1
    questions=[]; issues=[]
    (OUT / f'questions/v{v}').mkdir(parents=True,exist_ok=True)
    (OUT / f'notes/v{v}').mkdir(parents=True,exist_ok=True)
    for si,start in enumerate(starts):
        qid=f'v{v}-{start["code"]}'; pi=start['page']; y=start['y']
        last=None
        next_start=starts[si+1] if si+1<len(starts) else None
        for endpi in range(pi,min(pi+8,len(doc))):
            possible=[bb[1] for bb,t in all_lines[endpi] if t.startswith('Answer key') and (endpi>pi or bb[1]>y)]
            if possible: last=(endpi,min(possible));break
        if last is None:
            issues.append({'id':qid,'issue':'No end marker'});continue
        if next_start and (last[0]>next_start['page'] or (last[0]==next_start['page'] and last[1]>next_start['y'])):
            # A few source questions omit their Answer key link; the next
            # heading is the authoritative end boundary instead.
            last=(next_start['page'],next_start['y']-2)
        parts=[];text_parts=[];tags=[]
        for spi in range(pi,last[0]+1):
            top=y-4 if spi==pi else 43
            bot=last[1]-3 if spi==last[0] else doc[spi].rect.height-40
            parts.append(save_crop(doc,spi,top,bot,f'questions/v{v}/{start["code"]}-{spi-pi}.webp'))
            chosen=[t for bb,t in all_lines[spi] if bb[1]>=top and bb[1]<bot]
            text_parts.extend(chosen)
            tags += [t for t in chosen if re.match(r'^(gate|isro|tifr|ugc|isi|cmi|net|barc|drdo|cse|da)[\w-]*',t,re.I)]
        heading=start['header'];mt=re.search(r':\s*(.*?)\s*\|\s*Question:\s*(.*)',heading)
        exam=mt[1] if mt else heading.split(':',1)[-1].split('|')[0].strip()
        qnumber=mt[2] if mt else ''
        year=re.search(r'(19\d{2}|20\d{2})',exam)
        tag=' '.join(tags)
        kind='NAT' if 'numerical-answers' in tag else 'MSQ' if 'multiple-selects' in tag else 'Descriptive' if 'descriptive' in tag else 'MCQ'
        link=next((l.get('uri') for l in doc[pi].get_links() if l.get('uri','').startswith('https://gateoverflow.in/') and abs(l['from'].y0-y)<6),None)
        answer=keys.get(start['code'])
        if answer is None: issues.append({'id':qid,'issue':'Missing key'})
        questions.append({'id':qid,'subtopicId':qid.rsplit('.',1)[0],'volume':v,'page':pi+1,'code':start['code'],'exam':exam,'paper':'CSE' if re.search(r'GATE (CSE|CS\b)',exam) else 'IT' if 'GATE IT' in exam else 'DA' if any(s in exam for s in ['GATE DA','GATE DS']) else 'Other','year':int(year[1]) if year else None,'number':qnumber,'type':kind,'marks':2 if 'two-marks' in tag else 1 if 'one-mark' in tag else None,'answer':answer,'answerPage':keypages.get(start['code']),'images':parts,'searchText':' '.join(text_parts),'discussion':link})
    for ci,c in enumerate(chapters):
        first=min(t['page'] for t in topics if t['chapterId']==c['id'])
        c['notesEndPage']=first
        for pi in range(c['startPage']-1,first):
            save_crop(doc,pi,40,doc[pi].rect.height-40,f'notes/v{v}/{pi+1}.webp')
    counts=Counter(q['subtopicId'] for q in questions)
    for t in topics:
        t['count']=counts[t['id']]
        if t['count']!=t['expected']: issues.append({'id':t['id'],'issue':'Count mismatch','actual':t['count'],'expected':t['expected']})
    (OUT/'books').mkdir(exist_ok=True)
    shutil.copy2(INPUT/filename,OUT/f'books/volume{v}.pdf')
    result={'volume':v,'pages':len(doc),'chapters':chapters,'topics':topics,'questions':questions,'issues':issues}
    (ROOT/f'content/extracted{v}.json').write_text(json.dumps(result,ensure_ascii=False))
    print(json.dumps({'volume':v,'questions':len(questions),'expected':sum(c['expected'] for c in chapters),'topics':len(topics),'issues':issues[:30]},ensure_ascii=False),flush=True)

if __name__=='__main__':
    for v in [1,2,3]: extract(v)
    shutil.copy2(INPUT/'CS_GATE2027_Syllabus(2).pdf',OUT/'books/syllabus.pdf')
