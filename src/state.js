export const MAX_CANDIDATES = 5;
export const MAX_TEXT_LENGTH = 20000;

export const CRITERIA = [
  { key: 'experience', label: 'Experience' },
  { key: 'technicalSkills', label: 'Technical Skills' },
  { key: 'domainKnowledge', label: 'Domain Knowledge' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'communication', label: 'Communication' },
];

function makeCandidate(id) {
  return { id, text: '', fileName: null, status: 'idle', errorMessage: '' };
}

export const state = {
  resumes: [makeCandidate(1), makeCandidate(2)],
  activeId: 1,
  nextId: 3,
};

export function addCandidate() {
  if (state.resumes.length >= MAX_CANDIDATES) return null;
  const candidate = makeCandidate(state.nextId++);
  state.resumes.push(candidate);
  state.activeId = candidate.id;
  return candidate;
}

export function removeCandidate(id) {
  if (state.resumes.length <= 1) return;
  state.resumes = state.resumes.filter((r) => r.id !== id);
  if (state.activeId === id) state.activeId = state.resumes[0].id;
}

export function getCandidate(id) {
  return state.resumes.find((r) => r.id === id);
}

export function truncateText(text) {
  if (text.length <= MAX_TEXT_LENGTH) return { text, truncated: false };
  return { text: text.slice(0, MAX_TEXT_LENGTH), truncated: true };
}
