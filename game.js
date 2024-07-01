let score = 0;
let level = 1;
let isPaused = false;
let gameMode = 'single'; // 'single' or 'multi'

let levels = [
  { numObjects: 5, objective: 'Merge all objects', timeLimit: 60 },
  { numObjects: 10, objective: 'Avoid obstacles and merge', timeLimit: 60 },
];

const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;

let render;
let runner;
let fourDObjects = [];

document.addEventListener('DOMContentLoaded', () => {
  const renderElement = document.getElementById('gameView');

  if (renderElement) {
    render = Render.create({
      element: renderElement,
      engine: engine,
      options: {
        width: renderElement.clientWidth,
        height: renderElement.clientHeight,
        wireframes: false,
        background: '#f0f0f0'
      }
    });

    Render.run(render);
  }

  runner = Runner.create();
  Runner.run(runner, engine);

  setupUserInterface();
  initializeGame();
  startGame('single'); // Automatically start the game in single player mode
});

function initializeGame() {
  createGameObjects(levels[level - 1].numObjects);
  setupAI();
  setLevel(level);
}

function createGameObjects(numObjects) {
  World.clear(world);
  fourDObjects.length = 0;
  const renderElement = document.getElementById('gameView');
  for (let i = 0; i < numObjects; i++) {
    const fourDObject = Bodies.circle(
      Math.random() * renderElement.clientWidth,
      Math.random() * renderElement.clientHeight,
      20,
      {
        render: {
          fillStyle: getRandomColor()
        }
      }
    );
    fourDObject.fourthDimension = Math.random() * Math.PI * 2;
    fourDObjects.push(fourDObject);
    World.add(world, fourDObject);
  }
}

function updateGame() {
  if (isPaused) return;
  if (gameMode === 'single') {
    executeAIStrategy();
  } else {
    // handle multiplayer logic
  }
  checkObjectives();
  fourDObjects.forEach(update4DObject);
}

function setupUserInterface() {
  const pauseButton = document.getElementById('pauseButton');
  const resetButton = document.getElementById('resetButton');
  const singlePlayerButton = document.getElementById('singlePlayerButton');
  const multiPlayerButton = document.getElementById('multiPlayerButton');

  pauseButton.addEventListener('click', togglePause);
  resetButton.addEventListener('click', resetGame);
  singlePlayerButton.addEventListener('click', () => startGame('single'));
  multiPlayerButton.addEventListener('click', () => startGame('multi'));

  updateScore(0);
  setLevel(1);
}

function updateScore(newScore) {
  score = newScore;
  const scoreDisplay = document.getElementById('scoreDisplay');
  if (scoreDisplay) {
    scoreDisplay.innerHTML = `Score: ${score}`;
  }
}

function setLevel(newLevel) {
  level = newLevel;
  const levelDisplay = document.getElementById('levelDisplay');
  if (levelDisplay) {
    levelDisplay.innerHTML = `Level: ${level}`;
  }
  createGameObjects(levels[level - 1].numObjects);
}

function setupAI() {
  console.log("Setting up AI...");
}

function executeAIStrategy() {
  fourDObjects.forEach(obj1 => {
    let closestObj = null;
    let closestDistance = Infinity;
    fourDObjects.forEach(obj2 => {
      if (obj1 !== obj2) {
        const distance = Math.sqrt(Math.pow(obj1.position.x - obj2.position.x, 2) + Math.pow(obj1.position.y - obj2.position.y, 2));
        if (distance < closestDistance) {
          closestDistance = distance;
          closestObj = obj2;
        }
      }
    });

    if (closestObj) {
      const angle = Math.atan2(closestObj.position.y - obj1.position.y, closestObj.position.x - obj1.position.x);
      Body.setVelocity(obj1, { x: Math.cos(angle), y: Math.sin(angle) });
    }
  });
}

function togglePause() {
  isPaused = !isPaused;
  const pauseButton = document.getElementById('pauseButton');
  if (pauseButton) {
    pauseButton.innerHTML = isPaused ? 'Resume' : 'Pause';
  }
}

function resetGame() {
  score = 0;
  level = 1;
  isPaused = false;
  updateScore(score);
  setLevel(level);
}

function checkObjectives() {
  fourDObjects.forEach(obj1 => {
    fourDObjects.forEach(obj2 => {
      if (obj1 !== obj2 && areObjectsClose(obj1, obj2)) {
        interact4DObjects(obj1, obj2);
      }
    });
  });

  if (fourDObjects.length <= 1) {
    levelUp();
  }
}

function levelUp() {
  setLevel(level + 1);
  updateScore(score + 10);
  displayStatusMessage('Level up! Score +10');
}

function displayStatusMessage(message) {
  const statusMessage = document.getElementById('statusMessage');
  if (statusMessage) {
    statusMessage.innerHTML = message;
    setTimeout(() => {
      statusMessage.innerHTML = '';
    }, 2000);
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function startGame(mode) {
  gameMode = mode;
  document.getElementById('menu').style.display = 'none';
  document.getElementById('gameContainer').style.display = 'flex';
  initializeGame();
}

function internalTrigger(action, mode) {
  switch(action) {
    case 'start':
      startGame(mode);
      break;
    case 'pause':
      togglePause();
      break;
    case 'reset':
      resetGame();
      break;
    default:
      console.log("Invalid action");
  }
}

function areObjectsClose(obj1, obj2) {
  const threshold = 10;
  const dx = obj1.position.x - obj2.position.x;
  const dy = obj1.position.y - obj2.position.y;
  const dz = (obj1.position.z || 0) - (obj2.position.z || 0);
  const dw = (obj1.position.w || 0) - (obj2.position.w || 0);

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);

  return distance < threshold;
}

function interact4DObjects(obj1, obj2) {
  const mergedObject = Bodies.circle(
    (obj1.position.x + obj2.position.x) / 2,
    (obj1.position.y + obj2.position.y) / 2,
    20,
    {
      render: {
        fillStyle: getRandomColor()
      }
    }
  );

  fourDObjects = fourDObjects.filter(obj => obj !== obj1 && obj !== obj2);
  World.remove(world, obj1);
  World.remove(world, obj2);

  fourDObjects.push(mergedObject);
  World.add(world, mergedObject);
}

function update4DObject(object) {
  object.fourthDimension += 0.01;
  object.position.x += Math.sin(object.fourthDimension) * 0.5;
  object.position.y += Math.cos(object.fourthDimension) * 0.5;
  if (object.fourthDimension % (2 * Math.PI) < Math.PI) {
    Body.scale(object, 1.001, 1.001);
  } else {
    Body.scale(object, 0.999, 0.999);
  }
}

function handleResize() {
  const renderElement = document.getElementById('gameView');
  if (renderElement && render) {
    render.canvas.width = renderElement.clientWidth;
    render.canvas.height = renderElement.clientHeight;
    render.options.width = renderElement.clientWidth;
    render.options.height = renderElement.clientHeight;
    Render.setPixelRatio(render, window.devicePixelRatio); // Ensure crisp rendering on high DPI displays
  }
}

window.addEventListener('resize', handleResize);

// Use Matter.js built-in update loop instead of setInterval
Events.on(engine, 'beforeUpdate', updateGame);

// Call handleResize once at the start to set the initial size
handleResize();
