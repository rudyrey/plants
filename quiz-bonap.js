import { jsonData } from "./quiz-json.js";
const quizElement = document.getElementById("quiz");

let questionCount = 0;
let correctCount = 0;
let answerTracking = "";
let correctPlantNames = [];
let correctEmoji = "🌱";
let incorrectEmoji = "🍂";
let plantNames = [];
let answerResults = [];
let questionsAnswered = 0;
const totalQuestions = 10; // Change this to the desired number of questions


function getQuizData() {
  const urlParams = new URLSearchParams(window.location.search);
  const state = urlParams.get("state") || "TX"; // Default to "TX" if no state parameter is provided
  return jsonData.plants.filter(plant => plant.Native.Native.includes(state));
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function displayQuestion() {
  if (questionCount >= 10) {
    displayResult();
    return;
  }

  const plants = getQuizData();
  const randomPlantIndex = getRandomInt(plants.length);
  const randomPlant = plants[randomPlantIndex];
  const correctAnswer = randomPlant["Scientific Name"];
  const imageElement = document.getElementById("image");
  imageElement.src = randomPlant.Images[getRandomInt(randomPlant.Images.length)];

  // Remove the selected plant from the plants array
  plants.splice(randomPlantIndex, 1);

  const options = [correctAnswer];
  while (options.length < 4) {
    const optionIndex = getRandomInt(plants.length);
    const option = plants[optionIndex]["Scientific Name"];
    if (!options.includes(option)) {
      options.push(option);
    }
  }

  const shuffledOptions = shuffle(options);
  const optionsElement = document.getElementById("options");
  console.log("Correct Answer:", correctAnswer);
  optionsElement.innerHTML = "";

  shuffledOptions.forEach((option) => {
    const li = document.createElement("li");
    li.className = "option";

    // Add BONAP map image to the list item
    const img = document.createElement("img");
    img.src = `http://bonap.net/MapGallery/County/${option}.png`;
    img.alt = option;
    img.className = "bonap-map";
    li.appendChild(img);

    // Store the option text content as a custom attribute
    li.setAttribute("data-option", option);

    li.onclick = () => {
      const answerResult = {
        commonName: randomPlant["Common Name"].join(", "),
        scientificName: randomPlant["Scientific Name"],
        usedName: option,
        correct: option === correctAnswer,
      };
      answerResults.push(answerResult);

      if (option === correctAnswer) {
        correctCount++;
        li.style.backgroundColor = "green";
        answerTracking += "✅";
      } else {
        li.style.backgroundColor = "red";
        answerTracking += "❌";

        const correctLi = Array.from(optionsElement.querySelectorAll("li")).find(
          (item) => item.getAttribute("data-option") === correctAnswer
        );
        if (correctLi) {
          correctLi.style.backgroundColor = "#90EE90";
        }
        li.style.color = "white";
      }

      optionsElement.querySelectorAll("li").forEach((item) => {
        item.onclick = null;
        item.classList.add("disabled");
      });

      const nextQuestionButton = document.getElementById("next-question");
      nextQuestionButton.style.display = "block";
      nextQuestionButton.classList.remove("disabled");

      // Increment questionsAnswered and check if the quiz is finished
      questionsAnswered++;
      if (questionsAnswered === totalQuestions) {
        displayResult();
      }
    };

    optionsElement.appendChild(li);
  });

  const imageContainer = document.getElementById("image-container");
  const commonNamesElement = document.getElementById("common-names");
  commonNamesElement.textContent = randomPlant["Common Name"].slice(0, 4).join(", ");
  commonNamesElement.style.fontWeight = "bold";

  const scientificNameElement = document.getElementById("scientific-name");
  scientificNameElement.textContent = randomPlant["Scientific Name"];
};

// Move the onclick event for the "Next Question" button outside of the displayQuestion() function
const nextQuestionButton = document.getElementById("next-question");
nextQuestionButton.onclick = () => {
  questionCount++;

  if (questionCount === 5) {
    answerTracking += "\n";
  }

  nextQuestionButton.style.display = "none";
  displayQuestion();
};

let quizType = "Common Name";

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

const shareButton = document.getElementById("share");
shareButton.onclick = () => {
  const state = getStateFromUrl();
  const resultText = `Nativle Maps ${correctCount}/10\nbit.ly/nativle\n${answerTracking}`;
  copyToClipboard(resultText);

  const messageElement = document.getElementById("message");
  messageElement.textContent = "Results copied to clipboard!";
  messageElement.style.display = "block";

  setTimeout(() => {
    messageElement.style.opacity = 0;
    setTimeout(() => {
      messageElement.style.display = "none";
      messageElement.style.opacity = 1;
    }, 2000);
  }, 2000);
};

function displayResult() {
  console.log("Displaying results...");
  document.getElementById("results").style.display = "block";
  const quizElement = document.getElementById("quiz");
  quizElement.style.display = "none";

  const trackingElement = document.getElementById("tracking");
  trackingElement.innerHTML = "";

  console.log("answerResults:", answerResults);

  answerResults.forEach((answerResult) => {
    console.log("Processing answer result:", answerResult);

    const row = document.createElement("div");
    row.className = "result-row";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.backgroundColor = answerResult.correct ? "#90EE90" : "#FFB6C1";
    row.style.marginBottom = "5px";
    row.style.padding = "5px";
    row.style.borderRadius = "5px";

    // Create a new div for the collapsible content
    const collapsibleContent = document.createElement("div");
    collapsibleContent.className = "collapsible-content";
    collapsibleContent.style.display = "flex";
    collapsibleContent.style.flexDirection = "column"; // Add this line to stack the content vertically
    collapsibleContent.style.justifyContent = "space-between";
    collapsibleContent.style.maxHeight = "40px";
    collapsibleContent.style.overflow = "hidden";
    collapsibleContent.style.transition = "max-height 0.3s ease-in-out";

    row.style.display = "flex"; // Add this line to make the row a flex container
    row.style.alignItems = "center"; // Add this line to align the content vertically
    row.style.cursor = "pointer";

    // Add a click event listener to the row to toggle the collapsible content height
    row.addEventListener("click", () => {
      if (collapsibleContent.style.maxHeight === "40px") {
        collapsibleContent.style.maxHeight = "600px"; // Set the maxHeight to a larger value when expanded
      } else {
        collapsibleContent.style.maxHeight = "40px";
      }
    });

    const nameDiv = document.createElement("div");
    nameDiv.style.flexGrow = "1"; // Add this line
    nameDiv.style.flexBasis = "50%"; // Add this line

    const nameP = document.createElement("p");
    nameP.textContent = answerResult.commonName;
    nameP.style.margin = "0";
    nameP.style.justifyContent = "center";
    nameP.style.width = "100%"; // Add this line
    nameDiv.appendChild(nameP);

    const actualNameDiv = document.createElement("div");
    actualNameDiv.style.flexGrow = "1"; // Add this line
    actualNameDiv.style.flexBasis = "50%"; // Add this line

    const actualNameP = document.createElement("p");
    actualNameP.textContent = answerResult.scientificName;
    actualNameP.style.margin = "0";
    actualNameP.style.fontStyle = "italic";
    actualNameP.style.justifyContent = "center";
    actualNameP.style.width = "100%"; // Add this line
    actualNameDiv.appendChild(actualNameP);

    const namesContainer = document.createElement("div");
    namesContainer.style.display = "flex";
    namesContainer.style.justifyContent = "space-between";
    namesContainer.style.width = "100%";
    namesContainer.appendChild(nameDiv);
    namesContainer.appendChild(actualNameDiv);

    collapsibleContent.appendChild(namesContainer);

    // Create an img element for the image
    const image = document.createElement("img");
    image.src = `http://bonap.net/MapGallery/County/${answerResult.scientificName}.png`;
    image.alt = `${answerResult.scientificName} distribution map`;
    image.style.width = "100%"; // Adjust the width as needed
    image.style.marginTop = "10px"; // Add some space between the text and the image

    // Add the image to the collapsible content
    collapsibleContent.appendChild(image);

    row.appendChild(collapsibleContent);

    trackingElement.appendChild(row);
  });

  const restartButton = document.getElementById("restart");
  restartButton.onclick = () => {
    window.location.href = 'mapquiz.html';
  };
}

function getStateFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("state") || "TX"; // Default to "TX" if no state parameter is provided
}

// Call the displayQuestion function at the end of the script
displayQuestion();
