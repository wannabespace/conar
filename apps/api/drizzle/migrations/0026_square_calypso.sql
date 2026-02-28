DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typname = 'connection_type' AND e.enumlabel = 'supabase'
  ) THEN
    ALTER TYPE "public"."connection_type" ADD VALUE 'supabase' BEFORE 'mysql';
  END IF;
END
$$;
