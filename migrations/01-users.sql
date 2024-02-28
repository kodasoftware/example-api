CREATE TABLE IF NOT EXISTS users (
  id         UUID NOT NULL PRIMARY KEY,
  account_id UUID NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  name       VARCHAR(255) NOT NULL,
  deleted    BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

  CONSTRAINT fk_user_account
    FOREIGN KEY (account_id)
    REFERENCES accounts (id)
);
