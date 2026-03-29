const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

const predictionText = document.querySelector("#predictionText strong");
const userScoreEl = document.getElementById("userScore");
const computerScoreEl = document.getElementById("computerScore");
const userMoveEl = document.getElementById("userMove");
const computerMoveEl = document.getElementById("computerMove");
const roundResultEl = document.getElementById("roundResult");
const matchResultEl = document.getElementById("matchResult");

let camera = null;
let hands = null;
let stream = null;

let userScore = 0;
let computerScore = 0;
const MATCH_TARGET = 5;

let predictionBuffer = [];
let canPlayRound = true;

function isFingerExtended(lm, tip, pip, mcp) {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

function isThumbExtended(lm, handedness = "Right") {
  if (handedness === "Right") {
    return lm[4].x < lm[3].x;
  }
  return lm[4].x > lm[3].x;
}

function classifyGesture(landmarks, handednessLabel) {
  const thumb = isThumbExtended(landmarks, handednessLabel);
  const index = isFingerExtended(landmarks, 8, 6, 5);
  const middle = isFingerExtended(landmarks, 12, 10, 9);
  const ring = isFingerExtended(landmarks, 16, 14, 13);
  const pinky = isFingerExtended(landmarks, 20, 18, 17);

  const extendedCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;

  if (!thumb && !index && !middle && !ring && !pinky) return "stone";
  if (extendedCount >= 4) return "paper";
  if (!thumb && index && middle && !ring && !pinky) return "scissors";

  return null;
}

function mostFrequent(arr) {
  const count = {};
  let best = null;
  let max = 0;

  for (const item of arr) {
    if (!item) continue;
    count[item] = (count[item] || 0) + 1;
    if (count[item] > max) {
      max = count[item];
      best = item;
    }
  }

  return { value: best, count: max };
}

async function getComputerMove() {
  const res = await fetch("/api/computer-move");
  const data = await res.json();
  return data.move;
}

function decideRound(userMove, computerMove) {
  if (userMove === computerMove) return "draw";
  const win =
    (userMove === "stone" && computerMove === "scissors") ||
    (userMove === "paper" && computerMove === "stone") ||
    (userMove === "scissors" && computerMove === "paper");
  return win ? "user" : "computer";
}

function updateScoreUI() {
  userScoreEl.textContent = String(userScore);
  computerScoreEl.textContent = String(computerScore);
}

function clearRoundUI() {
  userMoveEl.textContent = "—";
  computerMoveEl.textContent = "—";
  roundResultEl.textContent = "—";
}

function setMatchResult(text = "", className = "") {
  matchResultEl.textContent = text;
  matchResultEl.classList.remove("win", "lose");
  if (className) matchResultEl.classList.add(className);
}

async function playRound(userMove) {
  if (!canPlayRound) return;
  if (userScore >= MATCH_TARGET || computerScore >= MATCH_TARGET) return;

  canPlayRound = false;

  const computerMove = await getComputerMove();
  const result = decideRound(userMove, computerMove);

  userMoveEl.textContent = userMove;
  computerMoveEl.textContent = computerMove;

  if (result === "user") {
    userScore += 1;
    roundResultEl.textContent = "You win this round";
  } else if (result === "computer") {
    computerScore += 1;
    roundResultEl.textContent = "Computer wins this round";
  } else {
    roundResultEl.textContent = "Draw";
  }

  updateScoreUI();

  if (userScore >= MATCH_TARGET) {
    setMatchResult("🎉 You won the match!", "win");
  } else if (computerScore >= MATCH_TARGET) {
    setMatchResult("🤖 Computer won the match.", "lose");
  }

  setTimeout(() => {
    canPlayRound = true;
    predictionBuffer = [];
  }, 1800);
}

function onResults(results) {
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;

  ctx.save();
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (results.image) {
    ctx.drawImage(results.image, 0, 0, overlay.width, overlay.height);
  }

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness?.[0]?.label || "Right";

    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
      color: "#3b82f6",
      lineWidth: 4,
    });
    drawLandmarks(ctx, landmarks, {
      color: "#22c55e",
      radius: 3,
    });

    const prediction = classifyGesture(landmarks, handedness);
    predictionText.textContent = prediction ? prediction : "Detecting...";

    predictionBuffer.push(prediction);
    if (predictionBuffer.length > 8) predictionBuffer.shift();

    const stable = mostFrequent(predictionBuffer);
    if (stable.value && stable.count >= 6) {
      playRound(stable.value);
    }
  } else {
    predictionText.textContent = "No hand";
    predictionBuffer = [];
  }

  ctx.restore();
}

async function initHands() {
  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.75,
    minTrackingConfidence: 0.7,
  });

  hands.onResults(onResults);
}

async function startCamera() {
  if (camera) return;
  setMatchResult("");

  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 960, height: 540 },
    audio: false,
  });
  video.srcObject = stream;

  await initHands();

  camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 960,
    height: 540,
  });

  await camera.start();

  startBtn.disabled = true;
  stopBtn.disabled = false;
}

function stopCamera() {
  if (!camera) return;

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  camera.stop();
  camera = null;
  hands = null;

  startBtn.disabled = false;
  stopBtn.disabled = true;
  predictionText.textContent = "—";

  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

function resetMatch() {
  userScore = 0;
  computerScore = 0;
  predictionBuffer = [];
  canPlayRound = true;
  updateScoreUI();
  clearRoundUI();
  setMatchResult("");
}

startBtn.addEventListener("click", async () => {
  try {
    await startCamera();
  } catch (err) {
    console.error(err);
    setMatchResult("Could not start camera. Check browser permissions.", "lose");
  }
});

stopBtn.addEventListener("click", stopCamera);
resetBtn.addEventListener("click", resetMatch);

updateScoreUI();
clearRoundUI();
