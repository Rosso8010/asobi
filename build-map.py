import json, math
from pathlib import Path
root=Path(__file__).resolve().parent
d=json.loads((root/'japan-source.topojson').read_text(encoding='utf-8'))
tr=d['transform']; arcs=[]
for arc in d['arcs']:
 x=y=0; pts=[]
 for dx,dy in arc:
  x+=dx;y+=dy;pts.append([x*tr['scale'][0]+tr['translate'][0],y*tr['scale'][1]+tr['translate'][1]])
 arcs.append(pts)
def simplify(p,eps=.018):
 if len(p)<3:return p
 ax,ay=p[0];bx,by=p[-1];den=(bx-ax)**2+(by-ay)**2
 def dist(q):
  t=max(0,min(1,((q[0]-ax)*(bx-ax)+(q[1]-ay)*(by-ay))/den)) if den else 0
  return math.hypot(q[0]-ax-t*(bx-ax),q[1]-ay-t*(by-ay))
 ds=[dist(q) for q in p];idx=max(range(len(ds)),key=ds.__getitem__)
 if ds[idx]<=eps:return [p[0],p[-1]]
 return simplify(p[:idx+1],eps)[:-1]+simplify(p[idx:],eps)
names='北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県'.split()
readings='ほっかいどう あおもりけん いわてけん みやぎけん あきたけん やまがたけん ふくしまけん いばらきけん とちぎけん ぐんまけん さいたまけん ちばけん とうきょうと かながわけん にいがたけん とやまけん いしかわけん ふくいけん やまなしけん ながのけん ぎふけん しずおかけん あいちけん みえけん しがけん きょうとふ おおさかふ ひょうごけん ならけん わかやまけん とっとりけん しまねけん おかやまけん ひろしまけん やまぐちけん とくしまけん かがわけん えひめけん こうちけん ふくおかけん さがけん ながさきけん くまもとけん おおいたけん みやざきけん かごしまけん おきなわけん'.split()
out=[]
for g in next(iter(d['objects'].values()))['geometries']:
 i=g['properties']['id'];polys=g['arcs'] if g['type']=='MultiPolygon' else [g['arcs']];rings=[]
 for poly in polys:
  points=[]
  for a in poly[0]:points.extend(arcs[a] if a>=0 else list(reversed(arcs[~a])))
  if len(points)<3:continue
  area=abs(sum(points[j-1][0]*p[1]-p[0]*points[j-1][1] for j,p in enumerate(points)))/2
  if area<.003:continue
  points=simplify(points)
  if len(points)<4:continue
  # A compact geographic projection; Okinawa is shown in an explicitly labelled inset.
  projected=[[(p[0]-128)*45,(46-p[1])*55] for p in points]
  if i==47:projected=[[(p[0]-126)*30+35,(29-p[1])*35+585] for p in points]
  rings.append([[round(x,1),round(y,1)] for x,y in projected])
 assert rings,(i,'missing geometry')
 out.append({'id':'jp-'+str(i).zfill(2),'code':i,'name':names[i-1],'reading':readings[i-1],'rings':rings})
assert len(out)==47 and len({p['id'] for p in out})==47
(root/'japan-map.js').write_text('window.JAPAN_MAP='+json.dumps(sorted(out,key=lambda p:p['code']),ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('map prefectures',len(out),'bytes',(root/'japan-map.js').stat().st_size)
