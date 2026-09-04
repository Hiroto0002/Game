const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let combo = 0;
let maxCombo = 0;
let score = 0;
let totalJudgementScore = 0;
let judgedNotes = 0;
let settingsOpen = false;


canvas.width = 500;
canvas.height = 800;

const laneCount = 4;
const laneWidth = canvas.width / laneCount;

const keyMap = {
    d: 0,
    f: 1,
    j: 2,
    k: 3
};

const keyHeld = [false, false, false, false];
const holdStartTimes = [null, null, null, null];

const judgeLineY = 700;

let travelTime = Number(
    localStorage.getItem("noteSpeed")
) || 2000;

const PERFECT_WINDOW = 50;
const GREAT_WINDOW = 100;
const GOOD_WINDOW = 150;
const HOLD_MIN_DURATION = 200;
const HOLD_END_WINDOW = 300;

const music = document.getElementById("music");

const savedVolume = localStorage.getItem("musicVolume");

if (savedVolume !== null) {
    music.volume = Number(savedVolume);
} else {
    music.volume = 0.5;
}

document.addEventListener("keydown", function(event) {

    if (event.key === "1") {
        travelTime = 3000;
        localStorage.setItem("noteSpeed", travelTime);
        setHitMessage("SPEED 1");
    }

    if (event.key === "2") {
        travelTime = 2000;
        localStorage.setItem("noteSpeed", travelTime);
        setHitMessage("SPEED 2");
    }

    if (event.key === "3") {
        travelTime = 1500;
        localStorage.setItem("noteSpeed", travelTime);
        setHitMessage("SPEED 3");
    }

    if (event.key === "4") {
        travelTime = 1000;
        localStorage.setItem("noteSpeed", travelTime);
        setHitMessage("SPEED 4");
    }
});

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

document.addEventListener("keydown", function(event) {

    if (event.key === "-") {
        music.volume = Math.max(0, music.volume - 0.1);
        localStorage.setItem("musicVolume", music.volume);
        setHitMessage(
            "VOLUME " + Math.round(music.volume * 100) + "%"
        );
    }

    if (event.key === "+") {
        music.volume = Math.min(1, music.volume + 0.1);
        localStorage.setItem("musicVolume", music.volume);
        setHitMessage(
            "VOLUME " + Math.round(music.volume * 100) + "%"
        );
    }
});

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

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        settingsOpen = !settingsOpen;

        if (settingsOpen) {
            music.pause();
        }
    }
});

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

document.addEventListener("keydown", function(event) {

    if (event.code === "Space") {
        event.preventDefault();

        if (settingsOpen) {
            return;
        }

        if (music.paused) {
            music.play();
        } else {
            music.pause();
        }
    }
});

document.addEventListener("keydown", function(event) {

    if (event.key.toLowerCase() === "z" && editMode) {

        if (recordedNotes.length > 0) {
            const deletedNote = recordedNotes.pop();

            setHitMessage("UNDO");

            console.log("UNDO:", deletedNote);
        }
    }
});

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

const recordedNotes = [];
let editMode = false;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showResult) {

        drawResult();

    } else {

        drawKeyLights();
        drawLanes();
        drawJudgeLine();

        const currentTime = music.currentTime * 1000;

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

let hitMessage = "";
let hitMessageTime = 0;

const HIT_MESSAGE_DURATION = 500;

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

let perfectCount = 0;
let greatCount = 0;
let goodCount = 0;
let missCount = 0;

let showResult = false;

function getAccuracy() {
    if (judgedNotes === 0) {
        return 100;
    }

    return totalJudgementScore / judgedNotes;
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

music.addEventListener("ended", function() {
    if (!editMode) {
        showResult = true;
    }
});

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

document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === "e") {
        editMode = !editMode;

        console.log("譜面作成モード:", editMode);
    }
});

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

document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === "r") {
        music.pause();
        music.currentTime = 0;

        hitMessage = "";

        for (let i = 0; i < laneCount; i++) {
            holdStartTimes[i] = null;
            keyHeld[i] = false;
        }

        console.log("曲を最初に戻しました");
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === "p") {

        // 記録した譜面をゲーム用にコピー
        notes = recordedNotes.map(function(note) {
            return {
                lane: note.lane,
                time: note.time,
                endTime: note.endTime,
                type: note.type,
                holding: false,
                hit: false
            };
        });

        // EDIT MODE終了
        editMode = false;

        // 曲を最初に戻す
        music.pause();
        music.currentTime = 0;
        
        score = 0;
        combo = 0;
        maxCombo = 0;

        totalJudgementScore = 0;
        judgedNotes = 0;

        perfectCount = 0;
        greatCount = 0;
        goodCount = 0;
        missCount = 0;

        console.log("PLAY MODE");
        console.log(notes);

        showResult = false;

        hitMessage = "";
    }
});

document.addEventListener("keydown", function(event) {

    if (event.repeat) {
        return;
    }

    const key = event.key.toLowerCase();

    if (settingsOpen) {
    return;
}

    if (keyMap[key] !== undefined) {
        const lane = keyMap[key];

        keyHeld[lane] = true;

        if (editMode) {
            holdStartTimes[lane] = Math.round(
                music.currentTime * 1000
            );
        } else {
            checkHit(lane);
        }
    }
});

document.addEventListener("keyup", function(event) {
    const key = event.key.toLowerCase();

    if (settingsOpen) {
    return;
}

    if (keyMap[key] !== undefined) {
        const lane = keyMap[key];

        keyHeld[lane] = false;

        if (editMode && holdStartTimes[lane] !== null) {

            const startTime = holdStartTimes[lane];
            const endTime = Math.round(
                music.currentTime * 1000
            );

            const duration = endTime - startTime;

            if (duration >= HOLD_MIN_DURATION) {

                recordedNotes.push({
                    lane: lane,
                    time: startTime,
                    endTime: endTime,
                    type: "hold"
                });

                console.log("HOLD NOTE", recordedNotes.at(-1));

            } else {

                recordedNotes.push({
                    lane: lane,
                    time: startTime
                });

                console.log("NORMAL NOTE", recordedNotes.at(-1));
            }

            holdStartTimes[lane] = null;
        }
    }
});

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

canvas.addEventListener("click", function(event) {

    if (!settingsOpen) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const mouseX =
        (event.clientX - rect.left) * (canvas.width / rect.width);

    const mouseY =
        (event.clientY - rect.top) * (canvas.height / rect.height);


    // SPEED -
    if (
        mouseX >= 120 &&
        mouseX <= 180 &&
        mouseY >= 315 &&
        mouseY <= 365
    ) {
        travelTime = Math.min(3000, travelTime + 500);
        localStorage.setItem("noteSpeed", travelTime);
        setHitMessage("SPEED DOWN");
    }


    // SPEED +
    if (
        mouseX >= 320 &&
        mouseX <= 380 &&
        mouseY >= 315 &&
        mouseY <= 365
    ) {
        travelTime = Math.max(1000, travelTime - 500);
        localStorage.setItem("noteSpeed", travelTime);
        setHitMessage("SPEED UP");
    }


    // VOLUME -
    if (
        mouseX >= 120 &&
        mouseX <= 180 &&
        mouseY >= 445 &&
        mouseY <= 495
    ) {
        music.volume = Math.max(
            0,
            music.volume - 0.1
        );

        localStorage.setItem("musicVolume", music.volume);

        setHitMessage(
            "VOLUME " +
            Math.round(music.volume * 100) +
            "%"
        );
    }


    // VOLUME +
    if (
        mouseX >= 320 &&
        mouseX <= 380 &&
        mouseY >= 445 &&
        mouseY <= 495
    ) {
        music.volume = Math.min(
            1,
            music.volume + 0.1
        );

        localStorage.setItem("musicVolume", music.volume);

        setHitMessage(
            "VOLUME " +
            Math.round(music.volume * 100) +
            "%"
        );
    }

});

gameLoop();