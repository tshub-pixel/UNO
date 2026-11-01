/* UNO Sequência: servidor online. O servidor é o juiz: guarda baralho e mãos,
   valida cada jogada e envia a cada jogador só as próprias cartas. */
const http = require('http'), { WebSocketServer } = require('ws'), { Game } = require('./engine.js');
const PORT = process.env.PORT || 8080, OR = process.env.ORIGIN || '';
const srv = http.createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/plain' }); s.end('UNO server ok'); });
const wss = new WebSocketServer({ server: srv, maxPayload: 1024, verifyClient: i => !OR || i.origin === OR });
const rooms = new Map(), pub = [null, null], NM = ['Rex', 'Luna', 'Bia', 'Teo'];
const tx = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
const cl = n => String(n || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 12) || 'Jogador';
const mk = (isPub, mode) => {
  let c; do { c = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random() * 24 | 0]).join(''); } while (rooms.has(c));
  const r = { c, pub: isPub, mode, pl: [], g: null, t: 0 }; rooms.set(c, r); return r;
};
const info = r => r.pl.forEach((p, i) => tx(p.ws, { t: 'r', c: r.c, pub: r.pub, mode: r.mode, host: i === 0, pl: r.pl.map(x => x.n) }));
const send = r => { if (r.g && r.g.G) r.pl.forEach(p => tx(p.ws, { t: 'v', v: r.g.view(p.seat) })); };
const kill = r => { clearTimeout(r.t); if (r.g) r.g.stop(); rooms.delete(r.c); if (pub[r.mode] === r) pub[r.mode] = null; };
function start(r) {
  if (r.g || !r.pl.length) return;
  clearTimeout(r.t); if (pub[r.mode] === r) pub[r.mode] = null;
  const nm = NM.slice(), hum = [];
  r.pl.forEach((p, i) => { p.seat = i; hum.push(i); nm[i] = p.n; });
  r.g = Game({ push: () => send(r), online: true });
  r.g.start(nm, hum, r.mode, []);
}
wss.on('connection', ws => {
  ws.alive = true; ws.on('pong', () => { ws.alive = true; }); ws.on('error', () => {});
  let last = 0;
  ws.on('message', d => {
    const now = Date.now(); if (now - last < 60) return; last = now;
    let m; try { m = JSON.parse(d); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    const t = m.t, r = ws.r, p = ws.p, md = m.m === 1 ? 1 : 0;
    if (!r && (t === 'q' || t === 'c' || t === 'j')) {
      if (rooms.size >= 300) return tx(ws, { t: 'e', m: 'Servidor cheio, tente em instantes.' });
      let room;
      if (t === 'q') { room = pub[md]; if (!room || room.g || room.pl.length >= 4) room = pub[md] = mk(true, md); }
      else if (t === 'c') room = mk(false, md);
      else {
        room = rooms.get(String(m.c || '').toUpperCase());
        if (!room || room.pub || room.g || room.pl.length >= 4) return tx(ws, { t: 'e', m: 'Sala não encontrada, cheia ou já iniciada.' });
      }
      const pl = { ws, n: cl(m.n), seat: -1 }; room.pl.push(pl); ws.r = room; ws.p = pl; info(room);
      if (room.pub) {
        clearTimeout(room.t); room.t = setTimeout(() => start(room), room.pl.length > 1 ? 8000 : 12000);
        if (room.pl.length >= 4) start(room);
      }
      return;
    }
    if (!r) return;
    if (t === 's' && !r.g && !r.pub && p === r.pl[0]) return start(r);
    if (r.g && r.g.G && p && p.seat >= 0 && typeof t === 'string' && t.length === 1 && 'pdeu'.includes(t)) {
      const G = r.g.G; if (!G.hum.includes(p.seat)) G.hum.push(p.seat); G.afk[p.seat] = 0;
      r.g.act(p.seat, { t, i: m.i | 0, col: Number.isInteger(m.col) ? m.col : -1, tg: Number.isInteger(m.tg) ? m.tg : -1 });
    }
  });
  ws.on('close', () => {
    const r = ws.r, p = ws.p; if (!r) return;
    if (!r.g) { r.pl = r.pl.filter(x => x !== p); if (r.pl.length) info(r); else kill(r); }
    else {
      const G = r.g.G; if (G) { G.hum = G.hum.filter(s => s !== p.seat); r.g.sync(); }
      if (r.pl.every(x => x.ws.readyState !== 1)) kill(r);
    }
  });
});
setInterval(() => {
  wss.clients.forEach(w => { if (!w.alive) return w.terminate(); w.alive = false; w.ping(); });
  rooms.forEach(r => { if (r.pl.every(x => x.ws.readyState !== 1)) kill(r); });
}, 25000);
setInterval(() => rooms.forEach(r => r.g && r.g.tick()), 250);
process.on('uncaughtException', e => console.error('erro:', e && e.message));
srv.listen(PORT, () => console.log('UNO server na porta', PORT));
