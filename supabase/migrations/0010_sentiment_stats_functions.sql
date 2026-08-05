-- Aggregation functions backing the dashboard sentiment/priority charts.

-- Pie chart: counts per sentiment
create or replace function email_sentiment_counts(p_org_id uuid)
returns table (sentiment text, count bigint)
language sql stable as $$
  select coalesce(sentiment::text, 'Unset') as sentiment, count(*) as count
  from emails
  where org_id = p_org_id
  group by sentiment
  order by sentiment;
$$;

-- Line chart: average sentiment_score per day, last 30 days
create or replace function email_sentiment_trend_30d(p_org_id uuid)
returns table (day date, avg_sentiment_score numeric)
language sql stable as $$
  select date_trunc('day', created_at)::date as day,
         round(avg(sentiment_score)::numeric, 3) as avg_sentiment_score
  from emails
  where org_id = p_org_id
    and created_at >= now() - interval '30 days'
    and sentiment_score is not null
  group by day
  order by day;
$$;

-- Stacked bar: Priority x Sentiment cross-tab
create or replace function email_priority_vs_sentiment(p_org_id uuid)
returns table (priority text, sentiment text, count bigint)
language sql stable as $$
  select coalesce(priority::text, 'Unset') as priority,
         coalesce(sentiment::text, 'Unset') as sentiment,
         count(*) as count
  from emails
  where org_id = p_org_id
  group by priority, sentiment
  order by priority, sentiment;
$$;
