variable "url" {
  type    = string
  default = getenv("DATABASE_URL")
}

variable "dev_url" {
  type    = string
  default = "docker://postgres/16/dev?search_path=public"
}

env "local" {
  src = "file://db/schema.hcl"
  url = var.url
  dev = var.dev_url
  migration {
    dir = "file://db/migrations"
  }
}

