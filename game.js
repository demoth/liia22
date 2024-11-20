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

function preload() {
    // Load assets
    this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('gift', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/diamond.png');
    this.load.spritesheet('dude', 
        'https://labs.phaser.io/assets/sprites/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
    this.load.audio('pickup', 'coin.mp3');
    this.load.image('button', 'https://labs.phaser.io/assets/sprites/button-bg.png');
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

    // Add background
    this.add.image(400, 300, 'sky');

    // Create platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Create player
    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // Player animations
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
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
    stars = this.physics.add.group({
        key: 'gift',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setScale(0.5);
    });

    // Add colliders
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
}

function update() {
    if (!gameStarted) return;
    
    // Player movement
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

function collectStar(player, star) {
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