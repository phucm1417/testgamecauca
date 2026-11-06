(()=>{
'use strict';
const KEY='fish_developer_options_v1',defaults={speed:1,waitSeconds:.85,biteSeconds:3.2,ringSpeed:1,perfectWidth:.18,pullTempo:1.7,fishSpeed:48,musicVolume:.25,immortal:false,noCooldown:false,freezeWeather:false,nextFish:-1};
const ranges={speed:[.25,8,.25,'Tốc độ mô phỏng ×'],waitSeconds:[.1,15,.1,'Chờ cá (giây)'],biteSeconds:[1,20,.1,'Thời gian giật (giây)'],ringSpeed:[.1,3,.1,'Tốc độ vòng giật'],perfectWidth:[.02,.5,.01,'Độ rộng giật hoàn hảo'],pullTempo:[.1,20,.1,'Hệ số lực kéo'],fishSpeed:[0,150,1,'Tốc độ cá bơi'],musicVolume:[0,1,.05,'Âm lượng nhạc']};
Object.assign(defaults,{attackScale:1,attackRate:1,fishDamage:1,qtePeriod:2.2,comboScale:1});Object.assign(ranges,{attackScale:[.1,5,.1,'Hệ số sát thương'],attackRate:[.25,3,.05,'Tốc độ lượt đánh'],fishDamage:[.1,3,.1,'Sát thương phản công'],qtePeriod:[1,4,.1,'Chu kỳ QTE'],comboScale:[0,3,.1,'Thưởng combo']});
let D={...defaults};try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');for(const k in ranges)if(Number.isFinite(v[k]))D[k]=clamp(v[k],ranges[k][0],ranges[k][1]);for(const k of ['immortal','noCooldown','freezeWeather'])D[k]=v[k]===true;if(Number.isInteger(v.nextFish)&&v.nextFish>=-1&&v.nextFish<FISH.length)D.nextFish=v.nextFish;}catch{}
const originalParam=param;param=k=>Object.hasOwn(D,k)&&typeof D[k]==='number'?D[k]:originalParam(k);
function persist(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch{status('Không lưu được cài đặt trên trình duyệt này.')}save()}
const originalChoose=chooseFish;chooseFish=function(rare=false){if(D.nextFish>=0){const f=FISH[D.nextFish];return {...f,kg:f.kg,boss:false}}return originalChoose(rare)};
const originalTick=tick;tick=function(dt){if(menu){originalTick(dt);return}const steps=Math.ceil(D.speed),part=dt*D.speed/steps;for(let i=0;i<steps;i++){if(D.immortal){S.stamina=100;S.lineHealth=100;S.hull=100;tension=Math.min(tension,70)}if(D.noCooldown){S.skillUntil=0;S.boostReady=0;S.phoenixReady=0;S.salvageReady=0}if(D.freezeWeather)weatherLeft=60;originalTick(part)}};
const root=document.querySelector('main'),launch=document.createElement('button');launch.id='dev-open';launch.dataset.action='developer';launch.textContent='TEST';launch.setAttribute('aria-label','Mở bảng nhà phát triển');root.append(launch);
const panel=document.createElement('section');panel.id='dev-panel';panel.className='sheet';panel.dataset.screen='overlay';panel.hidden=true;root.append(panel);
let resetArmed=false;
function status(text){const e=document.getElementById('dev-message');if(e)e.textContent=text}
function btn(text,action){return '<button type="button" class="buy" data-dev="'+action+'">'+text+'</button>'}
function select(id,list,value){return '<select id="'+id+'">'+list.map(([v,n])=>'<option value="'+v+'"'+(+value===+v?' selected':'')+'>'+clean(n)+'</option>').join('')+'</select>'}
function render(){let h='<div class="sheet-head"><b>Bản nhà phát triển</b><button class="close" data-dev="close" aria-label="Đóng bảng test">×</button></div><div class="sheet-body dev-body"><p id="dev-message" role="status">Tiến độ test được lưu riêng. Game tạm dừng khi mở bảng.</p><div class="dev-actions">'+btn('Đầy tài nguyên','rich')+btn('Mở khóa tất cả','unlock')+btn('Hồi đầy / xóa hồi chiêu','heal')+btn('Dọn túi cá','empty')+'</div><h3>Tài nguyên</h3><div class="dev-fields">';
for(const [k,n,max] of [['coins','Tiền',1e15],['gems','Ngọc',1e9],['materials','Nguyên liệu',1e9],['level','Cấp độ',1000]])h+='<label>'+n+'<input id="dev-'+k+'" type="number" inputmode="numeric" min="'+(k==='level'?1:0)+'" max="'+max+'" value="'+S[k]+'"></label>';
h+='</div>'+btn('Áp dụng tài nguyên','resources')+'<h3>Thông số trực tiếp</h3><div class="dev-fields">';for(const k in ranges){const [min,max,step,label]=ranges[k];h+='<label>'+label+'<input id="dev-'+k+'" type="number" inputmode="decimal" min="'+min+'" max="'+max+'" step="'+step+'" value="'+D[k]+'"></label>'}h+='</div>'+btn('Áp dụng thông số','params');
for(const [k,n] of [['immortal','Vô hạn thể lực, dây và thuyền'],['noCooldown','Bỏ thời gian hồi chiêu'],['freezeWeather','Giữ nguyên thời tiết']])h+='<label class="dev-check"><input type="checkbox" data-option="'+k+'" '+(D[k]?'checked':'')+'>'+n+'</label>';
h+='<h3>Chọn tình huống</h3><label>Bản đồ'+select('dev-zone',ZONES.map((z,i)=>[i,z.n]),S.zone)+'</label>'+btn('Đến bản đồ','zone')+'<label>Thời tiết'+select('dev-weather',WEATHER.map((w,i)=>[i,w.n]),weatherIndex)+'</label>'+btn('Đổi thời tiết','weather')+'<label>Buff kiểm tra'+select('dev-buff',STATUS_BUFFS.slice(0,10).map((r,i)=>[i,r[2]]),0)+'</label>'+btn('Kích hoạt buff 30s','buff')+btn('Xóa buff / debuff','clearfx')+'<label>Cá lần thả tiếp theo'+select('dev-fish',[[-1,'Ngẫu nhiên'],...FISH.map((f,i)=>[i,f.n])],D.nextFish)+'</label>'+btn('Chọn cá','fish')+'<label>Boss'+select('dev-boss',BOSSES.map((b,i)=>[i,b.n]),0)+'</label>'+btn('Bắt đầu test boss','boss')+'<div class="dev-actions">'+btn('Thắng trận hiện tại','win')+btn('Mô phỏng cá thoát','lose')+btn('Thông số mặc định','defaults')+btn(resetArmed?'XÁC NHẬN xóa tiến độ test':'Xóa tiến độ test','reset')+'</div><p class="details">Tăng tốc áp dụng cho mô phỏng câu cá và thu nhập trong game. Hồi chiêu theo đồng hồ thật: dùng tùy chọn bỏ hồi chiêu khi cần. Mở khóa không tự thay trang bị đang dùng.</p></div>';panel.innerHTML=h;}
function open(){closeMenu();stopPull();menu='developer';$('controls').hidden=true;$('fight').hidden=true;launch.hidden=true;panel.hidden=false;resetArmed=false;render()}
function close(){panel.hidden=true;launch.hidden=false;menu='';$('controls').hidden=false;$('fight').hidden=state!=='fight';stopPull();persist();updateUI()}
launch.onclick=open;
function read(id,min,max){const e=document.getElementById(id),n=Number(e.value);if(e.value.trim()===''||!Number.isFinite(n)||n<min||n>max)throw Error('Giá trị cần nằm trong '+min+' – '+max);return n}
function heal(){S.stamina=S.lineHealth=S.hull=100;S.skillUntil=S.boostReady=S.phoenixReady=S.salvageReady=0;tension=0;shock=entangled=0}
panel.onchange=e=>{const k=e.target.dataset.option;if(k){D[k]=e.target.checked;persist();status('Đã lưu tùy chọn.')}};
panel.onclick=e=>{const b=e.target.closest('[data-dev]');if(!b)return;const a=b.dataset.dev;try{
if(a==='close'){close();return}
if(a==='rich'){S.coins=1e15;S.gems=1e9;S.materials=1e9;for(const x of CATALOG.bait)S.bait[x.id]=99999;heal();render()}
if(a==='unlock'){for(const k in UP)S.up[k]=UP[k].max;S.level=Math.max(100,S.level);S.zones=ZONES.map((_,i)=>i);for(const k in S.owned)S.owned[k]=k==='character'?CHARACTERS.map(x=>x.id):CATALOG[k].map(x=>x.id);S.aqLevel=8;render()}
if(a==='heal'){heal();render()}
if(a==='empty'){S.inv=[];render()}
if(a==='resources'){const values={};for(const [k,min,max] of [['coins',0,1e15],['gems',0,1e9],['materials',0,1e9],['level',1,1000]])values[k]=Math.floor(read('dev-'+k,min,max));Object.assign(S,values)}
if(a==='params'){const values={};for(const k in ranges)values[k]=read('dev-'+k,ranges[k][0],ranges[k][1]);Object.assign(D,values);if(state==='wait')waitFor=D.waitSeconds;}
if(a==='zone'){S.zone=+document.getElementById('dev-zone').value;if(!S.zones.includes(S.zone))S.zones.push(S.zone);target=null;setState('idle');selectScene();}
if(a==='weather'){weatherIndex=+document.getElementById('dev-weather').value;weatherLeft=60;debuff=''}
if(a==='buff'){const row=STATUS_BUFFS[+document.getElementById('dev-buff').value];buffs[row[0]]=30;close();persist();return;}if(a==='clearfx'){for(const k in buffs)buffs[k]=0;shock=entangled=stun=guard=powerBuff=speedBuff=0;debuff='';}
if(a==='fish')D.nextFish=+document.getElementById('dev-fish').value;
if(a==='boss'){const id=+document.getElementById('dev-boss').value;heal();S.equip.bait=16;S.bait[16]=Math.max(10,S.bait[16]||0);if(S.inv.length>=capacity()){status('Túi đầy: dọn túi trước khi test boss.');return}close();cast(id);persist();return}
if(a==='win'){if(!target||!['fight','bite','wait'].includes(state)){status('Chưa có trận câu đang diễn ra.');return}close();hp=0;setState('reel');return}
if(a==='lose'){if(!target){status('Chưa có cá để mô phỏng.');return}close();lose('Test: cá thoát');return}
if(a==='defaults'){D={...defaults};render()}
if(a==='reset'){if(!resetArmed){resetArmed=true;render();status('Nhấn lại để xóa riêng tiến độ bản test.');return}S=fresh();D={...defaults};target=null;setState('idle');selectScene();resetArmed=false;render()}
persist();updateUI();status('Đã áp dụng và lưu.');
}catch(err){status(err.message)}};
window.DEV_TEST={get options(){return {...D}},get saveKey(){return SAVE}};
})();
