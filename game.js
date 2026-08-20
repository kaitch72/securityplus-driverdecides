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


/* ========================================
   DECISION LIST
   CHEAP FIRST → MORE EXPENSIVE LATER
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

const game =
    document.getElementById("game");

const scooter =
    document.getElementById("scooter");

const world =
    document.getElementById("world");

const decision =
    document.getElementById("decision");

const spendChoice =
    document.getElementById("spendChoice");

const saveChoice =
    document.getElementById("saveChoice");

const spendIcon =
    document.getElementById("spendIcon");

const spendName =
    document.getElementById("spendName");

const spendCost =
    document.getElementById("spendCost");

const walletDisplay =
    document.getElementById("wallet");

const spentDisplay =
    document.getElementById("spent");

const savingsDisplay =
    document.getElementById("savings");

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

    const playAgainButton =
    document.getElementById("playAgainButton");


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

    walletDisplay.textContent = wallet;
    spentDisplay.textContent = spent;
    savingsDisplay.textContent = savings;

    updateInventory();
}


/* ========================================
   LOAD CURRENT DECISION
======================================== */

function loadDecision() {

    if (currentDecision >= decisions.length) {

        finishGame();

        return;
    }

    const d =
        decisions[currentDecision];


    spendIcon.textContent =
        d.icon;

    spendName.textContent =
        d.name;

    spendCost.textContent =
        "$" + d.cost;


    /*
       Start completely off-screen
       on the LEFT.
    */

    decision.style.left =
        "-500px";


    decisionMoving = true;
    decisionStopped = false;


    instructions.textContent =
        "Ride toward the next decision!";


    moveDecisionToScooter();
}


/* ========================================
   MOVE DECISION FROM LEFT
   STOP IN FRONT OF SCOOTER
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
        ) || -500;


    /*
       The scooter is around x = 1440.

       The cards are approximately
       360px wide.

       1000px means the card ends
       around x = 1360, leaving a
       visible gap before the scooter.
    */

    const targetLeft = 1000;


    if (currentLeft < targetLeft) {

        currentLeft += 12;

        decision.style.left =
            currentLeft + "px";


        requestAnimationFrame(
            moveDecisionToScooter
        );

    }

    else {

        decision.style.left =
            targetLeft + "px";


        decisionMoving = false;

        decisionStopped = true;


        instructions.textContent =
            "Choose! Drag your scooter UP or DOWN, then let go.";
    }
}


/* ========================================
   SCOOTER DRAGGING
======================================== */

scooter.addEventListener(
    "pointerdown",
    function (event) {

        if (!gameRunning) {
            return;
        }


        dragging = true;


        scooter.setPointerCapture(
            event.pointerId
        );


        const rect =
            game.getBoundingClientRect();


        const scale =
            rect.width / 1920;


        const mouseY =
            (event.clientY - rect.top)
            / scale;


        const scooterTop =
            scooterY / 100 * 1080;


        dragOffsetY =
            mouseY - scooterTop;


        scooter.style.cursor =
            "grabbing";
    }
);


/* ========================================
   SCOOTER MOVE
======================================== */

scooter.addEventListener(
    "pointermove",
    function (event) {

        if (!dragging) {
            return;
        }


        const rect =
            game.getBoundingClientRect();


        const scale =
            rect.width / 1920;


        let mouseY =
            (event.clientY - rect.top)
            / scale;


        mouseY -= dragOffsetY;


        let newPercent =
            (mouseY / 1080) * 100;


        /*
           Keep scooter on road.
        */

        newPercent =
            Math.max(
                47,
                Math.min(
                    77,
                    newPercent
                )
            );


        scooterY =
            newPercent;


        scooter.style.top =
            scooterY + "%";
    }
);


/* ========================================
   RELEASE SCOOTER
======================================== */

function releaseScooter(event) {

    if (!dragging) {
        return;
    }


    dragging = false;


    scooter.style.cursor =
        "grab";


    try {

        scooter.releasePointerCapture(
            event.pointerId
        );

    }

    catch (e) {}


    /*
       IMPORTANT:

       Releasing does NOT show the popup.

       First the card moves past
       the scooter.
    */

    if (
        gameRunning &&
        decisionStopped
    ) {

        makeDecision();
    }
}


scooter.addEventListener(
    "pointerup",
    releaseScooter
);


scooter.addEventListener(
    "pointercancel",
    releaseScooter
);


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
            scooterPosition - spendY
        );


    const distanceToSave =
        Math.abs(
            scooterPosition - saveY
        );


    /*
       Decide which action was selected,
       but DO NOT execute it yet.

       The card must pass the scooter first.
    */

    if (
        distanceToSpend <
        distanceToSave
    ) {

        moveDecisionPastScooter(
            chooseSpend
        );

    }

    else {

        moveDecisionPastScooter(
            chooseSave
        );
    }
}


/* ========================================
   MOVE CARD PAST SCOOTER
   THEN SHOW RESULT
======================================== */

function moveDecisionPastScooter(
    callback
) {

    decisionMoving = true;


    let currentLeft =
        parseFloat(
            decision.style.left
        ) || 1000;


    /*
       Move RIGHT.

       The card starts around x=1000.

       Scooter is around x=1440.

       We move the card all the way
       past the scooter before calling
       the decision function.
    */

    const exitPoint = 2100;


    instructions.textContent =
        "Riding through your choice...";


    function movePast() {

        currentLeft += 25;


        decision.style.left =
            currentLeft + "px";


        if (currentLeft < exitPoint) {

            requestAnimationFrame(
                movePast
            );

        }

        else {

            decisionMoving = false;


            /*
               NOW the card is completely
               past the scooter.

               Only now do we show
               the result popup.
            */

            callback();
        }
    }


    movePast();
}


/* ========================================
   SPEND
======================================== */

function chooseSpend() {

    const d =
        decisions[currentDecision];


    /*
       Not enough money.
    */

    if (wallet < d.cost) {

        showResult(
            "😬",
            "You don't have enough money for this!"
        );


        setTimeout(
            () => {

                resultMessage.style.display =
                    "none";


                /*
                   Since the card already
                   passed, give the player
                   the next decision.
                */

                currentDecision++;


                loadDecision();

            },
            1500
        );


        return;
    }


    wallet -= d.cost;

    spent += d.cost;


    items.push({

        icon: d.icon,

        name: d.name

    });


    updateMoney();


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

    if (wallet < 1) {

        showResult(
            "💰",
            "You don't have any money left to save!"
        );


        currentDecision++;


        continueAfterChoice();


        return;
    }


    wallet -= 1;

    savings += 2;

    interest += 1;


    updateMoney();


    showInterest();


    currentDecision++;


    continueAfterChoice();
}


/* ========================================
   CONTINUE AFTER POPUP
======================================== */

function continueAfterChoice() {

    /*
       The card has ALREADY gone off screen.

       We only wait for the popup,
       then bring in the next card.
    */

    setTimeout(
        () => {

            resultMessage.style.display =
                "none";

            interestMessage.style.display =
                "none";


            loadDecision();

        },
        1600
    );
}


/* ========================================
   RESULT MESSAGE
======================================== */

function showResult(
    icon,
    message
) {

    resultIcon.textContent =
        icon;

    resultText.textContent =
        message;


    resultMessage.style.display =
        "flex";
}


/* ========================================
   INTEREST MESSAGE
======================================== */

function showInterest() {

    interestMessage.style.display =
        "flex";


    setTimeout(
        () => {

            interestMessage.style.display =
                "none";

        },
        1300
    );
}


/* ========================================
   FINISH GAME
======================================== */

function finishGame() {

    gameRunning = false;

    decisionMoving = false;

    decisionStopped = false;


    finalSavings.textContent =
        "$" + savings;


    finalInterest.textContent =
        "$" + interest;


    finishScreen.style.display =
        "flex";


    instructions.style.display =
        "none";
}


/* ========================================
   START GAME
======================================== */

startButton.addEventListener(
    "click",
    function () {

        startScreen.style.display =
            "none";

        finishScreen.style.display =
            "none";


        gameRunning = true;


        currentDecision = 0;


        wallet = 20;

        spent = 0;

        savings = 0;

        interest = 0;


        items = [];


        scooterY = 62;


        scooter.style.top =
            scooterY + "%";


        scooter.style.left =
            "75%";


        updateMoney();


        instructions.style.display =
            "block";


        loadDecision();
    }
);


/* ========================================
   BIG PRIZE SELECTION
======================================== */

document
    .querySelectorAll(".prize")
    .forEach(
        prize => {

            prize.addEventListener(
                "click",
                function () {

                    const cost =
                        Number(
                            prize.dataset.cost
                        );


                    if (savings < cost) {

                        prizeResult.textContent =
                            `You need $${cost}, but you only saved $${savings}. Keep saving next time!`;

                        return;
                    }


                    savings -= cost;


                    finalSavings.textContent =
                        "$" + savings;


                    prizeResult.textContent =
                        "🎉 You chose this prize! You had enough saved!";


                    document
                        .querySelectorAll(".prize")
                        .forEach(
                            p => {

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

playAgainButton.addEventListener(
    "click",
    function () {

        /* Reset game */
        wallet = 20;
        spent = 0;
        savings = 0;
        interest = 0;

        items = [];

        currentDecision = 0;

        scooterY = 62;

        scooter.style.top =
            scooterY + "%";

        /* Reset prize buttons */
        document
            .querySelectorAll(".prize")
            .forEach(
                prize => {
                    prize.disabled = false;
                }
            );

        /* Clear old prize message */
        prizeResult.textContent = "";

        /* Hide finish screen */
        finishScreen.style.display =
            "none";

        /* Show instructions */
        instructions.style.display =
            "block";

        /* Start game */
        gameRunning = true;

        updateMoney();

        loadDecision();
    }
);

/* ========================================
   INITIAL STATE
======================================== */

updateMoney();


startScreen.style.display =
    "flex";


finishScreen.style.display =
    "none";


resultMessage.style.display =
    "none";


interestMessage.style.display =
    "none";


instructions.style.display =
    "block";