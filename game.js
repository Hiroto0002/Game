// ==============================
// 1. DOM
// ==============================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const music = document.getElementById("music");
const musicFileInput = document.getElementById("musicFileInput");
const chartFileInput = document.getElementById("chartFileInput");
const packageFileInput = document.getElementById("packageFileInput");
const jacketFileInput = document.getElementById("jacketFileInput");

// ==============================
// 2. CONFIG
// ==============================
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 800;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const laneCount = 4;
const laneWidth = canvas.width / laneCount;

const keyMap = {
         d: 0,
         f: 1,
         j: 2,
         k: 3
};

const judgeLineY = canvas.height - 100;

const PERFECT_WINDOW = 50;
const GREAT_WINDOW = 100;
const GOOD_WINDOW = 150;

const HOLD_MIN_DURATION = 200;
const HOLD_END_WINDOW = 300;
const HIT_MESSAGE_DURATION = 500;

// ==============================
// 3. GAME STATE
// ==============================
let score = 0;
let combo = 0;
let maxCombo = 0;

let perfectCount = 0;
let missCount = 0;

let editMode = false;
let settingsOpen = false;
let showResult = false;

let totalJudgementScore = 0;
let judgedNotes = 0;

let greatCount = 0;
let goodCount = 0;

let currentMusicURL = null;

const keyHeld = [false, false, false, false];
const holdStartTimes = [null, null, null, null];

let travelTime = Number(
         localStorage.getItem("noteSpeed")
) || 2000;

let selectedMusicFile = null;
let jacketImage = null;

let notes = [
         { lane: 0, time: 1000, hit: false },
         { lane: 2, time: 1500, hit: false },
         { lane: 1, time: 2000, hit: false },
         { lane: 3, time: 2500, hit: false },

         {
             lane: 0,
             time: 3000,
             endTime: 5000,
             type: "hold",

             holding: false,
             hit: false
         }
];

let hitMessage = "";
let hitMessageTime = 0;

const recordedNotes = [];

let gameState = "title";

// ==============================
// 4. INITIALIZE
// ==============================
const savedVolume = localStorage.getItem("musicVolume");

if (savedVolume !== null) {
         music.volume = Number(savedVolume);
} else {
         music.volume = 0.5;
}


// ==============================
// 5. INPUT
// ==============================
document.addEventListener("keydown", handleKeyDown);

function handleKeyDown(event) {

         if (event.repeat) {
             return;
         }

         const key = event.key.toLowerCase();


         if (event.key === "Escape") {
             toggleSettings();
             return;
         }


         if (handleSpeedKey(key)) {
             return;
         }


         if (handleVolumeKey(event)) {
             return;
         }

         if (event.code === "Space") {
             event.preventDefault();

             if (!settingsOpen) {
                 toggleMusic();
             }

             return;
         }

         if (settingsOpen) {
             return;
         }


         if (key === "r") {
             resetSong();
             return;
         }


         if (key === "z" && editMode) {
             undoNote();
             return;
         }


         if (key === "p") {
             startPlayMode();
             return;
         }


         if (key === "x") {
             exportChart();
             return;
         }


         if (key === "c") {
             exportPackage();
             return;
         }


         handleLaneKeyDown(key);
}

function handleSelectClick(mouseX, mouseY) {
    // LOAD RGAME
    if (
        mouseX >= 125 &&
        mouseX <= 375 &&
        mouseY >= 500 &&
        mouseY <= 550
    ) {
        // Handle LOAD RGAME click
        packageFileInput.click();
        return;
    }

        // JACKET
    if (
        mouseX >= 150 &&
        mouseX <= 350 &&
        mouseY >= 160 &&
        mouseY <= 360
    ) {
        jacketFileInput.click();
        return;
    }


    // SONG
    if (
        mouseX >= 80 &&
        mouseX <= 420 &&
        mouseY >= 390 &&
        mouseY <= 440
    ) {
        musicFileInput.click();
        return;
    }


    // LOAD RGAME
    if (
        mouseX >= 125 &&
        mouseX <= 375 &&
        mouseY >= 500 &&
        mouseY <= 550
    ) {
        packageFileInput.click();
        return;
    }

    // START
    if (
        mouseX >= 125 &&
        mouseX <= 375 &&
        mouseY >= 560 &&
        mouseY <= 630
    ) {
        gameState = "play";
        editMode = false;

        notes = createPlayableNotes(notes);

        resetMusicPosition();
        resetGameStats();

        return;
    }


    // BACK
    if (
        mouseX >= 125 &&
        mouseX <= 375 &&
        mouseY >= 660 &&
        mouseY <= 720
    ) {
        gameState = "title";

        resetMusicPosition();

        return;
    }
}

document.addEventListener("keyup", handleKeyUp);

function handleKeyUp(event) {

         const key = event.key.toLowerCase();

         if (settingsOpen) {
             return;
         }

         if (key === "e") {
             toggleEditMode();
             return;
         }

         if (key === "r") {
             resetSong();
             return;
         }


         if (keyMap[key] === undefined) {
             return;
         }

         const lane = keyMap[key];

         keyHeld[lane] = false;

         if (editMode && holdStartTimes[lane] !== null) {
             finishRecordedNote(lane);
         }
}

canvas.addEventListener("click", handleCanvasClick);

function handleCanvasClick(event) {

    const rect = canvas.getBoundingClientRect();

    const mouseX =
        (event.clientX - rect.left) *
        (canvas.width / rect.width);

    const mouseY =
        (event.clientY - rect.top) *
        (canvas.height / rect.height);


    // 設定画面
    if (settingsOpen) {
        handleSettingsClick(
            mouseX,
            mouseY
        );

        return;
    }


    // タイトル画面
    if (gameState === "title") {
        handleTitleClick(
            mouseX,
            mouseY
        );

        return;
    }


    // 選曲画面
    if (gameState === "select") {
        handleSelectClick(
            mouseX,
            mouseY
        );

        return;
    }
}

function handleTitleClick(mouseX, mouseY) {

    // PLAY
    if (
        mouseX >= 125 &&
        mouseX <= 375 &&
        mouseY >= 300 &&
        mouseY <= 370
    ) {

        gameState = "select";

        editMode = false;
        
        notes = createPlayableNotes(notes);

        resetMusicPosition();
        resetGameStats();

        return;
    }

    // BACK
    if (
        mouseX >= 125 &&
        mouseX <= 375 &&
        mouseY >= 660 &&
        mouseY <= 720
    ) {
        gameState = "title";
       
        resetMusicPosition();

        return;
    }

    // CHART EDITOR
    if (
        mouseX >= 125 &&
        mouseX <= 375 &&
        mouseY >= 400 &&
        mouseY <= 470
    ) {
        gameState = "play";
        editMode = true;

        resetMusicPosition();

        return;
    }


    // SETTINGS
    if (
        mouseX >= 125 &&
        mouseX <= 375 &&
        mouseY >= 500 &&
        mouseY <= 570
    ) {
        settingsOpen = true;

        return;
    }
}

function handleLaneKeyDown(key) {

    if (keyMap[key] === undefined) {
        return;
    }

    const lane = keyMap[key];

    keyHeld[lane] = true;

    if (editMode) {

        holdStartTimes[lane] =
            Math.round(
                music.currentTime * 1000
            );

    } else {

        checkHit(lane);
    }
}



// ==============================
// 6. SETTINGS
// ==============================
function changeVolume(amount) {

         music.volume = Math.min(
             1,
             Math.max(
                 0,
                 music.volume + amount
             )
         );

         saveVolume();
}

function setSpeed(newSpeed, message) {

         travelTime = Math.min(
             3000,
             Math.max(
                 1000,
                 newSpeed
             )
         );

         saveSpeed(message);
}

function handleSettingsClick(mouseX, mouseY) {

         // SPEED -
         if (
             mouseX >= 120 &&
             mouseX <= 180 &&
             mouseY >= 315 &&
             mouseY <= 365
         ) {
             setSpeed(
                 travelTime + 500,
                 "SPEED DOWN"
             );

             return;
         }

         // SPEED +
         if (
             mouseX >= 320 &&
             mouseX <= 380 &&
             mouseY >= 315 &&
             mouseY <= 365
         ) {
             setSpeed(
                 travelTime - 500,
                 "SPEED UP"
             );

             return;
         }

         // VOLUME -
         if (
             mouseX >= 120 &&
             mouseX <= 180 &&
             mouseY >= 445 &&
             mouseY <= 495
         ) {
             changeVolume(-0.1);
             return;
         }

         // VOLUME +
         if (
             mouseX >= 320 &&
             mouseX <= 380 &&
             mouseY >= 445 &&
             mouseY <= 495
         ) {
             changeVolume(0.1);
             return;
         }
}

function toggleSettings() {

         settingsOpen = !settingsOpen;

         if (settingsOpen) {
             music.pause();
         }
}

function handleSpeedKey(key) {

         if (key === "1") {
             setSpeed(3000, "SPEED 1");
             return true;
         }

         if (key === "2") {
             setSpeed(2000, "SPEED 2");
             return true;
         }

         if (key === "3") {
             setSpeed(1500, "SPEED 3");
             return true;
         }

         if (key === "4") {
             setSpeed(1000, "SPEED 4");
             return true;
         }

         return false;
}

function saveSpeed(message) {

         localStorage.setItem(
             "noteSpeed",
             travelTime
         );

         setHitMessage(message);
}

function handleVolumeKey(event) {

         if (event.key === "-") {
             changeVolume(-0.1);
             return true;
         }

         if (event.key === "+") {
             changeVolume(0.1);
             return true;
         }

         return false;
}

function saveVolume() {

         localStorage.setItem(
             "musicVolume",
             music.volume
         );

         setHitMessage(
             "VOLUME " +
             Math.round(
                 music.volume * 100
             ) +
             "%"
         );
}


// ==============================
// 7. AUDIO
// ==============================
function resetMusicPosition() {
         music.pause();
         music.currentTime = 0;
}

function toggleMusic() {

         if (music.paused) {
             music.play();
         } else {
             music.pause();
         }
}

function resetSong() {

         resetMusicPosition();

         hitMessage = "";

         for (let i = 0; i < laneCount; i++) {
             holdStartTimes[i] = null;
             keyHeld[i] = false;
         }

         console.log("曲を最初に戻しました");
}

music.addEventListener("ended", function() {
         if (!editMode) {
             showResult = true;
         }
});


// ==============================
// 8. CHART / EDITOR
// ==============================
function createPlayableNotes(sourceNotes) {

         return sourceNotes.map(function(note) {

             return {
                 lane: note.lane,
                 time: note.time,
                 endTime: note.endTime,
                 type: note.type,
                 holding: false,
                 hit: false
             };

         });
}

function finishRecordedNote(lane) {

         const startTime = holdStartTimes[lane];

         const endTime = Math.round(
             music.currentTime * 1000
         );

         const duration = endTime - startTime;

         if (duration >= HOLD_MIN_DURATION) {

             recordHoldNote(
                 lane,
                 startTime,
                 endTime
             );

         } else {

             recordNormalNote(
                 lane,
                 startTime
             );
         }

         holdStartTimes[lane] = null;
}

function recordNormalNote(lane, time) {

         recordedNotes.push({
             lane: lane,
             time: time
         });

         console.log(
             "NORMAL NOTE",
             recordedNotes.at(-1)
         );
}

function recordHoldNote(lane, startTime, endTime) {

         recordedNotes.push({
             lane: lane,
             time: startTime,
             endTime: endTime,
             type: "hold"
         });

         console.log(
             "HOLD NOTE",
             recordedNotes.at(-1)
         );
}

function toggleEditMode() {

         editMode = !editMode;

         console.log(
             "譜面作成モード:",
             editMode
         );
}

function undoNote() {

         if (recordedNotes.length === 0) {
             return;
         }

         const deletedNote =
             recordedNotes.pop();

         setHitMessage("UNDO");

         console.log(
             "UNDO:",
             deletedNote
         );
}

function startPlayMode() {

         notes = createPlayableNotes(recordedNotes);

         editMode = false;

         resetMusicPosition();
         resetGameStats();

         hitMessage = "";

         console.log("PLAY MODE");
         console.log(notes);
}


// ==============================
// 9. GAME LOGIC
// ==============================
function resetGameStats() {

         score = 0;
         combo = 0;
         maxCombo = 0;

         totalJudgementScore = 0;
         judgedNotes = 0;

         perfectCount = 0;
         greatCount = 0;
         goodCount = 0;
         missCount = 0;

         showResult = false;
}

function setHitMessage(message) {
         hitMessage = message;
         hitMessageTime = performance.now();
}

function checkHit(lane) {
         const currentTime = music.currentTime * 1000;

         let closestNote = null;
         let closestDistance = Infinity;

         for (const note of notes) {

             if (note.hit) {
                 continue;
             }

             if (note.lane !== lane) {
                 continue;
             }

             const distance = Math.abs(note.time - currentTime);

             if (distance < closestDistance) {
                 closestDistance = distance;
                 closestNote = note;
             }
         }

         if (closestNote === null) {
             setHitMessage("MISS");
             return;
         }

         if (
             closestNote.type === "hold" &&
             closestDistance <= GOOD_WINDOW
         ) {
             closestNote.holding = true;
             setHitMessage("HOLD");

         return;
         }

         if (closestDistance <= PERFECT_WINDOW) {
             setHitMessage("PERFECT");
             closestNote.hit = true;

             score += 1000; // Add score for PERFECT hit
             totalJudgementScore += 100;
             judgedNotes++;

             perfectCount++;
             addCombo();

         } else if (closestDistance <= GREAT_WINDOW) {
             setHitMessage("GREAT");
             closestNote.hit = true;

             score += 700; // Add score for GREAT hit
             totalJudgementScore += 80;
             judgedNotes++;
                  
             greatCount++;
             addCombo();

         } else if (closestDistance <= GOOD_WINDOW) {
             setHitMessage("GOOD");
             closestNote.hit = true;
             score += 300; // Add score for GOOD hit
             totalJudgementScore += 50;
             judgedNotes++;

             goodCount++;
             addCombo();
              
         } else {
             setHitMessage("MISS");
             combo = 0;
         }
              
}

function checkHoldNotes(currentTime) {

         for (const note of notes) {

             if (note.type !== "hold") {
                 continue;
             }

             if (!note.holding) {
                 continue;
             }

             if (note.hit) {
                 continue;
             }

             if (!keyHeld[note.lane]) {

                 const distanceToEnd = note.endTime - currentTime;

                 if (distanceToEnd <= HOLD_END_WINDOW) {
                     note.hit = true;
                     note.holding = false;

                     setHitMessage("PERFECT");

                     perfectCount++;
                     judgedNotes++;
                     totalJudgementScore += 100;
                     score += 1000;

                     addCombo();
                      
                 } else {

                 note.hit = true;
                 note.holding = false;

                 setHitMessage("MISS");
                 missCount++;
                 judgedNotes++;
                 combo = 0;

                 }

                 continue;
             }

             if (currentTime >= note.endTime) {
                 note.hit = true;
                 note.holding = false;

                 setHitMessage("PERFECT");

                 perfectCount++;
                 judgedNotes++;
                 totalJudgementScore += 100;
                 score += 1000;

                 addCombo();
             }
         }
}

function addCombo() {
         combo++;

         if (combo > maxCombo) {
             maxCombo = combo;
         }
}

function checkMiss(currentTime) {
         for (const note of notes) {

             if (note.hit) {
                 continue;
             }

             if (note.type === "hold" && note.holding) {
                 continue;
             }

             if (currentTime - note.time > GOOD_WINDOW) {
                 note.hit = true;
                 setHitMessage("MISS");

                 judgedNotes++;
                 missCount++;

                 combo = 0;
             }
         }
}

function getAccuracy() {
         if (judgedNotes === 0) {
             return 100;
         }

         return totalJudgementScore / judgedNotes;
}


// ==============================
// 10. DRAW
// ==============================

function drawSongSelectScreen() {

    ctx.fillStyle = "#111";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "white";
    ctx.textAlign = "center";


    // タイトル
    ctx.font = "40px Arial";

    ctx.fillText(
        "SELECT SONG",
        canvas.width / 2,
        100
    );


    // ジャケット仮枠
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        150,
        160,
        200,
        200
    );


    ctx.font = "20px Arial";

    if (jacketImage) {
        
        ctx.drawImage(
            jacketImage,
            150,
            160,
            200,
            200
        );
    } else {
        
        ctx.fillText(
            "NO JACKET",
            canvas.width / 2,
            270
        );
    }

    // 曲名
    ctx.font = "26px Arial";

    let songTitle = "NO SONG";

    if (selectedMusicFile) {
        songTitle =
            selectedMusicFile.name.replace(
                /\.[^/.]+$/,
                ""
            );
    }

    ctx.fillText(
        songTitle,
        canvas.width / 2,
        420
    );


    // 難易度
    ctx.font = "22px Arial";

    ctx.fillText(
        "4 KEY",
        canvas.width / 2,
        470
    );

    ctx.fillText(
        "LEVEL 1",
        canvas.width / 2,
        505
    );

    //LOAD RGAME
    ctx.strokeRect(
        125,
        500,
        250,
        50
    );

    ctx.font = "22px Arial";
    
    ctx.fillText(
        "LOAD RGAME",
        canvas.width / 2,
        533
    );

    // START
    ctx.strokeRect(125, 580, 250, 60);
    ctx.font = "28px Arial";
    ctx.fillText("START", canvas.width / 2, 620);

    // BACK
    ctx.strokeRect(
        125,
        660,
        250,
        60
    );

    ctx.font = "24px Arial";

    ctx.fillText(
        "BACK",
        canvas.width / 2,
        700
    );
}

function drawSpeed() {
         ctx.fillStyle = "white";
         ctx.font = "22px Arial";
         ctx.textAlign = "right";

         ctx.fillText(
             "SPEED " + travelTime,
             canvas.width - 20,
             90
         );
}

function drawVolume() {
         ctx.fillStyle = "white";
         ctx.font = "22px Arial";
         ctx.textAlign = "right";

         ctx.fillText(
             "VOLUME " + Math.round(music.volume * 100) + "%",
             canvas.width - 20,
             120
         );
}

function drawSettings() {
         ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
         ctx.fillRect(50, 150, 400, 500);

         ctx.strokeStyle = "white";
         ctx.lineWidth = 2;
         ctx.strokeRect(50, 150, 400, 500);

         ctx.fillStyle = "white";
         ctx.textAlign = "center";

         ctx.font = "32px Arial";
         ctx.fillText(
             "SETTINGS",
             canvas.width / 2,
             210
         );

         ctx.font = "24px Arial";

         // SPEED
         ctx.fillText(
             "NOTE SPEED",
             canvas.width / 2,
             290
         );

         // SPEED －
         ctx.strokeRect(120, 315, 60, 50);
         ctx.fillText("-", 150, 348);

         // SPEED 数値
         ctx.fillText(
             travelTime,
             canvas.width / 2,
             348
         );

         // SPEED ＋
         ctx.strokeRect(320, 315, 60, 50);
         ctx.fillText("+", 350, 348);


         // VOLUME
         ctx.fillText(
             "VOLUME",
             canvas.width / 2,
             420
         );

         // VOLUME －
         ctx.strokeRect(120, 445, 60, 50);
         ctx.fillText("-", 150, 478);

         // VOLUME 数値
         ctx.fillText(
             Math.round(music.volume * 100) + "%",
             canvas.width / 2,
             478
         );

         // VOLUME ＋
         ctx.strokeRect(320, 445, 60, 50);
         ctx.fillText("+", 350, 478);


         ctx.font = "18px Arial";
         ctx.fillText(
             "ESC : CLOSE",
             canvas.width / 2,
             590
         );
}

function drawNotes(currentTime) {
         ctx.fillStyle = "cyan";

         for (const note of notes) {

             if (note.hit) {
                 continue;
             }

             const timeUntilHit = note.time - currentTime;
             const progress = 1 - timeUntilHit / travelTime;
             const y = progress * judgeLineY;

             const x = note.lane * laneWidth + 10;

             if (note.type === "hold") {

                 const endTimeUntilHit = note.endTime - currentTime;
                 const endProgress = 1 - endTimeUntilHit / travelTime;
                 const endY = endProgress * judgeLineY;

                 const holdHeight = y - endY;

                 ctx.fillRect(
                     x,
                     endY,
                     laneWidth - 20,
                     holdHeight
                 );

             } else {

                 ctx.fillRect(
                     x,
                     y,
                     laneWidth - 20,
                     20
                 );
             }
         }
}

function drawLanes() {
         ctx.strokeStyle = "white";
         ctx.lineWidth = 2;

         for (let i = 1; i < laneCount; i++) {
             const x = laneWidth * i;

             ctx.beginPath();
             ctx.moveTo(x, 0);
             ctx.lineTo(x, canvas.height);
             ctx.stroke();
         }
}

function drawJudgeLine() {
         ctx.strokeStyle = "yellow";
         ctx.lineWidth = 4;

         ctx.beginPath();
         ctx.moveTo(0, judgeLineY);
         ctx.lineTo(canvas.width, judgeLineY);
         ctx.stroke();
}

function drawCombo() {
         ctx.fillStyle = "white";
         ctx.font = "40px Arial";
         ctx.textAlign = "center";

         if (combo > 0) {
             ctx.fillText(
                 combo + " COMBO",
                 canvas.width / 2,
                 500
             );
         }
}

function drawHitMessage() {

         if (hitMessage === "") {
             return;
         }

         const elapsed = performance.now() - hitMessageTime;

         if (elapsed > HIT_MESSAGE_DURATION) {
             hitMessage = "";
             return;
         }

         ctx.fillStyle = "white";
         ctx.font = "30px Arial";
         ctx.textAlign = "center";

         ctx.fillText(
             hitMessage,
             canvas.width / 2,
             400
         );
}

function drawScore() {
         ctx.fillStyle = "white";
         ctx.font = "24px Arial";
         ctx.textAlign = "right";

         ctx.fillText(
             "SCORE " + score,
             canvas.width - 20,
             30
         );
}

function drawAccuracy() {
         const accuracy = getAccuracy();

         ctx.fillStyle = "white";
         ctx.font = "22px Arial";
         ctx.textAlign = "right";

         ctx.fillText(
             "ACC " + accuracy.toFixed(2) + "%",
             canvas.width - 20,
             60
         );
}

function drawResult() {
         ctx.fillStyle = "#111";
         ctx.fillRect(0, 0, canvas.width, canvas.height);

         ctx.fillStyle = "white";
         ctx.textAlign = "center";

         ctx.font = "40px Arial";
         ctx.fillText(
             "RESULT",
             canvas.width / 2,
             100
         );

         ctx.font = "26px Arial";

         ctx.fillText(
             "PERFECT   " + perfectCount,
             canvas.width / 2,
             200
         );

         ctx.fillText(
             "GREAT     " + greatCount,
             canvas.width / 2,
             250
         );

         ctx.fillText(
             "GOOD      " + goodCount,
             canvas.width / 2,
             300
         );

         ctx.fillText(
             "MISS      " + missCount,
             canvas.width / 2,
             350
         );

         ctx.font = "30px Arial";

         ctx.fillText(
             "MAX COMBO   " + maxCombo,
             canvas.width / 2,
             450
         );

         ctx.fillText(
             "ACC   " + getAccuracy().toFixed(2) + "%",
             canvas.width / 2,
             500
         );

         ctx.fillText(
             "SCORE   " + score,
             canvas.width / 2,
             550
         );
}

function drawEditMode() {
         if (editMode) {
             ctx.fillStyle = "lime";
             ctx.font = "20px Arial";
             ctx.textAlign = "left";

             ctx.fillText(
                 "EDIT MODE",
                 20,
                 30
             );
         }
}

function drawRecordedNotes(currentTime) {
         ctx.fillStyle = "lime";

         for (const note of recordedNotes) {

             const timeSinceNote = currentTime - note.time;

             // 記録してから2秒以上経ったノーツは表示しない
             if (timeSinceNote < 0 || timeSinceNote > travelTime) {
                 continue;
             }

             const progress = timeSinceNote / travelTime;

             // 判定ラインから上へ移動
             const y = judgeLineY - progress * judgeLineY;

             const x = note.lane * laneWidth + 20;

             if (note.type === "hold") {

                 const endTimeSince = currentTime - note.endTime;
                 const endProgress = endTimeSince / travelTime;

                 const endY = judgeLineY - endProgress * judgeLineY;

                 const topY = Math.min(y, endY);
                 const bottomY = Math.max(y, endY);

                 ctx.fillRect(
                     x,
                     topY,
                     laneWidth - 40,
                     bottomY - topY
                 );

             } else {

                 ctx.fillRect(
                     x,
                     y,
                     laneWidth - 40,
                     15
                 );
             }
         }
}

function drawEditingHoldNotes(currentTime) {
         ctx.fillStyle = "rgba(0, 255, 0, 0.6)";

         for (let lane = 0; lane < laneCount; lane++) {

             const startTime = holdStartTimes[lane];

             // このレーンで何も押していない
             if (startTime === null) {
                 continue;
             }

             const duration = currentTime - startTime;

             // 押した時間に応じて長さを計算
             const height = (duration / travelTime) * judgeLineY;

             const x = lane * laneWidth + 20;

             // 判定ラインから上方向へ伸ばす
             ctx.fillRect(
                 x,
                 judgeLineY - height,
                 laneWidth - 40,
                 height
             );
         }
}

function drawKeyLights() {
         for (let i = 0; i < laneCount; i++) {

             if (keyHeld[i]) {
                 ctx.fillStyle = "rgba(0, 255, 255, 0.2)";

                 ctx.fillRect(
                     i * laneWidth,
                     0,
                     laneWidth,
                     canvas.height
                 );
             }
         }
}

function drawTitleScreen() {
    ctx.fillStyle = "#111";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "48px Arial";

    ctx.fillText(
        "RHYTHM GAME",
        canvas.width / 2,
        180
    );

    ctx.font = "28px Arial";

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    // PLAY
    ctx.strokeRect(
        125,
        300,
        250,
        70
    );

    ctx.fillText(
        "PLAY",
        canvas.width / 2,
        345
    );

    // CHART EDITOR
    ctx.strokeRect(
        125,
        400,
        250,
        70
    );

    ctx.fillText(
        "CHART EDITOR",
        canvas.width / 2,
        445
    );

    // SETTINGS
    ctx.strokeRect(
        125,
        500,
        250,
        70
    );

    ctx.fillText(
        "SETTINGS",
        canvas.width / 2,
        545
    );
}

// ==============================
// 11. FILE IMPORT / EXPORT
// ==============================
musicFileInput.addEventListener("change", function(event) {

         const file = event.target.files[0];

         if (!file) {
             return;
         }

         selectedMusicFile = file;

         const musicURL = URL.createObjectURL(file);

         music.src = musicURL;
         music.load();

         setHitMessage("MUSIC LOADED");

         console.log("読み込んだ曲:", file.name);
});

function exportChart() {

         const chartData = {
             title: selectedMusicFile
                 ? selectedMusicFile.name
                 : "Unknown Song",

             notes: recordedNotes
         };

         const jsonText = JSON.stringify(
             chartData,
             null,
             2
         );

         const blob = new Blob(
             [jsonText],
             { type: "application/json" }
         );

         const url = URL.createObjectURL(blob);

         const link = document.createElement("a");

         link.href = url;
         link.download = "chart.json";

         link.click();

         URL.revokeObjectURL(url);

         setHitMessage("CHART EXPORTED");
}

async function exportPackage() {

         if (!selectedMusicFile) {
             setHitMessage("NO MUSIC");
             return;
         }

         if (recordedNotes.length === 0) {
             setHitMessage("NO CHART");
             return;
         }

         const zip = new JSZip();

         const chartData = {
             title: selectedMusicFile.name,
             audio: selectedMusicFile.name,
             notes: recordedNotes
         };

         const jsonText = JSON.stringify(
             chartData,
             null,
             2
         );

         zip.file(
             selectedMusicFile.name,
             selectedMusicFile
         );

         zip.file(
             "chart.json",
             jsonText
         );

         const packageBlob = await zip.generateAsync({
             type: "blob"
         });

         const url = URL.createObjectURL(packageBlob);

         const link = document.createElement("a");

         link.href = url;

         const songName =
             selectedMusicFile.name.replace(/.[^/.]+$/, "");

         link.download = songName + ".rgame";

         link.click();

         URL.revokeObjectURL(url);

         setHitMessage("PACKAGE EXPORTED");
}

chartFileInput.addEventListener("change", async function(event) {

         const file = event.target.files[0];

         if (!file) {
             return;
         }

         const text = await file.text();

         const chartData = JSON.parse(text);

         notes = createPlayableNotes(chartData.notes);

         resetMusicPosition();
         resetGameStats();

         setHitMessage("CHART LOADED");

         console.log("譜面読み込み:", chartData);
});

packageFileInput.addEventListener(
         "change",
         async function(event) {

             const file = event.target.files[0];

             if (!file) {
                 return;
             }

             try {

                 // .rgame をZIPとして開く
                 const zip = await JSZip.loadAsync(file);

                 // chart.jsonを探す
                 const chartFile = zip.file("chart.json");

                 if (!chartFile) {
                     setHitMessage("NO CHART.JSON");
                     return;
                 }

                 // chart.jsonを文字として読み込む
                 const chartText =
                     await chartFile.async("string");

                 const chartData =
                     JSON.parse(chartText);

                 // JSONに書かれている音楽ファイル名を取得
                 const audioFileName =
                     chartData.audio;

                 if (!audioFileName) {
                     setHitMessage("NO AUDIO INFO");
                     return;
                 }

                 // ZIP内から音楽を探す
                 const audioFile =
                     zip.file(audioFileName);

                 if (!audioFile) {
                     setHitMessage("NO AUDIO FILE");
                     return;
                 }

                 // 音楽をBlobとして取り出す
                 const audioBlob =
                     await audioFile.async("blob");

                 // 前の曲のURLがあれば解放
                 if (currentMusicURL) {
                     URL.revokeObjectURL(
                         currentMusicURL
                     );
                 }

                 currentMusicURL =
                     URL.createObjectURL(audioBlob);

                 music.src = currentMusicURL;
                 music.load();

                 // 再EXPORTできるように
                 // 音楽ファイルとして保持
                 selectedMusicFile = new File(
                     [audioBlob],
                     audioFileName,
                     {
                         type:
                             audioBlob.type ||
                             "audio/mpeg"
                     }
                 );

                 // 譜面をゲーム用notesに変換
                 notes = createPlayableNotes(chartData.notes);

                 // ゲーム状態をリセット
                 resetMusicPosition();
                 resetGameStats();

                 setHitMessage("PACKAGE LOADED");

                 console.log(
                     "RGame読み込み成功:",
                     chartData
                 );

             } catch (error) {

                 console.error(
                     "RGame読み込みエラー:",
                     error
                 );

                 setHitMessage("LOAD ERROR");
             }
         }
);

jacketFileInput.addEventListener("change", function(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const imageURL =
        URL.createObjectURL(file);

    const image = new Image();

    image.onload = function() {
        jacketImage = image;

        URL.revokeObjectURL(imageURL);
    };

    image.src = imageURL;
});

// ==============================
// 12. GAME LOOP
// ==============================
function gameLoop() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (gameState === "title") {

        drawTitleScreen();

        if (settingsOpen) {
            drawSettings();
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === "select") {

    drawSongSelectScreen();

    requestAnimationFrame(gameLoop);
    return;
}


    if (showResult) {

        drawResult();

    } else {

        drawKeyLights();
        drawLanes();
        drawJudgeLine();

        const currentTime =
            music.currentTime * 1000;

        if (!editMode) {
            checkMiss(currentTime);
            checkHoldNotes(currentTime);
        }

        if (editMode) {
            drawRecordedNotes(currentTime);
            drawEditingHoldNotes(currentTime);
        } else {
            drawNotes(currentTime);
        }

        drawHitMessage();

        drawCombo();
        drawScore();
        drawAccuracy();
        drawSpeed();
        drawVolume();
        drawEditMode();

        if (settingsOpen) {
            drawSettings();
        }
    }

    requestAnimationFrame(gameLoop);
}

console.log("JSZip:", JSZip);

gameLoop();
