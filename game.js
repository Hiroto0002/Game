const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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

function drawNotes(currentTime) {
    ctx.fillStyle = "cyan";

    for (const note of notes) {
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

const notes = [
    { lane: 0, time: 1000 },
    { lane: 2, time: 1500 },
    { lane: 1, time: 2000 },
    { lane: 3, time: 2500 }
];

const startTime = performance.now();

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawLanes();
    drawJudgeLine();

    const currentTime = performance.now() - startTime;

    drawNotes(currentTime);
    drawHitMessage();

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

const hitWindow = 50;
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
        checkHit(keyMap[key]);
    }
});

function checkHit(lane) {
    const currentTime = performance.now() - startTime;

    let closestNote = null;
    let closestDistance = Infinity;

    for (const note of notes) {
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
    } else if (closestDistance <= 60) {
        hitMessage = "GREAT";
    } else if (closestDistance <= 100) {
        hitMessage = "GOOD";
    } else {
        hitMessage = "MISS";
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

gameLoop();