// ResumeIQ proxy worker — forwards resume-scoring requests to the Anthropic API.
// Deploy with an environment secret named ANTHROPIC_KEY (never hardcode the key).

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-5';
const MAX_RESUMES = 5;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SCORING_TOOL = {
  name: 'report_candidate_score',
  description: 'Report a structured screening score for a single candidate against a job description.',
  input_schema: {
    type: 'object',
    properties: {
      overallScore: { type: 'integer', minimum: 0, maximum: 100 },
      criteria: {
        type: 'object',
        properties: {
          experience: { type: 'integer', minimum: 0, maximum: 100 },
          technicalSkills: { type: 'integer', minimum: 0, maximum: 100 },
          domainKnowledge: { type: 'integer', minimum: 0, maximum: 100 },
          leadership: { type: 'integer', minimum: 0, maximum: 100 },
          communication: { type: 'integer', minimum: 0, maximum: 100 },
        },
        required: ['experience', 'technicalSkills', 'domainKnowledge', 'leadership', 'communication'],
      },
      topTenets: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 3,
        description: 'Top 3 reasons this candidate is a strong (or weak) fit.',
      },
      redFlags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Concerns or gaps relative to the job description. Empty array if none.',
      },
      recommend: {
        type: 'string',
        enum: ['Yes', 'No'],
        description: 'Whether to recommend this candidate for an interview.',
      },
    },
    required: ['overallScore', 'criteria', 'topTenets', 'redFlags', 'recommend'],
  },
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function scoreCandidate(jobDescription, candidate, apiKey) {
  const prompt =
    'You are an expert technical recruiter. Score the following candidate resume against the job description below. ' +
    'Be rigorous and consistent. Recognize equivalent language (e.g. "led a team of 12" implies leadership even without the word "led team").\n\n' +
    '--- JOB DESCRIPTION ---\n' + jobDescription + '\n\n' +
    '--- CANDIDATE RESUME ---\n' + candidate.text + '\n\n' +
    'Call the report_candidate_score tool with your structured evaluation.';

  const resp = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      tools: [SCORING_TOOL],
      tool_choice: { type: 'tool', name: 'report_candidate_score' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error('Anthropic API error (' + resp.status + '): ' + errText.slice(0, 200));
  }

  const data = await resp.json();
  const toolUse = (data.content || []).find(block => block.type === 'tool_use');
  if (!toolUse) {
    throw new Error('Claude did not return a structured tool_use block.');
  }
  return toolUse.input;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
    }

    const { jobDescription, resumes } = payload || {};
    if (!jobDescription || typeof jobDescription !== 'string') {
      return jsonResponse({ error: 'jobDescription (string) is required.' }, 400);
    }
    if (!Array.isArray(resumes) || resumes.length === 0) {
      return jsonResponse({ error: 'resumes (non-empty array) is required.' }, 400);
    }
    if (resumes.length > MAX_RESUMES) {
      return jsonResponse({ error: 'A maximum of ' + MAX_RESUMES + ' resumes is supported per run.' }, 400);
    }

    const apiKey = env.ANTHROPIC_KEY;
    if (!apiKey) {
      return jsonResponse({ error: 'Server misconfiguration: ANTHROPIC_KEY is not set.' }, 500);
    }

    const results = await Promise.all(
      resumes.map(async (candidate) => {
        const label = candidate.label || ('Candidate ' + (candidate.id || ''));
        try {
          const scored = await scoreCandidate(jobDescription, candidate, apiKey);
          return { id: candidate.id, label, ...scored };
        } catch (err) {
          return { id: candidate.id, label, error: err.message };
        }
      })
    );

    results.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

    return jsonResponse({ results });
  },
};
