-- Seed the single default org for single-tenant launch.
insert into orgs (name)
select 'Muya Tech'
where not exists (select 1 from orgs);
