const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos da UI
const scoreEl = document.getElementById('score');
const hpBar = document.getElementById('hp-bar');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');

// Estado do Jogo
let score = 0;
let gameActive = true;
let enemies = [];
let spawnTimer = 0;

// Configurações do Jogador (Porquinho)
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 100, // No chão
    width: 40,
    height: 60,
    color: '#ff9ff3',
    state: 'idle', // idle, punch_left, punch_right, jump
    hp: 100,
    maxHp: 100,
    jumpSpeed: 0,
    gravity: 0.6,
    groundY: canvas.height - 100,
    actionTimer: 0
};

// Teclado
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    if (e.key === 'ArrowLeft' && player.state === 'idle') {
        player.state = 'punch_left';
        player.actionTimer = 10; // Duração do soco em frames
        checkHit('left');
    } else if (e.key === 'ArrowRight' && player.state === 'idle') {
        player.state = 'punch_right';
        player.actionTimer = 10;
        checkHit('right');
    } else if ((e.key === 'ArrowUp' || e.key === ' ') && player.y === player.groundY) {
        player.jumpSpeed = -12;
    }
});

// Reiniciar jogo
restartBtn.addEventListener('click', resetGame);

// Criar Lobos (Inimigos)
function spawnEnemy() {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const enemy = {
        x: side === 'left' ? -40 : canvas.width + 40,
        y: canvas.height - 90,
        width: 40,
        height: 50,
        color: '#718093',
        speed: side === 'left' ? 3 + Math.random() * 2 : -(3 + Math.random() * 2),
        side: side
    };
    enemies.push(enemy);
}

// Verificar se o soco acertou o inimigo
function checkHit(direction) {
    const reach = 60; // Alcance do golpe
    enemies.forEach((enemy, index) => {
        if (direction === 'left' && enemy.x < player.x && enemy.x > player.x - reach) {
            eliminateEnemy(index);
        } else if (direction === 'right' && enemy.x > player.x && enemy.x < player.x + player.width + reach) {
            eliminateEnemy(index);
        }
    });
}

function eliminateEnemy(index) {
    enemies.splice(index, 1);
    score += 10;
    scoreEl.textContent = score;
}

// Atualizar posições e física
function update() {
    if (!gameActive) return;

    // Física do Pulo
    player.y += player.jumpSpeed;
    if (player.y < player.groundY) {
        player.jumpSpeed += player.gravity;
    } else {
        player.y = player.groundY;
        player.jumpSpeed = 0;
    }

    // Timers de animação/ataque do jogador
    if (player.state !== 'idle' && player.y === player.groundY) {
        player.actionTimer--;
        if (player.actionTimer <= 0) {
            player.state = 'idle';
        }
    }

    // Mover e checar inimigos
    spawnTimer++;
    if (spawnTimer % 60 === 0) { // Cria um inimigo a cada ~1 segundo
        spawnEnemy();
    }

    enemies.forEach((enemy, index) => {
        enemy.x += enemy.speed;

        // Colisão com o jogador (Lobo encostou no porquinho)
        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            // Se o jogador pular em cima, elimina o lobo estilo Mario
            if (player.y < player.groundY && player.jumpSpeed > 0) {
                eliminateEnemy(index);
                player.jumpSpeed = -8; // Impulso para cima
            } else {
                // Jogador toma dano
                player.hp -= 20;
                hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
                enemies.splice(index, 1); // Remove inimigo que causou dano

                if (player.hp <= 0) {
                    gameOver();
                }
            }
        }
    });
}

// Desenhar elementos na tela
function draw() {
    // Limpar Canvas e desenhar o chão
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2ed573'; // Grama
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // Desenhar Inimigos (Lobos)
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Olhos raivosos do lobo
        ctx.fillStyle = '#fff';
        let eyeX = enemy.speed > 0 ? enemy.x + 30 : enemy.x + 5;
        ctx.fillRect(eyeX, enemy.y + 10, 5, 5);
    });

    // Desenhar Jogador (Porquinho)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Feedback visual dos ataques (Luvas de Boxe/Linhas de ação)
    ctx.fillStyle = '#ff4757';
    if (player.state === 'punch_left') {
        ctx.fillRect(player.x - 25, player.y + 20, 25, 15);
    } else if (player.state === 'punch_right') {
        ctx.fillRect(player.x + player.width, player.y + 20, 25, 15);
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
    player.state = 'idle';
    player.y = player.groundY;
    scoreEl.textContent = score;
    hpBar.style.width = '100%';
    gameOverScreen.classList.add('hidden');
    gameActive = true;
}

// Loop Principal do Jogo
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar
gameLoop();