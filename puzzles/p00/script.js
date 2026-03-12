const TARGET_WORD = "RELIC";

const WHEEL_SETS = [
  ["R", "A", "S", "V"],
  ["E", "O", "U", "N"],
  ["L", "M", "T", "K"],
  ["I", "C", "P", "H"],
  ["C", "Y", "G", "D"]
];

const START_POSITIONS = [1, 2, 3, 1, 2];

const screenPrelog = document.getElementById("screen-prelog");
const screenPuzzle = document.getElementById("screen-puzzle");
const screenPostlog = document.getElementById("screen-postlog");

const toPuzzleButton = document.getElementById("to-puzzle-button");
const toPostlogButton = document.getElementById("to-postlog-button");
const transmitButton = document.getElementById("transmit-button");

const playPrelogAudioButton = document.getElementById("play-prelog-audio");
const playPostlogAudioButton = document.getElementById("play-postlog-audio");

const wheelLayer = document.getElementById("wheel-layer");
const cylinderImage = document.querySelector(".cylinder-image");
const solveMessage = document.getElementById("solve-message");
const audioToggle = document.getElementById("audio-toggle");

const ambientAudio = document.getElementById("ambient-audio");
const clickAudio = document.getElementById("click-audio");

let wheels = [];
let currentPositions = [...START_POSITIONS];
let puzzleSolved = false;
let ambientMuted = false;

function showScreen(screenToShow) {
  [screenPrelog, screenPuzzle, screenPostlog].forEach((screen) => {
    screen.classList.remove("screen--active");
  });

  screenToShow.classList.add("screen--active");
  window.scrollTo(0, 0);
}

function playAmbient() {
  if (ambientMuted) return;
  ambientAudio.volume = 0.28;
  ambientAudio.play().catch(() => {});
}

function toggleAmbient() {
  ambientMuted = !ambientMuted;

  if (ambientMuted) {
    ambientAudio.pause();
    audioToggle.textContent = "🔇";
    audioToggle.setAttribute("aria-label", "Unmute ambient audio");
  } else {
    playAmbient();
    audioToggle.textContent = "🔊";
    audioToggle.setAttribute("aria-label", "Mute ambient audio");
  }
}

function playClick() {
  clickAudio.pause();
  clickAudio.currentTime = 0;
  clickAudio.volume = 0.72;
  clickAudio.play().catch(() => {});
}

function buildWheelMarkup() {
  wheelLayer.innerHTML = "";
  wheels = [];

  WHEEL_SETS.forEach((letters, wheelIndex) => {
    const wheel = document.createElement("button");
    wheel.type = "button";
    wheel.className = "wheel";
    wheel.setAttribute("aria-label", `Rotate wheel ${wheelIndex + 1}`);

    const track = document.createElement("div");
    track.className = "wheel-track";

    const repeatingLetters = [...letters, ...letters];

    repeatingLetters.forEach((letter) => {
      const cell = document.createElement("div");
      cell.className = "wheel-letter";
      cell.textContent = letter;
      track.appendChild(cell);
    });

    wheel.appendChild(track);
    wheelLayer.appendChild(wheel);

    wheels.push({
      root: wheel,
      track,
      letters
    });
  });

  requestAnimationFrame(() => {
    sizeWheelLetters();
  });

  wheels.forEach((wheel, wheelIndex) => {
    wheel.root.addEventListener("click", () => {
      rotateWheel(wheelIndex);
    });
  });
}

function sizeWheelLetters() {
  wheels.forEach((wheel, index) => {
    const wheelHeight = wheel.root.clientHeight;
    const normalizedPosition = currentPositions[index] % wheel.letters.length;

    wheel.track.querySelectorAll(".wheel-letter").forEach((cell) => {
      cell.style.height = `${wheelHeight}px`;
      cell.style.lineHeight = `${wheelHeight}px`;
    });

    wheel.track.style.transition = "none";
    wheel.track.style.transform = `translateY(-${normalizedPosition * wheelHeight}px)`;
  });
}

function getCurrentWord() {
  return currentPositions
    .map((position, index) => WHEEL_SETS[index][position % WHEEL_SETS[index].length])
    .join("");
}

function getCurrentWordAfterAdvance(changedIndex, nextPosition) {
  return currentPositions
    .map((position, index) => {
      const letters = WHEEL_SETS[index];
      const normalized = index === changedIndex
        ? nextPosition % letters.length
        : position % letters.length;
      return letters[normalized];
    })
    .join("");
}

function rotateWheel(index) {
  if (puzzleSolved) return;

  const wheel = wheels[index];
  const wheelHeight = wheel.root.clientHeight;
  const lettersPerWheel = wheel.letters.length;

  playClick();

  const previousPosition = currentPositions[index] % lettersPerWheel;
  const nextPosition = previousPosition + 1;

  currentPositions[index] = nextPosition;

  wheel.track.style.transition = "transform 0.18s ease-out";
  wheel.track.style.transform = `translateY(-${nextPosition * wheelHeight}px)`;

  const wordNow = getCurrentWordAfterAdvance(index, nextPosition);
  solveMessage.textContent = `Current alignment: ${wordNow}`;

  setTimeout(() => {
    if (nextPosition >= lettersPerWheel) {
      currentPositions[index] = 0;
      wheel.track.style.transition = "none";
      wheel.track.style.transform = "translateY(0px)";
    }

    checkSolved();
  }, 190);
}

function checkSolved() {
  const currentWord = getCurrentWord();

  if (currentWord === TARGET_WORD) {
    handleSolved();
    return;
  }

  solveMessage.classList.remove("solve-message--success");
}

function handleSolved() {
  puzzleSolved = true;

  solveMessage.textContent = "Cylinder unlocked. Archive fragment restored.";
  solveMessage.classList.add("solve-message--success");

  const wrapper = document.querySelector(".cylinder-wrapper");
  wrapper.classList.add("cylinder-wrapper--solved");

  wheels.forEach((wheel) => {
    wheel.root.disabled = true;
    wheel.root.style.cursor = "default";
  });

  setTimeout(() => {
    toPostlogButton.classList.remove("hidden");
  }, 650);
}

function layoutPuzzleWheels() {
  requestAnimationFrame(() => {
    sizeWheelLetters();

    setTimeout(() => {
      sizeWheelLetters();
    }, 80);

    setTimeout(() => {
      sizeWheelLetters();
    }, 220);
  });
}

function initPuzzle() {
  buildWheelMarkup();

  window.addEventListener("resize", () => {
    sizeWheelLetters();
  });
}

toPuzzleButton.addEventListener("click", () => {
  showScreen(screenPuzzle);
  playAmbient();

  if (cylinderImage && !cylinderImage.complete) {
    cylinderImage.addEventListener("load", layoutPuzzleWheels, { once: true });
  } else {
    layoutPuzzleWheels();
  }
});

toPostlogButton.addEventListener("click", () => {
  showScreen(screenPostlog);
});

transmitButton.addEventListener("click", () => {
  sessionStorage.setItem("p00", "solved");
  window.location.href = "../../index.html?return=p00";
});

playPrelogAudioButton?.addEventListener("click", () => {
  console.log("Pre-log audio not connected yet.");
});

playPostlogAudioButton?.addEventListener("click", () => {
  console.log("Post-log audio not connected yet.");
});

audioToggle.addEventListener("click", toggleAmbient);

document.addEventListener(
  "click",
  () => {
    if (!ambientMuted && ambientAudio.paused && screenPuzzle.classList.contains("screen--active")) {
      playAmbient();
    }
  },
  { once: true }
);

initPuzzle();