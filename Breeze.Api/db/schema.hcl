// schema.hcl — Atlas schema source of truth

schema "public" {
}

// Example: users table (customize as needed)
table "users" {
  column "id" {
    type = uuid
    null = false
    default = sql("gen_random_uuid()")
  }
  column "email" {
    type = varchar(255)
    null = false
    unique = true
  }
  column "created_at" {
    type = timestamp
    null = false
    default = sql("now()")
  }
  primary_key {
    columns = ["id"]
  }
}
