import { SetMetadata } from '@nestjs/common';
export const AUTH_MODE = 'auth:mode';
export const ADMIN_ONLY = 'auth:admin';
export const Public = () => SetMetadata(AUTH_MODE, 'public');
/** For session inspection and first-time user provisioning, before a DB user exists. */
export const CognitoOnly = () => SetMetadata(AUTH_MODE, 'cognito');
export const AdminOnly = () => SetMetadata(ADMIN_ONLY, true);
