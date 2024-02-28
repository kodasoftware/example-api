import {
  authenticationMiddlewareFactory,
  authorizationMiddlewareFactory,
  Router,
  schemaMiddlewareFactory,
} from '@kodasoftware/api';
// eslint-disable-next-line node/no-extraneous-import
import compose from 'koa-compose';

import {
  createMeMiddleware,
  deleteMeMiddleware,
  updateMeMiddleware,
} from '../middlewares';

const USER_SCHEMA = {
  email: {
    type: 'string',
    format: 'email',
    maxLength: 255,
  },
  password: {
    type: 'string',
    format: 'password',
  },
  name: {
    type: 'string',
    minLength: 3,
    maxLength: 255,
  },
};

/**
 * @openapi
 * /users:
 *  post:
 *    tags:
 *      - User
 *    description: Create your user
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *    responses:
 *      201:
 *        description: Return 201 response
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/User'
 * /users/me:
 *  patch:
 *    tags:
 *      - User
 *    description: Update your user
 *    parameters:
 *      - in: header
 *        name: Authorization
 *        schema:
 *          type: string
 *        required: true
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/User'
 *  delete:
 *    tags:
 *      - User
 *    description: Delete your user
 *    parameters:
 *      - in: header
 *        name: Authorization
 *        schema:
 *          type: string
 *        required: true
 *    responses:
 *      200:
 *        description: Return 200 response
 */
export function meRouteFactory(config: { jwksUri: string; cache?: boolean }) {
  const router = new Router();
  router.post(
    'createMe',
    '/users',
    compose([
      schemaMiddlewareFactory({
        schema: {
          body: {
            type: 'object',
            properties: USER_SCHEMA,
            required: ['email', 'password', 'name'],
          },
        },
      }),
      createMeMiddleware,
    ])
  );
  router.delete(
    'deleteMe',
    '/users/me',
    compose([
      authenticationMiddlewareFactory(config),
      authorizationMiddlewareFactory({ permissions: { required: 'WRITE' } }),
      deleteMeMiddleware,
    ])
  );
  router.patch(
    'updateMe',
    '/users/me',
    compose([
      authenticationMiddlewareFactory(config),
      authorizationMiddlewareFactory({ permissions: { required: 'WRITE' } }),
      schemaMiddlewareFactory({
        schema: {
          body: {
            type: 'object',
            properties: USER_SCHEMA,
          },
        },
      }),
      updateMeMiddleware,
    ])
  );
  return router;
}
