let questions = [];

fetch('questions.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    questions = data;
    displayQuestions();
  })
  .catch(error => {
    console.error('Failed to load questions:', error);
    document.getElementById("questionList").textContent = "Error loading questions.";
  });

function displayQuestions() {
  const questionList = document.getElementById("questionList");
  questionList.innerHTML = "";

  if (questions.length === 0) {
    questionList.textContent = "No questions available.";
    return;
  }

  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `<strong>${i + 1}. </strong>${q.content}`;
    questionList.appendChild(div);
  });

  if (typeof MathJax !== "undefined") {
    MathJax.typesetPromise();
  }
}
