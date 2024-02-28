// eslint-disable-next-line node/no-unpublished-import
import baseConfig from '@kodasoftware/testing/dist/jest.config';
// eslint-disable-next-line node/no-unpublished-import
import type { Config } from 'jest';
// eslint-disable-next-line node/no-unpublished-import
import { pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

const config: Config = {
  ...baseConfig,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  modulePaths: [compilerOptions.baseUrl],
};

export default config;
