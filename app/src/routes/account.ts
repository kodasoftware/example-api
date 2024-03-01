import {
  authenticationMiddlewareFactory,
  authorizationMiddlewareFactory,
  Router,
  schemaMiddlewareFactory,
} from '@kodasoftware/api';
// eslint-disable-next-line node/no-extraneous-import
import compose from 'koa-compose';

import {
  createMyAccountMiddleware,
  deleteMyAccountMiddleware,
  getMyAccountMiddleware,
  updateMyAccountMiddleware,
} from '../middlewares';

const ACCOUNT_SCHEMA = {
  name: { type: 'string', minLength: 1, maxLength: 255 },
};

/**
 * @openapi
 * /accounts:
 *  post:
 *    tags:
 *      - Account
 *    description: Create an account
 *    security:
 *      - Bearer: []
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
 *            $ref: '#/components/schemas/AccountRequest'
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/Account'
 *
 *  get:
 *    tags:
 *      - Account
 *    description: Get your account
 *    parameters:
 *      - in: header
 *        name: Authorization
 *        schema:
 *          type: string
 *        required: true
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/Account'
 *
 *  delete:
 *    tags:
 *      - Account
 *    description: Delete your account
 *    parameters:
 *      - in: header
 *        name: Authorization
 *        schema:
 *          type: string
 *        required: true
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/Account'
 *
 *  patch:
 *    tags:
 *      - Account
 *    description: Update your account
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
 *            $ref: '#/components/schemas/AccountRequest'
 *    responses:
 *      200:
 *        description: Return 200 response
 *        content:
 *          application/json:
 *            $ref: '#/components/schemas/Account'
 */
export function accountRouteFactory(config: { publicKey: string }) {
  const router = new Router();
  router.post(
    'createMyAccount',
    '/accounts',
    compose([
      authenticationMiddlewareFactory(config),
      authorizationMiddlewareFactory({ permission: { required: 'WRITE' } }),
      schemaMiddlewareFactory({
        opts: { coerceTypes: false },
        schema: {
          body: {
            type: 'object',
            properties: ACCOUNT_SCHEMA,
            required: ['name'],
          },
        },
      }),
      createMyAccountMiddleware,
    ])
  );
  router.get(
    'getMyAccount',
    '/accounts',
    compose([
      authenticationMiddlewareFactory(config),
      authorizationMiddlewareFactory({ permission: { required: 'READ' } }),
      getMyAccountMiddleware,
    ])
  );
  router.delete(
    'deleteMyAccount',
    '/accounts',
    compose([
      authenticationMiddlewareFactory(config),
      authorizationMiddlewareFactory({ permission: { required: 'WRITE' } }),
      deleteMyAccountMiddleware,
    ])
  );
  router.patch(
    'updateMyAccount',
    '/accounts',
    compose([
      authenticationMiddlewareFactory(config),
      authorizationMiddlewareFactory({ permission: { required: 'WRITE' } }),
      schemaMiddlewareFactory({
        opts: { coerceTypes: false },
        schema: {
          body: {
            type: 'object',
            properties: ACCOUNT_SCHEMA,
            required: ['name'],
          },
        },
      }),
      updateMyAccountMiddleware,
    ])
  );
  return router;
}
