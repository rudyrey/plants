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
  const randomCommonNameIndex = getRandomInt(randomPlant["Common Name"].length);
  const correctAnswer = quizType === "Common Name" ? randomPlant["Common Name"][randomCommonNameIndex] : randomPlant["Scientific Name"];
  const imageElement = document.getElementById("image");
  displayImages(randomPlant.Images);

  // Remove the selected plant from the plants array
  plants.splice(randomPlantIndex, 1);

  const options = [correctAnswer];
  while (options.length < 4) {
    const optionIndex = getRandomInt(plants.length);
    const randomCommonNameIndex = getRandomInt(plants[optionIndex]["Common Name"].length);
    const option = quizType === "Common Name" ? plants[optionIndex]["Common Name"][randomCommonNameIndex] : plants[optionIndex]["Scientific Name"];
    if (!options.includes(option)) {
      options.push(option);
    }
  }

  const shuffledOptions = shuffle(options);
  const optionsElement = document.getElementById("options");
  optionsElement.innerHTML = "";

  shuffledOptions.forEach((option) => {
    const li = document.createElement("li");
    li.textContent = option;
    li.className = "option";
    li.onclick = () => {
      const answerResult = {
        commonName: randomPlant["Common Name"][randomCommonNameIndex], // Save the common name here
        scientificName: randomPlant["Scientific Name"], // Save the scientific name here
        usedName: option, // Save the used common name or scientific name here
        correct: option === correctAnswer,
      };
      answerResults.push(answerResult);

      if (option === correctAnswer) {
        correctCount++;
        li.style.backgroundColor = "green";
        answerTracking += "🌱";
      } else {
        li.style.backgroundColor = "red";
        answerTracking += "🍂";

        const correctLi = Array.from(optionsElement.querySelectorAll("li")).find(item => item.textContent === correctAnswer);
        if (correctLi) {
          correctLi.style.backgroundColor = "#90EE90";
        }
      }
      li.style.color = "white";

      optionsElement.querySelectorAll("li").forEach((item) => {
        item.onclick = null;
        item.classList.add("disabled");
      });

      const nextQuestionButton = document.getElementById("next-question");
      nextQuestionButton.style.display = "block";
      nextQuestionButton.classList.remove("disabled");
    };

    optionsElement.appendChild(li);
  });
}

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

const landingPage = document.getElementById("landing");
const commonNameButton = document.getElementById("commonName");
const scientificNameButton = document.getElementById("scientificName");
let quizType;

function startQuiz(type) {
    quizType = type;
    landingPage.style.display = "none";
    quizElement.style.display = "block";
    displayQuestion();
}

commonNameButton.onclick = () => {
    startQuiz("Common Name");
};

scientificNameButton.onclick = () => {
    startQuiz("Scientific Name");
};

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
  const asterisk = quizType === "Scientific Name" ? "*" : "";
  const resultText = `Nativle ${state} ${correctCount}/10${asterisk}\nbit.ly/nativle\n${answerTracking}`;
  
  const messageElement = document.getElementById("message");

  if (navigator.share) {
    navigator.share({
      title: 'Nativle Quiz Results',
      text: resultText,
    }).then(() => console.log('Successful share'))
      .catch((error) => console.log('Error sharing', error));
  } else {
    // If Web Share API is not available, copy to clipboard and show the message
    copyToClipboard(resultText);
    messageElement.textContent = "Results copied to clipboard!";
    messageElement.style.display = "block";

    setTimeout(() => {
      messageElement.style.opacity = 0;
      setTimeout(() => {
        messageElement.style.display = "none";
        messageElement.style.opacity = 1;
      }, 2000);
    }, 2000);
  }
};

function displayResult() {
  const quizElement = document.getElementById("quiz");
  quizElement.style.display = "none";

  const resultsElement = document.getElementById("results");
  resultsElement.style.display = "block";

  const trackingElement = document.getElementById("tracking");
  trackingElement.innerHTML = "";

  answerResults.forEach((answerResult) => {

    const row = document.createElement("div");
    row.className = "result-row";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.backgroundColor = answerResult.correct ? "#90EE90" : "#FFB6C1";
    row.style.marginBottom = "5px";
    row.style.padding = "5px";
    row.style.borderRadius = "5px";

    const nameP = document.createElement("p");
    if (quizType === "Common Name") {
      nameP.textContent = answerResult.commonName;
    } else {
      nameP.textContent = answerResult.commonName;
    }
    nameP.style.margin = "0";
    row.appendChild(nameP);

    const actualNameP = document.createElement("p");
    if (quizType === "Common Name") {
      actualNameP.textContent = answerResult.scientificName;
    } else {
      actualNameP.textContent = answerResult.scientificName; // Display the first common name
    }
    actualNameP.style.margin = "0";
    actualNameP.style.fontStyle = "italic";
    row.appendChild(actualNameP);

    trackingElement.appendChild(row);
  });

  const restartButton = document.getElementById("restart");
  restartButton.onclick = () => {
    window.location.href = 'index.html';
  };
}

const retakeButton = document.getElementById("retake");
retakeButton.onclick = () => {
  // Reset the quiz variables
  questionCount = 0;
  correctCount = 0;
  answerTracking = "";
  answerResults = [];

  // Hide the results page and show the quiz page
  const resultsElement = document.getElementById("results");
  resultsElement.style.display = "none";
  quizElement.style.display = "block";

  // Start the quiz again with the same settings
  displayQuestion();
};

function displayImages(images) {
  const imageContainer = document.getElementById("images"); // Change this line

  // Remove existing images from the container
  imageContainer.innerHTML = "";

  // Add the new images
  images.forEach((imageUrl) => {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Plant image";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.marginRight = "5px";

    imageContainer.appendChild(img);
  });
}

function getStateFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("state") || "TX"; // Default to "TX" if no state parameter is provided
}

function updateTitleWithState() {
  const state = getStateFromUrl();
  const titleElement = document.getElementById("title");
  titleElement.textContent = `Nativle ${state}`;
}

updateTitleWithState();
