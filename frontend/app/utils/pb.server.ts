import { redirect } from '@remix-run/node';
import Pocketbase, { AuthModel } from 'pocketbase';

import { TypedPocketBase } from '~/types/pocketbase';

export function getPocketbase(request?: Request) {
  const pb = new Pocketbase(
    process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
  ) as TypedPocketBase;

  if (request) {
    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
  } else {
    pb.authStore.loadFromCookie('');
  }

  return pb;
}

export function getUser(pb: TypedPocketBase): AuthModel | undefined {
  if (pb.authStore.model) {
    return structuredClone(pb.authStore.model);
  }

  return undefined;
}

export function createSession(redirectTo: string, pb: TypedPocketBase) {
  return redirect(redirectTo, {
    headers: {
      'set-cookie': pb.authStore.exportToCookie({
        secure: redirectTo.startsWith('https:'),
        httpOnly: false
      })
    }
  });
}

export function destroySession(pb: TypedPocketBase) {
  pb.authStore.clear();

  return createSession('/', pb);
}
