const GRID_SIZE = 20;
const CELL_SIZE = 25;
let snake = [];
const DIRECTIONS = {
    LEFT: {x: -1, y: 0},
    RIGHT: {x: 1, y: 0},
    UP: {x: 0, y: -1},
    DOWN: {x: 0, y: 1}
}

let score = 0;
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;
let food;
let direction = DIRECTIONS.RIGHT;
let moveTimer = 0;
const MOVE_INTERVAL = 150;
let started = false;
let gameOver = false;
let activeScene;
let foodPulse = {scale: 1};

const config = {
    type: Phaser.AUTO,
    width:500,
    height:500,

    parent: 'game',

    transparent: true,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

const game = new Phaser.Game(config);


function preload(){

}

function create(){
    activeScene = this;
    this.gridGraphics = this.add.graphics();
    this.snakeGraphics = this.add.graphics();
    this.foodGraphics = this.add.graphics();
    this.foodTween = null;

    drawGrid(this);
    

    snake.push({x: 10, y: 10});
    snake.push({x: 9, y: 10});
    snake.push({x: 8, y: 10});

    spawnFood();
    drawSnake(this);
    drawFood(this);
    updateScoreDisplay();

    this.input.keyboard.on("keydown-UP", (event) =>{
        handleDirection(DIRECTIONS.UP);
    })
    this.input.keyboard.on("keydown-DOWN", (event) =>{
        handleDirection(DIRECTIONS.DOWN);
    })
    this.input.keyboard.on("keydown-RIGHT", (event) =>{
        handleDirection(DIRECTIONS.RIGHT);
    })
    this.input.keyboard.on("keydown-LEFT", (event) =>{
        handleDirection(DIRECTIONS.LEFT);
    })

    document.getElementById("restart-button").addEventListener("click", restartGame);

}

function update(time, delta){
    if(!started || gameOver){
        return;
    }
    moveTimer += delta;

    if(moveTimer >= MOVE_INTERVAL){
        moveSnake();
        moveTimer = 0;
    }

    drawSnake(this);
    drawFood(this);
}

function handleDirection(newDirection){
    if(!started){
        direction = newDirection;
        started = true;
        document.getElementById("start-screen").classList.add("hidden");
        return;
    }

    changeDirection(newDirection);
}

function changeDirection(newDirection) {
    if(newDirection.x === -direction.x && newDirection.y === -direction.y){
        return; // Prevent reversing direction
    } else {
        direction = newDirection;
    }
}

function checkSelfCollision(head) {
    for(let i = 1; i < snake.length; i++){
        if(head.x === snake[i].x && head.y === snake[i].y){
            endGame();
            return true;
        }
    }

    return false;
}

function moveSnake(){
    const head = snake[0];
    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    };

    if(newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE){
        endGame();
        return;
    }

    if(checkSelfCollision(newHead)){
        return;
    }

    snake.unshift(newHead);
    if(newHead.x === food.x && newHead.y === food.y){
        score++;
        if(score > highScore){
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
        }
        updateScoreDisplay();
        animateScore();
        spawnFood();
    } else {
        snake.pop();
    }
}

function spawnFood(){
    const x = Phaser.Math.Between(0, GRID_SIZE - 1);
    const y = Phaser.Math.Between(0, GRID_SIZE - 1);
    food = {x: x, y: y};
    foodPulse.scale = 1;

    if(activeScene && activeScene.foodTween){
        activeScene.foodTween.stop();
    }

    if(activeScene){
        activeScene.foodTween = activeScene.tweens.add({
            targets: foodPulse,
            scale: 1.12,
            duration: 650,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1
        });
    }
}

function drawGrid(scene){

    scene.gridGraphics.lineStyle(1, 0x6b8294, 0.3);
    
    for(let i = 0; i<=GRID_SIZE; i++){
        scene.gridGraphics.lineBetween(
            i*CELL_SIZE, 
            0, 
            i*CELL_SIZE, 
            GRID_SIZE*CELL_SIZE
        );
    }

    for(let j = 0; j<=GRID_SIZE; j++){
        scene.gridGraphics.lineBetween(
            0, 
            j*CELL_SIZE, 
            GRID_SIZE*CELL_SIZE, 
            j*CELL_SIZE
        );
    }
    
}

function drawSnake(scene){
    scene.snakeGraphics.clear();

    for(let i = 0; i<snake.length; i++){
        const pixelX = snake[i].x * CELL_SIZE + CELL_SIZE / 2;
        const pixelY = snake[i].y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;

        scene.snakeGraphics.fillStyle(0x22c55e, 0.18);
        scene.snakeGraphics.fillCircle(pixelX, pixelY, radius + 6);

        scene.snakeGraphics.fillStyle(i === 0 ? 0x19f59b : 0x22c55e, 1);
        scene.snakeGraphics.fillCircle(pixelX, pixelY, radius);

        if(i === 0){
            drawHeadEyes(scene, pixelX, pixelY);
        }
    }
}

function drawHeadEyes(scene, pixelX, pixelY){
    const eyeOffset = 4;
    let firstEye = {x: pixelX, y: pixelY};
    let secondEye = {x: pixelX, y: pixelY};

    if(direction === DIRECTIONS.RIGHT || direction === DIRECTIONS.LEFT){
        firstEye = {x: pixelX + (direction.x * 3), y: pixelY - eyeOffset};
        secondEye = {x: pixelX + (direction.x * 3), y: pixelY + eyeOffset};
    } else {
        firstEye = {x: pixelX - eyeOffset, y: pixelY + (direction.y * 3)};
        secondEye = {x: pixelX + eyeOffset, y: pixelY + (direction.y * 3)};
    }

    scene.snakeGraphics.fillStyle(0x063b2a, 1);
    scene.snakeGraphics.fillCircle(firstEye.x, firstEye.y, 1.5);
    scene.snakeGraphics.fillCircle(secondEye.x, secondEye.y, 1.5);
}

function drawFood(scene){
    scene.foodGraphics.clear();
    scene.foodGraphics.fillStyle(0xef4444, 1);
    const pixelX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const pixelY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulseRadius = CELL_SIZE / 2 * foodPulse.scale;

    scene.foodGraphics.fillStyle(0xef4444, 0.2);
    scene.foodGraphics.fillCircle(pixelX, pixelY, pulseRadius + 6);
    scene.foodGraphics.fillStyle(0xff5252, 1);
    scene.foodGraphics.fillCircle(pixelX, pixelY, pulseRadius - 1);
}

function endGame(){
    gameOver = true;
    document.getElementById("final-score").textContent = String(score).padStart(4, "0");
    const gameOverElement = document.getElementById("game-over");
    gameOverElement.classList.remove("hidden");
    requestAnimationFrame(() => gameOverElement.classList.add("visible"));
}

function updateScoreDisplay(){
    document.getElementById("score").textContent = String(score).padStart(4, "0");
    document.getElementById("high-score").textContent = String(highScore).padStart(4, "0");
}

function animateScore(){
    const scoreElement = document.getElementById("score");
    scoreElement.classList.remove("score-pop");
    void scoreElement.offsetWidth;
    scoreElement.classList.add("score-pop");
}

function restartGame(){
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    direction = DIRECTIONS.RIGHT;
    moveTimer = 0;
    score = 0;
    started = false;
    gameOver = false;

    updateScoreDisplay();
    document.getElementById("final-score").textContent = "0000";
    document.getElementById("game-over").classList.remove("visible");
    document.getElementById("game-over").classList.add("hidden");
    document.getElementById("start-screen").classList.remove("hidden");

    spawnFood();
    drawSnake(activeScene);
    drawFood(activeScene);
}