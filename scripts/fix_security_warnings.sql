-- SQL Script to Fix Security Warnings for Existing Functions
-- Addresses Supabase Linter warnings 0011, 0028, and 0029

-- 1. Fix search_path for mutable functions
ALTER FUNCTION get_my_workspace() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;

-- 2. Revoke public execution for SECURITY DEFINER functions
-- This prevents them from being called via the REST API (RPC) by users/anon

-- For get_my_workspace
REVOKE EXECUTE ON FUNCTION get_my_workspace() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_my_workspace() FROM anon;
REVOKE EXECUTE ON FUNCTION get_my_workspace() FROM authenticated;
GRANT EXECUTE ON FUNCTION get_my_workspace() TO service_role;

-- For handle_new_user
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- 3. If there are other functions mentioned in the linter, apply the same logic:
-- ALTER FUNCTION name(args) SET search_path = public;
-- REVOKE EXECUTE ON FUNCTION name(args) FROM PUBLIC;
