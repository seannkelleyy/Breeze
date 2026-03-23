variable "url" {
  type    = string
  default = getenv("DATABASE_URL")
}

env "local" {
  src = "file://db/schema" // directory of .hcl files
  url = var.url
  migration {
    dir = "file://db/migrations"
  }
}

