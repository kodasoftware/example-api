CREATE TABLE IF NOT EXISTS users (
  id         UUID NOT NULL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  name       VARCHAR(255) NOT NULL,
  deleted    BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_accounts (
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,

  CONSTRAINT pk_user_account
    PRIMARY KEY (user_id, account_id),

  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users (id),

  CONSTRAINT fk_account
    FOREIGN KEY (account_id)
    REFERENCES accounts (id)
);
