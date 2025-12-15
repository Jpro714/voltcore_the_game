import { CharacterAction } from '../types.js';
import { apiRequest } from './twitterClient.js';

export interface ActionResult {
  action: CharacterAction;
  status: 'completed' | 'skipped' | 'failed';
  response?: unknown;
  error?: string;
}

const jsonBody = (payload: unknown) => JSON.stringify(payload);

const postAsCharacter = (handle: string, content: string) =>
  apiRequest(`/internal/characters/${encodeURIComponent(handle)}/posts`, {
    method: 'POST',
    body: jsonBody({ content }),
  });

const replyAsCharacter = (handle: string, postId: string, content: string) =>
  apiRequest(`/internal/characters/${encodeURIComponent(handle)}/posts/${encodeURIComponent(postId)}/replies`, {
    method: 'POST',
    body: jsonBody({ content }),
  });

const dmAsCharacter = (handle: string, target: string, content: string) =>
  apiRequest(`/internal/characters/${encodeURIComponent(handle)}/direct-messages/${encodeURIComponent(target)}`, {
    method: 'POST',
    body: jsonBody({ content }),
  });

const likePost = (postId: string) =>
  apiRequest(`/api/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
  });

export async function executeActions(handle: string, actions: CharacterAction[]): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    if (action.type === 'noop') {
      results.push({ action, status: 'skipped', error: 'noop action' });
      continue;
    }

    try {
      switch (action.type) {
        case 'post': {
          if (!action.content) {
            throw new Error('Post action missing content');
          }
          const response = await postAsCharacter(handle, action.content);
          results.push({ action, status: 'completed', response });
          break;
        }
        case 'reply': {
          if (!action.content || !action.referencePostId) {
            throw new Error('Reply action requires content and referencePostId');
          }
          const response = await replyAsCharacter(handle, action.referencePostId, action.content);
          results.push({ action, status: 'completed', response });
          break;
        }
        case 'dm': {
          if (!action.content || !action.targetHandle) {
            throw new Error('DM action requires content and targetHandle');
          }
          if (action.targetHandle.toLowerCase() === handle.toLowerCase()) {
            results.push({ action, status: 'skipped', error: 'Cannot DM yourself' });
            break;
          }
          const response = await dmAsCharacter(handle, action.targetHandle, action.content);
          results.push({ action, status: 'completed', response });
          break;
        }
        case 'like': {
          if (!action.referencePostId) {
            throw new Error('Like action requires referencePostId');
          }
          const response = await likePost(action.referencePostId);
          results.push({ action, status: 'completed', response });
          break;
        }
        default:
          results.push({ action, status: 'skipped', error: 'Unknown action type' });
      }
    } catch (error) {
      results.push({
        action,
        status: 'failed',
        error: (error as Error).message,
      });
    }
  }

  return results;
}
