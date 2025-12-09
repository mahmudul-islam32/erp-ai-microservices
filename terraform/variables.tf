variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "erp-microservices"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 30
}

variable "key_pair_name" {
  description = "Name of the existing AWS key pair (or name for new one if create_key_pair is true)"
  type        = string
  default     = "erp-ec2-key"
}

variable "create_key_pair" {
  description = "Whether to create a new key pair (requires public_key variable)"
  type        = bool
  default     = false
}

variable "public_key" {
  description = "Public key for new key pair (required if create_key_pair is true)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "allowed_ssh_cidr_blocks" {
  description = "List of CIDR blocks allowed to SSH into the instance"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Change this to your IP for security
}

variable "allocate_elastic_ip" {
  description = "Whether to allocate an Elastic IP address"
  type        = bool
  default     = true
}
