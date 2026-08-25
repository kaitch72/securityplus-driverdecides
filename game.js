/* ========================================
   DRIVER DECIDES
   GAME JAVASCRIPT
======================================== */


/* ========================================
   GAME STATE
======================================== */

let wallet = 20;
let spent = 0;
let savings = 0;
let interest = 0;

let items = [];

let currentDecision = 0;

let gameRunning = false;
let decisionStopped = false;
let decisionMoving = false;

let scooterY = 62;

let dragging = false;
let dragOffsetY = 0;

let savesSinceBonus = 0;

let selectedGoal = null;


/* ========================================
   GOALS / PRIZES
======================================== */

const goals = [
    {
        icon: "🎮",
        name: "Small Game",
        cost: 5
    },
    {
        icon: "🎨",
        name: "Art Set",
        cost: 8
    },
    {
        icon: "⚽",
        name: "Soccer Ball",
        cost: 10
    },
    {
        icon: "🚲",
        name: "New Bike",
        cost: 15
    }
];


/* ========================================
   SPENDING DECISIONS
======================================== */

const decisions = [

    {
        icon: "⭐",
        name: "Sticker",
        cost: 1
    },

    {
        icon: "🍿",
        name: "Snack",
        cost: 2
    },

    {
        icon: "🧸",
        name: "Small Toy",
        cost: 3
    },

    {
        icon: "📚",
        name: "Comic Book",
        cost: 4
    },

    {
        icon: "🎢",
        name: "Theme Park Ticket",
        cost: 5
    },

    {
        icon: "🎮",
        name: "Small Game",
        cost: 7
    },

    {
        icon: "🎨",
        name: "Art Set",
        cost: 8
    },

    {
        icon: "🚲",
        name: "New Bike",
        cost: 10
    }

];


/* ========================================
   ELEMENTS
======================================== */

const game = document.getElementById("game");

const scooter = document.getElementById("scooter");

const decision = document.getElementById("decision");

const spendChoice = document.getElementById("spendChoice");
const saveChoice = document.getElementById("saveChoice");

const spendIcon = document.getElementById("spendIcon");
const spendName = document.getElementById("spendName");
const spendCost = document.getElementById("spendCost");

const walletDisplay = document.getElementById("wallet");
const spentDisplay = document.getElementById("spent");
const savingsDisplay = document.getElementById("savings");

const instructions =
    document.getElementById("instructions");

const startScreen =
    document.getElementById("startScreen");

const startButton =
    document.getElementById("startButton");

const resultMessage =
    document.getElementById("resultMessage");

const resultIcon =
    document.getElementById("resultIcon");

const resultText =
    document.getElementById("resultText");

const interestMessage =
    document.getElementById("interestMessage");

const finishScreen =
    document.getElementById("finishScreen");

const finalSavings =
    document.getElementById("finalSavings");

const finalInterest =
    document.getElementById("finalInterest");

const prizeResult =
    document.getElementById("prizeResult");

const itemsDisplay =
    document.getElementById("items");


/* ========================================
   SAFE TEXT HELPER
======================================== */

function setText(element, value) {

    if (element) {
        element.textContent = value;
    }

}


/* ========================================
   FIND GOAL BUTTONS
======================================== */

function getGoalButtons() {

    if (!startScreen) {
        return [];
    }

    return Array.from(
        startScreen.querySelectorAll(
            "button[data-cost]"
        )
    ).filter(
        button =>
            !button.classList.contains("prize")
    );

}


/* ========================================
   CREATE / FIND GOAL DISPLAY
======================================== */

let goalNameDisplay =
    document.getElementById("goalName");

let goalCostDisplay =
    document.getElementById("goalCost");

let goalIconDisplay =
    document.getElementById("goalIcon");

let goalProgressFill =
    document.getElementById("goalProgressFill");

let goalProgressText =
    document.getElementById("goalProgressText");


/* ========================================
   PROGRESS BAR
======================================== */

function updateGoalProgress() {

    if (!selectedGoal) {
        return;
    }

    const percentage =
        Math.min(
            100,
            Math.round(
                (savings / selectedGoal.cost) * 100
            )
        );

    if (goalProgressFill) {

        goalProgressFill.style.width =
            percentage + "%";

    }

    if (goalProgressText) {

        goalProgressText.textContent =
            `$${savings} / $${selectedGoal.cost}`;

    }

    setText(
        goalNameDisplay,
        selectedGoal.name
    );

    setText(
        goalCostDisplay,
        "$" + selectedGoal.cost
    );

    setText(
        goalIconDisplay,
        selectedGoal.icon
    );

}


/* ========================================
   INVENTORY
======================================== */

function updateInventory() {

    if (!itemsDisplay) {
        return;
    }

    if (items.length === 0) {

        itemsDisplay.innerHTML =
            '<span style="opacity:.35;">None yet</span>';

        return;
    }

    itemsDisplay.innerHTML =
        items.map(item => {

            return `
                <span
                    title="${item.name}"
                    style="
                        display:inline-flex;
                        align-items:center;
                        justify-content:center;
                        width:42px;
                        height:42px;
                        font-size:28px;
                    "
                >
                    ${item.icon}
                </span>
            `;

        }).join("");

}


/* ========================================
   MONEY DISPLAY
======================================== */

function updateMoney() {

    setText(
        walletDisplay,
        wallet
    );

    setText(
        spentDisplay,
        spent
    );

    setText(
        savingsDisplay,
        savings
    );

    updateInventory();

    updateGoalProgress();

}


/* ========================================
   SELECT GOAL
======================================== */

function selectGoal(goal) {

    selectedGoal = goal;

    getGoalButtons().forEach(button => {

        const buttonCost =
            Number(
                button.dataset.cost
            );

        const isSelected =
            buttonCost === goal.cost;

        button.classList.toggle(
            "selected",
            isSelected
        );

    });

    updateGoalProgress();

    const message =
        document.getElementById("goalSelectionMessage");

    if (message) {

        message.textContent =
            `Your goal: ${goal.icon} ${goal.name} — save $${goal.cost}!`;

    }

    if (startButton) {

        startButton.disabled = false;

    }

}


/* ========================================
   SET UP GOAL BUTTONS
======================================== */

getGoalButtons().forEach(button => {

    button.addEventListener(
        "click",
        function () {

            const cost =
                Number(
                    button.dataset.cost
                );

            const goal =
                goals.find(
                    item =>
                        item.cost === cost
                );

            if (goal) {
                selectGoal(goal);
            }

        }
    );

});


/* ========================================
   LOAD CURRENT DECISION
======================================== */

function loadDecision() {

    if (!gameRunning) {
        return;
    }

    if (currentDecision >= decisions.length) {

        finishGame();

        return;
    }

    const d =
        decisions[currentDecision];

    setText(
        spendIcon,
        d.icon
    );

    setText(
        spendName,
        d.name
    );

    setText(
        spendCost,
        "$" + d.cost
    );

    decision.style.left =
        "-500px";

    decisionMoving = true;
    decisionStopped = false;

    setText(
        instructions,
        "Ride toward the next choice!"
    );

    moveDecisionToScooter();

}


/* ========================================
   MOVE CARD TOWARD SCOOTER
======================================== */

function moveDecisionToScooter() {

    if (!gameRunning) {
        return;
    }

    if (!decisionMoving) {
        return;
    }

    let currentLeft =
        parseFloat(
            decision.style.left
        );

    if (Number.isNaN(currentLeft)) {
        currentLeft = -500;
    }

    /*
       The decision cards stop just BEFORE
       the scooter instead of on top of it.
    */

    const scooterRect =
        scooter.getBoundingClientRect();

    const gameRect =
        game.getBoundingClientRect();

    const scooterRight =
        scooterRect.right -
        gameRect.left;

    const decisionWidth =
        decision.offsetWidth || 320;

    const targetLeft =
        scooterRight - decisionWidth - 45;

    if (currentLeft < targetLeft) {

        currentLeft += 12;

        decision.style.left =
            currentLeft + "px";

        requestAnimationFrame(
            moveDecisionToScooter
        );

    } else {

        decision.style.left =
            targetLeft + "px";

        decisionMoving = false;
        decisionStopped = true;

        setText(
            instructions,
            "Choose! Drag UP to spend or DOWN to save."
        );

    }

}


/* ========================================
   SCOOTER DRAGGING
======================================== */

if (scooter) {

    scooter.addEventListener(
        "pointerdown",
        function (event) {

            if (!gameRunning) {
                return;
            }

            if (!decisionStopped) {
                return;
            }

            dragging = true;

            scooter.setPointerCapture(
                event.pointerId
            );

            const rect =
                game.getBoundingClientRect();

            const gameHeight =
                rect.height;

            const mouseY =
                event.clientY -
                rect.top;

            const scooterTop =
                (scooterY / 100) *
                gameHeight;

            dragOffsetY =
                mouseY -
                scooterTop;

            scooter.style.cursor =
                "grabbing";

        }
    );


    scooter.addEventListener(
        "pointermove",
        function (event) {

            if (!dragging) {
                return;
            }

            const rect =
                game.getBoundingClientRect();

            const gameHeight =
                rect.height;

            let mouseY =
                event.clientY -
                rect.top;

            mouseY -= dragOffsetY;

            let newPercent =
                (mouseY / gameHeight) * 100;

            /*
               Keep scooter on the road.
            */

            newPercent =
                Math.max(
                    48,
                    Math.min(
                        76,
                        newPercent
                    )
                );

            scooterY =
                newPercent;

            scooter.style.top =
                scooterY + "%";

        }
    );


    scooter.addEventListener(
        "pointerup",
        releaseScooter
    );


    scooter.addEventListener(
        "pointercancel",
        releaseScooter
    );

}


/* ========================================
   RELEASE SCOOTER
======================================== */

function releaseScooter(event) {

    if (!dragging) {
        return;
    }

    dragging = false;

    if (scooter) {
        scooter.style.cursor = "grab";
    }

    try {

        if (
            scooter &&
            event.pointerId !== undefined
        ) {

            scooter.releasePointerCapture(
                event.pointerId
            );

        }

    } catch (error) {
        // Nothing needed here.
    }


    if (
        gameRunning &&
        decisionStopped
    ) {

        makeDecision();

    }

}


/* ========================================
   MAKE DECISION
======================================== */

function makeDecision() {

    if (!decisionStopped) {
        return;
    }

    decisionStopped = false;

    const scooterPosition =
        scooterY;

    /*
       Upper lane = SPEND
       Lower lane = SAVE
    */

    const spendY = 58;
    const saveY = 72;

    const distanceToSpend =
        Math.abs(
            scooterPosition -
            spendY
        );

    const distanceToSave =
        Math.abs(
            scooterPosition -
            saveY
        );

    if (
        distanceToSpend <
        distanceToSave
    ) {

        chooseSpend();

    } else {

        chooseSave();

    }

}


/* ========================================
   SPEND
======================================== */

function chooseSpend() {

    const d =
        decisions[currentDecision];

    if (!d) {
        return;
    }

    if (wallet < d.cost) {

        showResult(
            "😬",
            "You don't have enough money for that. Try saving!"
        );

        setTimeout(
            function () {

                if (!gameRunning) {
                    return;
                }

                resultMessage.style.display =
                    "none";

                decisionStopped = true;

                setText(
                    instructions,
                    "Try the SAVE lane!"
                );

            },
            1500
        );

        return;
    }


    wallet -= d.cost;

    spent += d.cost;

    items.push({
        icon: d.icon,
        name: d.name,
        cost: d.cost
    });

    updateMoney();


    /*
       Show the purchase result,
       then send the cards onward.
    */

    showResult(
        d.icon,
        `You spent $${d.cost} on ${d.name}!`
    );

    currentDecision++;

    continueAfterChoice();

}


/* ========================================
   SAVE
======================================== */

function chooseSave() {

    const d =
        decisions[currentDecision];

    if (!d) {
        return;
    }


    /*
       Smaller items = save $2
       Bigger items = save $3
    */

    let saveAmount;

    if (d.cost <= 4) {
        saveAmount = 2;
    } else {
        saveAmount = 3;
    }


    /*
       Never save more money than is
       actually in the wallet.
    */

    saveAmount =
        Math.min(
            saveAmount,
            wallet
        );


    if (saveAmount <= 0) {

        showResult(
            "💰",
            "Your wallet is empty!"
        );

        currentDecision++;

        continueAfterChoice();

        return;
    }


    wallet -= saveAmount;

    savings += saveAmount;

    savesSinceBonus++;

    updateMoney();


    /*
       Every 3 saves earns a $2 bonus.
    */

    if (savesSinceBonus >= 3) {

        savings += 2;

        interest += 2;

        savesSinceBonus = 0;

        updateMoney();

        showInterest();

    } else {

        showResult(
            "🐷",
            `You put $${saveAmount} in your Piggy Bank!`
        );

    }


    currentDecision++;

    continueAfterChoice();

}


/* ========================================
   CONTINUE AFTER CHOICE
======================================== */

function continueAfterChoice() {

    setTimeout(
        function () {

            if (resultMessage) {
                resultMessage.style.display =
                    "none";
            }

            if (interestMessage) {
                interestMessage.style.display =
                    "none";
            }

            moveDecisionAway();

        },
        1400
    );

}


/* ========================================
   MOVE DECISION OUT TO THE RIGHT
======================================== */

function moveDecisionAway() {

    if (!decision) {
        return;
    }

    decisionMoving = true;

    let currentLeft =
        parseFloat(
            decision.style.left
        );

    if (Number.isNaN(currentLeft)) {
        currentLeft = 1000;
    }


    function moveAway() {

        currentLeft += 20;

        decision.style.left =
            currentLeft + "px";


        /*
           Keep moving RIGHT until the
           entire card is off screen.
        */

        const gameWidth =
            game.clientWidth;

        if (
            currentLeft <
            gameWidth + 600
        ) {

            requestAnimationFrame(
                moveAway
            );

        } else {

            decisionMoving = false;

            setTimeout(
                function () {

                    loadDecision();

                },
                250
            );

        }

    }


    moveAway();

}


/* ========================================
   RESULT MESSAGE
======================================== */

function showResult(
    icon,
    message
) {

    if (!resultMessage) {
        return;
    }

    setText(
        resultIcon,
        icon
    );

    setText(
        resultText,
        message
    );

    resultMessage.style.display =
        "flex";

}


/* ========================================
   INTEREST / BONUS MESSAGE
======================================== */

function showInterest() {

    if (!interestMessage) {
        return;
    }

    const bonusText =
        interestMessage.querySelector(
            "strong"
        );

    if (bonusText) {
        bonusText.textContent =
            "$2 bonus!";
    }

    interestMessage.style.display =
        "flex";


    setTimeout(
        function () {

            if (interestMessage) {

                interestMessage.style.display =
                    "none";

            }

        },
        1600
    );

}


/* ========================================
   FINISH GAME
======================================== */

function finishGame() {

    gameRunning = false;

    decisionMoving = false;
    decisionStopped = false;
    dragging = false;


    setText(
        finalSavings,
        "$" + savings
    );

    setText(
        finalInterest,
        "$" + interest
    );


    /*
       Update final goal progress.
    */

    updateGoalProgress();


    /*
       Show everything the player bought.
    */

    const finalItems =
        document.getElementById(
            "finalItems"
        );

    if (finalItems) {

        if (items.length === 0) {

            finalItems.innerHTML =
                "<span>You didn't buy anything this ride.</span>";

        } else {

            finalItems.innerHTML = `
                <strong>🛍️ Things you bought:</strong>
                <div class="finalItemList">
                    ${items.map(item => `
                        <span class="finalItem">
                            ${item.icon}
                            ${item.name}
                            ($${item.cost})
                        </span>
                    `).join("")}
                </div>
            `;

        }

    }


    /*
       Show final savings message.
    */

    const finalMessage =
        document.getElementById(
            "finalMessage"
        );

    if (finalMessage && selectedGoal) {

        if (savings >= selectedGoal.cost) {

            finalMessage.textContent =
                `🎉 You saved enough for your ${selectedGoal.name}!`;

        } else {

            finalMessage.textContent =
                `You saved $${savings} toward your ${selectedGoal.name}!`;

        }

    }


    if (finishScreen) {

        finishScreen.style.display =
            "flex";

    }

    if (instructions) {

        instructions.style.display =
            "none";

    }


    updatePrizeButtons();

}


/* ========================================
   UPDATE PRIZE BUTTONS
======================================== */

function updatePrizeButtons() {

    if (!finishScreen) {
        return;
    }

    const prizeButtons =
        finishScreen.querySelectorAll(
            ".prize"
        );

    prizeButtons.forEach(
        function (prize) {

            const cost =
                Number(
                    prize.dataset.cost
                );

            if (
                selectedGoal &&
                cost === selectedGoal.cost
            ) {

                prize.classList.add(
                    "goalPrize"
                );

            }

        }
    );

}


/* ========================================
   PRIZE SELECTION
======================================== */

document
    .querySelectorAll(".prize")
    .forEach(
        function (prize) {

            prize.addEventListener(
                "click",
                function () {

                    const cost =
                        Number(
                            prize.dataset.cost
                        );

                    if (savings < cost) {

                        if (prizeResult) {

                            prizeResult.textContent =
                                `You need $${cost}, but you saved $${savings}. Keep saving!`;

                        }

                        return;
                    }


                    savings -= cost;

                    updateMoney();


                    if (finalSavings) {

                        finalSavings.textContent =
                            "$" + savings;

                    }


                    if (prizeResult) {

                        prizeResult.textContent =
                            "🎉 You got your prize! Great saving!";

                    }


                    document
                        .querySelectorAll(".prize")
                        .forEach(
                            function (p) {
                                p.disabled = true;
                            }
                        );

                }
            );

        }
    );


/* ========================================
   PLAY AGAIN
======================================== */

const playAgainButton =
    document.getElementById(
        "playAgainButton"
    );


if (playAgainButton) {

    playAgainButton.addEventListener(
        "click",
        function () {

            resetGame();

        }
    );

}


/* ========================================
   RESET GAME
======================================== */

function resetGame() {

    gameRunning = false;

    decisionMoving = false;
    decisionStopped = false;
    dragging = false;

    wallet = 20;
    spent = 0;
    savings = 0;
    interest = 0;

    items = [];

    currentDecision = 0;

    scooterY = 62;

    savesSinceBonus = 0;

    selectedGoal = null;


    if (scooter) {

        scooter.style.top =
            scooterY + "%";

        scooter.style.cursor =
            "grab";

    }


    if (decision) {

        decision.style.left =
            "-500px";

    }


    updateMoney();


    if (resultMessage) {

        resultMessage.style.display =
            "none";

    }

    if (interestMessage) {

        interestMessage.style.display =
            "none";

    }

    if (finishScreen) {

        finishScreen.style.display =
            "none";

    }

    if (instructions) {

        instructions.style.display =
            "block";

    }


    /*
       Re-enable final prize buttons.
    */

    document
        .querySelectorAll(".prize")
        .forEach(
            function (prize) {

                prize.disabled = false;

                prize.classList.remove(
                    "goalPrize"
                );

            }
        );


    if (prizeResult) {

        prizeResult.textContent =
            "";

    }


    /*
       Return to the goal picker.
    */

    if (startScreen) {

        startScreen.style.display =
            "flex";

    }

}


/* ========================================
   START GAME
======================================== */

if (startButton) {

    startButton.addEventListener(
        "click",
        function () {

            /*
               Player MUST choose a goal first.
            */

            if (!selectedGoal) {

                const message =
                    document.getElementById(
                        "goalMessage"
                    );

                if (message) {

                    message.textContent =
                        "🎯 Pick a prize first!";

                }

                return;

            }


            if (startScreen) {

                startScreen.style.display =
                    "none";

            }

            if (finishScreen) {

                finishScreen.style.display =
                    "none";

            }


            gameRunning = true;

            currentDecision = 0;

            wallet = 20;
            spent = 0;
            savings = 0;
            interest = 0;

            items = [];

            savesSinceBonus = 0;

            scooterY = 62;


            if (scooter) {

                scooter.style.top =
                    scooterY + "%";

                scooter.style.cursor =
                    "grab";

            }


            updateMoney();


            if (instructions) {

                instructions.style.display =
                    "block";

            }


            setText(
                instructions,
                "Ride toward the first choice!"
            );


            loadDecision();

        }
    );

}


/* ========================================
   INITIAL STATE
======================================== */

updateMoney();


if (startScreen) {

    startScreen.style.display =
        "flex";

}


if (finishScreen) {

    finishScreen.style.display =
        "none";

}


if (resultMessage) {

    resultMessage.style.display =
        "none";

}


if (interestMessage) {

    interestMessage.style.display =
        "none";

}


if (instructions) {

    instructions.style.display =
        "block";

}
