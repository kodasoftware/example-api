import { application } from './app';
import { config } from './lib';

async function main() {
  try {
    await application.start({ port: config.app.port });
  } catch (err) {
    await application.end();
    application.context.log.fatal(err);
  }
}

main();
