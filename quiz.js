updateTitleWithState();

import { jsonData } from "./quiz-json.js";

const quizElement = document.getElementById("quiz");
const nextQuestionButton = document.getElementById("next-question");
const seeResultsButton = document.getElementById("see-results");
const landingPage = document.getElementById("landing");
const commonNameButton = document.getElementById("commonName");
const scientificNameButton = document.getElementById("scientificName");
const shareButton = document.getElementById("share");
const retakeButton = document.getElementById("retake");
const urlParams = new URLSearchParams(window.location.search);
const restartButton = document.getElementById("restart");

const state = getStateFromUrl();
let questionCount = 0;
let correctCount = 0;
let answerTracking = "";
let correctPlantNames = [];
let correctEmoji = "🌱";
let incorrectEmoji = "🍂";
let plantNames = [];
let answerResults;
let quizType;
let randomPlant;
let correctAnswer;
let shuffledOptions;
let stateFromUrl;
let answerArray = [];

landingPage.style.display = "none";
quizElement.style.display = "block";
quizType = "Common Name"
localStorage.setItem('quizType', quizType);
window.onload = function() {
    // Check the presence of local storage variables
    if (
        !localStorage.getItem('questionCount') &&
        !localStorage.getItem('correctCount') &&
        !localStorage.getItem('answerResults') &&
        !localStorage.getItem('shuffledOptions') &&
        !localStorage.getItem('randomPlantIndex') &&
        !localStorage.getItem('randomCommonNameIndex') &&
        !localStorage.getItem('correctAnswer')
    ) {
        startQuiz();
    } else {
        displayQuestion();
    }
};

nextQuestionButton.onclick = () => {
    // Clear answerResults and other values from local storage
    localStorage.removeItem('shuffledOptions');
    localStorage.removeItem('randomPlantIndex');
    localStorage.removeItem('randomCommonNameIndex');
    localStorage.removeItem('correctAnswer');

    // Increment the questionCount
    questionCount++;

    // Save the updated questionCount to local storage
    localStorage.setItem('questionCount', questionCount.toString());
    localStorage.setItem('state',state);

    nextQuestionButton.style.display = "none";
    if (questionCount >= 10) {
        saveUserStatistics();
    }

    displayQuestion();
};
seeResultsButton.onclick = () => {
    // Clear answerResults and other values from local storage
    localStorage.removeItem('shuffledOptions');
    localStorage.removeItem('randomPlantIndex');
    localStorage.removeItem('randomCommonNameIndex');
    localStorage.removeItem('correctAnswer');

    // Increment the questionCount
    questionCount++;

    // Save the updated questionCount to local storage
    localStorage.setItem('questionCount', questionCount.toString());
    localStorage.setItem('state',state);

    seeResultsButton.style.display = "none";
    if (questionCount >= 10) {
        saveUserStatistics();
    }

    displayQuestion();
};
commonNameButton.onclick = () => {
    startQuiz("Common Name");
};
scientificNameButton.onclick = () => {
    startQuiz("Scientific Name");
};
shareButton.onclick = () => {
    const state = getStateFromUrl();
    const asterisk = quizType === "Scientific Name" ? "*" : "";
    // Insert a newline character after the 5th character
    let answerTrackingEmoji = answerTracking.slice(0, 5) + '\n' + answerTracking.slice(5);
    answerTrackingEmoji = answerTrackingEmoji.replaceAll('C','🌱');
    answerTrackingEmoji = answerTrackingEmoji.replaceAll('I','🍂');
    
    const resultText = `Nativle ${state} ${correctCount}/10${asterisk}\nbit.ly/nativle\n${answerTrackingEmoji}`;
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
restartButton.onclick = () => {
    clearGameState();
    window.location.href = 'index.html';
};
retakeButton.onclick = () => {
    clearGameState();
    
    // Hide the results page and show the quiz page
    const resultsElement = document.getElementById("results");
    resultsElement.style.display = "none";
    quizElement.style.display = "block";

    // Start the quiz again with the same settings
    displayQuestion();
};

// FUNCTION
// building blocks
function getQuizData() {
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
function getStateFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("state") || "TX"; // Default to "TX" if no state parameter is provided
}

//statistics
function displayStats() {
    const totalGames = parseInt(localStorage.getItem('gamesCompleted') || 0);
    const totalCorrect = parseInt(localStorage.getItem('totalCorrectAnswers') || 0);
    const totalQuestions = parseInt(localStorage.getItem('totalQuestionsAttempted') || 0);

    const percentageCorrect = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100).toFixed(2) : 0;

    const plantStats = JSON.parse(localStorage.getItem('plantStats')) || {};

    const sortedPlants = Object.entries(plantStats).sort((a, b) => {
        const percA = a[1].total > 0 ? a[1].correct / a[1].total : 0;
        const percB = b[1].total > 0 ? b[1].correct / b[1].total : 0;
        return percB - percA || a[0].localeCompare(b[0]);
    });

    const top10 = sortedPlants.slice(0, 10);
    const bottom10 = sortedPlants.slice(-10).reverse();

    const consecutiveDays = parseInt(localStorage.getItem('consecutiveDays') || 0);

    let allScores = JSON.parse(localStorage.getItem('allScores')) || {};
    const currentStateScores = allScores[state] || [];
    let allStateScores = allScores["ALL"] || [];

    const histogramForCurrentState = generateHistogram(currentStateScores);
    const histogramForAllStates = generateHistogram(allStateScores);
    let statsHTML = `
        <div class="top-stat-container">
            <div class="stat-item">
                <p class="stat-category">Played</p>
                <p class="stat-value">${totalGames}</p>
            </div>
            <div class="stat-item">
                <p class="stat-category">Streak</p>
                <p class="stat-value">${consecutiveDays}</p>
            </div>
            <div class="stat-item">
                <p class="stat-category">% Correct</p>
                <p class="stat-value">${Math.round(percentageCorrect)}%</p>
            </div>
        </div>

        <div class="stat-container"><h2>Stats for ${state}</h2>
        ${histogramForCurrentState}</div>

        <div class="stat-container"><h2>Stats for All Games</h2>
        ${histogramForAllStates}</div>
    `;

    document.getElementById('playerStats').innerHTML = statsHTML;
}
function generateHistogram(scores) {
    const scoreCounts = {};
    
    // Initialize scoreCounts for scores from 1 to 10
    for (let i = 1; i <= 10; i++) {
        scoreCounts[i] = 0;
    }
    
    // Populate scoreCounts based on given scores
    for (let score of scores) {
        if (scoreCounts[score] !== undefined) {
            scoreCounts[score]++;
        }
    }

    // Calculate total number of games played
    let totalGamesPlayed = scores.length;

    let histogramText = '';
    for (let score in scoreCounts) {
        let percentageWidth = (scoreCounts[score] / totalGamesPlayed) * 100;

        // Ensure minimum width for the bar, but only if there's a non-zero score count
        if (scoreCounts[score] > 0 && percentageWidth < 10) {
            percentageWidth = 10;
        }

        let barClass = scoreCounts[score] === 0 ? "zero" : "";  // Add the gray class if score count is 0

        histogramText += `
            <div class="histogram-bar-container">
                <span class="scoreValueHist">${score}</span>
                <div class="histogram-bar ${barClass}" style="width: ${percentageWidth}%">
                    <div class="scoreCountHist">${scoreCounts[score]}</div>
                </div>
            </div>
        `;
    }


    return histogramText;
}
function gameCompleted() {
    let allScores = JSON.parse(localStorage.getItem('allScores')) || {};

    // Initialize arrays if they don't exist
    if (!allScores[state]) allScores[state] = [];
    if (!allScores["ALL"]) allScores["ALL"] = [];
    console.log("Current State:", state);
    localStorage.setItem('state',state);
    allScores[state].push(correctCount);
    allScores["ALL"].push(correctCount);
    console.log("allScores", JSON.stringify(allScores));
    localStorage.setItem('allScores', JSON.stringify(allScores));

    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem('lastPlayed');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastPlayed === today) {
        // If the user has already played today, do nothing
        return;
    } else if (lastPlayed === yesterday.toDateString()) {
        // If the user played yesterday, increment the consecutive days count
        const consecutiveDays = parseInt(localStorage.getItem('consecutiveDays') || 0);
        localStorage.setItem('consecutiveDays', consecutiveDays + 1);
    } else {
        // Otherwise, reset the consecutive days count
        localStorage.setItem('consecutiveDays', 1);
    }

    // Set the last played date to today
    localStorage.setItem('lastPlayed', today);
}
function saveUserStatistics() {
  gameCompleted()
  const userStats = {
    totalQuestionsAttempted: parseInt(questionCount) + (parseInt(localStorage.getItem('totalQuestionsAttempted') || 0, 10)),
    totalCorrectAnswers: parseInt(correctCount) + (parseInt(localStorage.getItem('totalCorrectAnswers') || 0, 10)),
    gamesCompleted: 1 + (parseInt(localStorage.getItem('gamesCompleted') || 0, 10))
  };

  // Load the current plant stats or initialize if not present
  const plantStats = JSON.parse(localStorage.getItem('plantStats')) || {};

  // Update the plant stats
  answerResults.forEach(answerResult => {
    const scientificName = answerResult.scientificName;
    if (!plantStats[scientificName]) {
      plantStats[scientificName] = { total: 0, correct: 0 };
    }
    plantStats[scientificName].total += 1;
    if (answerResult.correct) {
      plantStats[scientificName].correct += 1;
    }
  });

  // Save the updated stats
  for (let key in userStats) {
    localStorage.setItem(key, userStats[key].toString());  // Convert number to string when saving to localStorage
  }

  // Save the plant stats
  localStorage.setItem('plantStats', JSON.stringify(plantStats));
}
function loadUserStatistics() {
    // Reset in-memory variables
    questionCount = 0;
    correctCount = 0;
    answerResults = [];

    // Clear corresponding values from local storage
    localStorage.removeItem('questionCount');
    localStorage.removeItem('correctCount');
    localStorage.removeItem('answerResults');
    localStorage.removeItem('shuffledOptions');
    localStorage.removeItem('randomPlantIndex');
    localStorage.removeItem('randomCommonNameIndex');
    localStorage.removeItem('correctAnswer');
}

//game functionality
function displayResult() {
    const quizElement = document.getElementById("quiz");
    quizElement.style.display = "none";

    const resultsElement = document.getElementById("results");
    resultsElement.style.display = "block";

    const trackingElement = document.getElementById("tracking");
    trackingElement.innerHTML = "";

    const answerResults = localStorage.getItem('answerResults') ? JSON.parse(localStorage.getItem('answerResults')) : [];

answerResults.forEach((answerResult) => {
    const row = document.createElement("div");
    row.className = "result-row";
    row.style.backgroundColor = answerResult.correct ? "var(--light-light-green)" : "var(--light-red)";

    const collapsibleContent = document.createElement("div");
    collapsibleContent.className = "collapsible-content";

    const nameDiv = document.createElement("div");
    nameDiv.className = "nameDiv";
    
    const nameP = document.createElement("p");
    nameP.textContent = answerResult.commonName;
    nameP.className = "nameP";
    nameDiv.appendChild(nameP);
    
    const actualNameDiv = document.createElement("div");
    actualNameDiv.className = "actualNameDiv";
    
    const actualNameP = document.createElement("p");
    actualNameP.className = "actualNameP";
    actualNameP.textContent = answerResult.scientificName;
    actualNameDiv.appendChild(actualNameP);
            
    const expandDiv = document.createElement("div");
    expandDiv.className = "expandDiv";
    
    const expandIcon = document.createElement("p");
    expandIcon.className = "expand-icon";
    expandIcon.textContent = "+";
    expandDiv.appendChild(expandIcon);
    
    const namesContainer = document.createElement("div");
    namesContainer.className = "namesContainer";
    namesContainer.appendChild(nameDiv);
    namesContainer.appendChild(actualNameDiv);
    namesContainer.appendChild(expandDiv);
    collapsibleContent.appendChild(namesContainer); 
    
    // Create a new image container for each result
    const imageContainer = document.createElement("div");
    imageContainer.className = "imageContainer";
    
    // Add the images to this container
    answerResult.images.forEach((imageUrl) => {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = "Plant image";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.marginRight = "5px";

        imageContainer.appendChild(img);
    });

        
        //const image = document.createElement("img");
//        image.className = "resultsImage";
//        image.src = `http://bonap.net/MapGallery/County/${answerResult.scientificName}.png`;
//        image.alt = `${answerResult.scientificName} distribution map`;
        collapsibleContent.appendChild(imageContainer);

        row.appendChild(collapsibleContent);
        trackingElement.appendChild(row);

        // After appending to DOM, we can get the actual height
        const namesContainerHeight = namesContainer.getBoundingClientRect().height;
        
        // Set the initial maxHeight to the computed height of namesContainer
        collapsibleContent.style.maxHeight = `${namesContainerHeight}px`;

        row.addEventListener("click", () => {
            if (collapsibleContent.style.maxHeight === `${namesContainerHeight}px`) {
                collapsibleContent.style.maxHeight = "600px";
                expandIcon.textContent = "-"; // Change to '-' when expanded
            } else {
                collapsibleContent.style.maxHeight = `${namesContainerHeight}px`;
                expandIcon.textContent = "+"; // Change back to '+' when collapsed
            }
        });
        
        trackingElement.appendChild(row);
    });

    const userStatsElement = document.getElementById("user-stats");
}
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
function displayQuestion() {
    // Check if questionCount is available in local storage
    questionCount = localStorage.getItem('questionCount') ? parseInt(localStorage.getItem('questionCount')) : 0;
    correctCount = localStorage.getItem('correctCount') ? parseInt(localStorage.getItem('correctCount')) : 0;
    let stateFromLocalStorage = localStorage.getItem('state');
    let stateFromURL = getStateFromUrl();
    
    if (questionCount > 0 && stateFromURL !== stateFromLocalStorage) {
        clearGameState();
    }
    
    if (localStorage.getItem('answerArray')) {
        // Retrieve and parse from local storage if it exists
        answerArray = JSON.parse(localStorage.getItem('answerArray'));
        } else {
            // Initialize as an empty array if not found in local storage
            answerArray = [];
    }
    if (localStorage.getItem('answerTracking')) {
        // Retrieve from local storage if it exists
        answerTracking = localStorage.getItem('answerTracking');
    } else {
        // Initialize as an empty string if not found in local storage
        answerTracking = "";
    }
    
    // Check for previous answers
    answerResults = localStorage.getItem('answerResults') ? JSON.parse(localStorage.getItem('answerResults')) : [];
    

    // Save the updated answerTracking back to local storage
    localStorage.setItem('answerTracking', answerTracking);
    
    if (localStorage.getItem('questionCount')) {
        // Retrieve from local storage if it exists
        questionCount = parseInt(localStorage.getItem('questionCount'));
    } else {
        // Set a default value if not found in local storage
        questionCount = 0;
    }
    //answerArray
    updateProgressBar(questionCount, answerArray,0);
    if (questionCount >= 10) {
        displayResult();
        return;
    }

    const plants = getQuizData();
    // set the answer plant
    let randomPlantIndex;
    if (localStorage.getItem('randomPlantIndex')) {
        // Retrieve from local storage if it exists
        randomPlantIndex = parseInt(localStorage.getItem('randomPlantIndex'));
    } else {
        // Generate a new value if it doesn't exist in local storage
        randomPlantIndex = getRandomInt(plants.length);
    }
    localStorage.setItem('randomPlantIndex', randomPlantIndex.toString());
    console.log("randomPlantIndex", randomPlantIndex);
    randomPlant = plants[randomPlantIndex];
    
    // NOTE: IMPROVE THE WAY TO MANAGE DUPLICATES. MAINTAIN A LIST OF INDEXES THAT HAVE BEEN USED AND RERUN RANDOM GENERATOR IF THAT INDEX HAS ALREADY BEEN USED. 
    
    //set the common name that will be used
    let randomCommonNameIndex;
    if (localStorage.getItem('randomCommonNameIndex')) {
        // Retrieve from local storage if it exists
        randomCommonNameIndex = parseInt(localStorage.getItem('randomCommonNameIndex'));
    } else {
        // Generate a new value if it doesn't exist in local storage
        randomCommonNameIndex = getRandomInt(randomPlant["Common Name"].length);
        localStorage.setItem('randomCommonNameIndex', randomCommonNameIndex.toString());
    }
    console.log("randomCommonNameIndex", randomCommonNameIndex);

    //correctAnswer = quizType === "Common Name" ? randomPlant["Common Name"][randomCommonNameIndex] : randomPlant["Scientific Name"];
    correctAnswer = randomPlant["Common Name"][randomCommonNameIndex];
    localStorage.setItem('correctAnswer',correctAnswer);
    console.log("correctAnswer",correctAnswer);
    
    const imageElement = document.getElementById("image");
    displayImages(randomPlant.Images);

    let options;
    let shuffledOptions;
    if (localStorage.getItem('shuffledOptions')) {
        // Retrieve and parse from local storage if it exists
        shuffledOptions = JSON.parse(localStorage.getItem('shuffledOptions'));
    } else {
        // Generate options if it doesn't exist in local storage
        options = [correctAnswer];
        while (options.length < 4) {
            const optionIndex = getRandomInt(plants.length);
            const randomCommonNameIndex = getRandomInt(plants[optionIndex]["Common Name"].length);
            //const option = quizType === "Common Name" ? plants[optionIndex]["Common Name"][randomCommonNameIndex] : plants[optionIndex]["Scientific Name"];
            const option = plants[optionIndex]["Common Name"][randomCommonNameIndex];
            if (!options.includes(option)) {
                options.push(option);
            }
        }
        // Save the generated options to local storage
        shuffledOptions = shuffle(options);
        localStorage.setItem('shuffledOptions', JSON.stringify(shuffledOptions));
    }
    const optionsElement = document.getElementById("options");
    

    localStorage.setItem('correctAnswer',correctAnswer);
    optionsElement.innerHTML = "";
    shuffledOptions.forEach((option) => {
        const li = document.createElement("li");
        li.textContent = option;
        li.className = "option";
        li.onclick = () => {
            // Retrieve answerResults from local storage
            if (localStorage.getItem('answerResults')) {
                answerResults = JSON.parse(localStorage.getItem('answerResults'));
            } else {
                answerResults = [];
            }

            // Check if this question has already been answered
            if (answerResults[questionCount] && answerResults[questionCount].isAnswered) {
                // If so, don't allow the user to answer again
                return;
            }
            
            if (localStorage.getItem('answerResults')) {
                // If it does, parse it from the stored JSON string into a JavaScript array
                answerResults = JSON.parse(localStorage.getItem('answerResults'));
            } else {
                // If not, initialize 'answerResults' as an empty array
                answerResults = [];
            }
            
            const answerResult = {
                commonName: randomPlant["Common Name"][randomCommonNameIndex], // Save the common name here
                scientificName: randomPlant["Scientific Name"], // Save the scientific name here
                usedName: option, // Save the used common name or scientific name here
                correct: option === correctAnswer,
                isAnswered: true,
                images: randomPlant.Images
            };
            
            answerResults.push(answerResult);
            // Save answerResults to local storage
            localStorage.setItem('answerResults', JSON.stringify(answerResults));
            
            if (option === correctAnswer) {
                correctCount++;
                li.style.backgroundColor = "var(--light-green)";
                answerTracking += "C";
                answerArray[questionCount] = "correct";
            } else {
                li.style.backgroundColor = "var(--red)";
                answerTracking += "I";

                const correctLi = Array.from(optionsElement.querySelectorAll("li")).find(item => item.textContent === correctAnswer);
                if (correctLi) {
                    correctLi.style.backgroundColor = "var(--light-light-green)";
                }
                answerArray[questionCount] = "incorrect";
            }
            localStorage.setItem('correctCount', correctCount);
            localStorage.setItem('answerTracking', answerTracking);
            localStorage.setItem('answerArray', answerArray);
            li.style.color = "white";

            optionsElement.querySelectorAll("li").forEach((item) => {
            item.onclick = null;
            item.classList.add("disabled");
            });

            if (questionCount === 9) {
                // If questionCount is 10, show the 'See Results' button and hide the 'Next Question' button
                seeResultsButton.style.display = "block";
                seeResultsButton.classList.remove("disabled");
                nextQuestionButton.style.display = "none";
            } else {
                // Otherwise, show the 'Next Question' button and hide the 'See Results' button
                nextQuestionButton.style.display = "block";
                nextQuestionButton.classList.remove("disabled");
                seeResultsButton.style.display = "none";
            }
            updateProgressBar(questionCount+1, answerArray,1);
            console.log('answerTracking:', answerTracking);
            localStorage.setItem('answerTracking',answerTracking);
            console.log('Question Count:', questionCount+1);
            localStorage.setItem('questionCount',questionCount);
            console.log('Answer Array:', answerArray);
            localStorage.setItem('answerArray', JSON.stringify(answerArray));
            console.log('answerResults:', answerResults);
            localStorage.setItem('answerResults',
            JSON.stringify(answerResults));

        };

        optionsElement.appendChild(li);
    });
    
    if (answerResults[questionCount] && answerResults[questionCount].isAnswered) {
            // The user has already answered this question

            const option = answerResults[questionCount].usedName;
            const correctAnswerStored = answerResults[questionCount].commonName;
            const isCorrect = answerResults[questionCount].correct;

            // Find the corresponding <li> element for the user's answer
            const userAnswerElement = Array.from(optionsElement.querySelectorAll("li")).find(item => item.textContent === option);

            if (userAnswerElement) {
                // Set the background color based on whether the answer was correct or not
                userAnswerElement.style.backgroundColor = isCorrect ? "var(--light-green)" : "var(--red)";
                userAnswerElement.style.color = "white";

                // Disable all answer options
                optionsElement.querySelectorAll("li").forEach((item) => {
                    item.onclick = null;
                    item.classList.add("disabled");
                });

                // Highlight the correct answer if the user was wrong
                if (!isCorrect) {
                    const correctLi = Array.from(optionsElement.querySelectorAll("li")).find(item => item.textContent === correctAnswerStored);
                    if (correctLi) {
                        correctLi.style.backgroundColor = "var(--light-light-green)";
                    }
                }

                if (questionCount === 9) {
                    // If questionCount is 10, show the 'See Results' button and hide the 'Next Question' button
                    seeResultsButton.style.display = "block";
                    seeResultsButton.classList.remove("disabled");
                    nextQuestionButton.style.display = "none";
                } else {
                    // Otherwise, show the 'Next Question' button and hide the 'See Results' button
                    nextQuestionButton.style.display = "block";
                    nextQuestionButton.classList.remove("disabled");
                    seeResultsButton.style.display = "none";
                }
            }
        }
}
function startQuiz(type) {
    console.log('StartQuiz');
    quizType = type;
    //loadUserStatistics();
    landingPage.style.display = "none";
    quizElement.style.display = "block";
    displayQuestion();
}
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}
function clearGameState() {
    // Reset the quiz variables
    questionCount = 0;
    correctCount = 0;
    answerTracking = "";
    answerResults = [];
    answerArray = [];
    correctAnswer = "";
    localStorage.removeItem('randomPlantIndex');
    localStorage.removeItem('randomCommonNameIndex');
    localStorage.removeItem('correctAnswer');
    localStorage.removeItem('questionCount');
    localStorage.removeItem('correctCount');
    localStorage.removeItem('answerTracking');
    localStorage.removeItem('answerResults');
    localStorage.removeItem('answerArray');
}

//appearance
function updateTitleWithState() {
  const state = getStateFromUrl();
  const titleElement = document.getElementById("title");
  titleElement.textContent = `Nativle ${state}`;
}

// Get the menu and the menu button
var menu = document.getElementById('menu');
var btn = document.querySelector('.menu-btn');

// Add an event listener to the menu button
btn.addEventListener('click', function(event) {
    // Toggle the 'open' class on the menu
    menu.classList.toggle('open');

    // Prevents the event from bubbling up to the document
    event.stopPropagation();
});

// New event listener for the document
//document.addEventListener("DOMContentLoaded", function() {
//    loadGameState();
//});
document.addEventListener('click', function(event) {
    if (!menu.contains(event.target)) {
        // If the clicked target is not within the menu, remove 'open' class from the menu
        menu.classList.remove('open');
    }
});
document.getElementById('statsButton').onclick = function() {
        displayStats();
        document.getElementById('statsModal').style.display = 'block';
    }
document.getElementById('closeModal').onclick = function() {
        document.getElementById('statsModal').style.display = 'none';
    }
document.getElementById('statsModal').onclick = function(event) {
    // If the clicked element is the statsModal itself (the overlay), then hide the modal
    if (event.target === this) {
        this.style.display = 'none';
    }
};
//document.getElementById('modalContent').onclick = function(event) {
//    // Prevent clicks inside the modal content from propagating to the overlay
//    event.stopPropagation();
//};

function updateProgressBar(currentQuestionIndex, questionStatuses, currentQuestion) {
    document.querySelectorAll(".progress-section").forEach((section, index) => {
        section.classList.remove("correct", "incorrect", "current");
        
        if (index < currentQuestionIndex) {
            section.classList.add(questionStatuses[index]);
        } else if (index === currentQuestionIndex) {
            if (currentQuestion === 0) {
                section.classList.add("current");
            } else {
                section.classList.add(questionStatuses[index]);
            }
        }
        // Future questions remain gray by default, so no need to explicitly handle them
    });
}


// Assuming there's a function or event that moves to the next question, 
// we'll need to call updateProgressBar() within that function/event.
// For now, I'll add the function. Integration will depend on the quiz logic.