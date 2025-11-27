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

// OPTIONAL: Use this endpoint only to refresh expired TTS signed URLs (24h expiry)
// The initial POST /api/turns/upload response already includes the TTS URL
export async function pollForTTS(
  token: string,
  turnId: string,
  maxAttempts = 10,
  intervalMs = 2000
): Promise<{ tts_url: string | null; status: string; ready: boolean }> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch(
        `${BACKEND_BASE}/api/turns/${turnId}/tts`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ TTS polling attempt ${attempts} failed:`, response.status);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
          continue;
        }
        throw new Error(`TTS polling failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.ready && data.tts_url) {
        console.log(`✅ TTS ready on attempt ${attempts}:`, data.tts_url);
        return data;
      }

      console.log(`⏳ TTS not ready yet (attempt ${attempts}/${maxAttempts}), status: ${data.status}`);
      
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    } catch (error) {
      console.error(`❌ TTS polling error on attempt ${attempts}:`, error);
      if (attempts >= maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('TTS polling timeout - max attempts reached');
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

export async function assembleStory(
  token: string, 
  sessionId: string, 
  styleInstruction?: string | null
) {
  const body = styleInstruction ? { style_instruction: styleInstruction } : undefined;
  
  const response = await fetchWithRetry(
    `${BACKEND_BASE}/api/ai/story/assemble/${sessionId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) }),
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
// The response includes: { follow_up: { topic, question, tts_url, suggestions } }
// The tts_url is a signed URL ready for immediate playback - no database queries needed
// This function is deprecated and should not be used
export async function getFollowUpQuestions(token: string, sessionId: string) {
  console.warn('getFollowUpQuestions is deprecated. Follow-up questions come from turn upload response.');
  throw new Error('This endpoint is no longer available. Follow-up questions are included in the turn upload response.');
}

// Image management functions

export interface BackendImageResponse {
  id: string;
  file_name: string;
  storage_path: string;
  url: string; // Signed or public URL from backend
  session_id?: string;
  chapter_id?: string;
  story_id?: string;
  mime_type: string;
  width?: number;
  height?: number;
  caption?: string;
  alt_text?: string;
}

/**
 * List story images with optional filters and pagination
 * Uses the backend GET /api/story/list-images endpoint
 */
export async function listStoryImages(
  token: string,
  params: {
    sessionId?: string;
    chapterId?: string;
    storyId?: string;
    turnId?: string;
    usage?: string;
    limit?: number;
    offset?: number;
  }
): Promise<BackendImageResponse[]> {
  const queryParams = new URLSearchParams();
  if (params.sessionId) queryParams.append('session_id', params.sessionId);
  if (params.chapterId) queryParams.append('chapter_id', params.chapterId);
  if (params.storyId) queryParams.append('story_id', params.storyId);
  if (params.turnId) queryParams.append('turn_id', params.turnId);
  if (params.usage) queryParams.append('usage', params.usage);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const url = `${BACKEND_BASE}/api/story/list-images${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const response = await fetchWithRetry(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = new Error(`Failed to list images: ${response.statusText}`) as BackendError;
    error.status = response.status;
    throw error;
  }

  const result = await response.json();
  return result.images || [];
}

/**
 * DEPRECATED: Use listStoryImages instead
 */
export async function fetchImagesFromBackend(
  token: string,
  params: {
    sessionId?: string;
    chapterId?: string;
    storyId?: string;
  }
): Promise<BackendImageResponse[]> {
  console.warn('fetchImagesFromBackend is deprecated. Use listStoryImages instead.');
  return listStoryImages(token, params);
}

/**
 * Delete a story image via backend API
 * Uses the backend DELETE /api/story/delete-image endpoint
 */
export async function deleteImageViaBackend(token: string, imageId: string): Promise<void> {
  const response = await fetchWithRetry(
    `${BACKEND_BASE}/api/story/delete-image`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_id: imageId }),
    }
  );

  if (!response.ok) {
    const error = new Error(`Failed to delete image: ${response.statusText}`) as BackendError;
    error.status = response.status;
    throw error;
  }

  await response.json();
}
