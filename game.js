const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const gameOverOverlay = document.getElementById('game-over-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// 游戏配置
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreElement.textContent = highScore;

let snake = [
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
];

let food = { x: 5, y: 5 };
let dx = 0;
let dy = -1;
let nextDx = 0;
let nextDy = -1;
let gameRunning = false;
let gameLoopId = null;
let lastUpdateTime = 0;
let speed = 7; // 每秒移动次数

// 初始化游戏
function init() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;
    score = 0;
    scoreElement.textContent = score;
    placeFood();
    gameOverOverlay.classList.add('hidden');
    startBtn.classList.add('hidden');
}

// 放置食物
function placeFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // 确保食物不在蛇身上
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            placeFood();
            break;
        }
    }
}

// 绘制游戏
function draw(timestamp) {
    if (!gameRunning) return;

    gameLoopId = requestAnimationFrame(draw);

    // 控制更新频率 (游戏速度)
    const elapsed = timestamp - lastUpdateTime;
    if (elapsed < 1000 / speed) return;
    lastUpdateTime = timestamp;

    update();
    render();
}

// 更新游戏逻辑
function update() {
    // 应用方向改变
    dx = nextDx;
    dy = nextDy;

    // 移动蛇头
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 检查碰撞
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || checkSelfCollision(head)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        placeFood();
        // 每得 50 分增加一点速度
        if (score % 50 === 0) speed = Math.min(speed + 0.5, 20);
    } else {
        snake.pop();
    }
}

// 检查是否撞到自己
function checkSelfCollision(head) {
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
}

// 渲染画面
function render() {
    // 清除画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制食物
    ctx.fillStyle = '#EF5350'; // var(--food-color)
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2, 
        food.y * gridSize + gridSize / 2, 
        gridSize / 2 - 2, 
        0, 
        Math.PI * 2
    );
    ctx.fill();

    // 绘制蛇
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? '#66BB6A' : '#43A047'; // var(--snake-head) : var(--snake-body)
        
        // 绘制圆角矩形
        const r = 4;
        const x = segment.x * gridSize + 1;
        const y = segment.y * gridSize + 1;
        const w = gridSize - 2;
        const h = gridSize - 2;
        
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        // 为蛇头绘制眼睛
        if (isHead) {
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            // 根据方向绘制眼睛
            if (dx === 1) { // 右
                ctx.fillRect(x + w - 6, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + w - 6, y + h - 7, eyeSize, eyeSize);
            } else if (dx === -1) { // 左
                ctx.fillRect(x + 3, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 3, y + h - 7, eyeSize, eyeSize);
            } else if (dy === -1) { // 上
                ctx.fillRect(x + 4, y + 3, eyeSize, eyeSize);
                ctx.fillRect(x + w - 7, y + 3, eyeSize, eyeSize);
            } else if (dy === 1) { // 下
                ctx.fillRect(x + 4, y + h - 6, eyeSize, eyeSize);
                ctx.fillRect(x + w - 7, y + h - 6, eyeSize, eyeSize);
            }
        }
    });
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);
    finalScoreElement.textContent = score;
    gameOverOverlay.classList.remove('hidden');
}

// 监听键盘事件
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
    }
});

// 按钮事件
startBtn.addEventListener('click', () => {
    init();
    gameRunning = true;
    speed = 7;
    lastUpdateTime = performance.now();
    requestAnimationFrame(draw);
});

restartBtn.addEventListener('click', () => {
    init();
    gameRunning = true;
    speed = 7;
    lastUpdateTime = performance.now();
    requestAnimationFrame(draw);
});

// 初始渲染
render();
