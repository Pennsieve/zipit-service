resource "aws_ssm_parameter" "api_url" {
  name = "/${var.environment_name}/${var.service_name}/api-url"
  type = "String"
  value = "https://${data.terraform_remote_state.gateway.outputs.external_fqdn}"
}

resource "aws_ssm_parameter" "packages_path" {
  name = "/${var.environment_name}/${var.service_name}/packages-path"
  type = "String"
  value = var.packages_path
}

resource "aws_ssm_parameter" "manifest_path" {
  name = "/${var.environment_name}/${var.service_name}/manifest-path"
  type = "String"
  value = var.manifest_path
}

resource "aws_ssm_parameter" "log_level" {
  name = "/${var.environment_name}/${var.service_name}/log-level"
  type = "String"
  value = var.log_level
}

resource "aws_ssm_parameter" "max_archive_size" {
  name = "/${var.environment_name}/${var.service_name}/max-archive-size"
  type = "String"
  value = var.max_archive_size
}

resource "aws_ssm_parameter" "port" {
  name = "/${var.environment_name}/${var.service_name}/port"
  type = "String"
  value = var.port
}
