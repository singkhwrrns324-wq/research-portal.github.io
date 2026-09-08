/* Research Repository - Google Sheets integrated front-end */

const FALLBACK = [
  {
    id:'SD-001', title:'หายหายหสญสบสห', author:'หจาจหาหจาจไาหยนห', year:'2024', source:'sbsbbsbsbd', link:'ฟรืรหืนห่นห่ตห่ห',
    faculty:'', field:'', category:'', tags:[], date:'9/8/2026',
    reviewer:'', accreditation:'', methodology:'', reviewResult:'', related:'', checked:false
  }
];

let DATA = [];
let PROPOSED = [];
let DATA_SOURCE = 'fallback';
const S={q:'',year:'ทั้งหมด',faculty:'ทั้งหมด',field:'ทั้งหมด',category:'ทั้งหมด',sort:'new'};

const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]));
const clean=s=>String(s??'').trim();
const lower=s=>clean(s).toLocaleLowerCase('th-TH');
const truthy=v=>['true','1','yes','y','ใช่','เสร็จแล้ว','ตรวจสอบแล้ว'].includes(lower(v));
const validUrl=v=>/^https?:\/\//i.test(clean(v));

function csvUrl(sheet){
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_CONFIG.spreadsheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
}

function parseCSV(text){
  const rows=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], next=text[i+1];
    if(ch==='"'){
      if(quoted && next==='"'){cell+='"'; i++;}
      else quoted=!quoted;
    } else if(ch===',' && !quoted){row.push(cell);cell='';}
    else if((ch==='\n'||ch==='\r') && !quoted){
      if(ch==='\r'&&next==='\n')i++;
      row.push(cell); cell='';
      if(row.some(x=>clean(x)!==''))rows.push(row);
      row=[];
    } else cell+=ch;
  }
  if(cell!==''||row.length){row.push(cell);if(row.some(x=>clean(x)!==''))rows.push(row)}
  return rows;
}

function headerMap(headers){
  const m={}; headers.forEach((h,i)=>m[clean(h)]=i); return m;
}
function val(row,map,...names){
  for(const n of names){ if(map[n]!==undefined) return clean(row[map[n]]); }
  return '';
}
function rowsFromCSV(text){
  const rows=parseCSV(text); if(!rows.length)return [];
  const map=headerMap(rows[0]);
  return rows.slice(1).map(r=>({r,map}));
}

async function fetchSheet(name){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const res=await fetch(csvUrl(name),{signal:controller.signal,cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const text=await res.text();
    if(text.trim().startsWith('<!DOCTYPE')||text.includes('Sign in to continue')) throw new Error('Sheet is not publicly readable');
    return text;
  } finally { clearTimeout(timer); }
}

function mapResearch(text){
  return rowsFromCSV(text).map(({r,map})=>({
    id:val(r,map,'ID งานวิจัย'),
    title:val(r,map,'ชื่องานวิจัย'),
    author:val(r,map,'ชื่อผู้แต่ง/คณะผู้แต่ง','ผู้แต่ง/คณะผู้แต่งวิจัย','ผู้แต่ง/คณะผู้แต่งงานวิจัย'),
    year:val(r,map,'ปีที่เผยแพร่'),
    source:val(r,map,'แหล่งที่มา/วารสาร (URL)','ลิงค์แหล่งที่มา'),
    link:val(r,map,'ลิงค์งานวิจัย'),
    date:val(r,map,'วันที่นำเอกสารเข้า'),
    faculty:'', field:'', category:'', tags:[],
    reviewer:'', accreditation:'', methodology:'', reviewResult:'', related:'', checked:false
  })).filter(r=>r.id||r.title);
}
function mapVerification(text){
  const out={};
  rowsFromCSV(text).forEach(({r,map})=>{
    const id=val(r,map,'ID งานวิจัย');
    const title=val(r,map,'ชื่องานวิจัย');
    const key=id||title;
    if(!key)return;
    out[key]={
      id,title,
      author:val(r,map,'ผู้แต่ง/คณะผู้แต่งงานวิจัย','ชื่อผู้แต่ง/คณะผู้แต่ง','ผู้แต่ง/คณะผู้แต่งวิจัย'),
      link:val(r,map,'ลิงค์งานวิจัย'),
      reviewer:val(r,map,'ผู้ตรวจ'),
      accreditation:val(r,map,'เกณฑ์ประเมิน : การรับรอง (ผ่าน (วารสาร TCI กลุ่ม 1))','เกณฑ์ประเมิน : การรับรอง','การรับรอง'),
      methodology:val(r,map,'เกณฑ์การประเมิน : ระเบียบวิธีวิจัย/ระบุตัวอย่าง','เกณฑ์การประเมิน : ระเบียบวิจัย/ระบุตัวอย่าง','ระเบียบวิธีวิจัย/ระบุตัวอย่าง'),
      reviewResult:val(r,map,'ผลการตรวจสอบ'),
      faculty:val(r,map,'เกี่ยวข้องกับคณะ'),
      field:val(r,map,'เกี่ยวข้องกับสาขา'),
      related:'',
      checked:truthy(val(r,map,'สถานะการตรวจสอบ'))
    };
  });
  return out;
}
function mapProposed(text){
  return rowsFromCSV(text).map(({r,map})=>({
    id:val(r,map,'ID งานวิจัย'),
    title:val(r,map,'ชื่องานวิจัย'),
    author:val(r,map,'ผู้แต่ง/คณะผู้แต่งวิจัย','ชื่อผู้แต่ง/คณะผู้แต่ง'),
    link:val(r,map,'ลิงค์งานวิจัย'),
    source:val(r,map,'ลิงค์แหล่งที่มา'),
    faculty:val(r,map,'คณะที่เกี่ยวข้องกับงานวิจัย','เกี่ยวข้องกับคณะ'),
    field:val(r,map,'สาขาที่เกี่ยวข้องกับงานวิจัย','เกี่ยวข้องกับสาขา'),
    category:''
  })).filter(r=>r.id||r.title);
}

async function loadData(){
  try{
    const [research, verification, proposed]=await Promise.all([
      fetchSheet(SHEET_CONFIG.sheets.research),fetchSheet(SHEET_CONFIG.sheets.verification),fetchSheet(SHEET_CONFIG.sheets.proposed)
    ]);
    const mapped=mapResearch(research), checks=mapVerification(verification);
    const p=mapProposed(proposed);
    mapped.forEach(r=>{
      const check=checks[r.id]||checks[r.title]||{};
      const proposal=p.find(x=>x.id===r.id||(!r.id && x.title===r.title))||{};
      Object.assign(r,check);
      if(!r.faculty) r.faculty=proposal.faculty||'';
      if(!r.field) r.field=proposal.field||'';
      if(!r.source) r.source=proposal.source||'';
      if(!r.link) r.link=proposal.link||'';
    });
    if(mapped.length){DATA=mapped;PROPOSED=p;DATA_SOURCE='google';}
    else throw new Error('No research rows');
  }catch(err){
    DATA=FALLBACK; PROPOSED=FALLBACK; DATA_SOURCE='fallback';
    console.warn('Google Sheets unavailable; using bundled fallback data.',err);
  }
  render();
}

function years(){return ['ทั้งหมด',...new Set(DATA.map(r=>r.year).filter(Boolean))].sort((a,b)=>a==='ทั้งหมด'?-1:b==='ทั้งหมด'?1:String(b).localeCompare(String(a),'th'))}
function faculties(){return ['ทั้งหมด',...new Set(DATA.map(r=>r.faculty).filter(Boolean))]}
function fields(){return ['ทั้งหมด',...new Set(DATA.map(r=>r.field).filter(Boolean))]}
function categoriesList(){return ['ทั้งหมด',...new Set(DATA.map(r=>r.category).filter(Boolean))]}
function opts(arr,sel){return arr.map(x=>`<option value="${esc(x)}" ${x===sel?'selected':''}>${esc(x)}</option>`).join('')}
function results(){
 let a=DATA.filter(r=>{
   const q=lower(S.q), hay=[r.title,r.author,r.faculty,r.field,r.category,r.source,r.related,r.reviewResult].join(' ').toLocaleLowerCase('th-TH');
   return (!q||hay.includes(q))&&(S.year==='ทั้งหมด'||r.year===S.year)&&(S.faculty==='ทั้งหมด'||r.faculty===S.faculty)&&(S.field==='ทั้งหมด'||r.field===S.field)&&(S.category==='ทั้งหมด'||r.category===S.category);
 });
 if(S.sort==='new')a.sort((x,y)=>String(y.year).localeCompare(String(x.year),'th'));
 if(S.sort==='old')a.sort((x,y)=>String(x.year).localeCompare(String(y.year),'th'));
 if(S.sort==='az')a.sort((x,y)=>String(x.title).localeCompare(String(y.title),'th'));
 return a;
}
function status(r){return r.checked?'ตรวจสอบแล้ว':'อยู่ระหว่างการตรวจสอบ'}
function statusClass(r){return r.checked?'ok':'pending'}
function card(r){return `<button class="research" data-id="${esc(r.id)}"><span class="doc">▤</span><span class="rbody"><span class="rtitle">${esc(r.title||'ไม่ระบุชื่อเรื่อง')}</span><span class="meta">${esc(r.author||'ไม่ระบุผู้แต่ง')} &nbsp;|&nbsp; ${esc(r.faculty||'ไม่ระบุคณะ')} &nbsp;|&nbsp; ปี ${esc(r.year||'-')}</span><span class="tags">${[r.category,r.field].filter(Boolean).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</span></span><span class="go">›</span></button>`}
function searchBox(){return `<div class="searchbox"><input id="pageQuery" value="${esc(S.q)}" placeholder="พิมพ์คำสำคัญ ชื่อเรื่อง ผู้แต่ง หรือหัวข้อที่สนใจ..."><button id="doSearch">⌕ &nbsp;ค้นหา</button></div>`}
function shellHome(){
 const list=results().slice(0,4);
 const recommended=PROPOSED.filter(x=>x.title).slice(0,3);
 return `<section class="hero"><div><div class="hero-kicker">RESEARCH REPOSITORY</div><h1>แหล่งรวมงานวิจัยสำหรับนิสิตมหาวิทยาลัย</h1><p>ค้นหางานวิจัย ข้อมูลวิชาการ และแหล่งความรู้ พร้อมดูผลการตรวจสอบเพื่อช่วยประกอบการตัดสินใจเลือกแหล่งอ้างอิง</p></div><div class="illustration"><div class="cap"></div><div class="books"><div class="book"></div><div class="book"></div><div class="book"></div></div><div class="glass"></div></div></section>
 <div class="layout"><div><section class="card search-panel"><div class="title-row"><h2>⌕ &nbsp;ค้นหางานวิจัย</h2><span class="data-badge">${DATA_SOURCE==='google'?'● เชื่อมต่อ Google Sheets':'● ข้อมูลสำรอง'}</span></div>${searchBox()}<div class="filters"><div class="field"><label>ปีที่เผยแพร่</label><select id="year">${opts(years(),S.year)}</select></div><div class="field"><label>คณะ</label><select id="faculty">${opts(faculties(),S.faculty)}</select></div><div class="field"><label>สาขาวิชา</label><select id="field">${opts(fields(),S.field)}</select></div><button class="sort" id="sort">☷ เรียงลำดับ</button></div></section>
 <section class="card list-panel"><div class="title-row"><h2>▤ &nbsp;รายการงานวิจัย</h2><button class="sort" data-href="#search">ดูทั้งหมด →</button></div><div class="list">${list.length?list.map(card).join(''):`<div class="empty">ยังไม่มีข้อมูลที่ตรงกับการค้นหา</div>`}</div></section>
 <section class="card list-panel"><div class="title-row"><h2>★ &nbsp;งานวิจัยที่เสนอ</h2><button class="sort" data-href="#search">ค้นหางานวิจัย →</button></div><div class="list">${recommended.length?recommended.map(r=>`<div class="recommend"><div><b>${esc(r.title)}</b><small>${esc(r.author||'')} ${r.category?`• ${esc(r.category)}`:''}</small></div>${validUrl(r.link)?`<a href="${esc(r.link)}" target="_blank" rel="noopener">เปิดแหล่งข้อมูล ↗</a>`:''}</div>`).join(''):`<div class="empty">ยังไม่มีรายการเสนอ</div>`}</div></section></div>${sidebar()}</div>`
}
function sidebar(){
 const cats=categoriesList().filter(x=>x!=='ทั้งหมด').slice(0,6);
 return `<aside class="side"><section class="card side-card"><h3>▤ ค้นหาตามหมวดหมู่</h3><div class="cat-list">${cats.length?cats.map(c=>`<button class="cat" data-cat="${esc(c)}"><span>▣ &nbsp;${esc(c)}</span><b>›</b></button>`).join(''):`<div class="muted">ยังไม่มีหมวดหมู่</div>`}</div></section><section class="card side-card"><h3>✓ สถานะการตรวจสอบ</h3><div class="notice"><b>${DATA.filter(r=>r.checked).length} งานวิจัย</b><small>ตรวจสอบเสร็จแล้ว</small></div><div class="notice"><b>${DATA.filter(r=>!r.checked).length} งานวิจัย</b><small>อยู่ระหว่างการตรวจสอบ</small></div></section><section class="card side-card quote"><div class="quote-icon">▣</div><p>“เพราะงานวิจัย...คือก้าวสำคัญของการพัฒนาความรู้”</p></section></aside>`
}
function searchPage(){
 const a=results();
 return `<div class="pagehead"><div class="crumb">หน้าหลัก / ค้นหางานวิจัย</div><h1>ค้นหางานวิจัย</h1><p>ค้นหาและคัดกรองงานวิจัยตามข้อมูลจากคลังงานวิจัย</p></div><div class="search-layout"><section class="card results">${searchBox()}<div class="result-count">พบงานวิจัย ${a.length} รายการ</div><div class="list">${a.length?a.map(card).join(''):`<div class="empty">ไม่พบงานวิจัยที่ตรงกับคำค้นหา<br>ลองเปลี่ยนคำค้นหาหรือปรับตัวกรอง</div>`}</div></section><aside class="card filter"><h3>คัดกรอง</h3><div class="field"><label>ปี</label><select id="year">${opts(years(),S.year)}</select></div><div class="field"><label>คณะ</label><select id="faculty">${opts(faculties(),S.faculty)}</select></div><div class="field"><label>สาขาวิชา</label><select id="field">${opts(fields(),S.field)}</select></div><div class="field"><label>หมวดหมู่</label><select id="category">${opts(categoriesList(),S.category)}</select></div><div class="field"><label>เรียงตาม</label><select id="sortSelect"><option value="new" ${S.sort==='new'?'selected':''}>ใหม่ → เก่า</option><option value="old" ${S.sort==='old'?'selected':''}>เก่า → ใหม่</option><option value="az" ${S.sort==='az'?'selected':''}>ชื่อเรื่อง A → Z</option></select></div><button class="clear" id="clear">ล้างตัวกรองทั้งหมด</button></aside></div>`
}
function detail(id){
 const r=DATA.find(x=>x.id===id)||DATA[0];
 if(!r)return `<div class="empty">ไม่พบงานวิจัย</div>`;
 const sourceLink=validUrl(r.source)?r.source:(validUrl(r.link)?r.link:'');
 return `<div class="pagehead"><div class="crumb">หน้าหลัก / ค้นหางานวิจัย / รายละเอียดงานวิจัย</div></div><div class="detail-layout"><article class="card detail"><div class="idline">ID งานวิจัย: <b>${esc(r.id||'-')}</b></div><h1>${esc(r.title||'ไม่ระบุชื่อเรื่อง')}</h1><div class="detail-meta">${esc(r.author||'ไม่ระบุผู้แต่ง')} &nbsp;|&nbsp; ปีที่เผยแพร่ ${esc(r.year||'-')} &nbsp;|&nbsp; ${esc(r.faculty||'ไม่ระบุคณะ')}</div>${sourceLink?`<a class="source" href="${esc(sourceLink)}" target="_blank" rel="noopener">↗ เปิดแหล่งที่มา / งานวิจัยต้นฉบับ</a>`:`<span class="source disabled">ยังไม่มีลิงก์ต้นฉบับ</span>`}<div class="abstract"><div><b>สรุปผลการตรวจสอบ</b><p>${esc(r.reviewResult||'ยังไม่มีผลการตรวจสอบ')}</p></div></div><div class="details"><section class="detail-block"><h3>ข้อมูลของงานวิจัย</h3><p>ผู้แต่ง: ${esc(r.author||'-')}<br>ปีที่เผยแพร่: ${esc(r.year||'-')}<br>คณะ: ${esc(r.faculty||'-')}<br>สาขา: ${esc(r.field||'-')}</p></section><section class="detail-block"><h3>ผลการตรวจสอบ</h3><p>${esc(r.reviewResult||'ยังไม่มีผลการตรวจสอบ')}</p></section><section class="detail-block"><h3>แหล่งที่มา / วารสาร</h3><p>${esc(r.source||'ยังไม่มีข้อมูล')}</p></section></div></article><aside class="verify"><section class="card verify-card"><div class="face">▣</div><h3>รูปภาพผู้วิจัย</h3><div class="muted">ยังไม่มีรูปภาพในข้อมูลที่เชื่อมต่อ</div></section><section class="card verify-card"><h3>ข้อมูลการตรวจสอบ</h3><div class="vrow"><span>ผู้ตรวจสอบ</span><b>${esc(r.reviewer||'ยังไม่ระบุ')}</b></div><div class="vrow"><span>สถานะ</span><span class="${statusClass(r)}">${r.checked?'✓ ตรวจสอบเสร็จแล้ว':'◷ ยังตรวจสอบไม่เสร็จ'}</span></div></section><section class="card verify-card"><h3>เกณฑ์การตรวจสอบ</h3><div class="checks"><div><span class="checkmark">${esc(r.accreditation||'—')}</span> การรับรอง / แหล่งตีพิมพ์</div><div><span class="checkmark">${esc(r.methodology||'—')}</span> ระเบียบวิธีวิจัย / การระบุตัวอย่าง</div></div></section></aside></div>`
}
function categories(){
 const cats=categoriesList().filter(x=>x!=='ทั้งหมด');
 return `<div class="pagehead"><div class="crumb">หน้าหลัก / หมวดหมู่</div><h1>หมวดหมู่งานวิจัย</h1><p>เลือกหมวดหมู่จากข้อมูลที่มีอยู่ใน Google Sheets</p></div><div class="category-grid">${cats.length?cats.map(c=>`<button class="card category-card" data-cat="${esc(c)}"><div class="sym">▣</div><h3>${esc(c)}</h3><p>${DATA.filter(r=>r.category===c).length} งานวิจัย</p></button>`).join(''):`<div class="empty">ยังไม่มีข้อมูลหมวดหมู่</div>`}</div>`
}
function about(){
 return `<div class="pagehead"><div class="crumb">หน้าหลัก / เกี่ยวกับเรา</div><h1>เกี่ยวกับเว็บไซต์</h1><p>พื้นที่กลางสำหรับการค้นคว้างานวิจัยของนิสิตมหาวิทยาลัย</p></div><div class="about-grid"><section class="card about"><h2>แหล่งรวมงานวิจัยสำหรับนิสิตมหาวิทยาลัย</h2><p>เว็บไซต์นี้เชื่อมข้อมูลจาก Google Sheets เพื่อให้รายการงานวิจัยและผลการตรวจสอบสามารถปรับปรุงได้โดยไม่ต้องแก้โค้ดหน้าเว็บทุกครั้ง</p><div class="features"><div class="feature"><i class="ico">⌕</i><span><b>ค้นหาได้ง่าย</b>ค้นหาด้วยชื่อเรื่อง ผู้แต่ง คำสำคัญ และข้อมูลด้านวิชาการ</span></div><div class="feature"><i class="ico">✓</i><span><b>ดูผลการตรวจสอบ</b>แสดงผู้ตรวจ เกณฑ์ และสรุปผลการตรวจสอบจาก Sheet</span></div><div class="feature"><i class="ico">↗</i><span><b>เข้าถึงแหล่งต้นฉบับ</b>เปิดลิงก์งานวิจัยหรือแหล่งที่มาที่บันทึกไว้</span></div><div class="feature"><i class="ico">▤</i><span><b>ไม่มีระบบสมาชิก</b>ไม่ต้อง Login และไม่ต้องสมัครบัญชี</span></div></div></section><section class="card about about-quote"><div class="quote-icon">▣</div><h2>ข้อมูลจาก Google Sheets</h2><p>${DATA_SOURCE==='google'?'เว็บไซต์กำลังใช้ข้อมูลจาก Google Sheets โดยตรง':'ยังไม่สามารถอ่าน Google Sheets ได้ จึงใช้ข้อมูลสำรองในเว็บไซต์'}</p></section></div>`
}
function route(){const h=location.hash.replace('#','')||'home';const [page,id]=h.split('/');return page==='detail'?['detail',id]:[page,''];}
function render(){
 const [page,id]=route();
 document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===page));
 document.getElementById('app').innerHTML=page==='home'?shellHome():page==='search'?searchPage():page==='detail'?detail(id):page==='categories'?categories():about();
 bind();
}
function goSearch(){const el=document.getElementById('pageQuery');if(el)S.q=el.value;location.hash='#search';}
function bind(){
 document.querySelectorAll('.research').forEach(x=>x.onclick=()=>location.hash='#detail/'+encodeURIComponent(x.dataset.id));
 document.querySelectorAll('[data-cat]').forEach(x=>x.onclick=()=>{S.category=x.dataset.cat;S.q='';location.hash='#search'});
 document.querySelectorAll('[data-href]').forEach(x=>x.onclick=()=>location.hash=x.dataset.href);
 document.getElementById('doSearch')?.addEventListener('click',goSearch);
 document.getElementById('pageQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter')goSearch()});
 ['year','faculty','field','category'].forEach(k=>document.getElementById(k)?.addEventListener('change',e=>{S[k]=e.target.value;render()}));
 document.getElementById('sortSelect')?.addEventListener('change',e=>{S.sort=e.target.value;render()});
 document.getElementById('sort')?.addEventListener('click',()=>{S.sort=S.sort==='new'?'old':'new';render();toast(S.sort==='new'?'เรียงจากใหม่ไปเก่า':'เรียงจากเก่าไปใหม่')});
 document.getElementById('clear')?.addEventListener('click',()=>{Object.assign(S,{q:'',year:'ทั้งหมด',faculty:'ทั้งหมด',field:'ทั้งหมด',category:'ทั้งหมด',sort:'new'});render()});
}
document.getElementById('headerSearch').onclick=()=>{S.q=document.getElementById('headerQuery').value;location.hash='#search'};
document.getElementById('headerQuery').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('headerSearch').click()});
document.getElementById('hamburger').onclick=()=>document.getElementById('mobileNav').classList.toggle('open');
window.addEventListener('hashchange',render);
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)}
render();
loadData();
