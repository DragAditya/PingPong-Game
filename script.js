// Advanced, Mobile-Friendly Pong Game

const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('player-score');
const aiScoreEl = document.getElementById('ai-score');
const resetBtn = document.getElementById('reset-btn');
const beepSound = document.getElementById('beep');
const scoreSound = document.getElementById('score');

let WIDTH, HEIGHT, DPR;

// UI Responsive Handler
function resizeCanvas() {
    DPR = window.devicePixelRatio || 1;
    // Max 400px, min 240px, aspect 4:5
    let w = Math.min(window.innerWidth * 0.96, 400);
    w = Math.max(w, 240);
    let h = w * 1.25;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game objects
const PADDLE_W = 0.035, PADDLE_H = 0.19, BALL_SZ = 0.04;
let paddleWidth, paddleHeight, ballSize;
let player, ai, ball, ballTrail;

function initObjects() {
    paddleWidth = WIDTH * PADDLE_W;
    paddleHeight = HEIGHT * PADDLE_H;
    ballSize = Math.min(WIDTH, HEIGHT) * BALL_SZ;

    player = {
        x: WIDTH * 0.035,
        y: HEIGHT/2 - paddleHeight/2,
        width: paddleWidth,
        height: paddleHeight,
        color: "#00ffc6"
    };
    ai = {
        x: WIDTH - paddleWidth - WIDTH * 0.035,
        y: HEIGHT/2 - paddleHeight/2,
        width: paddleWidth,
        height: paddleHeight,
        color: "#ff5f5f"
    };
    ball = {
        x: WIDTH/2 - ballSize/2,
        y: HEIGHT/2 - ballSize/2,
        size: ballSize,
        speed: Math.max(WIDTH, HEIGHT) * 0.011,
        vx: 0,
        vy: 0,
        color: "#fff"
    };
    ballTrail = [];
    resetBall(true);
}
initObjects();
window.addEventListener('resize', initObjects);

// Scores
let playerScore = 0;
let aiScore = 0;

// Difficulty
let aiLevel = 0.07; // Higher is harder AI

// Ball reset
function resetBall(initial) {
    ball.x = WIDTH/2 - ball.size/2;
    ball.y = HEIGHT/2 - ball.size/2;
    let angle = (Math.random() * Math.PI/2 - Math.PI/4) + (Math.random() > 0.5 ? 0 : Math.PI);
    ball.vx = Math.cos(angle) * ball.speed * (1 + 0.1 * (playerScore + aiScore));
    ball.vy = Math.sin(angle) * ball.speed * (1 + 0.08 * (playerScore + aiScore));
    if (initial) {
        playerScore = 0;
        aiScore = 0;
        updateScore();
    }
    ballTrail = [];
}

// Drawing
function drawRoundedRect(x, y, w, h, radius, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowColor = color + "88";
    ctx.shadowBlur = 8 * DPR;
    ctx.fill();
    ctx.restore();
}

function drawNet() {
    let segLen = HEIGHT * 0.05, segSpace = HEIGHT * 0.04;
    ctx.save();
    ctx.strokeStyle = "#6060aa";
    ctx.lineWidth = 4 * DPR;
    for(let y=segSpace; y<HEIGHT; y += segLen + segSpace) {
        ctx.beginPath();
        ctx.moveTo(WIDTH/2, y);
        ctx.lineTo(WIDTH/2, y + segLen);
        ctx.stroke();
    }
    ctx.restore();
}

function drawBallTrail() {
    for(let i=0; i<ballTrail.length; i++) {
        let t = ballTrail[i];
        ctx.save();
        ctx.globalAlpha = 0.13 + 0.09*i;
        ctx.fillStyle = i < 2 ? "#fff" : "#00ffc6";
        ctx.beginPath();
        ctx.arc(t.x + ball.size/2, t.y + ball.size/2, ball.size/2 * (1-0.07*i), 0, 2 * Math.PI);
        ctx.shadowColor = "#00ffc6";
        ctx.shadowBlur = 6 * DPR;
        ctx.fill();
        ctx.restore();
    }
}

// Update score UI
function updateScore() {
    playerScoreEl.textContent = playerScore;
    aiScoreEl.textContent = aiScore;
}

// Main Game Logic
function update() {
    // Ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ball trail
    ballTrail.unshift({x: ball.x, y: ball.y});
    if (ballTrail.length > 11) ballTrail.pop();

    // Wall collision
    if (ball.y <= 0) {
        ball.y = 0;
        ball.vy *= -1;
        playBeep();
    }
    if (ball.y + ball.size >= HEIGHT) {
        ball.y = HEIGHT - ball.size;
        ball.vy *= -1;
        playBeep();
    }

    // Paddle collision (player)
    if (
        ball.x <= player.x + player.width &&
        ball.x >= player.x &&
        ball.y + ball.size >= player.y &&
        ball.y <= player.y + player.height
    ) {
        ball.x = player.x + player.width;
        ball.vx = Math.abs(ball.vx) * (1 + Math.random()*0.05);
        // Add angle based on hit
        let rel = (ball.y + ball.size/2 - (player.y + player.height/2)) / (player.height/2);
        ball.vy = ball.speed * rel * 1.3 + ball.vy * 0.1;
        playBeep();
        flashPaddle(player);
    }
    // Paddle collision (AI)
    if (
        ball.x + ball.size >= ai.x &&
        ball.x + ball.size <= ai.x + ai.width &&
        ball.y + ball.size >= ai.y &&
        ball.y <= ai.y + ai.height
    ) {
        ball.x = ai.x - ball.size;
        ball.vx = -Math.abs(ball.vx) * (1 + Math.random()*0.07);
        let rel = (ball.y + ball.size/2 - (ai.y + ai.height/2)) / (ai.height/2);
        ball.vy = ball.speed * rel * 1.2 + ball.vy * 0.08;
        playBeep();
        flashPaddle(ai);
    }

    // Score
    if (ball.x < -ball.size) {
        aiScore++;
        updateScore();
        playScore();
        resetBall();
    }
    if (ball.x > WIDTH + ball.size) {
        playerScore++;
        updateScore();
        playScore();
        resetBall();
    }

    // AI movement -- smarter with difficulty scaling
    let aiTarget = ball.y + ball.size / 2 - ai.height / 2;
    let diff = aiTarget - ai.y;
    ai.y += diff * Math.min(aiLevel + 0.02 * Math.abs(ball.vx / ball.speed), 1);
    ai.y = Math.max(0, Math.min(HEIGHT - ai.height, ai.y));
}

// Drawing everything
function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawNet();
    drawBallTrail();
    // Paddles
    drawRoundedRect(player.x, player.y, player.width, player.height, player.width * 0.8, player.color);
    drawRoundedRect(ai.x, ai.y, ai.width, ai.height, ai.width * 0.8, ai.color);
    // Ball
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x + ball.size/2, ball.y + ball.size/2, ball.size/2, 0, 2*Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#00ffc6";
    ctx.shadowBlur = 16 * DPR;
    ctx.fill();
    ctx.restore();
}

// Touch and Mouse Controls
let isDragging = false;
let dragOffset = 0;

function pointerToCanvasY(e) {
    let rect = canvas.getBoundingClientRect();
    let clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    return (clientY - rect.top) * DPR - player.height/2;
}

canvas.addEventListener('mousedown', e => {
    if (isOnPaddle(e)) {
        isDragging = true;
        dragOffset = pointerToCanvasY(e) - player.y;
    }
});
canvas.addEventListener('touchstart', e => {
    if (isOnPaddle(e)) {
        isDragging = true;
        dragOffset = pointerToCanvasY(e) - player.y;
        e.preventDefault();
    }
});

function isOnPaddle(e) {
    let y = pointerToCanvasY(e);
    return y >= player.y - 36*DPR && y <= player.y + player.height + 36*DPR;
}

function movePaddle(e) {
    if (isDragging) {
        player.y = pointerToCanvasY(e) - dragOffset;
        player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y));
    }
}
canvas.addEventListener('mousemove', movePaddle);
canvas.addEventListener('touchmove', movePaddle);

function stopDrag() {
    isDragging = false;
}
canvas.addEventListener('mouseup', stopDrag);
canvas.addEventListener('mouseleave', stopDrag);
canvas.addEventListener('touchend', stopDrag);
canvas.addEventListener('touchcancel', stopDrag);

// Quick tap to move paddle center (mobile)
canvas.addEventListener('touchstart', e => {
    if (!isDragging && e.touches.length === 1) {
        let y = pointerToCanvasY(e);
        player.y = y;
        player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y));
    }
});

// Keyboard for desktop
window.addEventListener('keydown', e => {
    if (e.key === "ArrowUp" || e.key === "w") {
        player.y -= HEIGHT * 0.06;
    } else if (e.key === "ArrowDown" || e.key === "s") {
        player.y += HEIGHT * 0.06;
    }
    player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y));
});

// Paddle flash effect
function flashPaddle(paddle) {
    let orig = paddle.color;
    paddle.color = "#fff";
    setTimeout(() => paddle.color = orig, 90);
}

// Sound
function playBeep() {
    try { beepSound.currentTime = 0; beepSound.volume = 0.22; beepSound.play(); } catch{}
}
function playScore() {
    try { scoreSound.currentTime = 0; scoreSound.volume = 0.43; scoreSound.play(); } catch{}
}

// Reset Button
resetBtn.addEventListener('click', () => {
    resetBall(true);
    playerScore = aiScore = 0;
    updateScore();
});

// Main game loop
function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}
loop();

// Prevent scrolling on mobile when dragging or touching the canvas
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(ev => {
    canvas.addEventListener(ev, e => e.preventDefault(), {passive: false});
});
