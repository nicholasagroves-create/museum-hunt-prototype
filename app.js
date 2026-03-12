const startScreen = document.getElementById("start-screen");
const crtBurst = document.getElementById("crt-burst");
const terminal = document.getElementById("terminal");
const terminalOutput = document.getElementById("terminal-output");
const promptLine = document.getElementById("prompt-line");
const promptText = document.getElementById("prompt-text");
const userInput = document.getElementById("user-input");
const mobileInput = document.getElementById("mobile-input");
const humAudio = document.getElementById("hum-audio");
const typingAudio = document.getElementById("typing-audio");

const bootLines = [
  "MUSEUM EXPEDITION ARCHIVE v0.9.4",
  "RECOVERED ACCESS NODE",
  "",
  "Initializing secure research terminal...",
  "Loading archive index...",
  "Restoring damaged session fragments...",
  "Connection established.",
  ""
];

const BASE_TYPE_SPEED = 22;
const LINE_DELAY = 260;
const FINAL_DELAY = 500;
const DOT_PAUSE = 220;
const LOAD_CYCLES = 3;
const CRT_BURST_DURATION = 420;

let bootStarted = false;
let currentInput = "";
let terminalReadyForInput = false;
let currentStage = "researcher-id";
let currentResearcherId = "";
let createdPin = "";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomSpeed() {
  return BASE_TYPE_SPEED + Math.random() * 35;
}

function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight);
}

function startHum() {
  humAudio.volume = 0.25;
  humAudio.loop = true;
  humAudio.play().catch(() => {});
}

function stopHum() {
  humAudio.pause();
  humAudio.currentTime = 0;
}

function startTypingSound() {
  typingAudio.volume = 0.35;

  if (typingAudio.paused) {
    typingAudio.currentTime = 0;
    typingAudio.play().catch(() => {});
  }
}

function stopTypingSound() {
  typingAudio.pause();
  typingAudio.currentTime = 0;
}

function getResearchers() {
  return JSON.parse(sessionStorage.getItem("researchers") || "{}");
}

function saveResearchers(researchers) {
  sessionStorage.setItem("researchers", JSON.stringify(researchers));
}

function clearPrototypeSessionState() {
  sessionStorage.removeItem("researchers");
  sessionStorage.removeItem("activeResearcherId");
  sessionStorage.removeItem("p00");
  sessionStorage.removeItem("p00_revealed");
}

function getReturnPuzzleId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("return");
}

function clearReturnParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete("return");
  window.history.replaceState({}, "", url.pathname + url.search);
}

function formatResearcherId(value) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7);

  if (cleaned.length <= 4) {
    return cleaned;
  }

  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

function freezeCurrentPromptLine(mask = false) {
  const lockedLine = document.createElement("div");
  lockedLine.className = "terminal__line";

  const visibleValue = mask ? "•".repeat(userInput.textContent.length) : userInput.textContent;
  const spacer = userInput.textContent ? " " : "";
  lockedLine.textContent = `> ${promptText.textContent}${spacer}${visibleValue}`;

  terminalOutput.appendChild(lockedLine);
  scrollToBottom();
}

async function addSystemLine(text) {
  const line = document.createElement("div");
  line.className = "terminal__line";
  terminalOutput.appendChild(line);
  await typeCharacters(line, text);
  scrollToBottom();
}

async function addLoadingSystemLine(text) {
  const line = document.createElement("div");
  line.className = "terminal__line";
  terminalOutput.appendChild(line);

  line.textContent = text;
  await animateWorkingDots(line, text);

  scrollToBottom();
}

function resetPrompt(newPrompt, inputMode = "text") {
  currentInput = "";
  mobileInput.value = "";
  userInput.textContent = "";
  promptText.textContent = newPrompt;
  mobileInput.setAttribute("inputmode", inputMode);
  promptLine.classList.remove("prompt-hidden");
  mobileInput.focus();
}

function setActiveResearcherId(id) {
  sessionStorage.setItem("activeResearcherId", id);
}

function getActiveResearcherId() {
  return sessionStorage.getItem("activeResearcherId") || "";
}

function getP00Solved() {
  return sessionStorage.getItem("p00") === "solved";
}

function getP00Revealed() {
  return sessionStorage.getItem("p00_revealed") === "true";
}

function setP00Revealed(value) {
  sessionStorage.setItem("p00_revealed", value ? "true" : "false");
}

function disableStartExperienceListeners() {
  document.removeEventListener("click", startExperience);
  document.removeEventListener("touchstart", startExperience);
}

function goToCreatePin() {
  freezeCurrentPromptLine(false);
  currentStage = "create-pin";
  resetPrompt("CREATE 4-DIGIT PIN", "numeric");
}

function goToConfirmPin() {
  freezeCurrentPromptLine(true);
  currentStage = "confirm-pin";
  resetPrompt("CONFIRM 4-DIGIT PIN", "numeric");
}

function goToEnterPin() {
  freezeCurrentPromptLine(false);
  currentStage = "enter-pin";
  resetPrompt("ENTER 4-DIGIT PIN", "numeric");
}

async function handlePinMismatch() {
  freezeCurrentPromptLine(true);
  await addSystemLine("PIN MISMATCH. RE-ENTER NEW PIN.");
  currentStage = "create-pin";
  createdPin = "";
  resetPrompt("CREATE 4-DIGIT PIN", "numeric");
  terminalReadyForInput = true;
}

async function handleInvalidPin() {
  freezeCurrentPromptLine(true);
  await addSystemLine("INVALID PIN. TRY AGAIN.");
  currentStage = "enter-pin";
  resetPrompt("ENTER 4-DIGIT PIN", "numeric");
  terminalReadyForInput = true;
}

function saveResearcherRecord() {
  const researchers = getResearchers();

  researchers[currentResearcherId] = {
    pin: createdPin
  };

  saveResearchers(researchers);
  setActiveResearcherId(currentResearcherId);
}

async function typeCharacters(element, text) {
  startTypingSound();

  for (let i = 0; i < text.length; i++) {
    element.textContent += text.charAt(i);
    scrollToBottom();
    await wait(randomSpeed());
  }

  stopTypingSound();
}

async function animateWorkingDots(element, baseText) {
  for (let cycle = 0; cycle < LOAD_CYCLES; cycle++) {
    element.textContent = baseText;
    await wait(DOT_PAUSE);

    element.textContent = `${baseText}.`;
    await wait(DOT_PAUSE);

    element.textContent = `${baseText}..`;
    await wait(DOT_PAUSE);

    element.textContent = `${baseText}...`;
    await wait(DOT_PAUSE);

    if (cycle < LOAD_CYCLES - 1) {
      element.textContent = baseText;
      await wait(DOT_PAUSE);
    }
  }

  await wait(350);
}

async function typeLine(text) {
  const line = document.createElement("div");
  line.className = "terminal__line";
  terminalOutput.appendChild(line);

  if (text === "") {
    line.innerHTML = "&nbsp;";
    await wait(120);
    return;
  }

  const hasEllipsis = text.endsWith("...");
  const baseText = hasEllipsis ? text.slice(0, -3) : text;

  await typeCharacters(line, baseText);

  if (hasEllipsis) {
    await animateWorkingDots(line, baseText);
  }

  scrollToBottom();
}

function getSealedRowMarkup(index) {
  const label = String(index).padStart(2, "0");

  return `
    <div class="archive-row archive-row--sealed">
      <div class="archive-row__number">${label}</div>
      <div class="archive-row__title">█████████████</div>
      <div class="archive-row__status">Sealed 🔒</div>
    </div>
  `;
}

function getFile00SealedMarkup() {
  return `
    <div id="file00-row" class="archive-row archive-row--sealed">
      <div class="archive-row__number">00</div>
      <div class="archive-row__title">█████████████</div>
      <div class="archive-row__status">Sealed 🔒</div>
    </div>
  `;
}

function getRecoveredRowMarkup() {
  return `
    <div id="file00-row" class="archive-row archive-row--recovered">
      <div class="archive-row__top">
        <div class="archive-row__number archive-row__number--recovered">00</div>
        <div class="archive-row__title archive-row__title--recovered">The Mercer Orientation Log</div>
        <div class="archive-row__status archive-row__status--recovered">Recovered</div>
      </div>

      <div class="archive-row__actions">
        <button id="file00-pre-button" type="button" class="archive-action-button">
          Pre-Incident Log
        </button>

        <button id="file00-post-button" type="button" class="archive-action-button">
          Post-Incident Log
        </button>

        <div class="archive-row__code">Code: M-00</div>
      </div>
    </div>
  `;
}

function buildArchiveRows() {
  const p00Solved = getP00Solved();
  const p00Revealed = getP00Revealed();

  let markup = "";

  if (p00Solved && p00Revealed) {
    markup += getRecoveredRowMarkup();
  } else {
    markup += getFile00SealedMarkup();
  }

  for (let i = 1; i <= 11; i += 1) {
    markup += getSealedRowMarkup(i);
  }

  return markup;
}

function wireRecoveredFile00Buttons() {
  const pre = document.getElementById("file00-pre-button");
  const post = document.getElementById("file00-post-button");

  if (!pre || !post) return;

  pre.addEventListener("click", () => {
    loadFile00Viewer("pre");
  });

  post.addEventListener("click", () => {
    loadFile00Viewer("post");
  });
}

function loadFile00Viewer(startTab = "pre") {
  const existingModal = document.getElementById("archive-modal-overlay");
  if (existingModal) {
    existingModal.remove();
  }

  const scrollY = window.scrollY;
  const previousBodyOverflow = document.body.style.overflow;
  const previousBodyPosition = document.body.style.position;
  const previousBodyTop = document.body.style.top;
  const previousBodyWidth = document.body.style.width;

  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";

  const overlay = document.createElement("div");
  overlay.id = "archive-modal-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  `;

  overlay.innerHTML = `
    <div style="
      width: 100%;
      max-width: 760px;
      max-height: 92vh;
      overflow-y: auto;
      background: rgba(23, 18, 13, 0.98);
      border: 1px solid rgba(191, 151, 87, 0.34);
      box-shadow: 0 0 40px rgba(0,0,0,0.55);
      padding: 16px;
      color: #ead8b2;
      font-family: Georgia, 'Times New Roman', serif;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      ">
        <div>
          <div style="
            font-size: 12px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #b79055;
            margin-bottom: 6px;
            font-family: 'Courier New', Courier, monospace;
          ">
            File 00
          </div>

          <div style="
            font-size: 28px;
            line-height: 1.2;
            color: #f4dfb3;
          ">
            The Mercer Orientation Log
          </div>
        </div>

        <button id="close-archive-modal" type="button" style="
          padding: 10px 12px;
          background: transparent;
          color: #ead8b2;
          border: 1px solid rgba(191, 151, 87, 0.28);
          font-family: 'Courier New', Courier, monospace;
          cursor: pointer;
        ">
          Close
        </button>
      </div>

      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 16px;
      ">
        <button id="file00-tab-pre" type="button" style="
          padding: 12px 10px;
          background: ${startTab === "pre" ? "linear-gradient(180deg, #5d4220, #2d2010)" : "transparent"};
          color: #f2deb1;
          border: 1px solid rgba(191, 151, 87, 0.4);
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        ">
          Pre-Incident Log
        </button>

        <button id="file00-tab-post" type="button" style="
          padding: 12px 10px;
          background: ${startTab === "post" ? "linear-gradient(180deg, #5d4220, #2d2010)" : "transparent"};
          color: #f2deb1;
          border: 1px solid rgba(191, 151, 87, 0.4);
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        ">
          Post-Incident Log
        </button>
      </div>

<div id="file00-panel-pre" style="display: ${startTab === "pre" ? "block" : "none"};">
  <div style="
    border: 1px solid rgba(191, 151, 87, 0.24);
    background: rgba(14, 11, 8, 0.52);
    padding: 14px;
  ">
    <div style="
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #b79055;
      margin-bottom: 10px;
      font-family: 'Courier New', Courier, monospace;
    ">
      Pre-Incident Log
    </div>

    <div style="
      background: url('puzzles/p00/graphics/journal-page.png') center center / cover no-repeat;
      aspect-ratio: 2 / 3;
      width: 100%;
      max-width: 640px;
      margin: 0 auto 12px;
      position: relative;
      border: 1px solid rgba(191, 151, 87, 0.18);
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        inset: 0;
        padding: 21% 13.2% 10.2% 13.2%;
        color: #1f1711;
      ">
        <div style="
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #5a4634;
          margin-bottom: 4px;
          font-family: Georgia, 'Times New Roman', serif;
        ">
          Recovered Journal Fragment
        </div>

        <div style="
          margin: 0 0 10px;
          font-size: 32px;
          line-height: 1.04;
          color: #2d2119;
          font-family: 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
          font-weight: 600;
        ">
          Pre-Incident Log
        </div>

        <div style="
          font-size: 20px;
          line-height: 1.5;
          color: #2e241c;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.1);
          font-family: 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
          font-weight: 500;
        ">
          <p style="margin: 0 0 14px;">
            Orientation procedures were established before entering the restricted archive. Mercer insisted that every researcher carry a field credential bearing the proper classification.
          </p>

          <p style="margin: 0 0 14px;">
            He claimed the mechanisms would respond only to those who could identify their assigned artifact status without hesitation.
          </p>

          <p style="margin: 0;">
            The first lock was described as simple by design. A test. A way of proving that the researcher understood where to look before attempting anything deeper in the collection.
          </p>
        </div>
      </div>
    </div>

    <button id="play-file00-observation" type="button" style="
      width: 100%;
      padding: 12px 14px;
      background: linear-gradient(180deg, #5d4220, #2d2010);
      color: #f2deb1;
      border: 1px solid rgba(191, 151, 87, 0.4);
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
    ">
      Play Log Audio
    </button>
  </div>
</div>

<div id="file00-panel-post" style="display: ${startTab === "post" ? "block" : "none"};">
  <div style="
    border: 1px solid rgba(191, 151, 87, 0.24);
    background: rgba(14, 11, 8, 0.52);
    padding: 14px;
  ">
    <div style="
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #b79055;
      margin-bottom: 10px;
      font-family: 'Courier New', Courier, monospace;
    ">
      Post-Incident Log
    </div>

    <div style="
      background: url('puzzles/p00/graphics/journal-page.png') center center / cover no-repeat;
      aspect-ratio: 2 / 3;
      width: 100%;
      max-width: 640px;
      margin: 0 auto 12px;
      position: relative;
      border: 1px solid rgba(191, 151, 87, 0.18);
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        inset: 0;
        padding: 21% 13.2% 10.2% 13.2%;
        color: #1f1711;
      ">
        <div style="
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #5a4634;
          margin-bottom: 4px;
          font-family: Georgia, 'Times New Roman', serif;
        ">
          Restored Journal Fragment
        </div>

        <div style="
          margin: 0 0 10px;
          font-size: 32px;
          line-height: 1.04;
          color: #2d2119;
          font-family: 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
          font-weight: 600;
        ">
          Post-Incident Log
        </div>

        <div style="
          font-size: 20px;
          line-height: 1.5;
          color: #2e241c;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.1);
          font-family: 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
          font-weight: 500;
        ">
          <p style="margin: 0 0 14px;">
            Credential accepted. The cylinder responded immediately once the correct classification was aligned.
          </p>

          <p style="margin: 0 0 14px;">
            Mercer’s note was underlined twice: <strong>The archive does not reward guessing. It rewards observation.</strong>
          </p>

          <p style="margin: 0;">
            With the first mechanism cleared, the system restored a corresponding expedition record and confirmed that additional locks would follow the same pattern: observe, interpret, align, transmit.
          </p>
        </div>
      </div>
    </div>

    <button id="play-file00-response" type="button" style="
      width: 100%;
      padding: 12px 14px;
      background: linear-gradient(180deg, #5d4220, #2d2010);
      color: #f2deb1;
      border: 1px solid rgba(191, 151, 87, 0.4);
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
    ">
      Play Log Audio
    </button>
  </div>
</div>
  `;

  document.body.appendChild(overlay);

  const observationAudio = new Audio("puzzles/p00/audio/mercer-field-log.wav");
  const responseAudio = new Audio("puzzles/p00/audio/mercer-field-log-solution.wav");

  const tabPre = document.getElementById("file00-tab-pre");
  const tabPost = document.getElementById("file00-tab-post");
  const panelPre = document.getElementById("file00-panel-pre");
  const panelPost = document.getElementById("file00-panel-post");

  function activateTab(tab) {
    const preActive = tab === "pre";

    tabPre.style.background = preActive ? "linear-gradient(180deg, #5d4220, #2d2010)" : "transparent";
    tabPost.style.background = preActive ? "transparent" : "linear-gradient(180deg, #5d4220, #2d2010)";

    panelPre.style.display = preActive ? "block" : "none";
    panelPost.style.display = preActive ? "none" : "block";
  }

  tabPre.addEventListener("click", () => activateTab("pre"));
  tabPost.addEventListener("click", () => activateTab("post"));

  document.getElementById("play-file00-observation").addEventListener("click", () => {
    responseAudio.pause();
    responseAudio.currentTime = 0;
    observationAudio.currentTime = 0;
    observationAudio.play().catch(() => {});
  });

  document.getElementById("play-file00-response").addEventListener("click", () => {
    observationAudio.pause();
    observationAudio.currentTime = 0;
    responseAudio.currentTime = 0;
    responseAudio.play().catch(() => {});
  });

  const closeModal = () => {
    observationAudio.pause();
    responseAudio.pause();
    overlay.remove();

    document.body.style.overflow = previousBodyOverflow;
    document.body.style.position = previousBodyPosition;
    document.body.style.top = previousBodyTop;
    document.body.style.width = previousBodyWidth;

    window.scrollTo(0, scrollY);
  };

  document.getElementById("close-archive-modal").addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });
}
async function revealRecoveredFile00() {
  const banner = document.getElementById("archive-update-banner");
  const file00Row = document.getElementById("file00-row");

  if (!file00Row) return;

  if (banner) {
    banner.style.transition = "box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease";

    for (let i = 0; i < 3; i += 1) {
      banner.style.boxShadow = "0 0 0 1px rgba(255, 214, 140, 0.35), 0 0 24px rgba(255, 184, 70, 0.28)";
      banner.style.borderColor = "rgba(255, 214, 140, 0.55)";
      banner.style.background = "rgba(92, 62, 22, 0.78)";
      await wait(180);

      banner.style.boxShadow = "none";
      banner.style.borderColor = "rgba(217, 168, 91, 0.28)";
      banner.style.background = "rgba(61, 42, 18, 0.62)";
      await wait(140);
    }
  }

  file00Row.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  await wait(950);

  file00Row.style.transition =
    "box-shadow 0.22s ease, transform 0.22s ease, background 0.22s ease, border-color 0.22s ease";

  for (let i = 0; i < 4; i += 1) {
    file00Row.style.borderColor = "rgba(255, 214, 140, 0.92)";
    file00Row.style.background =
      "linear-gradient(180deg, rgba(130, 88, 28, 0.78), rgba(52, 34, 14, 0.94))";
    file00Row.style.boxShadow =
      "0 0 0 1px rgba(255, 214, 140, 0.34), 0 0 34px rgba(255, 176, 62, 0.38)";
    file00Row.style.transform = "scale(1.012)";
    await wait(190);

    file00Row.style.borderColor = "rgba(191, 151, 87, 0.2)";
    file00Row.style.background = "rgba(18, 14, 10, 0.78)";
    file00Row.style.boxShadow = "none";
    file00Row.style.transform = "scale(1)";
    await wait(150);
  }

  file00Row.outerHTML = getRecoveredRowMarkup();
  wireRecoveredFile00Buttons();
  setP00Revealed(true);
}

function getArchiveStyles() {
  return `
    <style>
      @keyframes archiveShellFadeIn {
        from { opacity: 0; filter: brightness(0.7); }
        to { opacity: 1; filter: brightness(1); }
      }

      .archive-shell {
        width: 100%;
        max-width: 760px;
        margin: 14px auto 24px;
        border: 2px solid rgba(191, 151, 87, 0.28);
        background:
          linear-gradient(rgba(30, 22, 15, 0.9), rgba(22, 16, 11, 0.94)),
          url('images/archive-seal.jpg') center top / cover no-repeat;
        box-shadow: 0 0 34px rgba(0,0,0,0.55);
        position: relative;
        overflow: hidden;
        opacity: 0;
        animation: archiveShellFadeIn 1.4s ease-out forwards;
      }

      .archive-shell::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(rgba(0,0,0,0.54), rgba(0,0,0,0.66)),
          repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.018) 0px,
            rgba(255,255,255,0.018) 1px,
            transparent 1px,
            transparent 3px
          );
        pointer-events: none;
      }

      .archive-row {
        border: 1px solid rgba(191, 151, 87, 0.2);
        background: rgba(18, 14, 10, 0.78);
        padding: 12px 14px;
      }

      .archive-row--sealed {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 12px;
        align-items: center;
      }

      .archive-row--recovered {
        display: grid;
        gap: 12px;
        border: 1px solid rgba(217, 168, 91, 0.42);
        background: linear-gradient(180deg, rgba(90, 60, 22, 0.52), rgba(34, 24, 12, 0.88));
        box-shadow: inset 0 0 0 1px rgba(255, 212, 140, 0.08);
      }

      .archive-row__top {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 12px;
        align-items: center;
      }

      .archive-row__number {
        font-size: 24px;
        line-height: 1;
        color: #d6b37b;
        font-weight: 700;
      }

      .archive-row__number--recovered {
        color: #f0d094;
      }

      .archive-row__title {
        font-size: 16px;
        line-height: 1.4;
        color: #af9370;
        font-weight: 700;
      }

      .archive-row__title--recovered {
        font-size: 18px;
        line-height: 1.3;
        color: #f5dfb2;
      }

      .archive-row__status {
        font-size: 14px;
        color: #af9370;
        white-space: nowrap;
      }

      .archive-row__status--recovered {
        color: #f0d094;
      }

      .archive-row__actions {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 10px;
        align-items: center;
      }

      .archive-row__code {
        font-size: 14px;
        color: #f0d094;
        white-space: nowrap;
        text-align: right;
      }

      .archive-action-button {
        padding: 11px 10px;
        background: linear-gradient(180deg, #5d4220, #2d2010);
        color: #f2deb1;
        border: 1px solid rgba(191, 151, 87, 0.4);
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        letter-spacing: 0.04em;
        cursor: pointer;
      }

      @media (max-width: 640px) {
        .archive-row__actions {
          grid-template-columns: 1fr;
        }

        .archive-row__code {
          text-align: left;
        }
      }
    </style>
  `;
}

function loadArchiveShell(returnedPuzzleId = null) {
  disableStartExperienceListeners();

  document.body.style.overflowY = "auto";
  document.body.style.overflowX = "hidden";
  document.body.style.background = "#0a0a0a";

  const p00Solved = getP00Solved();
  const p00Revealed = getP00Revealed();
  const isFreshP00Return = returnedPuzzleId === "p00" && p00Solved && !p00Revealed;
  const restoredCount = p00Solved ? "1 / 50 FILES RESTORED" : "0 / 50 FILES RESTORED";

  document.body.innerHTML = `
    <main style="
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(110,80,30,0.16), transparent 36%),
        linear-gradient(rgba(10,8,6,0.96), rgba(10,8,6,0.98)),
        #0a0a0a;
      color: #ead8b2;
      font-family: Georgia, 'Times New Roman', serif;
      padding: 16px 12px 36px;
    ">
      ${getArchiveStyles()}

      <section class="archive-shell">
        <div style="
          position: relative;
          padding: 18px 14px 14px;
          border-bottom: 1px solid rgba(191, 151, 87, 0.22);
          text-align: center;
        ">
          <div style="
            font-size: clamp(28px, 7vw, 48px);
            line-height: 1.05;
            color: #f2ddb2;
            font-weight: 700;
            letter-spacing: 0.03em;
            margin-bottom: 10px;
          ">
            Expedition Archive
          </div>

          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            letter-spacing: 0.16em;
            color: #d8b57c;
            margin-bottom: 10px;
          ">
            ${restoredCount}
          </div>

          <div style="
            color: #ceb892;
            font-size: 15px;
            line-height: 1.7;
          ">
            Recovered records stored securely on this device.
          </div>
        </div>

        <div style="
          position: relative;
          padding: 16px 14px 18px;
        ">
          <div style="
            border: 1px solid rgba(191, 151, 87, 0.24);
            background: rgba(16, 12, 9, 0.7);
            padding: 14px;
            margin-bottom: 16px;
          ">
            <div style="
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: #b79055;
              margin-bottom: 10px;
            ">
              Training Mechanism
            </div>

            <div style="
              color: #ead8b2;
              font-size: 15px;
              line-height: 1.8;
              margin-bottom: 12px;
            ">
              Begin with the tutorial puzzle to demonstrate archive recovery and restore File 00.
            </div>

            <button id="launch-tutorial-button" type="button" style="
              width: 100%;
              padding: 14px 12px;
              background: linear-gradient(180deg, #6c4a23, #2d2010);
              color: #f2deb1;
              border: 1px solid rgba(191, 151, 87, 0.44);
              font-family: 'Courier New', Courier, monospace;
              font-size: 13px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              cursor: pointer;
            ">
              ${p00Solved ? "Replay Tutorial Puzzle" : "Play Tutorial Puzzle"}
            </button>
          </div>

          ${
            isFreshP00Return
              ? `
                <div id="archive-update-banner" style="
                  border: 1px solid rgba(217, 168, 91, 0.28);
                  background: rgba(61, 42, 18, 0.62);
                  padding: 12px 14px;
                  margin-bottom: 16px;
                  color: #f3ddb1;
                  font-family: 'Courier New', Courier, monospace;
                ">
                  ARCHIVE UPDATE DETECTED — FILE 00 RESTORATION IN PROGRESS
                </div>
              `
              : ""
          }

          <div id="archive-file-list" style="
            display: grid;
            gap: 12px;
            margin-bottom: 16px;
          ">
            ${buildArchiveRows()}
          </div>

          <button id="back-to-briefing-button" type="button" style="
            width: 100%;
            padding: 13px 12px;
            background: transparent;
            color: #dec89f;
            border: 1px solid rgba(191, 151, 87, 0.22);
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
          ">
            Back To Briefing
          </button>
        </div>
      </section>
    </main>
  `;

  document.getElementById("launch-tutorial-button").addEventListener("click", () => {
    window.location.href = "puzzles/p00/index.html";
  });

  document.getElementById("back-to-briefing-button").addEventListener("click", () => {
    loadArchiveStartScreen(true);
  });

  if (p00Solved && p00Revealed) {
    wireRecoveredFile00Buttons();
  }

  if (isFreshP00Return) {
    setTimeout(() => {
      revealRecoveredFile00();
    }, 650);
  }
}

function loadArchiveStartScreen(autoplayMusic = false) {
  disableStartExperienceListeners();
  stopHum();

  document.body.style.overflowY = "auto";
  document.body.style.overflowX = "hidden";
  document.body.style.background = "#0a0a0a";

  document.body.innerHTML = `
    <main style="
      min-height: 100vh;
      height: auto;
      overflow-y: auto;
      background:
        linear-gradient(rgba(8,8,8,0.94), rgba(8,8,8,0.97)),
        url('images/archive-seal.jpg') center 120px / 260px no-repeat,
        #0a0a0a;
      color: #d7cfbd;
      font-family: 'Courier New', Courier, monospace;
      padding: 20px 14px 40px;
    ">
      <audio
        id="start-screen-audio"
        src="audio/start-screen.wav"
        loop
      ></audio>

      <style>
        @keyframes archiveFadeIn {
          from {
            opacity: 0;
            filter: brightness(0.6);
          }
          to {
            opacity: 1;
            filter: brightness(1);
          }
        }
      </style>

      <section style="
        width: 100%;
        max-width: 760px;
        margin: 24px auto 40px;
        border: 1px solid rgba(191, 179, 146, 0.18);
        background: rgba(20, 18, 15, 0.84);
        box-shadow: 0 0 32px rgba(0,0,0,0.45);
        position: relative;
        overflow: hidden;
        opacity: 0.05;
        animation: archiveFadeIn 5s cubic-bezier(.25,.8,.25,1) forwards;
      ">
        <div style="
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.018) 0px,
              rgba(255,255,255,0.018) 1px,
              transparent 1px,
              transparent 3px
            );
          opacity: 0.08;
          pointer-events: none;
        "></div>

        <div style="
          position: relative;
          padding: 18px 16px 16px;
          border-bottom: 1px solid rgba(191, 179, 146, 0.14);
        ">
          <div style="
            font-size: 11px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #8e8674;
            margin-bottom: 8px;
            line-height: 1.5;
          ">
            Expedition Archive
          </div>

          <div style="
            font-size: clamp(22px, 6vw, 30px);
            color: #f1eadb;
            line-height: 1.2;
            margin-bottom: 12px;
          ">
            Recovered Mission Briefing
          </div>

          <div style="
            font-size: 12px;
            line-height: 1.7;
            color: #aa9f89;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          ">
            Researcher ${currentResearcherId}<br />
            Access Level: Provisional
          </div>
        </div>

        <div style="
          position: relative;
          padding: 18px 16px 22px;
        ">
          <div style="
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #8e8674;
            margin-bottom: 12px;
          ">
            Recovery Summary
          </div>

          <div style="
            color: #e7dfcf;
            font-size: 17px;
            line-height: 1.8;
            margin-bottom: 16px;
          ">
            The Mercer expedition entered the museum archive in search of protected knowledge hidden behind a sequence of mechanical safeguards.
          </div>

          <div style="
            color: #c7beaa;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 16px;
          ">
            Their final records indicate that each solved mechanism restores fragments of the expedition log, revealing what the team encountered and what was lost inside the archive.
          </div>

          <div style="
            color: #c7beaa;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 22px;
          ">
            Your objective is to follow their path, recover the missing records, and reconstruct the full sequence of events.
          </div>

          <div style="
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #8e8674;
            margin-bottom: 12px;
            margin-top: 8px;
          ">
            How To Proceed
          </div>

          <div style="
            color: #d7cfbd;
            font-size: 15px;
            line-height: 1.9;
            margin-bottom: 22px;
          ">
            1. Solve puzzles located throughout the museum.<br />
            2. Each solved puzzle unlocks recovered expedition records.<br />
            3. Review the records to understand the unfolding story.<br />
            4. Continue until the archive has been restored.
          </div>

          <div style="
            border: 1px solid rgba(191, 179, 146, 0.16);
            background: rgba(10, 10, 10, 0.42);
            padding: 14px;
            margin-bottom: 16px;
          ">
            <div style="
              font-size: 11px;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #8e8674;
              margin-bottom: 10px;
            ">
              Recovered Transmission
            </div>

            <audio controls style="width: 100%; margin-bottom: 12px;">
              <source src="audio/intro-transmission.mp3" type="audio/mpeg" />
            </audio>

            <div style="
              color: #bdb39d;
              font-size: 13px;
              line-height: 1.8;
            ">
              Audio log playback available. Transcript excerpt below.
            </div>
          </div>

          <div style="
            border: 1px solid rgba(191, 179, 146, 0.16);
            background: rgba(10, 10, 10, 0.42);
            padding: 14px;
            margin-bottom: 18px;
          ">
            <div style="
              font-size: 11px;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #8e8674;
              margin-bottom: 10px;
            ">
              Transcript
            </div>

            <div style="
              color: #d7cfbd;
              font-size: 14px;
              line-height: 1.9;
            ">
              “If this recording is active, then at least part of the archive has responded. The mechanisms are not random. They are protective. Every answer reveals a record, and every record reveals what happened to us.”
            </div>
          </div>

          <button id="access-archive-button" type="button" style="
            width: 100%;
            padding: 16px 14px;
            background: #1a1712;
            color: #f0eadb;
            border: 1px solid rgba(191, 179, 146, 0.28);
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            cursor: pointer;
            margin-bottom: 10px;
          ">
            Access Archive
          </button>

          <button id="toggle-start-music-button" type="button" style="
            width: 100%;
            padding: 14px 12px;
            background: transparent;
            color: #cfc6b3;
            border: 1px solid rgba(191, 179, 146, 0.16);
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            cursor: pointer;
          ">
            Mute Start Music
          </button>
        </div>
      </section>
    </main>
  `;

  const startScreenAudio = document.getElementById("start-screen-audio");
  const accessArchiveButton = document.getElementById("access-archive-button");
  const toggleStartMusicButton = document.getElementById("toggle-start-music-button");

  startScreenAudio.volume = 0.35;

  if (autoplayMusic) {
    startScreenAudio.play().catch(() => {});
  }

  toggleStartMusicButton.addEventListener("click", () => {
    if (startScreenAudio.paused) {
      startScreenAudio.play().catch(() => {});
      toggleStartMusicButton.textContent = "Mute Start Music";
    } else {
      startScreenAudio.pause();
      toggleStartMusicButton.textContent = "Play Start Music";
    }
  });

  accessArchiveButton.addEventListener("click", () => {
    startScreenAudio.pause();
    startScreenAudio.currentTime = 0;
    loadArchiveShell();
  });
}

async function completeRegistration() {
  saveResearcherRecord();
  await addSystemLine("CREDENTIALS VERIFIED.");
  await addSystemLine("LOADING EXPEDITION ARCHIVE...");
  await addLoadingSystemLine("LAUNCHING INTERFACE");
  await wait(250);
  loadArchiveStartScreen(true);
}

async function handleCompletedResearcherId() {
  terminalReadyForInput = false;
  currentResearcherId = currentInput;

  const researchers = getResearchers();

  await wait(120);

  if (researchers[currentResearcherId]) {
    goToEnterPin();
  } else {
    goToCreatePin();
  }

  terminalReadyForInput = true;
}

async function handleCompletedCreatePin() {
  terminalReadyForInput = false;
  createdPin = currentInput;
  await wait(120);
  goToConfirmPin();
  terminalReadyForInput = true;
}

async function handleCompletedConfirmPin() {
  terminalReadyForInput = false;

  if (currentInput === createdPin) {
    freezeCurrentPromptLine(true);
    promptLine.classList.add("prompt-hidden");
    await completeRegistration();
    return;
  }

  await handlePinMismatch();
}

async function handleCompletedEnterPin() {
  terminalReadyForInput = false;

  const researchers = getResearchers();
  const researcher = researchers[currentResearcherId];

  if (researcher && researcher.pin === currentInput) {
    freezeCurrentPromptLine(true);
    promptLine.classList.add("prompt-hidden");
    setActiveResearcherId(currentResearcherId);
    await addSystemLine("CREDENTIALS VERIFIED.");
    await addLoadingSystemLine("LAUNCHING INTERFACE");
    await wait(250);
    loadArchiveShell();
    return;
  }

  await handleInvalidPin();
}

async function runBootSequence() {
  startHum();

  for (const line of bootLines) {
    await typeLine(line);
    await wait(LINE_DELAY);
  }

  await wait(FINAL_DELAY);
  promptLine.classList.remove("prompt-hidden");
  terminalReadyForInput = true;
}

async function startExperience() {
  if (bootStarted) return;
  bootStarted = true;

  startScreen.style.display = "none";
  terminal.classList.remove("hidden");

  terminalOutput.innerHTML = "";
  terminal.style.opacity = "1";
  promptLine.classList.add("prompt-hidden");
  terminalReadyForInput = false;
  currentInput = "";
  currentStage = "researcher-id";
  currentResearcherId = "";
  createdPin = "";
  mobileInput.value = "";
  userInput.textContent = "";
  promptText.textContent = "ENTER RESEARCHER ID";
  mobileInput.setAttribute("inputmode", "text");

  mobileInput.focus();

  crtBurst.classList.remove("hidden");
  await wait(CRT_BURST_DURATION);
  crtBurst.classList.add("hidden");

  await runBootSequence();
}

function initReturnToArchiveFlow() {
  const returnPuzzleId = getReturnPuzzleId();

  if (!returnPuzzleId) {
    clearPrototypeSessionState();
    return;
  }

  const activeResearcherId = getActiveResearcherId();

  if (!activeResearcherId) {
    clearPrototypeSessionState();
    return;
  }

  currentResearcherId = activeResearcherId;
  clearReturnParam();
  loadArchiveShell(returnPuzzleId);
}

document.addEventListener("click", startExperience, { once: true });
document.addEventListener("touchstart", startExperience, { once: true });

mobileInput.addEventListener("input", async () => {
  if (!terminalReadyForInput) return;

  if (currentStage === "researcher-id") {
    const formatted = formatResearcherId(mobileInput.value);
    currentInput = formatted;
    mobileInput.value = formatted;
    userInput.textContent = formatted;

    if (formatted.length === 8) {
      await handleCompletedResearcherId();
    }

    return;
  }

  if (currentStage === "create-pin") {
    const pin = mobileInput.value.replace(/\D/g, "").slice(0, 4);
    currentInput = pin;
    mobileInput.value = pin;
    userInput.textContent = pin;

    if (pin.length === 4) {
      await handleCompletedCreatePin();
    }

    return;
  }

  if (currentStage === "confirm-pin") {
    const pin = mobileInput.value.replace(/\D/g, "").slice(0, 4);
    currentInput = pin;
    mobileInput.value = pin;
    userInput.textContent = pin;

    if (pin.length === 4) {
      await handleCompletedConfirmPin();
    }

    return;
  }

  if (currentStage === "enter-pin") {
    const pin = mobileInput.value.replace(/\D/g, "").slice(0, 4);
    currentInput = pin;
    mobileInput.value = pin;
    userInput.textContent = pin;

    if (pin.length === 4) {
      await handleCompletedEnterPin();
    }
  }
});

mobileInput.addEventListener("keydown", (event) => {
  if (!terminalReadyForInput) return;

  if (event.key === "Enter") {
    event.preventDefault();
  }
});

initReturnToArchiveFlow();