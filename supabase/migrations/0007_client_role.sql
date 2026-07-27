-- Add a 'client' role for customers who sign up to submit and track their own
-- support/lead messages, distinct from internal 'admin' and 'agent' staff.
alter type user_role add value if not exists 'client';
