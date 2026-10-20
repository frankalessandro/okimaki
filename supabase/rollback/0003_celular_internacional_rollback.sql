-- Reversa de 0003_celular_internacional: vuelve a aceptar solo celulares colombianos.
-- Los clientes ya guardados con número extranjero se conservan; solo dejan de aceptarse nuevos.
create or replace function public.normalizar_celular(p text) returns text
language plpgsql immutable set search_path = '' as $$
declare d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if length(d) = 12 and left(d, 2) = '57' then d := substr(d, 3); end if;
  if length(d) = 10 and left(d, 1) = '3' then return '+57' || d; end if;
  raise exception 'Celular inválido: usa 10 dígitos que empiecen por 3.';
end $$;
