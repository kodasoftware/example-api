# Example API

An example Koa-based API application that can be run as a HTTP server or as a Lambda.

## Pre-requisites

* [asdf](https://asdf-vm.com/guide/getting-started.html)
* [asdf nodejs](https://github.com/asdf-vm/asdf-nodejs)
* [asdf terraform](https://github.com/asdf-community/asdf-hashicorp)
* [Docker Desktop](https://docs.docker.com/desktop/)


## Running the application

There are multiple ways you can run the API application on your local machine. See some examples below.

### Node

You can use NPM on your machine to run the application.

#### Server

You can run the application locally with Node. This uses nodemon to restart the application when it detects changes.

```bash
cd app
npm start
```

Then navigate to http://localhost:9000/docs in your browser to see the Swagger UI for available endpoints. You can change the PORT the application binds to by setting the `APP_PORT` environment variable like below:

```bash
APP_PORT=9090 npm start
```

This will expose the application on port `9090` instead of the default `9000`. For more environment variable bindings you can look into the `app/config/custom-environment-variables.yaml` file to see which environment variables bind to which configuration. This functionality is provided by [config](https://www.npmjs.com/package/config) NPM package. See the link for more information about how this works.

### Docker

You can use Docker to build and run the application binding the port to your host machine.

#### HTTP Server

You can build and run the API application as a HTTP server in a Docker container.

```bash
docker build -t example-api .
docker run -itp 9000:9000
```

Then navigate to http://localhost:9000/docs in your browser to see the Swagger UI for available endpoints. You can also pass environment variables using the `-e ENV_VAR=VALUE` flag for each environment variable you wish to set to the `docker run` command.

#### Serverless (AWS Lambda)

You can build and run the API application as a Lambda in a Docker container.

```bash
docker build -t example-api -f Dockerfile.serverless ..
docker run -itp 9000:8080
```

Then using curl or postman execute the following request to retrieve the docs (though the response is an Lambda response so which is a JSON response).

```bash
curl -XPOST http://localhost:9000/2015-03-31/functions/function/invocations -d '{"path":"/docs","httpMethod":"GET"}'
```

You can also pass environment variables using the `-e ENV_VAR=VALUE` flag for each environment variable you wish to set to the `docker run` command.

## Request Examples

Here are a few curl commands you can execute against the running API to retrieve results

### HTTP Server Requests

```bash
curl -XGET http://localhost:9000/accounts

curl -XGET http://localhost:9000/coffee/hot

curl -XGET http://localhost:9000/coffee/iced
```

### Serverless Requests

```bash
curl -XPOST http://localhost:9000/2015-03-31/functions/function/invocations \
-d '{"path":"/accounts","httpMethod":"GET"}'

curl -XPOST http://localhost:9000/2015-03-31/functions/function/invocations \
-d '{"path":"/coffee/hot","httpMethod":"GET"}'

curl -XPOST http://localhost:9000/2015-03-31/functions/function/invocations \
-d '{"path":"/coffee/iced","httpMethod":"GET"}'
```

Also see [event.json](https://github.com/awsdocs/aws-lambda-developer-guide/blob/main/sample-apps/nodejs-apig/event.json) for more serverless payloads
