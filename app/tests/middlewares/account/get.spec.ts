/* eslint-disable node/no-extraneous-import */
/* eslint-disable node/no-unpublished-import */
import {
  generateToken,
  MockJwks,
  mockJwksEndpoint,
} from '@kodasoftware/testing';
import Chance from 'chance';
import nock from 'nock';
import request from 'supertest';

import { applicationFactory, config } from '@/lib';
import { accountRouteFactory } from '@/routes';

const CHANCE = new Chance();

describe('getAccountMiddleware', () => {
  const application = applicationFactory(config);
  const jwksUri = CHANCE.url();
  const jwksClient = new MockJwks({ uri: jwksUri });
  const { privateKey, jwks } = jwksClient.generateKeys();
  const { privateKey: invalidPrivateKey } = jwksClient.generateKeys();
  const kid = CHANCE.word();

  beforeAll(() => {
    application.use(accountRouteFactory({ jwksUri }).attach());
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('When an missing authorization header', () => {
    it('Then returns 401', async () => {
      await expect(
        request(application.callback()).get('/accounts')
      ).resolves.toEqual(
        expect.objectContaining({ status: 401, text: 'Unauthorized' })
      );
    });
  });

  describe('When an unauthorised request to retrieve account', () => {
    it.each([
      ['Authorization', 'Bearer '],
      [
        'Authorization',
        `Bearer ${generateToken({
          payload: { id: CHANCE.guid(), permissions: ['READ', 'WRITE'] },
          privateKey: invalidPrivateKey,
          algorithm: 'RS256',
        })}`,
      ],
      [
        'Authorization',
        `Bearer ${generateToken({
          payload: { id: CHANCE.guid(), permissions: [] },
          privateKey,
          algorithm: 'RS256',
          header: { kid, alg: 'RS256' },
        })}`,
      ],
    ])('Then returns 401', async (header, value) => {
      mockJwksEndpoint({ endpoint: new URL(jwksUri), jwks, kid });

      await expect(
        request(application.callback()).get('/accounts').set(header, value)
      ).resolves.toEqual(
        expect.objectContaining({ status: 401, text: 'Unauthorized' })
      );
    });
  });
});
