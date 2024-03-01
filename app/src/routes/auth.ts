import { Router, schemaMiddlewareFactory } from '@kodasoftware/api';
// eslint-disable-next-line node/no-extraneous-import
import compose from 'koa-compose';

import {
  getAuthMiddlewareFactory,
  refreshAuthMiddlewareFactory,
} from '../middlewares';

const AUTH_SCHEMA = {
  email: {
    type: 'string',
    format: 'email',
    maxLength: 255,
  },
  password: {
    type: 'string',
    format: 'password',
  },
};

/**
 * @openapi
 * /auth:
 *  post:
 *    tags:
 *      - Auth
 *    description: Get auth tokens
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/EmailPassword'
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/Auth'
 *
 * /auth/refresh:
 *  post:
 *    tags:
 *      - Auth
 *    description: Refresh access and refresh tokens
 *    parameters:
 *      - in: cookie
 *        name: refreshToken
 *        schema:
 *          type: string
 *        required: true
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/Auth'
 */
export function authRouteFactory(config: {
  accessToken: { expiry: number };
  refreshToken: { expiry: number };
}) {
  const router = new Router();
  router.post(
    'getAuth',
    '/auth',
    compose([
      schemaMiddlewareFactory({
        opts: { coerceTypes: false },
        schema: {
          body: {
            type: 'object',
            properties: AUTH_SCHEMA,
            required: ['email', 'password'],
          },
        },
      }),
      getAuthMiddlewareFactory({
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
      }),
    ])
  );
  router.get(
    'getRefreshAuth',
    '/auth',
    compose([
      refreshAuthMiddlewareFactory({
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
      }),
    ])
  );
  return router;
}
