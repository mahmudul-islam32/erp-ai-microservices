output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.erp_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.erp_server.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.erp_server.public_dns
}

output "elastic_ip" {
  description = "Elastic IP address (if allocated)"
  value       = var.allocate_elastic_ip ? aws_eip.erp_eip[0].public_ip : null
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.erp_ec2_sg.id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${var.allocate_elastic_ip ? aws_eip.erp_eip[0].public_ip : aws_instance.erp_server.public_ip}"
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://${var.allocate_elastic_ip ? aws_eip.erp_eip[0].public_ip : aws_instance.erp_server.public_ip}:8080"
}

output "auth_service_url" {
  description = "Auth service API URL"
  value       = "http://${var.allocate_elastic_ip ? aws_eip.erp_eip[0].public_ip : aws_instance.erp_server.public_ip}:8001"
}

output "inventory_service_url" {
  description = "Inventory service API URL"
  value       = "http://${var.allocate_elastic_ip ? aws_eip.erp_eip[0].public_ip : aws_instance.erp_server.public_ip}:8002"
}

output "sales_service_url" {
  description = "Sales service API URL"
  value       = "http://${var.allocate_elastic_ip ? aws_eip.erp_eip[0].public_ip : aws_instance.erp_server.public_ip}:8003"
}
