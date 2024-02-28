data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_subnet" "lambda" {
  filter {
    name   = "tag:Name"
    values = ["lambda"]
  }
}

data "aws_vpc" "lambda" {
  id = data.aws_subnet.lambda.vpc_id
}

data "aws_security_group" "lambda" {
  id = var.security_group_id
}

# This could be managed separately and we can lock down the deployment role so that it cannot provision new IAM roles.
# This is purely for demonstration purposes
resource "aws_iam_role" "lambda" {
  name               = "lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_lambda_function" "main" {
  function_name = var.image_name
  role          = aws_iam_role.lambda.arn
  handler       = "/opts/nodejs/node_modules/datadog-lambda-js/handler.handler"

  runtime = "nodejs20.x"

  image_uri    = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.image_name}:${var.image_tag}"
  package_type = "Image"
  publish      = true


  logging_config {
    application_log_level = "ERROR"
    log_format            = "JSON"
    system_log_level      = "ERROR"
  }

  vpc_config {
    security_group_ids = [
      data.aws_security_group.lambda.id
    ]
    subnet_ids = [
      data.aws_subnet.lambda.id
    ]
  }

  layers = [
    "arn:aws:lambda:${var.aws_region}:464622532012:layer:Datadog-Node20-x:106",
    "arn:aws-us-gov:lambda:${var.aws_region}:002406178527:layer:Datadog-Extension:55"
  ]

  environment {
    variables = {
      NODE_ENV              = var.environment
      LOG_LEVEL             = "error"
      APP_VERSION           = "0.0.0"
      CORS_ORIGIN           = "nokkel.com"
      DD_SITE               = "datadoghq.eu"
      DD_ENV                = var.environment
      DD_API_KEY_SECRET_ARN = ""
      DD_LAMBDA_HANDLER     = "handler.handler"
      DD_LOG_LEVEL          = "debug"
    }
  }
}
