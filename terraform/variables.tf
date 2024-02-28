variable "aws_account_id" {
  type = string
}

variable "aws_region" {
  type = string
  default = "eu-west-2"
}

variable "aws_role_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "image_name" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "security_group_id" {
  type = string
}
