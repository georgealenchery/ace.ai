-- ai-interviewer schema
-- Run with: psql -U <user> -d <database> -f sql/schema.sql
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  name          TEXT,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'fullstack',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Interviews
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS interviews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          TIMESTAMPTZ NOT NULL DEFAULT now(),
  role          TEXT        NOT NULL,
  question_type TEXT        NOT NULL,
  config        JSONB       NOT NULL,
  result        JSONB       NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date    ON interviews(date DESC);

-- Migration: add transcript column if it doesn't exist yet
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS transcript JSONB NOT NULL DEFAULT '[]'::jsonb;
