import { CRITERIA, MAX_CANDIDATES, state } from './state.js';

export function renderTabs({ onSelectTab }) {
  const tabsEl = document.getElementById('resume-tabs');
  const candidateCount = document.getElementById('candidate-count');
  const addBtn = document.getElementById('add-candidate-btn');

  tabsEl.innerHTML = '';
  state.resumes.forEach((r, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-btn' + (r.id === state.activeId ? ' active' : '');
    btn.textContent = 'Candidate ' + (idx + 1);
    btn.addEventListener('click', () => onSelectTab(r.id));
    tabsEl.appendChild(btn);
  });

  candidateCount.textContent = '(' + state.resumes.length + ' / ' + MAX_CANDIDATES + ')';
  addBtn.disabled = state.resumes.length >= MAX_CANDIDATES;
}

export function renderPanes({ onTextChange, onFileSelect, onRemove }) {
  const panesEl = document.getElementById('resume-panes');
  panesEl.innerHTML = '';

  state.resumes.forEach((r, idx) => {
    const pane = document.createElement('div');
    pane.className = 'resume-pane' + (r.id === state.activeId ? ' active' : '');

    if (state.resumes.length > 2) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'tab-btn remove-btn';
      removeBtn.textContent = 'Remove Candidate ' + (idx + 1);
      removeBtn.style.marginBottom = '8px';
      removeBtn.addEventListener('click', () => onRemove(r.id));
      pane.appendChild(removeBtn);
    }

    const uploadRow = document.createElement('div');
    uploadRow.className = 'upload-row';

    const fileLabel = document.createElement('label');
    fileLabel.className = 'file-input-label';
    fileLabel.textContent = 'Upload PDF / DOCX / TXT';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.docx,.txt';
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) onFileSelect(r.id, file);
      e.target.value = '';
    });
    fileLabel.appendChild(fileInput);
    uploadRow.appendChild(fileLabel);

    const statusSpan = document.createElement('span');
    statusSpan.className = 'file-status' + (r.status !== 'idle' ? ' ' + r.status : '');
    if (r.status === 'parsing') statusSpan.textContent = 'Parsing ' + r.fileName + '...';
    else if (r.status === 'error') statusSpan.textContent = r.errorMessage;
    else if (r.status === 'success') statusSpan.textContent = 'Loaded ' + r.fileName;
    uploadRow.appendChild(statusSpan);

    pane.appendChild(uploadRow);

    const ta = document.createElement('textarea');
    ta.placeholder = 'Paste resume text for Candidate ' + (idx + 1) + ', or upload a file above...';
    ta.value = r.text;
    ta.addEventListener('input', (e) => onTextChange(r.id, e.target.value));
    pane.appendChild(ta);

    panesEl.appendChild(pane);
  });
}

function scoreClass(score) {
  if (score >= 75) return 'score-good';
  if (score >= 50) return 'score-mid';
  return 'score-low';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

export function renderResults(results) {
  const resultsSection = document.getElementById('results-section');
  const resultsGrid = document.getElementById('results-grid');
  resultsGrid.innerHTML = '';

  results.forEach((res, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    if (res.error) {
      card.innerHTML =
        '<div class="result-header"><div class="result-title">' +
        '<div class="rank-badge">' + (idx + 1) + '</div>' +
        '<div class="candidate-label">' + escapeHtml(res.label) + '</div>' +
        '</div></div>' +
        '<div class="candidate-error">Scoring failed: ' + escapeHtml(res.error) + '</div>';
      resultsGrid.appendChild(card);
      return;
    }

    const header = document.createElement('div');
    header.className = 'result-header';

    const title = document.createElement('div');
    title.className = 'result-title';
    title.innerHTML =
      '<div class="rank-badge' + (idx === 0 ? ' rank-1' : '') + '">' + (idx + 1) + '</div>' +
      '<div class="candidate-label">' + escapeHtml(res.label) + '</div>';

    const scoreWrap = document.createElement('div');
    scoreWrap.style.display = 'flex';
    scoreWrap.style.alignItems = 'center';
    scoreWrap.style.gap = '14px';
    scoreWrap.innerHTML =
      '<span class="recommend-badge ' + (res.recommend === 'Yes' ? 'recommend-yes' : 'recommend-no') + '">' +
        (res.recommend === 'Yes' ? 'Recommend Interview' : 'Not Recommended') +
      '</span>' +
      '<span class="overall-score ' + scoreClass(res.overallScore) + '">' + res.overallScore + '</span>';

    header.appendChild(title);
    header.appendChild(scoreWrap);
    card.appendChild(header);

    const criteriaList = document.createElement('div');
    criteriaList.className = 'criteria-list';
    CRITERIA.forEach((c) => {
      const val = (res.criteria && res.criteria[c.key]) || 0;
      const row = document.createElement('div');
      row.className = 'criterion-row';
      row.innerHTML =
        '<span class="criterion-name">' + c.label + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + val + '%"></span></span>' +
        '<span class="criterion-value">' + val + '</span>';
      criteriaList.appendChild(row);
    });
    card.appendChild(criteriaList);

    if (res.topTenets && res.topTenets.length) {
      const label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = 'Top Tenets';
      card.appendChild(label);
      const ul = document.createElement('ul');
      ul.className = 'tenets';
      res.topTenets.slice(0, 3).forEach((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }

    if (res.redFlags && res.redFlags.length) {
      const label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = 'Red Flags';
      card.appendChild(label);
      const ul = document.createElement('ul');
      ul.className = 'red-flags';
      res.redFlags.forEach((f) => {
        const li = document.createElement('li');
        li.textContent = f;
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }

    resultsGrid.appendChild(card);
  });

  resultsSection.style.display = results.length ? 'block' : 'none';
}
