import particle from "./assets/particle.png";
import red from "./assets/square/red.png";
import blue from "./assets/square/blue.png";
import green from "./assets/square/green.png";
import aqua from "./assets/square/aqua.png";
import cyan from "./assets/square/cyan.png";

const radius = 30;
const ballLength = radius * 2;
const width = 800;
const height = 600;
const gravityY = 500;
const types = ['red', 'blue', 'green', 'aqua', 'cyan'];

const ballCollections = [];


function randomColor(Types = types) {
  return Types[Math.floor((Math.random() * Types.length))];
}

let initialMaxBall, initialOffsetX;

let maxBall = initialMaxBall = Math.floor(width / ballLength);
let offsetX = initialOffsetX = Math.floor(((width % ballLength) || 1) / 2);
let offsetY = 0;

const config = {
  type: Phaser.AUTO,
  width,
  height,
  physics: {
    default: 'arcade',
    arcade: {
      // debug: true,
      gravity: {y: gravityY}
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

let ovalRed, mainBall, aquaGroups, marbles, particles, emitter;

let ballColor = randomColor();

function preload() {
  this.load.image('particle', particle);
  this.load.image('red', red);
  this.load.image('blue', blue);
  this.load.image('aqua', aqua);
  this.load.image('green', green);
  this.load.image('cyan', cyan);
}


function createNewMainBall() {

  particles = this.add.particles('particle');

  mainBall = this.physics.add.image(500, height - 30, ballColor);
  mainBall.setScale(.2, .2)
    .setBounce(0.5)
    .setCollideWorldBounds(true).setCircle(150).setGravityY(-gravityY);
  mainBall.setName(ballColor);

  this.physics.add.collider(mainBall, marbles, onCollide, null, this);

  emitter = particles.createEmitter({
    speed: 700,
    scale: {start: 1, end: 0},
    blendMode: 'ADD'
  });

  emitter.startFollow(mainBall);
}

function create() {


  marbles = this.physics.add.group({});

  for (let i = 1; i <= 30; i++) {
    const type = randomColor();

    marbles.create(Math.floor(Math.random() * width) + 1,
      Math.floor(Math.random() * height) + 1,
      type);
  }

  let count = 1;
  let row = 1;
  marbles.children.iterate((child) => {
    const name = child?.texture?.key;

    child
      .setScale(.2, .2)
      .setCollideWorldBounds(true)
      .setX(offsetX + radius * count)
      .setY(offsetY + radius * row)
      .setCircle(150)
      .setGravityY(-gravityY)
      .setName(name)
      .setImmovable(true)
      .setInteractive();
    child.getNearlyBalls = getNearlyBalls;
    //.on('pointermove',onHover);

    if (count === maxBall) {
      count = 1;
      offsetX = initialOffsetX;

      if (maxBall === initialMaxBall) {
        maxBall--;
        offsetX += radius;
      } else {
        maxBall++;
      }

      offsetY += radius;
      row++;
    } else {
      count++;
      offsetX += radius;
    }

    ballCollections.push(child);

  });


  createNewMainBall.call(this);


  this.input.keyboard.on('keydown', onPress, this);

  let line = new Phaser.Geom.Line();
  let gfx = this.add.graphics().setDefaultStyles({lineStyle: {width: 10, color: 0xffdd00, alpha: 0.5}});
  let angle;

  this.input.on('pointermove', (pointer) => {
    angle = Phaser.Math.Angle.BetweenPoints(mainBall, pointer);
    Phaser.Geom.Line.SetToAngle(line, mainBall.x, mainBall.y, angle, 128);
    gfx.clear().strokeLineShape(line);
  });

  this.input.on('pointerup', () => {
    const v = 800;
    mainBall.setVelocity(v * Math.cos(angle), v * Math.sin(angle));
  });

}

function update() {
}

function onCollide(mainBall, marble) {

  let {x, y} = marble;

  const angle = Phaser.Math.Angle.BetweenPoints(marble, mainBall);

  const PI = Math.PI;
  const mod = PI - 2.5;
  const modUp = PI - 3;

  const right = (angle >= 0 && angle <= mod) || (angle < 0 && angle >= -modUp);
  const bottomRight = angle > mod && angle <= (PI / 2);
  const bottomLeft = angle > (PI / 2) && angle < (PI - mod);
  const left = (angle <= PI && angle >= (PI - mod)) || (angle >= -PI && angle < -PI + modUp);
  const topRight = angle < -modUp && angle >= -(PI / 2);
  const topLeft = angle < -(PI / 2) && angle >= -PI + modUp;


  if (right) {
    x += ballLength;
  } else if (bottomRight) {
    x += radius;
    y += ballLength
  } else if (bottomLeft) {
    x += -radius;
    y += ballLength
  } else if (left) {
    x += -ballLength;
  } else if (topLeft) {
    x += -radius;
    y += -ballLength
  } else if (topRight) {
    x += radius;
    y += -ballLength;
  }


  const newMarble = marbles.create(x, y, ballColor);
  newMarble.scaleX = 0.2;
  newMarble.scaleY = 0.2;
  newMarble.setGravityY(-gravityY);
  newMarble.setCircle(150);
  newMarble.setImmovable(true);
  newMarble.setName(mainBall.name);
  newMarble.setInteractive();
  newMarble.getNearlyBalls = getNearlyBalls;
  newMarble.wasMainBall = true;

  //reset
  mainBall.destroy();
  particles.destroy();


  setTimeout(() => {

    newMarble.getNearlyBalls();
    if (nearlyBall.length > 1) {
      newMarble.destroy();

      for (let i = 0; i < nearlyBall.length; i++) {
        nearlyBall[i].destroy();
      }

    } else {
      for (let i = 0; i < storeRecycles.length; i++) {
        const {index, ball} = storeRecycles[i];
        ballCollections[index] = ball;
      }

      ballCollections.push(newMarble);
    }

    nearlyBall = [];
    storeRecycles = [];

    const availableTypes = [...new Set(ballCollections.filter(item => item).map(ball => ball.name))];

    ballColor = randomColor(availableTypes);

    createNewMainBall.call(this);
  }, 300);


}

let nearlyBall = [];
let storeRecycles = [];

function getNearlyBalls() {
  for (let i = 0; i < ballCollections.length; i++) {
    const ball = ballCollections?.[i] || {};
    const vector = Math.sqrt(Math.pow(this.x - ball.x, 2) + Math.pow(this.y - ball.y, 2));
    const match = ball.name === this.name && vector < 80;
    if (match) {
      ballCollections[i] = null;
      storeRecycles.push({
        index: i,
        ball: ball
      });
      ball.getNearlyBalls();
      nearlyBall.push(ball);
    }
  }
}


function onPress(event) {

  /*  mainBall.setGravityY(-200);
    if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.W) {
      //up
      mainBall.setVelocityX(0);
      mainBall.setVelocityY(-200);
    } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.S) {
      //down
      mainBall.setVelocityX(0);
      mainBall.setVelocityY(200);
    }
    if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.A) {
      //left
      mainBall.setVelocityX(-200);
      mainBall.setVelocityY(0);
    } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.D) {
      //right
      mainBall.setVelocityX(200);
      mainBall.setVelocityY(0);
    }*/
}

const game = new Phaser.Game(config);
