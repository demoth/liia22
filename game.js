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
    this.load.image('sky', 'background.jpg');
    this.load.image('ground', 'platform.png');
    this.load.spritesheet('presents', 'presents-small.png', { 
        frameWidth: 64,  // Adjust these dimensions to match your spritesheet
        frameHeight: 64
    });
    this.load.spritesheet('liia', 'liia-small.png', {
        frameWidth: 42,  // Adjust these dimensions to match your spritesheet
        frameHeight: 128
    });
    this.load.audio('pickup', 'coin.mp3');
    this.load.audio('congrats', 'congrats.mp3');
    this.load.audio('spawn', 'spawn.mp3');
    this.load.audio('bgMusic', 'soong.mp3');
    this.load.audio('jump', 'jump.mp3');
    
    this.load.image('button', 'https://labs.phaser.io/assets/sprites/button-bg.png');

    this.load.image('heart', 'hearts-small.png');
}

function createTitleScreen() {
    this.add.image(400, 300, 'sky');
    
    startButton = this.add.image(400, 300, 'button')
        .setInteractive()
        .setScale(1.7);
    
    this.add.text(400, 300, 'START', {
        fontSize: '64px',
        fill: '#ff0',
        stroke: '#ff00ff',
        strokeThickness: 6
    }).setOrigin(0.5);


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
    
    // Create yellow rectangles instead of using the image
    // lower platform
    platforms.create(100, 568, 'ground').setScale(0.5).refreshBody();
    platforms.create(400, 568, 'ground').setScale(0.5).refreshBody();

    platforms.create(700, 568, 'ground').setScale(0.5).refreshBody();

    
    platforms.create(600, 400, 'ground').setScale(0.5).refreshBody();
    // left
    platforms.create(50, 250, 'ground').setScale(0.5).refreshBody();
    
    platforms.create(750, 220, 'ground').setScale(0.5).refreshBody();


    // Create player - adjust spawn position to be above ground
    player = this.physics.add.sprite(0, 400, 'liia');
    
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

    // Make sure collision with platforms is set up correctly
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

    if (this.sound.context.state === 'running') {
        this.sound.play('spawn');
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

    // Add touch input handling
    this.input.addPointer(2); // Support 2 touch points
    
    // Create touch zones for movement
    const leftZone = this.add.rectangle(100, 500, 200, 200, 0x000000, 0)
        .setInteractive()
        .setScrollFactor(0)
        .setAlpha(0.2); // Slightly visible for debugging
    
    const rightZone = this.add.rectangle(700, 500, 200, 200, 0x000000, 0)
        .setInteractive()
        .setScrollFactor(0)
        .setAlpha(0.2);
    
    const jumpZone = this.add.rectangle(400, 500, 400, 200, 0x000000, 0)
        .setInteractive()
        .setScrollFactor(0)
        .setAlpha(0.2);
}

function update() {
    if (!gameStarted) return;
    
    // Track both keyboard and multiple touch points
    const leftPressed = cursors.left.isDown || 
        (this.input.pointer1.isDown && this.input.pointer1.x < 200) ||
        (this.input.pointer2.isDown && this.input.pointer2.x < 200);
        
    const rightPressed = cursors.right.isDown || 
        (this.input.pointer1.isDown && this.input.pointer1.x > 600) ||
        (this.input.pointer2.isDown && this.input.pointer2.x > 600);
        
    const jumpPressed = cursors.up.isDown || 
        (this.input.pointer1.isDown && this.input.pointer1.x > 200 && this.input.pointer1.x < 600) ||
        (this.input.pointer2.isDown && this.input.pointer2.x > 200 && this.input.pointer2.x < 600);

    // Handle horizontal movement
    if (leftPressed) {
        player.setVelocityX(-160);
        player.setFlipX(true);
        player.anims.play('walk', true);
    }
    else if (rightPressed) {
        player.setVelocityX(160);
        player.setFlipX(false);
        player.anims.play('walk', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    // Handle jumping (now independent of left/right movement)
    if (jumpPressed && player.body.touching.down) {
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

    if (score === 250) {
        // Create celebratory text
        const birthdayText = this.add.text(400, 300, 'Happy Birthday Lia!!!', {
            fontSize: '54px',
            fill: '#ff0',
            stroke: '#ff00ff',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Add some animation to the text
        this.tweens.add({
            targets: birthdayText,
            scale: { from: 0, to: 1 },
            duration: 3000,
            ease: 'Bounce'
        });

        if (this.sound.context.state === 'running') {
            this.sound.play('congrats');
        }

        // Create confetti particle effect
        const confetti = this.add.particles(0, 0, 'heart', {  // reusing heart particle
            x: { min: 0, max: 800 },
            y: -10,
            quantity: 2,
            frequency: 50,
            lifespan: 10000,
            gravityY: 200,
            speed: { min: -200, max: 200 },
            scale: { start: 0.6, end: 0 },
            rotate: { start: 0, end: 360 },
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00],  // Multiple colors
            emitting: true
        });

        // Stop confetti after 3 seconds
        this.time.delayedCall(10000, () => {
            confetti.destroy();
            birthdayText.destroy();
        });
    }

    // Respawn all stars when they're all collected
    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        if (this.sound.context.state === 'running') {
            this.sound.play('spawn');
        }
    }
} 