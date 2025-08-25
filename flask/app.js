const fileInput = document.getElementById('fileInput');
const playlistEl = document.getElementById('playlist');
const audio = document.getElementById('audio');
const titleEl = document.getElementById('title');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const progressWrap = document.getElementById('progressWrap');
const progress = document.getElementById('progress');
const currentEl = document.getElementById('current');
const durationEl = document.getElementById('duration');
const volumeEl = document.getElementById('volume');

const nowPlaying = document.getElementById('nowPlaying');
const npThumb = document.getElementById('npThumb');
const npTitle = document.getElementById('npTitle');
const npDesc = document.getElementById('npDesc');
const npPlay = document.getElementById('npPlay');
const npPrev = document.getElementById('npPrev');
const npNext = document.getElementById('npNext');

let tracks=[],order=[],index=0,shuffled=false,repeating=false;

// IndexedDB
let db;
const request=indexedDB.open("HoneyMusicDB",1);
request.onupgradeneeded=e=>{
  db=e.target.result;
  if(!db.objectStoreNames.contains("songs")) db.createObjectStore("songs",{keyPath:"name"});
};
request.onsuccess=e=>{db=e.target.result;loadStoredSongs();};

function saveSong(name,blob){
  const tx=db.transaction("songs","readwrite");
  tx.objectStore("songs").put({name,blob});
}

function loadStoredSongs(){
  const tx=db.transaction("songs","readonly");
  const store=tx.objectStore("songs");
  const req=store.getAll();
  req.onsuccess=()=> {
    tracks=req.result.map(s=>({name:s.name,blobUrl:URL.createObjectURL(s.blob),description:'Artist: Local Audio',thumbnail:'icons/icon-192.png'}));
    if(tracks.length){ensureOrder();rebuildPlaylist();load(0,false);}
  }
}

function fmt(s){if(!isFinite(s))return'0:00';const m=Math.floor(s/60),r=Math.floor(s%60);return`${m}:${r.toString().padStart(2,'0')}`;}
function rebuildPlaylist(){
  playlistEl.innerHTML='';
  tracks.forEach((t,i)=>{
    const li=document.createElement('li');
    li.textContent=t.name;
    li.dataset.i=i;
    li.addEventListener('click',()=>{showNowPlayingPanel(t);const pos=order.indexOf(i);load(pos===-1?0:pos);});
    playlistEl.appendChild(li);
  });
}
function ensureOrder(){order=tracks.map((_,i)=>i);if(shuffled){for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}}}

function load(pos,autoplay=true){
  if(!order.length)return;
  if(pos<0||pos>=order.length)return;
  index=pos;
  const t=tracks[order[index]];
  audio.src=t.blobUrl;
  titleEl.textContent=t.name;
  setActive(index);
  showNowPlayingPanel(t);
  if(autoplay) audio.play().catch(()=>{});
  playBtn.textContent='⏸';
  npPlay.textContent='⏸';
}

async function addFiles(fileList){
  for(const f of fileList){
    tracks.push({name:f.name,blobUrl:URL.createObjectURL(f),description:'Artist: Local Audio',thumbnail:'icons/icon-192.png'});
    saveSong(f.name,f);
  }
  ensureOrder();rebuildPlaylist();
  if(!audio.src && tracks.length) load(0,false);
}
fileInput.addEventListener('change',e=>addFiles(e.target.files));

function playPause(){if(audio.paused){audio.play();playBtn.textContent='⏸';npPlay.textContent='⏸';}else{audio.pause();playBtn.textContent='▶️';npPlay.textContent='▶️';}}
function prev(){if(order.length)load((index-1+order.length)%order.length);}
function next(){if(order.length)load((index+1)%order.length);}
playBtn.addEventListener('click',playPause);
prevBtn.addEventListener('click',prev);
nextBtn.addEventListener('click',next);
npPlay.addEventListener('click',playPause);
npPrev.addEventListener('click',prev);
npNext.addEventListener('click',next);

shuffleBtn.addEventListener('click',()=>{
  shuffled=!shuffled;
  shuffleBtn.classList.toggle('active',shuffled);
  const curTrackId=order[index];
  ensureOrder();rebuildPlaylist();
  const newPos=order.indexOf(curTrackId);
  index=newPos===-1?0:newPos;
  setActive(index);
});

repeatBtn.addEventListener('click',()=>{
  repeating=!repeating;
  repeatBtn.classList.toggle('active',repeating);
  audio.loop=repeating;
});

volumeEl.addEventListener('input',()=>audio.volume=volumeEl.value);
progressWrap.addEventListener('click',e=>{
  const rect=progressWrap.getBoundingClientRect();
  const pct=(e.clientX-rect.left)/rect.width;
  audio.currentTime=pct*(audio.duration||0);
});

audio.addEventListener('timeupdate',()=>{progress.style.width=((audio.currentTime/(audio.duration||1))*100)+'%';currentEl.textContent=fmt(audio.currentTime);durationEl.textContent=fmt(audio.duration);});
audio.addEventListener('ended',()=>{if(!repeating) next();});

function setActive(pos){[...playlistEl.children].forEach(li=>li.classList.remove('active'));const id=order[pos];const li=playlistEl.querySelector(`li[data-i="${id}"]`);if(li)li.classList.add('active');}

// Now Playing panel
function showNowPlayingPanel(track){
  nowPlaying.style.display='flex';
  npThumb.src=track.thumbnail || 'icons/icon-192.png';
  npTitle.textContent=track.name;
  npDesc.textContent=track.description || 'Artist: Local Audio';
}
