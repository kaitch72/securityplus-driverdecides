// ========================================
// DRIVER DECIDES
// ========================================


// ========================================
// MONEY
// ========================================

let money = 10;

let savings = 0;


// ========================================
// GAME
// ========================================

let gameState = "start";

let worldPosition = 0;

let decisionMade = false;


// ========================================
// SPEED
// ========================================

// Slow forward movement

const rideSpeed = 0.55;


// ========================================
// SCOOTER
// ========================================

let scooterX = 50;

let dragging = false;


// ========================================
// ELEMENTS
// ========================================

const world =
    document.getElementById("world");

const scooter =
    document.getElementById("scooter");

const spendChoice =
    document.getElementById("spendChoice");

const saveChoice =
    document.getElementById("saveChoice");

const moneyDisplay =
    document.getElementById("money");

const savingsDisplay =
    document.getElementById("savings");

const startScreen =
    document.getElementById("startScreen");

const startButton =
    document.getElementById("startButton");

const controlText =
    document.getElementById("controlText");

const resultMessage =
    document.getElementById("resultMessage");

const resultIcon =
    document.getElementById("resultIcon");

const resultText =
    document.getElementById("resultText");

const finishScreen =
    document.getElementById("finishScreen");

const finalSavings =
    document.getElementById("finalSavings");

const finalMessage =
    document.getElementById("finalMessage");


// ========================================
// START GAME
// ========================================

startButton.addEventListener("click", function () {

    startScreen.style.display = "none";

    gameState = "riding";

    controlText.textContent =
        "Drag the scooter left or right";

    requestAnimationFrame(gameLoop);

});


// ========================================
// START DRAG
// ========================================

scooter.addEventListener("pointerdown", function (event) {

    if (gameState !== "riding") {
        return;
    }

    dragging = true;

    scooter.setPointerCapture(event.pointerId);

});


// ========================================
// DRAG SCOOTER
// ========================================

scooter.addEventListener("pointermove", function (event) {

    if (!dragging) {
        return;
    }

    if (gameState !== "riding") {
        return;
    }


    /*
        Convert mouse position into
        a percentage of the screen.
    */

    let newX =
        (event.clientX / window.innerWidth) * 100;


    /*
        Keep the scooter inside
        reasonable road boundaries.
    */

    if (newX < 12) {
        newX = 12;
    }

    if (newX > 88) {
        newX = 88;
    }


    scooterX = newX;

    scooter.style.left =
        scooterX + "%";

});


// ========================================
// END DRAG
// ========================================

scooter.addEventListener("pointerup", function () {

    dragging = false;

});


scooter.addEventListener("pointercancel", function () {

    dragging = false;

});


// ========================================
// HUD
// ========================================

function updateHUD() {

    moneyDisplay.textContent =
        money;

    savingsDisplay.textContent =
        savings;

}


// ========================================
// MOVE WORLD
// ========================================

function moveWorld() {

    worldPosition += rideSpeed;

    world.style.transform =
        `translateY(${worldPosition}px)`;

}


// ========================================
// COLLISION DETECTION
// ========================================

function checkCollision(first, second) {

    const a =
        first.getBoundingClientRect();

    const b =
        second.getBoundingClientRect();


    return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
    );

}


// ========================================
// CHECK CHOICES
// ========================================

function checkChoices() {

    if (decisionMade) {
        return;
    }


    /*
        The choice cards are inside
        the scrolling world.

        The scooter is NOT.

        Therefore the cards move
        toward the scooter.
    */


    // SPEND

    if (
        checkCollision(
            scooter,
            spendChoice
        )
    ) {

        makeSpendChoice();

        return;
    }


    // SAVE

    if (
        checkCollision(
            scooter,
            saveChoice
        )
    ) {

        makeSaveChoice();

        return;
    }

}


// ========================================
// SPEND
// ========================================

function makeSpendChoice() {

    decisionMade = true;

    gameState = "result";


    if (money >= 2) {

        money -= 2;

    }


    updateHUD();


    resultIcon.textContent =
        "🍦";

    resultText.textContent =
        "You spent $2 on ice cream!";


    resultMessage.style.display =
        "block";


    controlText.textContent =
        "You chose to spend!";


    /*
        Hide the choice so it can't
        be selected again.
    */

    spendChoice.style.display =
        "none";


    setTimeout(function () {

        resultMessage.style.display =
            "none";

        controlText.textContent =
            "Keep riding!";

        gameState = "riding";

    }, 1200);

}


// ========================================
// SAVE
// ========================================

function makeSaveChoice() {

    decisionMade = true;

    gameState = "result";


    if (money >= 2) {

        money -= 2;

        savings += 2;

    }


    updateHUD();


    resultIcon.textContent =
        "💰";

    resultText.textContent =
        "You saved $2!";


    resultMessage.style.display =
        "block";


    controlText.textContent =
        "You chose to save!";


    saveChoice.style.display =
        "none";


    setTimeout(function () {

        resultMessage.style.display =
            "none";

        controlText.textContent =
            "Keep riding!";

        gameState = "riding";

    }, 1200);

}


// ========================================
// FINISH
// ========================================

function finishGame() {

    gameState = "finished";


    finalSavings.textContent =
        "$" + savings;


    if (savings >= 4) {

        finalMessage.textContent =
            "Great job! You made choices that helped you save money.";

    }

    else {

        finalMessage.textContent =
            "Nice ride! Saving a little at a time can help you reach your goals.";

    }


    finishScreen.style.display =
        "flex";

}


// ========================================
// MAIN GAME LOOP
// ========================================

function gameLoop() {

    if (
        gameState === "finished"
    ) {

        return;

    }


    // ====================================
    // RIDING
    // ====================================

    if (gameState === "riding") {

        // Scroll the park

        moveWorld();


        // Check whether the scooter
        // hits a choice

        checkChoices();

    }


    // ====================================
    // FINISH
    // ====================================

    if (worldPosition >= 1500) {

        finishGame();

        return;

    }


    requestAnimationFrame(gameLoop);

}


// ========================================
// INITIALIZE
// ========================================

updateHUD();