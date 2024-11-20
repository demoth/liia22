const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: createTitleScreen,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let platforms;
let cursors;
let stars;
let score = 0;
let scoreText;
let startButton;
let gameStarted = false;
let backgroundMusic;

function preload() {
    // Load assets
    this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.spritesheet('presents', 'presents-small.png', { 
        frameWidth: 64,  // Adjust these dimensions to match your spritesheet
        frameHeight: 64
    });
    this.load.spritesheet('liia', 'liia-small.png', {
        frameWidth: 42,  // Adjust these dimensions to match your spritesheet
        frameHeight: 128
    });
    this.load.audio('pickup', 'coin.mp3');
    this.load.image('button', 'https://labs.phaser.io/assets/sprites/button-bg.png');
    this.load.audio('bgMusic', 'soong.mp3');
    this.load.audio('jump', 'jump.mp3');
    this.load.image('heart', 'hearts-small.png');
}

function createTitleScreen() {
    this.add.image(400, 300, 'sky');
    
    startButton = this.add.image(400, 300, 'button')
        .setInteractive()
        .setScale(2);
    
    this.add.text(350, 290, 'START', { 
        fontSize: '32px', 
        fill: '#000' 
    });

    startButton.on('pointerdown', () => {
        startButton.destroy();
        gameStarted = true;
        create.call(this);
    });
}

function create() {
    // Add this at the start of create function
    this.sound.pauseOnBlur = false;
    
    // Add click handler to resume audio context
    this.input.on('pointerdown', () => {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }
    });

    // Add background music
    backgroundMusic = this.sound.add('bgMusic', {
        loop: true,
        volume: 0.5
    });
    backgroundMusic.play();

    // Add background
    this.add.image(400, 300, 'sky');

    // Create platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Create player
    player = this.physics.add.sprite(200, 450, 'liia');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // Simplify to just two animations - standing and walking
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('liia', { start: 1, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'liia', frame: 0 } ],
        frameRate: 20
    });

    // Add collision between player and platforms
    this.physics.add.collider(player, platforms);

    // Input
    cursors = this.input.keyboard.createCursorKeys();

    // Add score text
    scoreText = this.add.text(16, 16, 'Score: 0', { 
        fontSize: '32px', 
        fill: '#fff' 
    });

    // Create stars group
    stars = this.physics.add.group();
    
    // Create 12 presents at different x positions
    for (let i = 0; i < 12; i++) {
        const present = stars.create(12 + (i * 70), 0, 'presents');
        present.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        present.setFrame(Phaser.Math.Between(0, 8)); // Random frame (0-8 for 9 different presents)
        present.setScale(0.5);  // Adjust scale if needed
    }

    // Add colliders
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // Add this before the end of create function
    this.heartParticles = this.add.particles(0, 0, 'heart', {
        speed: { min: 100, max: 200 },
        angle: { min: 240, max: 300 },
        scale: { start: 0.6, end: 0 },
        lifespan: 1000,
        gravityY: -100,
        quantity: 4,
        emitting: false
    });
}

function update() {
    if (!gameStarted) return;
    
    // Updated player movement with flipping
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.setFlipX(true);  // Flip sprite horizontally
        player.anims.play('walk', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.setFlipX(false);  // Normal orientation
        player.anims.play('walk', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
        if (this.sound.context.state === 'running') {
            this.sound.play('jump');
        }
    }
}

function collectStar(player, star) {
    // Add this at the start of collectStar
    this.heartParticles.emitParticleAt(star.x, star.y);
    
    star.disableBody(true, true);
    
    // Add a check before playing the sound
    if (this.sound.context.state === 'running') {
        this.sound.play('pickup');
    }
    
    score += 10;
    scoreText.setText('Score: ' + score);

    // Respawn all stars when they're all collected
    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });
    }
} 