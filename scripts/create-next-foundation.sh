#!/usr/bin/env bash

set -euo pipefail

target_dir="${1:-.}"

if [[ ! -d "$target_dir" ]]; then
  echo "Target directory does not exist: $target_dir" >&2
  exit 1
fi

created_count=0
skipped_count=0

create_file() {
  local relative_path="$1"
  local destination="$target_dir/$relative_path"

  mkdir -p "$(dirname "$destination")"

  if [[ -e "$destination" ]]; then
    echo "skip   $relative_path (already exists)"
    skipped_count=$((skipped_count + 1))
    cat >/dev/null
    return
  fi

  cat >"$destination"
  echo "create $relative_path"
  created_count=$((created_count + 1))
}

create_file ".env.example" <<'EOF'
# Public Cognito identifiers. These identify resources but are not secret keys.
NEXT_PUBLIC_COGNITO_USER_POOL_ID=
NEXT_PUBLIC_COGNITO_CLIENT_ID=

# Server-only values. Never expose these with NEXT_PUBLIC_.
JWT_SECRET=
DATABASE_URL=
DIRECT_URL=
EOF

create_file "lib/auth/session-token.ts" <<'EOF'
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

const SESSION_DURATION = '6h';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');
  return new TextEncoder().encode(secret);
};

export const createSessionToken = (payload: JWTPayload) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());

export const verifySessionToken = async (token: string) => {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ['HS256'],
  });
  return payload;
};
EOF

create_file "lib/auth/session-cookie.ts" <<'EOF'
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_MAX_AGE_SECONDS = 6 * 60 * 60;

export const readSessionCookie = async () =>
  (await cookies()).get(SESSION_COOKIE_NAME)?.value;

export const writeSessionCookie = async (token: string) => {
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
};

export const deleteSessionCookie = async () => {
  (await cookies()).delete(SESSION_COOKIE_NAME);
};
EOF

create_file "lib/auth/session.ts" <<'EOF'
import { createSessionToken } from './session-token';
import { writeSessionCookie } from './session-cookie';

export const createSession = async (userId: string) => {
  const token = await createSessionToken({ userId });
  await writeSessionCookie(token);
};
EOF

create_file "lib/cognito/configure-amplify.ts" <<'EOF'
import { Amplify } from 'aws-amplify';

export const configureAmplify = () => {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!userPoolId || !userPoolClientId) {
    throw new Error('Cognito public environment variables are not configured.');
  }

  Amplify.configure({
    Auth: { Cognito: { userPoolId, userPoolClientId } },
  });
};
EOF

create_file "lib/cognito/verify-access-token.ts" <<'EOF'
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error('Cognito environment variables are not configured.');
}

const verifier = CognitoJwtVerifier.create({
  userPoolId,
  clientId,
  tokenUse: 'access',
});

export const verifyCognitoAccessToken = (token: string) =>
  verifier.verify(token);
EOF

create_file "lib/tag/get-tag-color-class.ts" <<'EOF'
const colors = [
  'bg-blue-50 text-blue-800',
  'bg-orange-50 text-orange-800',
  'bg-emerald-50 text-emerald-800',
  'bg-violet-50 text-violet-800',
  'bg-rose-50 text-rose-800',
] as const;

const normalize = (value: string) =>
  value.trim().normalize('NFKC').toLocaleLowerCase();

export const getTagColorClass = (name: string) => {
  const hash = Array.from(normalize(name)).reduce(
    (total, character) => total + (character.codePointAt(0) ?? 0),
    0,
  );
  return colors[hash % colors.length];
};
EOF

create_file "lib/http/api-client.ts" <<'EOF'
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const apiClient = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(body?.message ?? 'Request failed.', response.status);
  }

  return body as T;
};
EOF

create_file "vitest.config.mts" <<'EOF'
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    clearMocks: true,
  },
});
EOF

create_file "vitest.setup.ts" <<'EOF'
process.env.JWT_SECRET =
  'vitest-only-secret-key-that-is-longer-than-32-characters';
process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = 'ap-northeast-1_testPool';
process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'test-client-id';
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/test_database';
EOF

create_file "prisma.config.ts" <<'EOF'
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
EOF

create_file "app/loading.tsx" <<'EOF'
export default function Loading() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-10 w-64 rounded-xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 rounded-2xl bg-white" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white" />
      </div>
    </main>
  );
}
EOF

create_file "REUSABLE_FOUNDATION.md" <<'EOF'
# Reusable Next.js foundation

Generated files intentionally contain no real secrets.

## Install

```bash
npm install jose aws-amplify aws-jwt-verify
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

If Prisma/PostgreSQL is needed:

```bash
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install -D prisma tsx
```

## Project-specific work still required

- Define the Prisma schema and generated client output.
- Look up the application User after verifying `payload.userId`.
- Configure Cognito attributes and signup/confirmation screens.
- Add authorization checks to every mutation.
- Replace the loading skeleton with the destination page layout.
- Copy `.env.example` to a local ignored env file and supply real values.
EOF

echo
echo "Done: $created_count created, $skipped_count skipped."
echo "Next: read $target_dir/REUSABLE_FOUNDATION.md"
