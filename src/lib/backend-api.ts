import { BACKEND_URL } from '@/config/backend';

const BACKEND_BASE = BACKEND_URL;
const MAX_RETRIES = 2;

interface BackendError extends Error {
  status?: number;
  retryable?: boolean;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && response.status >= 500 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// DEPRECATED: Use createTurn instead
// The uploadRecording endpoint has been removed from the backend

export async function createTurn(
  token: string,
  data: {
    sessionId: string;
    storagePath: string;
    durationSeconds: number;
    mimeType: string;
    language: string;
    prompt_text?: string;
    synthesize_tts: boolean;
  }
) {
  console.log('🌐 Backend API Call:', {
    url: `${BACKEND_BASE}/api/turns/upload`,
    method: 'POST',
    data
  });

  const response = await fetchWithRetry(
    `${BACKEND_BASE}/api/turns/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  console.log('📡 Backend response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Backend error response:', errorText);
    const error = new Error(`Turn creation failed: ${response.statusText}`) as BackendError;
    error.status = response.status;
    throw error;
  }

  const result = await response.json();
  console.log('✅ Backend success response:', result);
  return result;
}

// DEPRECATED: Transcription is now handled automatically by createTurn
// The transcribeRecording endpoint has been removed from the backend

export async function generateChapters(token: string, sessionId: string) {
  const response = await fetchWithRetry(
    `${BACKEND_BASE}/api/ai/chapters/by-session/${sessionId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = new Error(`Chapter generation failed: ${response.statusText}`) as BackendError;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function assembleStory(token: string, sessionId: string) {
  const response = await fetchWithRetry(
    `${BACKEND_BASE}/api/ai/story/assemble/${sessionId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = new Error(`Story assembly failed: ${response.statusText}`) as BackendError;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// NOTE: Follow-up questions are now retrieved from the POST /api/turns/upload response
// The response includes: { follow_up: { topic, suggestions, tts_url } }
// This function is deprecated and should not be used
export async function getFollowUpQuestions(token: string, sessionId: string) {
  console.warn('getFollowUpQuestions is deprecated. Follow-up questions come from turn upload response.');
  throw new Error('This endpoint is no longer available. Follow-up questions are included in the turn upload response.');
}
