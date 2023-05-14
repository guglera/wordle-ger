const pageReload = document.getElementById("restart");
pageReload.addEventListener("click", () => location.reload());

var modal = document.getElementById("infodialog");
var btn = document.getElementById("help");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
  modal.style.display = "block";
}

span.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

const tileDisplay = document.querySelector(".tile-container");
const keyboard = document.querySelector(".key-container");
const messageDisplay = document.querySelector(".message-container");

let wordle;

async function fetchWord() {
  var hits = 0;
  while (hits < 1) {
    try {
      const respWord = await fetch("https://random-word-api.herokuapp.com/word?length=5&lang=de", 
        { method: "GET" });
      const word = await respWord.json();
      // console.log(word[0]);

      const respCheck = await fetch("https://api.woerterbuchnetz.de/open-api/dictionaries/DWDSWB/lemmata/"+word[0], 
        { method: "GET" });
      const reply = await respCheck.json();
      hits = reply.result_count;
      if (hits > 0) { wordle = word[0].toUpperCase()};
      // console.log(reply.result_count);
    } 
    catch (error) {
      console.error(error);
    }
  }
}

fetchWord();

async function wordValidation(word) {
  const respCheck = await fetch("https://api.woerterbuchnetz.de/open-api/dictionaries/DWDSWB/lemmata/"+word, 
    { method: "GET" });
  const reply = await respCheck.json();
  // console.log("Reply Result Count Word Validation: " + reply.result_count);
  if (reply.result_count > 0) {
    return true;
  } else {
    return false;
  }
}

const keys = [ "Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ü", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Ö", "Ä", "Y", "X", "C", "V", "B", 
"N", "M", "ENTER", "<--" ];

const guessRows = [
  ["", "", "", "", "" ],
  ["", "", "", "", "" ],
  ["", "", "", "", "" ],
  ["", "", "", "", "" ],
  ["", "", "", "", "" ],
  ["", "", "", "", "" ]
]

let currentRow = 0;
let currentTile = 0;
let isGameOver = false;

guessRows.forEach((guessRow, guessRowIndex) => {
  const rowElement = document.createElement("div");
  rowElement.setAttribute("id", "guessRow-" + guessRowIndex);
  guessRow.forEach((guess, guessIndex) => {
    const tileElement = document.createElement("div");
    tileElement.setAttribute("id", "guessRow-" + guessRowIndex + "-Tile-" + guessIndex);
    tileElement.classList.add("tile");
    rowElement.append(tileElement);
  });
  tileDisplay.append(rowElement);
})

keys.forEach(key => {
  const buttonElement = document.createElement("button");
  buttonElement.textContent = key;
  buttonElement.setAttribute("id", key);
  buttonElement.addEventListener("click", () => handleClick(key));
  keyboard.append(buttonElement);
})

const addLetter = (letter) => {
  if (currentTile < 5 && currentRow < 6) {
    const tile = document.getElementById("guessRow-" + currentRow + "-Tile-" + currentTile);
    tile.textContent = letter;
    guessRows[currentRow][currentTile] = letter;
    tile.setAttribute("data", letter);
    currentTile++;
    // console.log("guessRows: ", guessRows);
  }
}

const handleClick = (letter) => {
  if (!isGameOver) {
    // console.log("clicked on button", letter);
    if ((letter === "<--") || (letter == "BACKSPACE")) {
      deleteLetter();
      // console.log("guessRows: ", guessRows);
      return;
    }
    if (letter === "ENTER") {
      checkRow();
      // console.log("guessRows: ", guessRows);
      return;
    }
    addLetter(letter);
  }
}

// enable physical keyboard input:
let validKeys = keys;
validKeys.pop();
validKeys.push("BACKSPACE");

document.addEventListener("keydown", function(event) {
  if (event.key == "Backspace") {
    event.preventDefault();
  }
  var x = event.key.toUpperCase();
  if (validKeys.includes(x)) {
    handleClick(x);
  }
});

const deleteLetter = () => {
  if (currentTile > 0) {
    currentTile--;
    const tile = document.getElementById("guessRow-" + currentRow + "-Tile-" + currentTile);
    tile.textContent = "";
    guessRows[currentRow][currentTile] = "";
    tile.setAttribute("data", "");
  }
}

async function checkRow() {
  const guess = guessRows[currentRow].join("");
  const valid = await wordValidation(guess);
  if ((currentTile > 4) && (valid === false)) {
    showMessage("Wort nicht gefunden");
    return;
  }
  if (currentTile > 4) {
    console.log("Hinweis: " + wordle);
    flipTile();
    if (wordle === guess) {
      showMessage("Richtig erraten!");
      isGameOver = true;
      return;
    } else {
      if (currentRow >= 5) {
        isGameOver = true;
        showMessage("Spiel vorbei! Lösung: " + wordle);
        return;
      }
      if (currentRow < 5) {
        currentRow++;
        currentTile = 0;
      }
    }
  }
}

const showMessage = (message) => {
  if (!messageDisplay.hasChildNodes()) {
    const messageElement = document.createElement("p");
    if (message == "Richtig erraten!") {
      messageElement.classList.add("tilt");
    } else {
      messageElement.classList.add("skew");
    }
    messageElement.textContent = message;
    messageDisplay.append(messageElement);
    setTimeout(() => messageDisplay.removeChild(messageElement), 2500);
  }
}

const addColorToKey = (keyLetter, color) => {
  const key = document.getElementById(keyLetter);
  key.classList.add(color);
}

String.prototype.replaceAt = function(index, replacement) {
  return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

const flipTile = () => {
  const rowTiles = document.querySelector("#guessRow-" + currentRow).childNodes;
  var checkWordle = wordle;
  const guess = [];

  rowTiles.forEach(tile => {
      guess.push({letter: tile.getAttribute("data"), color: "grey-overlay"});
  })
  
  guess.forEach( (guess, index) => {
    if ( guess.letter == checkWordle[index] ) {
      guess.color = "green-overlay";
      checkWordle = checkWordle.replaceAt(index, " ");
    }
  })

  // console.log("checkWordle: " + checkWordle);

  guess.forEach( (guess) => {
    if ( (checkWordle.includes(guess.letter)) && (guess.color != "green-overlay") ) {
      guess.color = "yellow-overlay";
      checkWordle = checkWordle.replace(guess.letter, " ");
    }
  })

  rowTiles.forEach((tile, index) => {
      setTimeout(() => {
          tile.classList.add("flip");
          tile.classList.add(guess[index].color);
          addColorToKey(guess[index].letter, guess[index].color);
      }, 350 * index)
  })
}

