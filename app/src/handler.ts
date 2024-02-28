import { datadog } from 'datadog-lambda-js';

import { application } from './app';

export const handler = datadog(application.serverless());
