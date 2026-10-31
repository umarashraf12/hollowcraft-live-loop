    else if (o.kind === 'formula') { // lava + water = obsidian
      const k = eOutBack(seg(t, o.t0, o.t0 + .35)); ctx.save(); ctx.translate(W / 2, H * .2); ctx.scale(k, k);
      rrect(-430, -70, 860, 140, 22, 'rgba(0,0,0,.75)', '#c77dff', 5);
      icon('lavaB', -400, -48, 96); txt('+', -260, 0, 80, '#fff', { stroke: false }); icon('bucketW', -210, -48, 96); txt('=', -70, 0, 80, '#fff', { stroke: false });
      ctx.drawImage(T.obsidian.userData.canvas, -10, -46, 92, 92); txt('OBSIDIAN', 230, 0, 54, '#c77dff', { stroke: false }); ctx.restore();
    } else if (o.kind === 'xcell') {
      const p = project(o.at); if (!p.vis) continue; const k = eOutBack(seg(t, o.t0, o.t0 + .3));
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(k, k); ctx.strokeStyle = '#000'; ctx.lineWidth = 18; ctx.lineCap = 'round';
      for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(-26, -26 * s); ctx.lineTo(26, 26 * s); ctx.stroke(); }
      ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 9; for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(-26, -26 * s); ctx.lineTo(26, 26 * s); ctx.stroke(); } ctx.restore();
    } else if (o.kind === 'moldTip') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)), out = seg(t, 51.2, 51.6); ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(W - 90 - (1 - k) * -700, H * .12);
      const pw = 560, ph = 560, cs = 62; rrect(-pw, 0, pw, ph, 22, 'rgba(0,0,0,.78)', '#ffd400', 5);
      txt('PRO TIP: DIRT MOLD', -pw / 2, 46, 40, '#ffd400', { stroke: false });
      const ox = -pw / 2 - cs * 3, oy = 92;
      for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 6; gx++) {
        const fx = gx - 1, fy = 4 - (gy - 0); const inFrame = fx >= 0 && fx <= 3 && fy >= 0 && fy <= 4, corner = (fx === 0 || fx === 3) && (fy === 0 || fy === 4), inner = fx >= 1 && fx <= 2 && fy >= 1 && fy <= 3;
        const tex = inFrame && !corner && !inner ? T.obsidian : (!inFrame || corner) ? T.dirt : null;
        if (tex) ctx.drawImage(tex.userData.canvas, ox + gx * cs, oy + gy * cs, cs - 3, cs - 3);
      }
      txt('dirt holds the lava in place', -pw / 2, ph - 40, 30, '#fff', { stroke: false, w: 700 }); ctx.restore();
    } else if (o.kind === 'debrisChart') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W - 110 - (1 - k) * -700, H * .12);
      const pw = 520, ph = 540; rrect(-pw, 0, pw, ph, 22, 'rgba(0,0,0,.78)', '#ffb380', 5);
      txt('ANCIENT DEBRIS BY Y', -pw / 2, 46, 40, '#ffb380', { stroke: false });
      const top = 100, bot = ph - 40, yv = v => lerp(top, bot, (40 - v) / 40);
      for (let v = 38; v >= 2; v -= 3) { const f = Math.exp(-(((v - 15) / 6.5) ** 2)) * .85 + (v < 30 ? .1 : .02); rrect(-pw + 150, yv(v) - 10, f * (pw - 210), 20, 4, Math.abs(v - 14) <= 1 ? '#ffb380' : 'rgba(255,179,128,.55)'); }
      for (const v of [36, 24, 15, 6]) txt(`Y ${v}`, -pw + 130, yv(v), 30, v === 15 ? '#ffd400' : '#cfd8dc', { align: 'right', stroke: false });
      const y15 = yv(15); ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(-pw + 140, y15); ctx.lineTo(-30, y15); ctx.stroke(); ctx.setLineDash([]);
      txt('BEST', -70, y15 - 30, 34, '#ffd400', { lw: 6 }); ctx.restore();
    } else if (o.kind === 'craft') {
      const a1 = seg(t, o.t0, o.t0 + .4), a2 = seg(t, o.t0 + 2.2, o.t0 + 2.6);
      ctx.save(); ctx.globalAlpha = a1; const y1 = H * .3;
      [['debris', 'ANCIENT DEBRIS'], null, ['scrap', 'NETHERITE SCRAP']].forEach((it, i) => { const x = W / 2 + (i - 1) * 380; if (!it) { txt('SMELT →', x, y1, 52, '#ffd400', { lw: 8 }); return; } rrect(x - 110, y1 - 110, 220, 220, 24, 'rgba(0,0,0,.6)', '#ffb380', 4); icon(it[0], x - 80, y1 - 80, 160); txt(it[1], x, y1 + 150, 34, '#fff', { lw: 7 }); });
      ctx.globalAlpha = a2; const y2 = H * .7;
      const row = [['scrap', '×4'], ['+'], ['gold', '×4'], ['='], ['ingot', 'NETHERITE INGOT']];
      row.forEach((it, i) => { const x = W / 2 + (i - 2) * 300; if (it.length === 1) { txt(it[0], x, y2, 90, '#fff', { lw: 10 }); return; } rrect(x - 95, y2 - 95, 190, 190, 22, 'rgba(0,0,0,.6)', i === 4 ? '#ffd400' : '#fff', 4); icon(it[0], x - 70, y2 - 75, 140); txt(it[1], x + (i === 4 ? 0 : 50), y2 + (i === 4 ? 130 : 60), i === 4 ? 36 : 44, i === 4 ? '#ffd400' : '#fff', { lw: 8 }); });
      ctx.restore();
    } else if (o.kind === 'tips') {
      [['chest', 'WEAR ARMOR', 'the bed blast hurts you too'], ['fireres', 'FIRE RESISTANCE', 'lava is everywhere']].forEach(([ic, a, b], i) => {
        const k = eOutBack(seg(t, o.t0 + i * .6, o.t0 + .4 + i * .6)); ctx.save(); ctx.translate(60 + (1 - k) * -700, H * .2 + i * 190);
        rrect(0, 0, 680, 160, 24, 'rgba(0,0,0,.72)', i ? '#ff9a1f' : '#cfd8dc', 5); icon(ic, 20, 20, 120); txt(a, 170, 58, 52, '#fff', { align: 'left', stroke: false }); txt(b, 170, 112, 32, '#cfd8dc', { align: 'left', stroke: false, w: 700 }); ctx.restore(); });
    } else if (o.kind === 'ratio') {
      const k = seg(t, o.t0, o.t0 + .4), g = eOutC(seg(t, o.t0 + .5, o.t0 + 2.2)); ctx.save(); ctx.globalAlpha = k;
      rrect(120, H * .14, W - 240, 420, 26, 'rgba(0,0,0,.72)', '#ffd400', 5);
      txt('1 BLOCK IN THE NETHER = 8 IN THE OVERWORLD', W / 2, H * .14 + 60, 50, '#ffd400', { stroke: false });
      const bx = 380, bw = W - 640;
      txt('NETHER', bx - 30, H * .14 + 170, 42, '#ff8a65', { align: 'right', stroke: false }); rrect(bx, H * .14 + 145, bw / 8 * g, 50, 10, '#ff7043'); txt('125 blocks', bx + bw / 8 * g + 20, H * .14 + 172, 38, '#fff', { align: 'left', stroke: false, alpha: g });
      txt('OVERWORLD', bx - 30, H * .14 + 290, 42, '#9be27a', { align: 'right', stroke: false }); rrect(bx, H * .14 + 265, bw * g, 50, 10, '#66bb6a'); txt('1,000 blocks', bx + bw * g - 20, H * .14 + 340, 38, '#fff', { align: 'right', stroke: false, alpha: g });
      ctx.restore();
    } else if (o.kind === 'speed') {
      ctx.font = FONT(44); const s = `${o.v} BLOCKS/SEC`, w = ctx.measureText(s).width + 70;
      rrect(W - 48 - w, 48, w, 80, 16, 'rgba(0,0,0,.65)', '#78aaf8', 4); txt(s, W - 48 - w / 2, 90, 44, '#cfe6ff', { stroke: false });
    } else if (o.kind === 'speedlines') {
      const r = rng(Math.floor(t * 30)); ctx.save(); ctx.globalAlpha = .55 * o.a; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
      for (let i = 0; i < 38; i++) { const a = r() * Math.PI * 2, r0 = 360 + r() * 300, r1 = r0 + 120 + r() * 260; ctx.lineWidth = 2 + r() * 5; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * .7); ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1 * .7); ctx.stroke(); }
      ctx.restore();
    } else if (o.kind === 'compare') {
      const k = seg(t, o.t0, o.t0 + .4), g = eOutC(seg(t, o.t0 + .4, o.t0 + 1.8)); ctx.save(); ctx.globalAlpha = k;
      rrect(120, H * .55, W - 240, 330, 26, 'rgba(0,0,0,.75)', '#78aaf8', 5);
      const bx = 620, bw = W - 900;
      [['ELYTRA + ROCKETS', 33, '#cfd8dc', 'elytra'], ['ICE BOAT', 72, '#78aaf8', 'boat']].forEach(([l, v, c, ic], i) => { const y = H * .55 + 90 + i * 130;
        icon(ic, 160, y - 45, 90); txt(l, bx - 30, y, 44, c, { align: 'right', stroke: false }); rrect(bx, y - 28, bw * v / 72 * g, 56, 12, c); txt(`~${Math.round(v * g)} b/s`, bx + bw * v / 72 * g + 20, y, 42, '#fff', { align: 'left', stroke: false }); });
      ctx.restore();
    } else if (o.kind === 'distance') {
      rrect(W / 2 - 420, 40, 840, 150, 22, 'rgba(0,0,0,.72)', o.done ? '#5cff7a' : '#ffd400', 5);
      txt(`OVERWORLD DISTANCE: ${o.d.toLocaleString('en-US')}`, W / 2, 92, 50, o.done ? '#5cff7a' : '#fff', { stroke: false });
      txt(`${o.s.toFixed(2)} s`, W / 2, 152, 46, o.done ? '#5cff7a' : '#ffd400', { stroke: false });
    }
