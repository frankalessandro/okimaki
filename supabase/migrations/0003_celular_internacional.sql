-- M3: el cliente puede reservar con un celular de otro país.
-- Con "+" e indicativo distinto de 57 se guarda en E.164 (8 a 15 dígitos); Colombia mantiene su regla.
create or replace function public.normalizar_celular(p text) returns text
language plpgsql immutable set search_path = '' as $$
declare
  crudo text := btrim(coalesce(p, ''));
  d text := regexp_replace(crudo, '\D', '', 'g');
begin
  if left(crudo, 1) = '+' and left(d, 2) <> '57' then
    if length(d) between 8 and 15 and left(d, 1) <> '0' then return '+' || d; end if;
    raise exception 'Celular inválido: revisa el indicativo y el número.';
  end if;
  if length(d) = 12 and left(d, 2) = '57' then d := substr(d, 3); end if;
  if length(d) = 10 and left(d, 1) = '3' then return '+57' || d; end if;
  raise exception 'Celular inválido: en Colombia son 10 dígitos que empiezan por 3.';
end $$;
