# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}


locals {
  # Create a map of availability zones to use for looping.
  # This makes it easy to change from 2 AZs to 3 in the future.
  availability_zones = {
    "a" = data.aws_availability_zones.available.names[0],
    "b" = data.aws_availability_zones.available.names[1]
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each                = local.availability_zones
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${index(keys(local.availability_zones), each.key) + 1}.0/24"
  availability_zone       = each.value
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${each.key}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  for_each          = local.availability_zones
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${index(keys(local.availability_zones), each.key) + 10}.0/24"
  availability_zone = each.value

  tags = {
    Name = "${var.project_name}-private-${each.key}"
    Type = "private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  for_each   = var.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones["a"] }
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-nat-eip-${each.key}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "nat" {
  for_each = var.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones["a"] }
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id

  tags = {
    Name = "${var.project_name}-nat-${each.key}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  for_each = var.environment == "prod" ? local.availability_zones : { "a" = local.availability_zones["a"] }
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[each.key].id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${each.key}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each = aws_route_table.private # Loop over the route tables that were actually created

  subnet_id      = aws_subnet.private[each.key].id # Associate the subnet with the same AZ key ('a', 'b')
  route_table_id = each.value.id
}