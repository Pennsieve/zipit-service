variable "aws_account" {}

variable "environment_name" {}

variable "service_name" {}

variable "vpc_name" {}

variable "ecs_task_iam_role_id" {}

variable "log_level" {
  default = "silly"
}

variable "packages_path" {
  default = "/packages"
}

variable "manifest_path" {
  default = "/download-manifest"
}

variable "max_archive_size" {
  default = "15000000000"
}

variable "port" {
  default = "8080"
}

locals {
  service = element(split("-", var.service_name), 0)
  tier    = element(split("-", var.service_name), 1)
}
