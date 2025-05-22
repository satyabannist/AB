let questions = [];

fetch('questions.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    questions = data;
    displayQuestions();
  })
  .catch(error => {
    console.error('Failed to load questions:', error);
    document.getElementById("questionList").textContent = "Could not load questions.";
  });

function displayQuestions() {
  const questionList = document.getElementById("questionList");
  questionList.innerHTML = "";
  questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = \`\${i + 1}. \${q.content}\`;
    questionList.appendChild(div);
  });
  MathJax.typesetPromise();
}
