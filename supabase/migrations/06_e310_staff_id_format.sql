-- Migration: 06_e310_staff_id_format.sql
-- Description: Standardize department_users.staff_id values to the E310-XXX format (e.g. E310-002).

update public.department_users
set staff_id = 'E310-' || lpad(((regexp_match(staff_id, '^(?:R4C|E310)-([0-9]+)$', 'i'))[1])::integer::text, 3, '0')
where staff_id ~* '^(?:R4C|E310)-[0-9]+$';

