// Global variables
let angle;
let power;
let isCharging;
let balls;
let phoneNumber;
let cells;
let powerDirection = 1;
let cannonXRatio = 0.04; // יחס אופקי של התותח (לדוגמה: 0.04 = 4% מרוחב המסך)
let explosions = [];
let canShoot = true;

// For arrow key control with acceleration
let upPressed = false;
let downPressed = false;
let angleSpeed = 0.002;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);

  angle = -PI / 4;
  power = 0;
  isCharging = false;
  balls = [];
  phoneNumber = '';
  cells = [];

  for (let i = 0; i < 10; i++) {
    cells.push({ number: i });
  }

  let clearButton = createButton('⌫');
  clearButton.mousePressed(clearLast);

  let resetButton = createButton('🔄');
  resetButton.mousePressed(resetNumber);

  let submitButton = createButton('Submit');
  submitButton.attribute('disabled', '');
  submitButton.mousePressed(() => alert(`Phone Number: 05${formatPhoneNumber()}`));
  submitButton.id('submitBtn');
}

function draw() {
  background(220);

  // Relative sizes
  let cellSize = width * 0.06;
  let cellSpacing = width * 0.015;
  let startX = width * 0.1;
  let groundY = height - height * 0.1;

  // Ground
  stroke(0);
  line(0, groundY, width, groundY);

  // Cells
  for (let i = 0; i < 10; i++) {
    let cell = cells[i];
    cell.x = startX + i * (cellSize + cellSpacing);
    cell.y = groundY - cellSize;

    fill(180);
    rect(cell.x, cell.y, cellSize, cellSize);
    fill(255);
    rect(cell.x + cellSize * 0.06, cell.y + cellSize * 0.06, cellSize * 0.88, cellSize * 0.88);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(cellSize * 0.5);
    text(cell.number, cell.x + cellSize / 2, cell.y + cellSize / 2);
  }

  // Cannon
  let cannonX = width * cannonXRatio;
  push();
  translate(cannonX, groundY);
  rotate(angle);
  fill(80);
  rect(0, -cellSize * 0.2, cellSize * 1.2, cellSize * 0.4);
  fill(50);
  ellipse(0, 0, cellSize * 0.8);
  pop();

  // Power gauge
  let gaugeX = width - width * 0.05;
  let gaugeY = height * 0.5;
  let gaugeHeight = height * 0.25;
  fill(150);
  rect(gaugeX, gaugeY, width * 0.02, -gaugeHeight);
  fill('red');
  rect(gaugeX, gaugeY, width * 0.02, -gaugeHeight * (power / 100));

  if (isCharging) {
    power += powerDirection * 2;
    if (power >= 100 || power <= 0) {
      powerDirection *= -1;
    }
  }

  // Ball
  if (balls.length > 0) {
    let b = balls[balls.length - 1];
    b.update();
    b.show();
    if (b.vx === 0 && b.vy === 0) {
      canShoot = true;
    }
  }

  // Explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].show();
    if (explosions[i].isDone()) {
      explosions.splice(i, 1);
    }
  }

  // Phone number text
  fill(0);
  textSize(width * 0.025);
  textAlign(CENTER, CENTER);
  text(`05${formatPhoneNumber()}`, width / 2, height * 0.05);

  // Dynamic buttons
  let scaleFactor = min(width / 800, height / 400);
  let btnSize = 30 * scaleFactor;
  let btnX = 10 * scaleFactor;
  let btnY = 10 * scaleFactor;
  let btnSpacing = 50 * scaleFactor;
  select('button:nth-of-type(1)').position(btnX, btnY).style('font-size', btnSize + 'px');
  select('button:nth-of-type(2)').position(btnX + btnSpacing, btnY).style('font-size', btnSize + 'px');
  select('button:nth-of-type(3)').position(btnX + 2 * btnSpacing, btnY).style('font-size', btnSize + 'px');

  let btn = select('#submitBtn');
  if (phoneNumber.length === 8) {
    btn.removeAttribute('disabled');
  } else {
    btn.attribute('disabled', '');
  }

  // Cannon angle control
  if (upPressed) {
    angle -= angleSpeed;
    angleSpeed = min(angleSpeed + 0.0005, 0.02);
    limitAngle();
  } else if (downPressed) {
    angle += angleSpeed;
    angleSpeed = min(angleSpeed + 0.0005, 0.02);
    limitAngle();
  } else {
    angleSpeed = 0.002;
  }
}

function formatPhoneNumber() {
  let formatted = '';
  for (let i = 0; i < 8; i++) {
    if (i < phoneNumber.length) {
      formatted += phoneNumber[i];
    } else {
      formatted += '_';
    }
    if (i === 0 || i === 4) {
      formatted += '-';
    }
  }
  return formatted;
}

function mouseDragged() {
  let dy = mouseY - pmouseY;
  angle += dy * 0.005;
  limitAngle();
}

function keyPressed() {
  if (key === ' ') {
    isCharging = true;
  }
  if (keyCode === UP_ARROW) upPressed = true;
  if (keyCode === DOWN_ARROW) downPressed = true;
}

function keyReleased() {
  if (key === ' ') {
    isCharging = false;
    if (power > 0 && canShoot) {
      if (balls.length > 0) balls.pop();
      let groundY = height - height * 0.1;
      balls.push(new Ball(width * cannonXRatio, groundY, angle, power * 0.5));
      createExplosion(width * cannonXRatio + 30 * cos(angle), groundY + 30 * sin(angle));
      canShoot = false;
    }
    power = 0;
    powerDirection = 1;
  }
  if (keyCode === UP_ARROW) upPressed = false;
  if (keyCode === DOWN_ARROW) downPressed = false;
}

function limitAngle() {
  angle = constrain(angle, -PI / 2 + 0.2, 0);
}

function clearLast() {
  if (phoneNumber.length > 0) {
    phoneNumber = phoneNumber.slice(0, -1);
  }
}
function resetNumber() {
  phoneNumber = '';
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Ball {
  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.vx = speed * cos(angle);
    this.vy = speed * sin(angle);
    this.hit = false;
    this.energy = 0.8;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    if (this.x <= 0 || this.x >= width) this.vx *= -1;
    if (this.y <= 0) this.vy *= -1;
    if (this.y >= height - height * 0.1) {
      let inCell = false;
      for (let cell of cells) {
        if (this.x > cell.x && this.x < cell.x + cell.size) {
          inCell = true;
          if (!this.hit && phoneNumber.length < 8) {
            phoneNumber += cell.number;
            this.hit = true;
          }
          this.vx = 0;
          this.vy = 0;
        }
      }
      if (!inCell) {
        this.y = height - height * 0.1;
        this.vy *= -this.energy;
        this.vx *= 0.9;
        if (abs(this.vy) < 1) this.vy = 0;
        if (abs(this.vx) < 0.1) this.vx = 0;
      }
    }
  }
  show() {
    fill('blue');
    ellipse(this.x, this.y, 10);
  }
}
class Explosion {
  constructor(x, y) {
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: random(-2, 2),
        vy: random(-2, 2),
        alpha: 255
      });
    }
  }
  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 5;
    }
  }
  show() {
    noStroke();
    for (let p of this.particles) {
      fill(150, 150, 150, p.alpha);
      ellipse(p.x, p.y, 10);
    }
  }
  isDone() {
    return this.particles.every(p => p.alpha <= 0);
  }
}
function createExplosion(x, y) {
  explosions.push(new Explosion(x, y));
}
