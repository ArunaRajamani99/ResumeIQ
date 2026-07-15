const WORKER_URL = 'https://resumeiq-proxy.aruna-ranga.workers.dev';

export async function screenCandidates(jobDescription, resumes) {
  const resp = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription, resumes }),
  });

  if (!resp.ok) {
    throw new Error('Worker returned status ' + resp.status);
  }

  const data = await resp.json();
  if (!data || !Array.isArray(data.results)) {
    throw new Error('Unexpected response shape from scoring service.');
  }

  return data.results;
}
