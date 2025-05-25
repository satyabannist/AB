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
    populateYearFilter();     // ✅ Move it here
    updateTopicFilter();      // ✅ Optional: also move here for safety
    displayQuestions();
  })



  .catch(error => {
    console.error('Failed to load questions:', error);
    document.getElementById("questionList").textContent = "Error loading questions.";
  });


// DOM Elements - Grouped for clarity
const DOMElements = {
  // Filters
  classFilter: document.getElementById("classFilter"),
  subjectFilter: document.getElementById("subjectFilter"),
  topicFilter: document.getElementById("topicFilter"),
  difficultyFilter: document.getElementById("difficultyFilter"),
  yearFilter: document.getElementById("yearFilter"),
  typeFilter: document.getElementById("typeFilter"),
  questionSearch: document.getElementById("questionSearch"),

  // Question Lists
  questionList: document.getElementById("questionList"),
  paperQuestionList: document.getElementById("paperQuestionList"),

  // Paper Management Buttons
  previewBtn: document.getElementById("previewBtn"),
  addToPaperBtn: document.getElementById("addToPaperBtn"),
  printBtn: document.getElementById("printBtn"),

  // Modals and related
  previewModal: document.getElementById("previewModal"),
  closeModal: document.querySelector("#previewModal .close"), // More specific selector
  paperPreview: document.getElementById("paperPreview"),

  // Manual Question Form
  manualQuestionForm: document.getElementById("manualQuestionForm"),
  questionContentInput: document.getElementById("questionContent"),
  manualClass: document.getElementById("manualClass"),
  manualSubject: document.getElementById("manualSubject"),
  manualTopic: document.getElementById("manualTopic"),
  manualDifficulty: document.getElementById("manualDifficulty"),
  manualType: document.getElementById("manualType"),
  manualSolution: document.getElementById("manualSolution"),
  manualMarks: document.getElementById("manualMarks"),
  questionPreview: document.getElementById("questionPreview"),
  solutionPreview: document.getElementById("solutionPreview"),

  // Paper Header Inputs
  examNameInput: document.getElementById("examNameInput"),
  instituteNameInput: document.getElementById("instituteNameInput"),
  subjectNameInput: document.getElementById("subjectNameInput"),
  durationInput: document.getElementById("durationInput"),
  yourPaperSection: document.getElementById("yourPaper"), // For scrolling
};

// Global State
const selectedPaperQuestions = [];
let nextManualQuestionId = 10000; // Start with a high ID to avoid clashes with existing questions

// Helper Functions
const getUniqueValues = (key) => [...new Set(questions.map(q => q[key]).filter(Boolean))].sort();

// Function to update the topic filter based on the selected subject
function updateTopicFilter() {
  const subject = DOMElements.subjectFilter.value;
  const topics = subject === "all" ? [] : getUniqueValues("topic").filter(topic =>
    questions.some(q => q.subject === subject && q.topic === topic)
  );

  DOMElements.topicFilter.innerHTML = '<option value="all">All Topics</option>';
  topics.forEach(topic => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    DOMElements.topicFilter.appendChild(option);
  });
}

// Function to populate the year filter
function populateYearFilter() {
  const years = getUniqueValues("year");
  DOMElements.yearFilter.innerHTML = `<option value="all">All Years</option>`;
  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    DOMElements.yearFilter.appendChild(option);
  });
}

// Filters questions based on selected criteria and search query
function filterQuestions() {
  const { classFilter, subjectFilter, topicFilter, difficultyFilter, typeFilter, yearFilter, questionSearch } = DOMElements;
  const searchQuery = questionSearch.value.toLowerCase();

  return questions.filter(q =>
    (classFilter.value === "all" || q.class === classFilter.value) &&
    (subjectFilter.value === "all" || q.subject === subjectFilter.value) &&
    (topicFilter.value === "all" || q.topic === topicFilter.value) &&
    (difficultyFilter.value === "all" || q.difficulty === difficultyFilter.value) &&
    (typeFilter.value === "all" || q.type === typeFilter.value) &&
    (yearFilter.value === "all" || q.year === yearFilter.value) &&
    (q.content?.toLowerCase().includes(searchQuery) || q.question?.toLowerCase().includes(searchQuery) || q.solution?.toLowerCase().includes(searchQuery))
  );
}

// Generates HTML for a single question for display
function getQuestionHtml(q, isPreview = false, questionNumber = "") {
  let contentHtml;
  if (q.type === "mcq") {
    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const optionsHtml = q.options?.map((opt, idx) => `<li><strong>${optionLabels[idx] || String.fromCharCode(65 + idx)}.</strong> ${opt}</li>`).join("");
    contentHtml = `
      <strong>Q:</strong> ${q.question || q.content}<br/>
      <ul style="margin: 5px 0; padding-left: 20px;">${optionsHtml}</ul>
    `;
  } else if (q.format === "image") {
    contentHtml = `<img src="${q.content}" alt="Question Image" style="max-width: 100%; max-height: 150px;" />`;
  } else {
    contentHtml = q.content || q.question || "No content provided.";
  }

  const marksHtml = isPreview ? `<strong>Marks:</strong> ${q.marks || 0}` : `<strong>(${q.marks || 0} marks)</strong>`;

  return `${questionNumber}${contentHtml}${isPreview ? '' : ' ' + marksHtml}`;
}

// Displays questions in the main list
function displayQuestions() {
  const filtered = filterQuestions();
  DOMElements.questionList.innerHTML = "";

  if (filtered.length === 0) {
    DOMElements.questionList.textContent = "No questions found for selected filters.";
    document.getElementById("paginationControls").innerHTML = ""; // Clear pagination
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filtered.slice(startIndex, endIndex);

  const fragment = document.createDocumentFragment();
  paginatedQuestions.forEach(q => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${q.id}" ${selectedPaperQuestions.some(sq => sq.id === q.id) ? "checked" : ""} />
        <span>${getQuestionHtml(q)}</span>
      </label>
    `;
    fragment.appendChild(div);
  });

  DOMElements.questionList.appendChild(fragment);
  renderPaginationControls(filtered.length);
  MathJax.typesetPromise([DOMElements.questionList]);
}

function renderPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const container = document.getElementById("paginationControls");
  container.innerHTML = "";

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.addEventListener("click", () => {
      currentPage = i;
      displayQuestions();
    });
    container.appendChild(btn);
  }
}


// Gets questions currently selected in the main list
function getSelectedQuestionsFromList() {
  const checkedIds = Array.from(DOMElements.questionList.querySelectorAll("input[type=checkbox]:checked"))
    .map(cb => parseInt(cb.value));
  return questions.filter(q => checkedIds.includes(q.id));
}

// Renders questions in the "Your Paper" section
function renderPaperQuestions() {
  DOMElements.paperQuestionList.innerHTML = "";
  if (selectedPaperQuestions.length === 0) {
    DOMElements.paperQuestionList.textContent = "No questions added yet.";
    return;
  }

  const fragment = document.createDocumentFragment();
  selectedPaperQuestions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
      <div style="display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="flex-grow: 1;">
          <span>${i + 1}. ${getQuestionHtml(q)}</span>
        </div>
        <div>
          <input type="number" class="mark-input" data-id="${q.id}" value="${q.marks || 0}" min="0" style="width: 60px;" /> marks
          <button class="remove-btn" data-id="${q.id}" aria-label="Remove question ${i + 1} from paper">✕</button>
        </div>
      </div>
      <div class="solution" style="display:none; margin-left:20px; color:#444; margin-top:5px;">
        <em>${q.solutionFormat === "image" ? `<img src="${q.solution}" alt="Solution Image" style="max-width:100%; margin-top:10px;" />` : (q.solution || "Solution not available.")}</em>
      </div>
      <button class="toggle-solution btn-secondary" style="margin-left:20px; margin-top:5px;">Show Solution</button>
    `;
    fragment.appendChild(div);
  });
  DOMElements.paperQuestionList.appendChild(fragment);
  MathJax.typesetPromise([DOMElements.paperQuestionList]);
}

// Event Listeners for "Your Paper" section (delegated)
DOMElements.paperQuestionList.addEventListener("click", (e) => {
  const target = e.target;

  // Handle remove button
  if (target.classList.contains("remove-btn")) {
    const idToRemove = parseInt(target.getAttribute("data-id"));
    const index = selectedPaperQuestions.findIndex(q => q.id === idToRemove);
    if (index > -1) {
      selectedPaperQuestions.splice(index, 1);
      renderPaperQuestions();
      displayQuestions(); // Update checkboxes in main list
    }
  }

  // Handle toggle solution button
  if (target.classList.contains("toggle-solution")) {
    const solutionDiv = target.previousElementSibling;
    if (solutionDiv) {
      const isVisible = solutionDiv.style.display === "block";
      solutionDiv.style.display = isVisible ? "none" : "block";
      target.textContent = isVisible ? "Show Solution" : "Hide Solution";
      MathJax.typesetPromise([solutionDiv]);
    }
  }
});

// Event listener for mark input changes (delegated)
DOMElements.paperQuestionList.addEventListener('input', (e) => {
  const target = e.target;
  if (target.classList.contains('mark-input')) {
    const id = parseInt(target.getAttribute('data-id'));
    const question = selectedPaperQuestions.find(q => q.id === id);
    if (question) {
      question.marks = parseInt(target.value, 10) || 0;
    }
  }
});

// Adds selected questions from main list to paper
DOMElements.addToPaperBtn.addEventListener("click", () => {
  const currentlySelected = getSelectedQuestionsFromList();
  currentlySelected.forEach(q => {
    if (!selectedPaperQuestions.some(pq => pq.id === q.id)) {
      selectedPaperQuestions.push(q);
    }
  });
  renderPaperQuestions();
  displayQuestions(); // Re-render main list to update checked states
});

// Handles preview button click
DOMElements.previewBtn.addEventListener("click", () => {
  DOMElements.paperPreview.innerHTML = "";
  if (selectedPaperQuestions.length === 0) {
    DOMElements.paperPreview.textContent = "No questions selected.";
  } else {
    selectedPaperQuestions.forEach((q, i) => {
      const p = document.createElement("p");
      p.innerHTML = `${i + 1}. ${getQuestionHtml(q, true)}`; // Use getQuestionHtml with isPreview = true
      DOMElements.paperPreview.appendChild(p);
    });
  }

  MathJax.typesetPromise([DOMElements.paperPreview]).then(() => {
    DOMElements.previewModal.style.display = "block";
    DOMElements.paperPreview.focus();
  });
});

// Handles modal close button click
DOMElements.closeModal.addEventListener("click", () => {
  DOMElements.previewModal.style.display = "none";
});

// Handles Escape key to close modal
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && DOMElements.previewModal.style.display === "block") {
    DOMElements.previewModal.style.display = "none";
  }
});

// Handles click outside modal to close
window.addEventListener("click", e => {
  if (e.target === DOMElements.previewModal) DOMElements.previewModal.style.display = "none";
});

// Handles print button click
DOMElements.printBtn.addEventListener("click", () => {
  const { examNameInput, instituteNameInput, subjectNameInput, durationInput } = DOMElements;
  const date = new Date().toLocaleDateString();
  const examName = examNameInput.value.trim();
  const institute = instituteNameInput.value.trim();
  const subject = subjectNameInput.value.trim();
  const duration = durationInput.value.trim();

  let totalMarks = 0;
  const questionsHtml = selectedPaperQuestions.map((q, i) => {
  const marks = q.marks || 0;
  totalMarks += marks;
  return `<p>${i + 1}. ${getQuestionHtml(q, true)} <strong>(${marks} marks)</strong></p>`;
}).join("");

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="margin: 0;">${institute || ""}</h1>
      <h2 style="margin: 5px 0;">${examName || ""}</h2>
      <p><strong>Subject:</strong> ${subject || ""} &nbsp;&nbsp; <strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${duration || ""} &nbsp;&nbsp; <strong>Total Marks:</strong> ${totalMarks}</p>
    </div>
    <div style="font-family: 'Georgia', serif; font-size: 16px;">
      ${questionsHtml}
    </div>
  `;

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
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Delay to ensure content is rendered before print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);
});

// Event Listeners for Filters
DOMElements.classFilter.addEventListener("change", () => {
  updateTopicFilter();
  displayQuestions();
});
DOMElements.subjectFilter.addEventListener("change", () => {
  updateTopicFilter();
  displayQuestions();
});
DOMElements.topicFilter.addEventListener("change", displayQuestions);
DOMElements.difficultyFilter.addEventListener("change", displayQuestions);
DOMElements.typeFilter.addEventListener("change", displayQuestions);
DOMElements.yearFilter.addEventListener("change", displayQuestions);
DOMElements.questionSearch.addEventListener("input", displayQuestions);


// Manual Question Form Submission
DOMElements.manualQuestionForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const newQuestion = {
    id: nextManualQuestionId++,
    class: DOMElements.manualClass.value,
    subject: DOMElements.manualSubject.value.trim(),
    topic: DOMElements.manualTopic.value.trim(),
    difficulty: DOMElements.manualDifficulty.value,
    type: DOMElements.manualType.value,
    content: DOMElements.questionContentInput.value.trim(),
    solution: DOMElements.manualSolution.value.trim() || null,
    marks: parseInt(DOMElements.manualMarks.value, 10),
  };
  selectedPaperQuestions.push(newQuestion);
  renderPaperQuestions();
  DOMElements.manualQuestionForm.reset();
  DOMElements.questionPreview.innerHTML = ""; // Clear preview after submission
  DOMElements.solutionPreview.innerHTML = ""; // Clear solution preview after submission
  DOMElements.yourPaperSection.scrollIntoView({ behavior: "smooth" });
  MathJax.typesetPromise();
});

// Manual Question Content Preview
DOMElements.questionContentInput.addEventListener("input", () => {
  const content = DOMElements.questionContentInput.value.trim();
  DOMElements.questionPreview.textContent = content;
  if (content) MathJax.typesetPromise([DOMElements.questionPreview]);
});

// Manual Solution Preview
DOMElements.manualSolution.addEventListener("input", () => {
  const content = DOMElements.manualSolution.value.trim();
  DOMElements.solutionPreview.textContent = content;
  if (content) MathJax.typesetPromise([DOMElements.solutionPreview]);
});


// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  displayQuestions();
  renderPaperQuestions();
});
