-- Create a stored procedure that allows executing SQL from the client
-- This needs to be installed separately in Supabase before running the reset script
CREATE OR REPLACE FUNCTION exec_sql(sql_string text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_string;
END;
$$; 