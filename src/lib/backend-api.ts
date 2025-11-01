const BACKEND_BASE = 'https://maryln-manipular-unsuperiorly.ngrok-free.dev';
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

export async function uploadRecording(
  token: string,
  data: {
    sessionId: string;
    storagePath: string;
    durationSeconds: number;
    mimeType: string;
    language: string;
  }
) {
  const response = await fetchWithRetry(
    `${BACKEND_BASE}/api/recordings/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = new Error(`Upload failed: ${response.statusText}`) as BackendError;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

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

  if (!response.ok) {
    const error = new Error(`Turn creation failed: ${response.statusText}`) as BackendError;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function transcribeRecording(token: string, recordingId: string) {
  const response = await fetchWithRetry(
    `${BACKEND_BASE}/api/ai/transcribe/${recordingId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = new Error(`Transcription failed: ${response.statusText}`) as BackendError;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function generateChapters(token: string, recordingId: string) {
  const response = await fetchWithRetry(
    `${BACKEND_BASE}/api/ai/chapters/generate/${recordingId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
