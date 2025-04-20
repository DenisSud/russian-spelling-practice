import "./style.css";

// Add global declaration for the appLoaded flag
declare global {
    interface Window {
        appLoaded: boolean;
    }
}

interface WordData {
    word: string;
    missingVowelIndex: number;
    correctWord: string;
    displayWord: string;
}

// Set flag to indicate the script has successfully loaded
window.appLoaded = true;

document.addEventListener("DOMContentLoaded", () => {
    const wordDisplay = document.getElementById(
        "word-display",
    ) as HTMLDivElement;
    const feedback = document.getElementById("feedback") as HTMLDivElement;
    const nextButton = document.getElementById(
        "next-button",
    ) as HTMLButtonElement;
    const scoreDisplay = document.getElementById("score") as HTMLSpanElement;
    const attemptsDisplay = document.getElementById(
        "attempts",
    ) as HTMLSpanElement;
    const answerInput = document.getElementById(
        "answer-input",
    ) as HTMLInputElement;
    const submitButton = document.getElementById(
        "submit-button",
    ) as HTMLButtonElement;

    const VOWELS: string = "аеёиоуыэюя";
    let wordsData: WordData[] = [];
    let currentWordIndex: number = -1;
    let score: number = 0;
    let attempts: number = 0;
    let isAnswered: boolean = false;

    async function loadWords(): Promise<void> {
        try {
            // Use the base URL from Vite environment
            const basePath = (import.meta as any).env.BASE_URL || '/';
            const response: Response = await fetch(`${basePath}spelling.txt`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text: string = await response.text();
            parseAndStoreWords(text);
            if (wordsData.length > 0) {
                shuffleArray(wordsData);
                displayNextWord();
            } else {
                wordDisplay.textContent = "No words found in file.";
                nextButton.disabled = true;
                submitButton.disabled = true;
            }
        } catch (error) {
            console.error("Error loading or parsing words file:", error);
            wordDisplay.textContent = "Error loading words.";
            feedback.textContent =
                "Could not load spelling.txt. Please check the file and console.";
            feedback.className = "feedback incorrect";
            nextButton.disabled = true;
            submitButton.disabled = true;
        }
    }

    function parseAndStoreWords(text: string): void {
        // First split by lines, then process each line
        const lines = text
            .trim()
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        // Process each line, handling comma-separated forms
        const processedWords: WordData[] = [];

        for (const line of lines) {
            // Split by comma to handle multiple forms
            const wordForms = line.split(",").map((form) => form.trim());

            for (const word of wordForms) {
                // Skip empty forms
                if (word.length === 0) continue;

                const wordLower: string = word.toLowerCase();

                // Find vowels in the word
                const vowelIndices: number[] = [];
                for (let i = 0; i < wordLower.length; i++) {
                    if (VOWELS.includes(wordLower[i])) {
                        vowelIndices.push(i);
                    }
                }

                // Skip words with no vowels
                if (vowelIndices.length === 0) continue;

                // Randomly select a vowel to remove
                const randomVowelIndex = Math.floor(Math.random() * vowelIndices.length);
                const missingVowelIndex = vowelIndices[randomVowelIndex];

                // Create a display word with the missing vowel
                const displayWordChars = wordLower.split('');
                displayWordChars[missingVowelIndex] = '_';
                const displayWord = displayWordChars.join('');

                processedWords.push({
                    word: wordLower,
                    missingVowelIndex: missingVowelIndex,
                    correctWord: wordLower,
                    displayWord: displayWord
                });
            }
        }

        wordsData = processedWords;
    }

    function displayNextWord(): void {
        if (wordsData.length === 0) return;

        isAnswered = false;
        currentWordIndex = (currentWordIndex + 1) % wordsData.length;
        const currentWord: WordData = wordsData[currentWordIndex];

        wordDisplay.innerHTML = "";
        wordDisplay.classList.remove("answered");
        feedback.textContent = "";
        feedback.className = "feedback";
        nextButton.disabled = true;

        // Enable the input and submit button
        answerInput.value = "";
        answerInput.disabled = false;
        submitButton.disabled = false;
        answerInput.focus();

        // Display the word with the missing vowel
        currentWord.displayWord.split("").forEach((char: string) => {
            const span: HTMLSpanElement = document.createElement("span");
            span.textContent = char;
            if (char === '_') {
                span.classList.add("missing-vowel");
            }
            wordDisplay.appendChild(span);
        });
    }

    function handleAnswer(): void {
        if (isAnswered) return;

        isAnswered = true;
        wordDisplay.classList.add("answered");

        const userAnswer: string = answerInput.value.toLowerCase();
        const currentWord: WordData = wordsData[currentWordIndex];
        const correctVowel: string = currentWord.word[currentWord.missingVowelIndex];

        // Disable input after answering
        answerInput.disabled = true;
        submitButton.disabled = true;

        attempts++;
        attemptsDisplay.textContent = attempts.toString();

        // Find the missing vowel span
        const missingVowelSpan = wordDisplay.querySelector(".missing-vowel") as HTMLSpanElement;

        if (userAnswer === correctVowel) {
            score++;
            scoreDisplay.textContent = score.toString();
            feedback.textContent = "Correct!";
            feedback.className = "feedback correct";

            if (missingVowelSpan) {
                missingVowelSpan.textContent = correctVowel;
                missingVowelSpan.classList.add("correct-answer");
            }
        } else {
            feedback.textContent = `Incorrect. The correct word is: ${currentWord.word}`;
            feedback.className = "feedback incorrect";

            if (missingVowelSpan) {
                missingVowelSpan.textContent = correctVowel;
                missingVowelSpan.classList.add("correct-answer");

                // Show what the user guessed
                if (userAnswer.length > 0) {
                    feedback.textContent += ` (you entered: ${userAnswer})`;
                }
            }
        }

        nextButton.disabled = false;
    }

    function shuffleArray<T>(array: T[]): void {
        for (let i: number = array.length - 1; i > 0; i--) {
            const j: number = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    nextButton.addEventListener("click", displayNextWord);
    submitButton.addEventListener("click", handleAnswer);

    // We'll use a flag to prevent immediate next word after answering
    let justAnswered = false;

    // Handle Enter key in the input field
    answerInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter" && !isAnswered) {
            // If not answered yet, submit the answer
            handleAnswer();
            // Set flag to prevent immediate next word
            justAnswered = true;
            // Reset the flag after a short delay
            setTimeout(() => {
                justAnswered = false;
            }, 300);
        }
    });

    // Add a document-wide event listener for Enter key to handle next word
    document.addEventListener("keypress", (event) => {
        if (event.key === "Enter" && isAnswered && !justAnswered) {
            // If already answered and not immediately after answering, go to next word
            displayNextWord();
        }
    });

    nextButton.disabled = true;
    submitButton.disabled = true;
    loadWords();
});
