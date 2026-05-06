// js/canvas.js
// 펜 필기 캔버스. PointerEvents 기반.
// setPointerCapture 사용 안 함 (캡처가 잡히면 도구 버튼 클릭이 막힘).

let canvas, ctx;
let drawing = false;
let drawTool = 'pen';
let drawSize = 4;
let strokes = [];
let currentStroke = null;

window.initCanvas = function() {
  canvas = document.getElementById('drawing-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  canvas.addEventListener('pointerdown', e => {
    drawing = true;
    const pos = getPointerPos(e);
    const sizeBoost = (e.pointerType === 'pen') ? (0.5 + pos.p) : 1;
    currentStroke = {
      tool: drawTool,
      color: drawTool === 'eraser' ? 'rgba(0,0,0,1)' : '#1a1a2e',
      size: drawSize * sizeBoost,
      points: [pos]
    };
    strokes.push(currentStroke);
    drawStroke(currentStroke);
  });

  canvas.addEventListener('pointermove', e => {
    if (!drawing || !currentStroke) return;
    const pos = getPointerPos(e);
    currentStroke.points.push(pos);
    const pts = currentStroke.points;
    if (pts.length < 2) return;
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = currentStroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    const a = pts[pts.length-2], b = pts[pts.length-1];
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => {
    canvas.addEventListener(ev, () => {
      drawing = false;
      currentStroke = null;
    });
  });

  // 캔버스 밖에서 펜을 떼는 경우 안전장치
  window.addEventListener('pointerup', () => {
    drawing = false;
    currentStroke = null;
  });

  window.addEventListener('resize', resizeCanvas);
};

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top, p: e.pressure || 0.5 };
}

window.resizeCanvas = function() {
  if (!canvas) return;
  if (!document.getElementById('problem-screen').classList.contains('active')) return;
  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redrawAll();
};

window.clearCanvas = function() {
  strokes = [];
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
};

function redrawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(s => drawStroke(s));
}

function drawStroke(s) {
  if (s.points.length < 2) {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.points[0].x, s.points[0].y, s.size/2, 0, Math.PI*2);
    ctx.fill();
    return;
  }
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.beginPath();
  ctx.moveTo(s.points[0].x, s.points[0].y);
  for (let i = 1; i < s.points.length; i++) {
    const p = s.points[i], prev = s.points[i-1];
    const mid = { x: (p.x + prev.x)/2, y: (p.y + prev.y)/2 };
    ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
  }
  ctx.lineTo(s.points[s.points.length-1].x, s.points[s.points.length-1].y);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

window.handleToolButton = function(tool) {
  if (tool === 'undo') { strokes.pop(); redrawAll(); return; }
  if (tool === 'clear') { window.clearCanvas(); return; }
  if (tool === 'pen' || tool === 'eraser') {
    drawTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => {
      const t = b.dataset.tool;
      if (t === 'pen' || t === 'eraser') b.classList.toggle('active', t === tool);
    });
  }
};

window.setStrokeSize = function(size) {
  drawSize = parseInt(size);
};

window.hasDrawing = function() {
  return strokes.length > 0;
};

console.log('[MATHLAND] canvas 모듈 로드');
