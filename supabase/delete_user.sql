-- Function to allow a user to delete their own account
-- Uses $func$ delimiters to avoid parsing errors
create or replace function delete_user()
returns void
language plpgsql
security definer
as $func$
begin
  -- Delete the user from auth.users (this triggers cascade delete on profiles)
  delete from auth.users where id = auth.uid();
end;
$func$;
