/* UNO Sequência: regras do jogo (rodam no navegador e no servidor). */
(function(root){
const rnd=n=>Math.random()*n|0,sh=a=>{for(let i=a.length;i>1;){let j=rnd(i--);[a[i],a[j]]=[a[j],a[i]]}return a};
function Game(hk){hk=hk||{};
let G=null,bt=0;const saved=hk.saved||{w:0,c:0},sv=hk.sv||(()=>{}),nx=(p,n=1)=>((p+G.dir*n)%4+4)%4,say=m=>{G.msg=m};
/* ---------- regras ---------- */
function ok(c){let k=c[1],t=G.top;if(k>12)return!G.chain;if(G.chain)return k<10&&Math.abs(k-G.last)<2;if(k>9)return c[0]==G.col||t[1]==k;return c[0]==G.col||(t[1]<10&&Math.abs(k-t[1])<2)}
function newGame(nm,hum,mode,pe){let d=[];for(let c=0;c<4;c++){d.push([c,0]);for(let k=1;k<13;k++)d.push([c,k],[c,k])}
 for(let i=0;i<4;i++)d.push([4,13],[4,14],[4,15]);sh(d);
 G={h:[[],[],[],[]],d,disc:[],cur:0,dir:1,col:0,top:null,chain:0,last:-1,drew:0,over:-1,names:nm,hum,mode,pe,win:[0,0,0,0],afk:[0,0,0,0],msg:'Boa sorte!',tl:Date.now()+(mode?13000:40000)};
 for(let i=0;i<7;i++)for(let p=0;p<4;p++)G.h[p].push(G.d.pop());
 let t;do{t=G.d.pop();if(t[1]>9)G.d.unshift(t)}while(t[1]>9);
 G.top=t;G.disc.push(t);G.col=t[0];G.cur=rnd(4);sync()}
function dr(p,n){for(let i=0;i<n;i++){if(!G.d.length){let t=G.disc.pop();G.d=sh(G.disc);G.disc=[t];if(!G.d.length)break}G.h[p].push(G.d.pop())}chk()}
function chk(){for(let p=0;p<4;p++){if(G.h[p].length==1){if(!G.win[p]&&!G.call?.[p]){G.win[p]=Date.now()+3500;botUno(p)}}else{G.win[p]=0;if(G.call)G.call[p]=0}}}
function botUno(p){if(G.hum.includes(p)||Math.random()>.9)return;setTimeout(()=>{if(G&&G.win[p]){G.win[p]=0;(G.call=G.call||[0,0,0,0])[p]=1;say(G.names[p]+': UNO!');sync()}},600+rnd(1800))}
function un(p){if(G.h[p].length==1&&G.win[p]){G.win[p]=0;(G.call=G.call||[0,0,0,0])[p]=1;say(G.names[p]+': UNO!')}}
function endT(p,sk){if(G.chain>=4&&G.mode){for(let q=0;q<4;q++)if(q!=p)dr(q,1);say('💥 COMBO x'+G.chain+'! Todos compram 1')}
 if(p==0&&G.chain>saved.c){saved.c=G.chain;sv()}
 G.chain=0;G.last=-1;G.drew=0;G.cur=nx(p,1+sk);G.tl=Date.now()+(G.mode?13000:40000)}
function win(p){G.over=p;say(G.names[p]+' venceu!');if(p==0){saved.w++;sv()}}
function play(p,i,o){if(G.over>=0||p!=G.cur||(G.drew&&i!=G.drew-1))return;let c=G.h[p][i];if(!c||!ok(c))return;let k=c[1];
 if((k==13||k==14)&&!(o.col>=0&&o.col<4))return;if(k==15&&!(o.tg>=0&&o.tg<4&&o.tg!=p))return;
 G.h[p].splice(i,1);G.disc.push(c);G.top=c;G.drew=0;
 if(k<10){G.col=c[0];G.last=k;G.chain++;say(G.names[p]+' jogou '+k+(G.chain>1?' (x'+G.chain+')':''));chk();if(!G.h[p].length)return win(p);
  if(!G.h[p].some(ok))endT(p,0);return}
 let sk=0;G.col=k>12?(k==15?G.col:o.col):c[0];
 if(k==10){sk=1;say(G.names[p]+' pulou '+G.names[nx(p)])}
 if(k==11){G.dir*=-1;say(G.names[p]+' inverteu o sentido')}
 if(k==12){dr(nx(p),2);sk=1;say(G.names[nx(p)]+' compra 2')}
 if(k==14){dr(nx(p),4);sk=1;say(G.names[nx(p)]+' compra 4')}
 if(k==13)say(G.names[p]+' escolheu a cor');
 if(k==15){let a=G.h[p];G.h[p]=G.h[o.tg];G.h[o.tg]=a;G.win[p]=G.win[o.tg]=0;if(G.call)G.call[p]=G.call[o.tg]=0;say('⇆ '+G.names[p]+' trocou de mão com '+G.names[o.tg]);chk()}
 chk();if(!G.h[p].length)return win(p);endT(p,sk)}
function dw(p){if(G.over>=0||p!=G.cur||G.chain||G.drew)return;dr(p,1);let c=G.h[p][G.h[p].length-1];if(c&&ok(c)){G.drew=G.h[p].length;say(G.names[p]+' comprou')}else{say(G.names[p]+' comprou e passou');endT(p,0)}}
function ps(p){if(G.over<0&&p==G.cur&&(G.chain||G.drew))endT(p,0)}
/* ---------- robôs (pensam como gente) ---------- */
function bot(p){let h=G.h[p],o=[0,1,2,3].filter(q=>q!=p),L=o.reduce((a,q)=>G.h[q].length<G.h[a].length?q:a,o[0]);
 let idx=h.map((c,i)=>i).filter(i=>ok(h[i])&&(!G.drew||i==G.drew-1));
 if(!idx.length){if(G.chain||G.drew)endT(p,0);else dw(p);return}
 let sc=i=>{let c=h[i],k=c[1],nb=h.filter(d=>d[1]<10&&Math.abs(d[1]-k)<2).length;
  if(k<10)return nb*2+(c[0]==G.col?1:0)+Math.random();
  if(k==15)return h.length>=5&&G.h[L].length<=h.length-3?20:-9;
  if(k>12)return h.length<=3||idx.length==1?5:-4;
  return G.h[nx(p)].length<=2?12:1+Math.random()};
 idx.sort((a,b)=>sc(b)-sc(a));let i=idx[0],cc=[0,0,0,0];
 h.forEach((d,j)=>{if(j!=i&&d[0]<4)cc[d[0]]++});
 play(p,i,{col:cc.every(x=>!x)?rnd(4):cc.indexOf(Math.max(...cc)),tg:L})}
function sync(){hk.push();if(G&&G.over<0&&!G.hum.includes(G.cur)&&!bt)bt=setTimeout(()=>{bt=0;if(G&&G.over<0&&!G.hum.includes(G.cur))bot(G.cur);sync()},700+G.h[G.cur].length*50+rnd(900))}
function tick(){if(!G||G.over>=0)return;let n=Date.now(),c=0;
 for(let p=0;p<4;p++)if(G.win[p]&&n>G.win[p]){G.win[p]=0;dr(p,2);say(G.names[p]+' esqueceu o UNO! +2');c=1}
 if((G.mode||hk.online)&&G.hum.includes(G.cur)&&n>G.tl){let p=G.cur;say('⏱ '+G.names[p]+' demorou');if(!G.chain&&!G.drew)dr(p,1);endT(p,0);c=1;if(hk.online&&++G.afk[p]>=2){G.hum=G.hum.filter(q=>q!=p);say(G.names[p]+' saiu: robô assumiu')}}
 if(c)sync()}
/* ---------- visão (cada jogador só vê a própria mão) ---------- */
function view(s){return{h:G.h.map(x=>x.length),m:G.h[s],ok:G.h[s].map((c,i)=>G.cur==s&&G.over<0&&ok(c)&&(!G.drew||i==G.drew-1)),t:G.top,col:G.col,cur:G.cur,dir:G.dir,ch:G.chain,la:G.last,dw:G.drew,ov:G.over,nm:G.names,me:s,md:G.mode,w:G.win.map(x=>x?1:0),ms:G.msg,tr:G.tl-Date.now(),dk:G.d.length}}

function act(p,a){if(!G)return;if(a.t=='p')play(p,a.i|0,a);else if(a.t=='d')dw(p);else if(a.t=='e')ps(p);else if(a.t=='u')un(p);sync()}
return{start:newGame,act,tick,view,sync,stop(){G=null},get G(){return G}};}
root.Game=Game;
})(typeof module!=='undefined'?module.exports:window);
