const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const hpBar = document.getElementById('hp-bar');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let gameActive = true;
let enemies = [];
let pinhoes = []; 
let spawnTimer = 0;
let baseSpeed = 3; 

// CONFIGURAÇÃO DA GRALHA-AZUL (Sem nenhum traço de rosa)
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 110,
    width: 40,
    height: 60,
    color: '#00457c',     // Corpo Azul Escuro
    headColor: '#111111', // Cabeça Preta
    state: 'idle',
    hp: 100,
    maxHp: 100,
    jumpSpeed: 0,
    gravity: 0.6,
    groundY: canvas.height - 110,
    actionTimer: 0
};

// Controles
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    if (e.key === 'ArrowLeft' && player.state === 'idle') {
        player.state = 'punch_left';
        player.actionTimer = 10;
        checkHit('left');
    } else if (e.key === 'ArrowRight' && player.state === 'idle') {
        player.state = 'punch_right';
        player.actionTimer = 10;
        checkHit('right');
    } else if ((e.key === 'ArrowUp' || e.key === ' ') && player.y === player.groundY) {
        player.jumpSpeed = -13;
    }
});

restartBtn.addEventListener('click', resetGame);

function spawnEnemy() {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    
    // PROGRESSÃO DE DIFICULDADE (Lobos andam mais rápido conforme os pontos sobem)
    const difficultyBonus = Math.min(score * 0.15, 8); 
    const currentSpeed = baseSpeed + difficultyBonus + Math.random() * 1.5;

    const enemy = {
        x: side === 'left' ? -40 : canvas.width + 40,
        y: canvas.height - 100,
        width: 40,
        height: 50,
        color: '#7f8c8d',
        speed: side === 'left' ? currentSpeed : -currentSpeed
    };
    enemies.push(enemy);
}

function checkHit(direction) {
    const reach = 65;
    enemies.forEach((enemy, index) => {
        if (direction === 'left' && enemy.x < player.x && enemy.x > player.x - reach) {
            defeatEnemy(enemy, index);
        } else if (direction === 'right' && enemy.x > player.x && enemy.x < player.x + player.width + reach) {
            defeatEnemy(enemy, index);
        }
    });
}

function defeatEnemy(enemy, index) {
    // Drop de pinhão
    pinhoes.push({
        x: enemy.x + 15,
        y: enemy.y + 10,
        width: 15,
        height: 22,
        vSpeed: -5, 
        hSpeed: enemy.speed * -0.3
    });
    
    enemies.splice(index, 1);
}

function update() {
    if (!gameActive) return;

    // Física do Jogador
    player.y += player.jumpSpeed;
    if (player.y < player.groundY) {
        player.jumpSpeed += player.gravity;
    } else {
        player.y = player.groundY;
        player.jumpSpeed = 0;
    }

    if (player.state !== 'idle') {
        player.actionTimer--;
        if (player.actionTimer <= 0) player.state = 'idle';
    }

    // Tempo de spawn reduz conforme os pontos aumentam
    spawnTimer++;
    const spawnInterval = Math.max(50 - Math.floor(score * 0.5), 18); 
    if (spawnTimer % spawnInterval === 0) {
        spawnEnemy();
    }

    // Inimigos
    enemies.forEach((enemy, index) => {
        enemy.x += enemy.speed;

        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            if (player.y < player.groundY && player.jumpSpeed > 0) {
                defeatEnemy(enemy, index);
                player.jumpSpeed = -8;
            } else {
                player.hp -= 20;
                hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
                enemies.splice(index, 1);
                if (player.hp <= 0) gameOver();
            }
        }
    });

    // Pinhões
    pinhoes.forEach((pinhao, index) => {
        pinhao.x += pinhao.hSpeed;
        pinhao.y += pinhao.vSpeed;
        
        if (pinhao.y < canvas.height - 70) {
            pinhao.vSpeed += 0.4;
        } else {
            pinhao.y = canvas.height - 70;
            pinhao.hSpeed = 0;
            pinhao.vSpeed = 0;
        }

        let distToPlayer = Math.abs((player.x + player.width/2) - pinhao.x);
        if (distToPlayer < 65 && Math.abs(player.y - pinhao.y) < 85) {
            pinhoes.splice(index, 1);
            score++;
            scoreEl.textContent = score;
        }
    });
}

function drawAraucaria(x, y, scale) {
    ctx.fillStyle = '#4a2f13'; 
    ctx.fillRect(x, y, 20 * scale, 120 * scale);
    
    ctx.fillStyle = '#1e4620'; 
    ctx.fillRect(x - 40 * scale, y, 100 * scale, 15 * scale);
    ctx.fillRect(x - 50 * scale, y - 25 * scale, 120 * scale, 15 * scale);
    ctx.fillRect(x - 30 * scale, y - 50 * scale, 80 * scale, 15 * scale);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fundo
    drawAraucaria(80, 150, 0.8);
    drawAraucaria(680, 130, 0.9);

    // Chão
    ctx.fillStyle = '#8d6e63'; 
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.fillStyle = '#5d4037'; 
    ctx.fillRect(0, canvas.height - 15, canvas.width, 15);

    // Lobos
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Pinhões
    pinhoes.forEach(pinhao => {
        ctx.fillStyle = '#d35400'; 
        ctx.beginPath();
        ctx.ellipse(pinhao.x, pinhao.y, pinhao.width/2, pinhao.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(pinhao.x - 2, pinhao.y - pinhao.height/2, 4, 4);
    });

    // DESENHO DA GRALHA-AZUL (Cores forçadas e corrigidas)
    ctx.fillStyle = player.color; // Azul Escuro
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = player.headColor; // Cabeça Preta
    ctx.fillRect(player.x, player.y, player.width, 22);
    
    ctx.fillStyle = '#f1c40f'; // Bico Amarelo
    if (player.state === 'punch_left') {
        ctx.fillRect(player.x - 15, player.y + 6, 15, 10);
    } else {
        ctx.fillRect(player.x + player.width, player.y + 6, 15, 10);
    }

    // Asas (Ataques) - Azul um pouco mais claro
    ctx.fillStyle = '#0069bd';
    if (player.state === 'punch_left') {
        ctx.fillRect(player.x - 25, player.y + 22, 25, 15);
    } else if (player.state === 'punch_right') {
        ctx.fillRect(player.x + player.width, player.y + 22, 25, 15);
    }
}

function gameOver() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    score = 0;
    player.hp = 100;
    enemies = [];
    pinhoes = [];
    player.state = 'idle';
    player.y = player.groundY;
    scoreEl.textContent = score;
    hpBar.style.width = '100%';
    gameOverScreen.classList.add('hidden');
    gameActive = true;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();