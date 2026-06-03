// Joke API URL
const JOKE_API_URL = 'https://v2.jokeapi.dev/joke/';

// DOM Elements
const jokeText = document.getElementById('joke-text');
const jokeType = document.getElementById('joke-type');
const getJokeBtn = document.getElementById('get-joke-btn');
const getProgrammingJokeBtn = document.getElementById('get-programming-joke-btn');
const clearBtn = document.getElementById('clear-btn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// Event Listeners
getJokeBtn.addEventListener('click', () => fetchJoke('Any'));
getProgrammingJokeBtn.addEventListener('click', () => fetchJoke('Programming'));
clearBtn.addEventListener('click', clearJoke);

// Fetch Joke from API
async function fetchJoke(category) {
    try {
        // Show loading state
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        jokeText.textContent = '';
        jokeType.textContent = '';

        // Fetch joke from API
        const response = await fetch(`${JOKE_API_URL}${category}?type=single`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide loading state
        loadingDiv.style.display = 'none';
        
        // Check if joke was found
        if (data.error) {
            throw new Error('Joke not found');
        }
        
        // Display joke
        jokeText.textContent = data.joke;
        jokeType.textContent = `Category: ${data.category} | Type: ${data.type}`;
        
    } catch (error) {
        console.error('Error fetching joke:', error);
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        jokeText.textContent = '';
        jokeType.textContent = '';
    }
}

// Clear Joke
function clearJoke() {
    jokeText.textContent = 'Click "Get Joke" to start laughing!';
    jokeType.textContent = '';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
}

// Load a joke on page load
window.addEventListener('load', () => {
    fetchJoke('Any');
});