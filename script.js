// Constants
const GRID_SIZE = 20;
const GAME_SPEED = 150;
const SWIPE_THRESHOLD = 20;
const SCORE_INCREMENT = 10;

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = {
    statusMessage: document.getElementById('statusMessage'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    gameOverModal: document.getElementById('gameOverModal'),
    finalScore: document.getElementById('finalScore'),
};

// Game State
const GRID_COUNT = canvas.width / GRID_SIZE;
let state = {
    snake: [],
    food: {},
    score: 0,
    dx: GRID_SIZE,
    dy: 0,
    isPlaying: false,
    isPaused: true,
    gameLoopInterval: null,
    nextDirection: { dx: GRID_SIZE, dy: 0 },
    lastDirection: { dx: GRID_SIZE, dy: 0 },
};

// Touch Tracking
let touch = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
};

// Game Functions

function initGame() {
    state.snake = [
        { x: GRID_SIZE * 4, y: GRID_SIZE * 2 },
        { x: GRID_SIZE * 3, y: GRID_SIZE * 2 },
        { x: GRID_SIZE * 2, y: GRID_SIZE * 2 },
    ];
    state.dx = GRID_SIZE;
    state.dy = 0;
    state.score = 0;
    state.nextDirection = { dx: GRID_SIZE, dy: 0 };
    state.lastDirection = { dx: GRID_SIZE, dy: 0 };
    state.isPaused = true;
    state.isPlaying = true;

    ui.scoreDisplay.textContent = 'Score: 0';
    ui.statusMessage.textContent = 'Press Enter to Start';
    ui.gameOverModal.style.display = 'none';

    generateFood();
    drawGame();
}

function gameLoop() {
    if (state.isPaused) return;

    state.dx = state.nextDirection.dx;
    state.dy = state.nextDirection.dy;

    if (checkCollision()) {
        endGame();
        return;
    }

    const head = { x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy };
    state.snake.unshift(head);

    if (head.x === state.food.x && head.y === state.food.y) {
        state.score += SCORE_INCREMENT;
        ui.scoreDisplay.textContent = `Score: ${state.score}`;
        generateFood();
    } else {
        state.snake.pop();
    }

    state.lastDirection.dx = state.dx;
    state.lastDirection.dy = state.dy;

    drawGame();
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = '#00ff80';
    ctx.strokeStyle = '#00a04c';
    state.snake.forEach((segment, index) => {
        ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);

        if (index === 0) {
            ctx.shadowColor = '#00ff80';
            ctx.shadowBlur = 15;
        }
    });
    ctx.shadowBlur = 0;

    // Draw food
    ctx.fillStyle = '#ff9900';
    ctx.strokeStyle = '#cc7a00';
    ctx.fillRect(state.food.x, state.food.y, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(state.food.x, state.food.y, GRID_SIZE, GRID_SIZE);
    ctx.shadowColor = '#ff9900';
    ctx.shadowBlur = 10;
    ctx.fillRect(state.food.x, state.food.y, GRID_SIZE, GRID_SIZE);
    ctx.shadowBlur = 0;
}

function generateFood() {
    let newFood;
    let onSnake;

    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE,
            y: Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE
        };
        onSnake = state.snake.some(s => s.x === newFood.x && s.y === newFood.y);
    } while (onSnake);

    state.food = newFood;
}

function checkCollision() {
    const headX = state.snake[0].x + state.dx;
    const headY = state.snake[0].y + state.dy;

    const hitWall = headX < 0 || headX >= canvas.width || headY < 0 || headY >= canvas.height;
    const hitSelf = state.snake.slice(1).some(s => s.x === headX && s.y === headY);

    return hitWall || hitSelf;
}

function endGame() {
    clearInterval(state.gameLoopInterval);
    state.isPlaying = false;
    ui.finalScore.textContent = state.score;
    ui.gameOverModal.style.display = 'flex';
}

function startGame() {
    if (state.isPlaying && state.isPaused) {
        state.isPaused = false;
        ui.statusMessage.textContent = 'Playing...';
        state.gameLoopInterval = setInterval(gameLoop, GAME_SPEED);
    }
}

function restartGame() {
    clearInterval(state.gameLoopInterval);
    initGame();
}

// Input Handling

function setDirection(newDir) {
    if (state.isPaused) {
        startGame();
        return;
    }

    const directions = {
        'UP': { dx: 0, dy: -GRID_SIZE },
        'DOWN': { dx: 0, dy: GRID_SIZE },
        'LEFT': { dx: -GRID_SIZE, dy: 0 },
        'RIGHT': { dx: GRID_SIZE, dy: 0 },
    };

    const dir = directions[newDir];
    if (!dir) return;

    const isOpposite = Math.abs(state.lastDirection.dx) === Math.abs(dir.dx) &&
                       Math.abs(state.lastDirection.dy) === Math.abs(dir.dy);

    if (!isOpposite) {
        state.nextDirection = dir;
    }
}

const keyMap = {
    'ArrowUp': 'UP', 'w': 'UP',
    'ArrowDown': 'DOWN', 's': 'DOWN',
    'ArrowLeft': 'LEFT', 'a': 'LEFT',
    'ArrowRight': 'RIGHT', 'd': 'RIGHT',
};

document.addEventListener('keydown', (e) => {
    if (ui.gameOverModal.style.display === 'flex' && e.key === 'Enter') {
        restartGame();
        return;
    }
    if (state.isPaused && e.key === 'Enter') {
        startGame();
        return;
    }
    if (!state.isPlaying || state.isPaused) return;

    const direction = keyMap[e.key];
    if (direction) setDirection(direction);
});

// Touch/Swipe Handling

canvas.addEventListener('touchstart', (e) => {
    touch.startX = e.changedTouches[0].screenX;
    touch.startY = e.changedTouches[0].screenY;
    e.preventDefault();
}, false);

canvas.addEventListener('touchend', (e) => {
    touch.endX = e.changedTouches[0].screenX;
    touch.endY = e.changedTouches[0].screenY;
    handleGesture();
    e.preventDefault();
}, false);

function handleGesture() {
    const deltaX = touch.endX - touch.startX;
    const deltaY = touch.endY - touch.startY;
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
        if (state.isPaused) startGame();
        return;
    }

    if (isHorizontal) {
        setDirection(deltaX > SWIPE_THRESHOLD ? 'RIGHT' : 'LEFT');
    } else {
        setDirection(deltaY > SWIPE_THRESHOLD ? 'DOWN' : 'UP');
    }
}

// Initialization

window.addEventListener('load', () => {
    initGame();
    ctx.fillStyle = '#00ff80';
    ctx.font = '30px "Inter", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NEON VIPER READY', canvas.width / 2, canvas.height / 2);
});
