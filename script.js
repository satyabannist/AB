let currentPage = 1;
const itemsPerPage = 10;
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

const classFilter = document.getElementById("classFilter");
const subjectFilter = document.getElementById("subjectFilter");
const topicFilter = document.getElementById("topicFilter");
const difficultyFilter = document.getElementById("difficultyFilter");
const typeFilter = document.getElementById("typeFilter");
const questionList = document.getElementById("questionList");
const previewBtn = document.getElementById("previewBtn");
const previewModal = document.getElementById("previewModal");
const closeModal = previewModal.querySelector(".close");
const paperPreview = document.getElementById("paperPreview");
const printBtn = document.getElementById("printBtn");
const addToPaperBtn = document.getElementById("addToPaperBtn");
const paperQuestionList = document.getElementById("paperQuestionList");

const manualQuestionForm = document.getElementById("manualQuestionForm");
const questionContentInput = document.getElementById("questionContent");
const manualClass = document.getElementById("manualClass");
const manualSubject = document.getElementById("manualSubject");
const manualTopic = document.getElementById("manualTopic");
const manualDifficulty = document.getElementById("manualDifficulty");
const manualType = document.getElementById("manualType");
const manualSolution = document.getElementById("manualSolution");
const questionPreview = document.getElementById("questionPreview");

const selectedPaperQuestions = [];
let nextManualQuestionId = 10000;

function getTopicsForSubject(subject) {
  if (subject === "all") return [];
  const topics = questions.filter(q => q.subject === subject).map(q => q.topic);
  return [...new Set(topics)].sort();
}

function updateTopicFilter() {
  const subject = subjectFilter.value;
  const topics = getTopicsForSubject(subject);
  topicFilter.innerHTML = '<option value="all">All Topics</option>';
  topics.forEach(topic => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicFilter.appendChild(option);
  });
}

function filterQuestions() {
  const selectedClass = classFilter.value;
  const subject = subjectFilter.value;
  const topic = topicFilter.value;
  const difficulty = difficultyFilter.value;
  const type = typeFilter.value;
  const searchQuery = document.getElementById("questionSearch").value.toLowerCase();

  return questions.filter(q =>
    (selectedClass === "all" || q.class === selectedClass) &&
    (subject === "all" || q.subject === subject) &&
    (topic === "all" || q.topic === topic) &&
    (difficulty === "all" || q.difficulty === difficulty) &&
    (type === "all" || q.type === type) &&
    (q.content.toLowerCase().includes(searchQuery) || q.solution?.toLowerCase().includes(searchQuery))
  );
}

function displayQuestions() {
  const filtered = filterQuestions();
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  questionList.innerHTML = "";
  if (paginated.length === 0) {
    questionList.textContent = "No questions found.";
    return;
  }

  paginated.forEach(q => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${q.id}" />
        <span>${q.format === "image" ? `<img src="${q.content}" />` : q.content}</span>
      </label>
    `;
    questionList.appendChild(div);
  });

  renderPaginationControls(filtered.length);
  MathJax.typesetPromise();
}


function getSelectedQuestions() {
  return questions.filter(q =>
    Array.from(questionList.querySelectorAll("input[type=checkbox]:checked"))
      .map(cb => parseInt(cb.value))
      .includes(q.id)
  );
}

function renderPaperQuestions() {
  paperQuestionList.innerHTML = "";
  if (selectedPaperQuestions.length === 0) {
    paperQuestionList.textContent = "No questions added yet.";
    return;
  }

  selectedPaperQuestions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
      <div style="display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="flex-grow: 1;">
          <span>
  ${i + 1}. ${q.format === "image" ? `<img src="${q.content}" alt="Question Image" style="max-width: 100%; max-height: 150px;" />` : q.content}
</span>
        </div>
        <div>
          <input type="number" class="mark-input" data-id="${q.id}" value="${q.marks || 0}" min="0" style="width: 60px;" /> marks
          <button class="remove-btn" data-id="${q.id}" aria-label="Remove question ${i + 1} from paper">✕</button>
        </div>
      </div>
      <div class="solution" style="display:none; margin-left:20px; color:#444; margin-top:5px;">
        <em>
  ${
    q.solutionFormat === "image"
      ? `<img src="${q.solution}" alt="Solution Image" style="max-width:100%; margin-top:10px;" />`
      : q.solution || "Solution not available."
  }
</em>
      </div>
      <button class="toggle-solution btn-secondary" style="margin-left:20px; margin-top:5px;">Show Solution</button>
    `;
    paperQuestionList.appendChild(div);
  });

  // NEW: Update marks in selectedPaperQuestions when edited
  paperQuestionList.querySelectorAll('.mark-input').forEach(input => {
    input.addEventListener('input', () => {
      const id = parseInt(input.getAttribute('data-id'));
      const question = selectedPaperQuestions.find(q => q.id === id);
      if (question) {
        question.marks = parseInt(input.value) || 0;
      }
    });
  });

  MathJax.typesetPromise();
}


paperQuestionList.addEventListener("click", (e) => {
  const removeBtn = e.target.closest(".remove-btn");
  if (removeBtn && paperQuestionList.contains(removeBtn)) {
    e.stopPropagation();
    const idToRemove = parseInt(removeBtn.getAttribute("data-id"));
    const index = selectedPaperQuestions.findIndex(q => q.id === idToRemove);
    if (index > -1) {
      selectedPaperQuestions.splice(index, 1);
      renderPaperQuestions();
    }
    return;
  }
  const toggleBtn = e.target.closest(".toggle-solution");
  if (toggleBtn && paperQuestionList.contains(toggleBtn)) {
    e.stopPropagation();
    const solutionDiv = toggleBtn.previousElementSibling;
    if (solutionDiv) {
      const isVisible = solutionDiv.style.display === "block";
      solutionDiv.style.display = isVisible ? "none" : "block";
      toggleBtn.textContent = isVisible ? "Show Solution" : "Hide Solution";
      MathJax.typesetPromise();
    }
  }
});

addToPaperBtn.addEventListener("click", () => {
  const currentlySelected = getSelectedQuestions();
  currentlySelected.forEach(q => {
    if (!selectedPaperQuestions.some(pq => pq.id === q.id)) {
      selectedPaperQuestions.push(q);
    }
  });
  renderPaperQuestions();
  questionList.querySelectorAll("input[type=checkbox]:checked").forEach(cb => cb.checked = false);
});

previewBtn.addEventListener("click", () => {
  paperPreview.innerHTML = "";
  if (selectedPaperQuestions.length === 0) {
    paperPreview.textContent = "No questions selected.";
  } else {
    selectedPaperQuestions.forEach((q, i) => {
      const p = document.createElement("p");
      p.innerHTML = `${i + 1}. ${q.content}`;
      paperPreview.appendChild(p);
    });
  }
  MathJax.typesetPromise().then(() => {
    previewModal.style.display = "block";
    paperPreview.focus();
  });
});

closeModal.addEventListener("click", () => {
  previewModal.style.display = "none";
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && previewModal.style.display === "block") {
    previewModal.style.display = "none";
  }
});

window.addEventListener("click", e => {
  if (e.target === previewModal) previewModal.style.display = "none";
});

printBtn.addEventListener("click", () => {
const selected = selectedPaperQuestions;
const date = new Date().toLocaleDateString();
const examName = document.getElementById("examNameInput").value.trim();
const institute = document.getElementById("instituteNameInput").value.trim();
const subject = document.getElementById("subjectNameInput").value.trim();
const duration = document.getElementById("durationInput").value.trim();

  let content = `
<div style="text-align: center; margin-bottom: 20px;">
  <h1 style="margin: 0;">${institute || ""}</h1>
<h2 style="margin: 5px 0;">${examName || ""}</h2>
<p><strong>Subject:</strong> ${subject || ""} &nbsp;&nbsp; <strong>Date:</strong> ${date}</p>
<p><strong>Time:</strong> ${duration || ""} &nbsp;&nbsp; <strong>Total Marks:</strong> __MARKS_PLACEHOLDER__</p>

  </div>

    <div style="font-family: 'Georgia', serif; font-size: 16px;">`;
  let totalMarks = 0;
selected.forEach((q, i) => {
  const marks = q.marks || 0;
  totalMarks += marks;
 content += `<p>${i + 1}. ${q.format === "image" ? `<img src="${q.content}" alt="Question Image" style="max-width: 100%; max-height: 150px;" />` : q.content} <strong>(${marks} marks)</strong></p>`;

});
content = content.replace('__MARKS_PLACEHOLDER__', totalMarks);
  content += "</div>";
  const printWindow = window.open("", "_blank");
printWindow.document.write(`
  <html>
    <head>
      <title>Print Question Paper</title>
      <style>
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: 'Georgia', serif;
          line-height: 1.6;
          display: flex;
          flex-direction: column;
        }
        .print-body {
          padding: 40px;
          flex: 1;
        }
        .print-footer {
          text-align: center;
          font-size: 0.9rem;
          color: #555;
          padding: 20px;
          border-top: 1px solid #ccc;
        }
        @media print {
          button { display: none; }
        }
      </style>
      <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    </head>
    <body>
      <div class="print-body">
        ${content}
      </div>
      <footer class="print-footer">
        Question paper generated by: <strong>QPaperGen.com</strong>
      </footer>
    </body>
  </html>`);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 1000);
});

classFilter.addEventListener("change", () => {
  updateTopicFilter();
  displayQuestions();
});
subjectFilter.addEventListener("change", () => {
  updateTopicFilter();
  displayQuestions();
});
topicFilter.addEventListener("change", displayQuestions);
difficultyFilter.addEventListener("change", displayQuestions);
typeFilter.addEventListener("change", displayQuestions);
document.getElementById("questionSearch").addEventListener("input", displayQuestions);


manualQuestionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const manualMarks = document.getElementById("manualMarks");

const newQuestion = {
  id: nextManualQuestionId++,
  class: manualClass.value,
  subject: manualSubject.value.trim(),
  topic: manualTopic.value.trim(),
  difficulty: manualDifficulty.value,
  type: manualType.value,
  content: questionContentInput.value.trim(),
  solution: manualSolution.value.trim() || null,
  marks: parseInt(manualMarks.value, 10),
};
  selectedPaperQuestions.push(newQuestion);
  renderPaperQuestions();
  manualQuestionForm.reset();
  document.getElementById("yourPaper").scrollIntoView({ behavior: "smooth" });
  MathJax.typesetPromise();
});

questionContentInput.addEventListener("input", () => {
  const content = questionContentInput.value.trim();
  if (!content) {
    questionPreview.innerHTML = "";
    return;
  }
  questionPreview.textContent = content;
  MathJax.typesetPromise([questionPreview]);
});
const solutionPreview = document.getElementById("solutionPreview");

manualSolution.addEventListener("input", () => {
  const content = manualSolution.value.trim();
  if (!content) {
    solutionPreview.innerHTML = "";
    return;
  }
  solutionPreview.textContent = content;
  MathJax.typesetPromise([solutionPreview]);
});

updateTopicFilter();
displayQuestions();
renderPaperQuestions();
