const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let combo = 0;
let maxCombo = 0;
let score = 0;
let totalJudgementScore = 0;
let judgedNotes = 0;

canvas.width = 500;
canvas.height = 800;

const laneCount = 4;
const laneWidth = canvas.width / laneCount;

ctx.strokeStyle = "white";
ctx.lineWidth = 2;


for (let i = 1; i < laneCount; i++) {
    const x = laneWidth * i;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
}

const judgeLineY = 700;
const travelTime = 2000;

ctx.strokeStyle = "yellow";
ctx.lineWidth = 4;

ctx.beginPath();
ctx.moveTo(0, judgeLineY);
ctx.lineTo(canvas.width, judgeLineY);
ctx.stroke();

const music = document.getElementById("music");

document.addEventListener("keydown", function(event) {

    if (event.code === "Space") {
        music.play();
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

        ctx.fillRect(
            x,
            y,
            laneWidth - 20,
            20
        );
    }
}

let notes = [
    { lane: 0, time: 1000, hit: false },
    { lane: 2, time: 1500, hit: false },
    { lane: 1, time: 2000, hit: false },
    { lane: 3, time: 2500, hit: false }
];

const recordedNotes = [];
let editMode = false;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showResult) {

        drawResult();

    } else {

        drawLanes();
        drawJudgeLine();

        const currentTime = music.currentTime * 1000;

        if (!editMode) {
            checkMiss(currentTime);
        }

        drawNotes(currentTime);
        drawHitMessage();
        drawCombo();
        drawScore();
        drawAccuracy();
        drawEditMode();
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

document.addEventListener("keydown", function(event) {
    const key = event.key.toLowerCase();

    const keyMap = {
        d: 0,
        f: 1,
        j: 2,
        k: 3
    };

    if (keyMap[key] !== undefined) {
        const lane = keyMap[key];

        if (editMode) {
            recordNote(lane);
        } else {
            checkHit(lane);
        }
    }
});

function recordNote(lane) {
    const currentTime = music.currentTime * 1000;

    const note = {
        lane: lane,
        time: Math.round(currentTime)
    };

    recordedNotes.push(note);

    console.log(note);
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
        hitMessage = "MISS";
        return;
    }

    if (closestDistance <= 30) {
        hitMessage = "PERFECT";
        closestNote.hit = true;

        score += 1000; // Add score for PERFECT hit
        totalJudgementScore += 100;
        judgedNotes++;

        perfectCount++;
        addCombo();

    } else if (closestDistance <= 60) {
        hitMessage = "GREAT";
        closestNote.hit = true;

        score += 700; // Add score for GREAT hit
        totalJudgementScore += 80;
        judgedNotes++;
        
        greatCount++;
        addCombo();

    } else if (closestDistance <= 100) {
        hitMessage = "GOOD";
        closestNote.hit = true;
        score += 300; // Add score for GOOD hit
        totalJudgementScore += 50;
        judgedNotes++;

        goodCount++;
        addCombo();
    
    } else {
        hitMessage = "MISS";
        combo = 0;
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

        if (currentTime - note.time > 100) {
            note.hit = true;
            hitMessage = "MISS";

            judgedNotes++;
            missCount++;

            combo = 0;
        }
    }
}

function drawHitMessage() {
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

document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === "r") {
        music.pause();
        music.currentTime = 0;

        hitMessage = "";

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

gameLoop();