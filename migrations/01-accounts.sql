CREATE TABLE IF NOT EXISTS accounts (
  id            UUID NOT NULL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  deleted       boolean NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL
);
