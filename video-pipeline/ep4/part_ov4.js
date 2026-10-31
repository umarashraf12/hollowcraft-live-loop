    else if (o.kind === 'trades') {
      const a = eOutBack(seg(t, o.t0, o.t0 + .3)), pw = 780, rh = 124, ph = 110 + o.rows.length * rh;
      ctx.save(); ctx.translate(o.x + pw / 2, o.y + ph / 2); ctx.scale(a, a); ctx.translate(-pw / 2, -ph / 2);
      rrect(0, 0, pw, ph, 18, 'rgba(198,198,198,.96)', '#1b1b1b', 6); rrect(8, 8, pw - 16, 70, 10, 'rgba(0,0,0,.18)');
      txt(o.title, pw / 2, 44, 44, '#3a3a3a', { stroke: false });
      o.rows.forEach((r, i) => {
        const y = 92 + i * rh, hl = r.hl; rrect(16, y, pw - 32, rh - 14, 12, hl ? `rgba(199,125,255,${.35 + .4 * (o.flash || 0)})` : 'rgba(139,139,139,.55)', hl ? '#7a2bd6' : '#555', 3);
        let x = 36; const slot = (ic, n, opts = {}) => { rrect(x, y + 12, 86, 86, 8, '#8b8b8b', '#373737', 3); icon(ic, x + 9, y + 21, 68);
          if (opts.newp != null && o.k > 0) { txt(String(n), x + 78, y + 84, 30, '#ff5252', { align: 'right', lw: 5 }); ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 46, y + 84); ctx.lineTo(x + 82, y + 84); ctx.stroke();
            txt(String(opts.newp), x + 86, y + 34, 44 * eOutBack(o.k), '#2fd06a', { align: 'right', lw: 7 }); }
          else if (n > 1) txt(String(n), x + 78, y + 84, 30, '#fff', { align: 'right', lw: 6 }); x += 100; };
        r.in.forEach(([ic, n], j) => slot(ic, n, j === 0 ? { newp: r.newp } : {}));
        txt('➜', x + 30, y + 56, 52, r.done ? '#2fd06a' : '#555', { stroke: false }); x += 76;
        slot(r.out[0], r.out[1]);
        txt(r.lab, x + 12, y + 56, r.hl ? 46 : 38, r.hl ? '#5a1aa0' : '#2a2a2a', { align: 'left', stroke: false });
      });
      if (o.locked) { ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(0, 0, pw, ph, 18, 'rgba(0,0,0,.35)'); ctx.save(); ctx.translate(pw - 120, 60);
        rrect(-40, -10, 80, 64, 10, '#ffd400', '#000', 5); ctx.strokeStyle = '#000'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, -10, 24, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -10, 24, Math.PI, 0); ctx.stroke();
        ctx.restore(); txt('LOCKED', pw - 260, 62, 44, '#ffd400', { lw: 8 }); }
      ctx.restore();
    } else if (o.kind === 'tag2b') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .3)); ctx.save(); ctx.translate(W / 2, H * .38); ctx.scale(k, k);
      ctx.font = FONT(50); const w = ctx.measureText(o.text).width + 130;
      rrect(-w / 2, -44, w, 88, 16, 'rgba(0,0,0,.72)', o.col, 4); icon(o.icon, -w / 2 + 16, -30, 60); txt(o.text, 35, 2, 50, o.col, { stroke: false }); ctx.restore();
    } else if (o.kind === 'timecard') {
      const a = seg(t, o.t0, o.t0 + .25) * (1 - seg(t, o.t0 + 1.7, o.t0 + 2.0));
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); txt(o.text, W / 2, H / 2, 110, '#ffd400', { lw: 16 });
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(W / 2, H / 2 - 170, 60, 0, 7); ctx.stroke(); const ang = t * 6; ctx.beginPath(); ctx.moveTo(W / 2, H / 2 - 170); ctx.lineTo(W / 2 + Math.cos(ang) * 44, H / 2 - 170 + Math.sin(ang) * 44); ctx.stroke(); ctx.restore();
    } else if (o.kind === 'nope') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .25)); ctx.save(); ctx.translate(100 + 780 - 70, 120 + 92 + 55); ctx.scale(k, k);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 22; ctx.lineCap = 'round'; for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(-34, -34 * s); ctx.lineTo(34, 34 * s); ctx.stroke(); }
      ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 11; for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(-34, -34 * s); ctx.lineTo(34, 34 * s); ctx.stroke(); } ctx.restore();
      txt('NO MENDING', 490, 120 + 92 + 150, 40, '#ff5252', { lw: 7 });
    } else if (o.kind === 'jobs') {
      const items = [['lectern', 'LIBRARIAN'], ['fletch', 'FLETCHER'], ['composter', 'FARMER'], ['smoker', 'BUTCHER']];
      txt('ANY JOB BLOCK WORKS', W / 2, H * .17, 72, '#ffd400', { lw: 12, scale: eOutBack(seg(t, o.t0, o.t0 + .35)) });
      items.forEach(([ic, l], i) => { const k = eOutBack(seg(t, o.t0 + .3 + i * .25, o.t0 + .6 + i * .25)), x = W / 2 + (i - 1.5) * 330, y = H * .42;
        ctx.save(); ctx.translate(x, y); ctx.scale(k, k); rrect(-130, -130, 260, 300, 24, 'rgba(0,0,0,.7)', '#fff', 4); icon(ic, -90, -110, 180); txt(l, 0, 120, 38, '#fff', { stroke: false }); ctx.restore(); });
      if (t > o.t0 + 2.4) txt('...until you trade with it', W / 2, H * .72, 50, '#ff8a80', { lw: 8, alpha: seg(t, o.t0 + 2.4, o.t0 + 2.8) });
    } else if (o.kind === 'sticks') {
      const row = [['log', '×4'], ['→'], ['planksI', '×16'], ['→'], ['stick', '×32'], ['='], ['emerald', '×1']];
      row.forEach((it, i) => { const k = seg(t, o.t0 + i * .3, o.t0 + .3 + i * .3), x = W / 2 + (i - 3) * 245, y = H * .42; ctx.save(); ctx.globalAlpha = k;
        if (it.length === 1) txt(it[0], x, y, 90, '#fff', { lw: 10 }); else { rrect(x - 105, y - 105, 210, 210, 24, 'rgba(0,0,0,.6)', i === 6 ? '#2fd06a' : '#fff', 4); icon(it[0], x - 80, y - 85, 160); txt(it[1], x + 60, y + 72, 48, '#fff', { lw: 8 }); }
        ctx.restore(); });
      if (t > o.t0 + 2.6) txt('EVERY 4 LOGS = 1 EMERALD', W / 2, H * .2, 80, '#2fd06a', { lw: 13, scale: eOutBack(seg(t, o.t0 + 2.6, o.t0 + 2.9)) });
    } else if (o.kind === 'restock') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W / 2, H * .22); ctx.scale(k, k);
      rrect(-520, -90, 1040, 180, 26, 'rgba(0,0,0,.72)', '#ffd400', 5);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(-470, -42, 84, 84); ctx.fillStyle = '#fff6c8'; ctx.fillRect(-452, -24, 48, 48);
      txt('RESTOCK: UP TO 2× A DAY', 60, -16, 60, '#ffd400', { stroke: false }); txt('while working at their job block', 60, 46, 36, '#fff', { stroke: false, w: 700 }); ctx.restore();
    } else if (o.kind === 'emeralds') {
      rrect(W - 300, 48, 252, 90, 18, 'rgba(0,0,0,.65)', '#2fd06a', 4); icon('emerald', W - 290, 58, 70); txt('× ' + o.n, W - 130, 95, 52, '#fff', { stroke: false });
    }
