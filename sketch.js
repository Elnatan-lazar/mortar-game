// Global variables
let angle;
let power;
let isCharging;
let balls;
let phoneNumber;
let cells;
let powerDirection = 1;
let cannonX = 30;
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

  let cellSize = min(50, width / 15);
  for (let i = 0; i < 10; i++) {
    let x = 100 + i * (cellSize + 15);
    let y = height - 55;
    cells.push({ x: x, y: y, size: cellSize, number: i });
  }

  let clearButton = createButton('⌫');
  clearButton.position(10, 10);
  clearButton.mousePressed(clearLast);

  let resetButton = createButton('🔄');
  resetButton.position(50, 10);
  resetButton.mousePressed(resetNumber);

  let submitButton = createButton('Submit');
  submitButton.position(110, 10);
  submitButton.attribute('disabled', '');
  submitButton.mousePressed(() => alert(`Phone Number: 05${formatPhoneNumber()}`));
  submitButton.id('submitBtn');
}

function draw() {
  background(220);

  // Ground line
  stroke(0);
  line(0, height - 50, width, height - 50);

  // Adjust cells
  let cellSize = cells[0].size;
  for (let i = 0; i < 10; i++) {
    let cell = cells[i];
    cell.x = 100 + i * (cellSize + 15);
    cell.y = height - 55;

    fill(180);
    rect(cell.x, cell.y, cell.size, cell.size);
    fill(255);
    rect(cell.x + 3, cell.y + 3, cell.size - 6, cell.size - 6);
    fill(0);
    textAlign(CENTER, CENTER);
    text(cell.number, cell.x + cell.size / 2, cell.y + cell.size / 2);
  }

  // Draw the cannon
  push();
  translate(cannonX, height - 50);
  rotate(angle);
  fill(80);
  rect(0, -10, 60, 20);
  fill(50);
  ellipse(0, 0, 40);
  pop();

  // Power gauge
  fill(150);
  rect(width - 50, height / 2 + 50, 20, -100);
  fill('red');
  rect(width - 50, height / 2 + 50, 20, -power);

  if (isCharging) {
    power += powerDirection * 2;
    if (power >= 100 || power <= 0) {
      powerDirection *= -1;
    }
  }

  // Update and show balls
  if (balls.length > 0) {
    let b = balls[balls.length - 1];
    b.update();
    b.show();

    if (b.vx === 0 && b.vy === 0) {
      canShoot = true;
    }
  }

  // Update and show explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].show();
    if (explosions[i].isDone()) {
      explosions.splice(i, 1);
    }
  }

  // Display phone number
  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(`05${formatPhoneNumber()}`, width / 2, 30);

  let btn = select('#submitBtn');
  if (phoneNumber.length === 8) {
    btn.removeAttribute('disabled');
  } else {
    btn.attribute('disabled', '');
  }

  // Control cannon angle
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

// Format phone number: 05X-XXXX-XXX
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

// Mouse drag for cannon
function mouseDragged() {
  let dy = mouseY - pmouseY;
  angle += dy * 0.005;
  limitAngle();
}

// Key control
function keyPressed() {
  if (key === ' ') {
    isCharging = true;
  }
  if (keyCode === UP_ARROW) {
    upPressed = true;
  }
  if (keyCode === DOWN_ARROW) {
    downPressed = true;
  }
}

function keyReleased() {
  if (key === ' ') {
    isCharging = false;
    if (power > 0 && canShoot) {
      if (balls.length > 0) {
        balls.pop();
      }
      balls.push(new Ball(cannonX, height - 50, angle, power * 0.5));
      createExplosion(cannonX + 30 * cos(angle), height - 50 + 30 * sin(angle));
      canShoot = false;
    }
    power = 0;
    powerDirection = 1;
  }
  if (keyCode === UP_ARROW) {
    upPressed = false;
  }
  if (keyCode === DOWN_ARROW) {
    downPressed = false;
  }
}

// Limit cannon angle
function limitAngle() {
  angle = constrain(angle, -PI / 2 + 0.2, 0);
}

// Clear and reset
function clearLast() {
  if (phoneNumber.length > 0) {
    phoneNumber = phoneNumber.slice(0, -1);
  }
}
function resetNumber() {
  phoneNumber = '';
}

// Window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Ball class
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
    if (this.y >= height - 50) {
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
        this.y = height - 50;
        this.vy *= -this.energy;
        this.vx *= 0.9;
        if (abs(this.vy) < 1) this.vy = 0;
        if (abs(this.vx) < 0.1) this.vx = 0;
      }
    }
    this.x = constrain(this.x, 0, width);
    this.y = constrain(this.y, 0, height);
  }
  show() {
    fill('blue');
    ellipse(this.x, this.y, 10);
  }
}

// Explosion class
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
