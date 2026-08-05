-- Sentiment analysis columns for emails and leads.

create type email_sentiment as enum ('Positive', 'Neutral', 'Negative');
create type lead_sentiment as enum ('Positive', 'Neutral', 'Negative');

alter table emails
  add column sentiment email_sentiment,
  add column sentiment_score numeric(3, 2) check (sentiment_score >= 0 and sentiment_score <= 1);

alter table leads
  add column sentiment lead_sentiment,
  add column sentiment_score numeric(3, 2) check (sentiment_score >= 0 and sentiment_score <= 1);

create index if not exists emails_sentiment_idx on emails (sentiment);
create index if not exists emails_created_at_idx on emails (created_at);
create index if not exists leads_sentiment_idx on leads (sentiment);
