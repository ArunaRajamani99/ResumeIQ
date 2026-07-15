import './styles.css';
import { state, addCandidate, removeCandidate, getCandidate, truncateText } from './state.js';
import { renderTabs, renderPanes, renderResults } from './render.js';
import { extractTextFromFile } from './fileParsing.js';
import { screenCandidates } from './api.js';

const jdTextarea = document.getElementById('jd-textarea');
const addBtn = document.getElementById('add-candidate-btn');
const screenBtn = document.getElementById('screen-btn');
const statusText = document.getElementById('status-text');
const errorBox = document.getElementById('error-box');
const resultsSection = document.getElementById('results-section');

function refresh() {
  renderTabs({
    onSelectTab: (id) => {
      state.activeId = id;
      refresh();
    },
  });
  renderPanes({
    onTextChange: (id, text) => {
      const candidate = getCandidate(id);
      candidate.text = text;
      candidate.status = 'idle';
    },
    onFileSelect: handleFileSelect,
    onRemove: (id) => {
      removeCandidate(id);
      refresh();
    },
  });
}

async function handleFileSelect(id, file) {
  const candidate = getCandidate(id);
  candidate.fileName = file.name;
  candidate.status = 'parsing';
  candidate.errorMessage = '';
  refresh();

  try {
    const extracted = await extractTextFromFile(file);
    const { text, truncated } = truncateText(extracted);
    candidate.text = text;
    candidate.status = 'success';
    candidate.errorMessage = truncated ? 'Loaded ' + file.name + ' (truncated to fit length limit)' : '';
  } catch (err) {
    candidate.status = 'error';
    candidate.errorMessage = err.message;
  }
  refresh();
}

addBtn.addEventListener('click', () => {
  addCandidate();
  refresh();
});

function setLoading(isLoading) {
  screenBtn.disabled = isLoading;
  screenBtn.textContent = isLoading ? 'Screening...' : 'Screen Candidates';
  statusText.textContent = isLoading ? 'Calling Claude for each candidate — this can take a few seconds...' : '';
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}

function clearError() {
  errorBox.style.display = 'none';
  errorBox.textContent = '';
}

screenBtn.addEventListener('click', async () => {
  clearError();
  resultsSection.style.display = 'none';

  const jobDescription = jdTextarea.value.trim();
  const filled = state.resumes.filter((r) => r.text.trim().length > 0);

  if (!jobDescription) {
    showError('Please paste a job description before screening.');
    return;
  }
  if (filled.length === 0) {
    showError('Please paste or upload at least one resume before screening.');
    return;
  }

  setLoading(true);
  try {
    const payload = filled.map((r, idx) => ({
      id: r.id,
      label: 'Candidate ' + (idx + 1),
      text: r.text.trim(),
    }));

    const results = await screenCandidates(jobDescription, payload);
    const sorted = results.slice().sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    renderResults(sorted);
  } catch (err) {
    showError('Screening failed: ' + err.message);
  } finally {
    setLoading(false);
  }
});

refresh();
