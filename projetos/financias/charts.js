/**
 * charts.js – Gráficos em Canvas puro
 * Compatível com Chrome/Firefox antigos. Sem bibliotecas externas.
 */

 var Charts = (function () {

  var COLORS = ['#10b981','#ef4444','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#6b7280','#84cc16'];

  function getSurfaceColor() {
    var s = getComputedStyle(document.body).getPropertyValue('--surface');
    return s ? s.trim() : '#ffffff';
  }

  function getMutedColor() {
    var s = getComputedStyle(document.body).getPropertyValue('--text-muted');
    return s ? s.trim() : '#718096';
  }

  function getBorderColor() {
    var s = getComputedStyle(document.body).getPropertyValue('--border');
    return s ? s.trim() : '#e2e8f0';
  }

  function clear(canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ---- PIZZA (donut) ---- */
  function drawPie(canvasId, legendId, data) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    clear(canvas);

    if (!data || !data.length) {
      ctx.fillStyle = getMutedColor();
      ctx.font = '13px Segoe UI, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados', canvas.width / 2, canvas.height / 2);
      if (legendId) document.getElementById(legendId).innerHTML = '';
      return;
    }

    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var r = Math.min(cx, cy) - 16;
    var rInner = r * 0.52;
    var angle = -Math.PI / 2;

    data.forEach(function (d, i) {
      var slice = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      angle += slice;
    });

    // Buraco
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.fillStyle = getSurfaceColor();
    ctx.fill();

    // Texto central
    ctx.fillStyle = getMutedColor();
    ctx.font = 'bold 12px Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(data.length + ' categ.', cx, cy + 4);

    // Legenda
    if (legendId) {
      var leg = document.getElementById(legendId);
      leg.innerHTML = data.map(function (d, i) {
        return '<span class="legend-item">'
          + '<span class="legend-dot" style="background:' + COLORS[i % COLORS.length] + '"></span>'
          + UI.escHtml(d.name)
          + '</span>';
      }).join('');
    }
  }

  /* ---- BARRAS (receita vs despesa por mês) ---- */
  function drawBar(canvasId, data) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    clear(canvas);
    var W = canvas.width, H = canvas.height;
    var muted = getMutedColor(), border = getBorderColor();

    if (!data || !data.length) {
      ctx.fillStyle = muted;
      ctx.font = '13px Segoe UI, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados', W / 2, H / 2);
      return;
    }

    var maxVal = 1;
    data.forEach(function (d) { maxVal = Math.max(maxVal, d.income || 0, d.expense || 0); });

    var padL = 60, padR = 20, padT = 20, padB = 50;
    var chartW = W - padL - padR, chartH = H - padT - padB;
    var colW = chartW / data.length;
    var barW = colW * 0.3;
    var gap  = colW * 0.05;

    // Guias
    for (var y = 0; y <= 4; y++) {
      var yy = padT + chartH - (y / 4) * chartH;
      ctx.strokeStyle = border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
      ctx.fillStyle = muted; ctx.font = '11px Segoe UI, Arial'; ctx.textAlign = 'right';
      var amt = maxVal * y / 4;
      ctx.fillText(amt >= 1000 ? 'R$' + (amt/1000).toFixed(0) + 'k' : 'R$' + amt.toFixed(0), padL - 5, yy + 4);
    }

    data.forEach(function (d, i) {
      var x = padL + i * colW + colW * 0.1;

      // Barra receita (verde)
      var incH = (( d.income || 0) / maxVal) * chartH;
      ctx.fillStyle = '#10b981';
      roundRect(ctx, x, padT + chartH - incH, barW, incH, 4);

      // Barra despesa (vermelho)
      var expH = ((d.expense || 0) / maxVal) * chartH;
      ctx.fillStyle = '#ef4444';
      roundRect(ctx, x + barW + gap, padT + chartH - expH, barW, expH, 4);

      // Label
      ctx.fillStyle = muted; ctx.font = '11px Segoe UI, Arial'; ctx.textAlign = 'center';
      ctx.fillText(d.label || '', x + barW + gap / 2, H - padB + 16);
    });

    // Legenda
    drawLegendDot(ctx, padL, H - 16, '#10b981', 'Receitas', muted);
    drawLegendDot(ctx, padL + 100, H - 16, '#ef4444', 'Despesas', muted);
  }

  /* ---- LINHA (evolução) ---- */
  function drawLine(canvasId, data) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    clear(canvas);
    var W = canvas.width, H = canvas.height;
    var muted = getMutedColor(), border = getBorderColor();

    if (!data || data.length < 2) {
      ctx.fillStyle = muted;
      ctx.font = '13px Segoe UI, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Dados insuficientes (mínimo 2 meses)', W / 2, H / 2);
      return;
    }

    var maxVal = 1;
    data.forEach(function (d) { maxVal = Math.max(maxVal, d.income || 0, d.expense || 0, d.balance || 0); });

    var padL = 60, padR = 20, padT = 20, padB = 50;
    var chartW = W - padL - padR, chartH = H - padT - padB;
    var step = chartW / (data.length - 1);

    // Guias
    for (var y = 0; y <= 4; y++) {
      var yy = padT + chartH - (y / 4) * chartH;
      ctx.strokeStyle = border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
      ctx.fillStyle = muted; ctx.font = '11px Segoe UI, Arial'; ctx.textAlign = 'right';
      var amt = maxVal * y / 4;
      ctx.fillText(amt >= 1000 ? 'R$' + (amt/1000).toFixed(0) + 'k' : 'R$' + amt.toFixed(0), padL - 5, yy + 4);
    }

    function drawPolyLine(key, color) {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      data.forEach(function (d, i) {
        var px = padL + i * step;
        var val = Math.max(0, d[key] || 0);
        var py = padT + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
      // Pontos
      data.forEach(function (d, i) {
        var px = padL + i * step;
        var val = Math.max(0, d[key] || 0);
        var py = padT + chartH - (val / maxVal) * chartH;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.fillStyle = getSurfaceColor();
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
      });
    }

    drawPolyLine('income',  '#10b981');
    drawPolyLine('expense', '#ef4444');

    // Labels mês
    data.forEach(function (d, i) {
      var px = padL + i * step;
      ctx.fillStyle = muted; ctx.font = '11px Segoe UI, Arial'; ctx.textAlign = 'center';
      ctx.fillText(d.label || '', px, H - padB + 16);
    });

    // Legenda
    drawLegendDot(ctx, padL, H - 10, '#10b981', 'Receitas', muted);
    drawLegendDot(ctx, padL + 100, H - 10, '#ef4444', 'Despesas', muted);
  }

  /* ---- Helpers ---- */
  function roundRect(ctx, x, y, w, h, r) {
    if (h <= 0) return;
    if (h < r) r = h;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawLegendDot(ctx, x, y, color, label, muted) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x + 5, y - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = muted; ctx.font = '11px Segoe UI, Arial'; ctx.textAlign = 'left';
    ctx.fillText(label, x + 14, y);
  }

  return { drawPie: drawPie, drawBar: drawBar, drawLine: drawLine };
})();
