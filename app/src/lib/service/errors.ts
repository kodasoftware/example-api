// eslint-disable-next-line node/no-extraneous-import
import Koa from 'koa';

export class UserExistsError extends Error {}
export class NoUserError extends Error {}
export class UserDeletedError extends Error {}
export class NoAccountError extends Error {}
export class InvalidAuthError extends Error {}

export function getStatusForError(error: Error): number {
  if (error instanceof Koa.HttpError) return error.status;
  if (error instanceof UserExistsError) return 409;
  if (
    error instanceof NoUserError ||
    error instanceof NoAccountError ||
    error instanceof UserDeletedError
  )
    return 404;
  if (error instanceof InvalidAuthError) return 401;
  return 500;
}
