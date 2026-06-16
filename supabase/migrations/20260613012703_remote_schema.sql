create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "moddatetime" with schema "extensions";

drop extension if exists "pg_net";

create schema if not exists "internal";

create schema if not exists "private";


  create table "public"."activities" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "title" text not null,
    "description" text,
    "location" text,
    "event_date" timestamp with time zone not null,
    "image_url" text,
    "preview_image_url" text,
    "status" text default 'active'::text,
    "date_modified_at" timestamp with time zone,
    "created_by" uuid
      );


alter table "public"."activities" enable row level security;


  create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "table_name" text not null,
    "action" text not null,
    "record_id" text,
    "user_id" uuid,
    "user_email" text,
    "old_data" jsonb,
    "new_data" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."audit_logs" enable row level security;


  create table "public"."configs" (
    "id" text not null,
    "workspace_id" text not null,
    "type" text not null,
    "name" text,
    "data" jsonb not null,
    "modified" timestamp with time zone default now(),
    "_deleted" boolean default false
      );


alter table "public"."configs" enable row level security;


  create table "public"."feedback" (
    "id" bigint generated always as identity not null,
    "type" text not null,
    "message" text not null,
    "app_version" text,
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid
      );


alter table "public"."feedback" enable row level security;


  create table "public"."fuel_schedules" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "date" date not null,
    "person" text not null,
    "created_by" uuid,
    "amount" numeric default 0
      );


alter table "public"."fuel_schedules" enable row level security;


  create table "public"."fuel_transactions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "type" text not null,
    "amount" numeric not null,
    "reason" text,
    "responsible" text not null,
    "operation_date" timestamp with time zone not null default now(),
    "counter" text not null default 'main'::text
      );


alter table "public"."fuel_transactions" enable row level security;


  create table "public"."global_config" (
    "key" text not null,
    "value" jsonb not null,
    "updated_at" timestamp with time zone default now(),
    "updated_by" uuid
      );


alter table "public"."global_config" enable row level security;


  create table "public"."history" (
    "id" text not null,
    "workspace_id" text not null,
    "type" text not null,
    "date" text not null,
    "personnel_id" text not null,
    "data" jsonb not null,
    "modified" timestamp with time zone default now(),
    "_deleted" boolean default false
      );


alter table "public"."history" enable row level security;


  create table "public"."loans" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "item_name" text not null,
    "responsible" text not null,
    "status" text default 'loaned'::text,
    "loan_date" timestamp with time zone not null default now(),
    "return_date" timestamp with time zone,
    "images" text[],
    "return_notes" text,
    "notes" text,
    "given_by" text,
    "returned_by" text
      );


alter table "public"."loans" enable row level security;


  create table "public"."lookups" (
    "id" text not null,
    "workspace_id" text not null,
    "type" text not null,
    "name" text,
    "data" jsonb,
    "modified" timestamp with time zone default now(),
    "_deleted" boolean default false
      );


alter table "public"."lookups" enable row level security;


  create table "public"."municipalities" (
    "id" text not null,
    "state_id" character(3) not null,
    "name" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."municipalities" enable row level security;


  create table "public"."pending_activities" (
    "id" text not null,
    "workspace_id" text not null,
    "date" text not null,
    "time" text not null,
    "text" text not null,
    "category" text not null,
    "status" text not null,
    "completed" boolean not null default false,
    "priority" text not null,
    "subtasks" jsonb not null default '[]'::jsonb,
    "modified" timestamp with time zone not null default timezone('utc'::text, now()),
    "_deleted" boolean not null default false
      );


alter table "public"."pending_activities" enable row level security;


  create table "public"."personnel" (
    "id" text not null,
    "workspace_id" text not null,
    "personnel_id" text,
    "name" text not null,
    "cedula" text,
    "rank" text,
    "cargo" text,
    "titulo" text,
    "role_id" text,
    "status" text,
    "department" text,
    "sex" text,
    "specialties" text[],
    "order" numeric default 0,
    "modified" timestamp with time zone default now(),
    "_deleted" boolean default false
      );


alter table "public"."personnel" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "role" text default 'user'::text,
    "is_admin" boolean default false,
    "is_approved" boolean default false,
    "workspace_id" text,
    "is_verified" boolean default false,
    "allowed_workspaces" text[] default '{}'::text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."reports" (
    "id" text not null,
    "workspace_id" text not null,
    "template_id" text not null,
    "title" text not null,
    "timestamp" timestamp with time zone not null,
    "content" text not null,
    "is_relevant" boolean default false,
    "status" text,
    "form_data" jsonb,
    "modified" timestamp with time zone default now(),
    "_deleted" boolean default false,
    "photos" jsonb,
    "sections" jsonb
      );


alter table "public"."reports" enable row level security;


  create table "public"."scheduled_messages" (
    "id" text not null,
    "workspace_id" text not null,
    "chatId" text not null,
    "message" text,
    "title" text not null,
    "scheduledTime" text not null,
    "status" text not null,
    "error" text,
    "media" jsonb default '[]'::jsonb,
    "modified" timestamp with time zone not null default timezone('utc'::text, now()),
    "_deleted" boolean not null default false
      );


alter table "public"."scheduled_messages" enable row level security;


  create table "public"."states" (
    "id" character(3) not null,
    "name" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."states" enable row level security;


  create table "public"."sync_channels" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "name" text not null,
    "owner_user_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."sync_channels" enable row level security;


  create table "public"."sync_reports" (
    "id" uuid not null default gen_random_uuid(),
    "channel_id" uuid,
    "source_device" text not null,
    "report_data" jsonb not null,
    "status" text default 'pending'::text,
    "sent_at" timestamp with time zone default now()
      );


alter table "public"."sync_reports" enable row level security;


  create table "public"."templates" (
    "id" text not null default (gen_random_uuid())::text,
    "workspace_id" text,
    "name" text not null,
    "content" text not null,
    "type" text default 'normal'::text,
    "is_active" boolean not null default true,
    "statistics_category" text,
    "statistics_sub_categories" jsonb default '[]'::jsonb,
    "statistics_rules" jsonb default '[]'::jsonb,
    "modified" text default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'::text),
    "_deleted" boolean default false
      );


alter table "public"."templates" enable row level security;


  create table "public"."web_push_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subscription" jsonb not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."web_push_subscriptions" enable row level security;


  create table "public"."workspaces" (
    "id" text not null,
    "name" text not null,
    "estado" text,
    "municipio" text,
    "created_at" timestamp with time zone default now(),
    "modified" timestamp with time zone default now(),
    "_deleted" boolean default false
      );


alter table "public"."workspaces" enable row level security;

CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id);

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at DESC);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE INDEX audit_logs_table_name_idx ON public.audit_logs USING btree (table_name);

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);

CREATE UNIQUE INDEX configs_pkey ON public.configs USING btree (id);

CREATE UNIQUE INDEX feedback_pkey ON public.feedback USING btree (id);

CREATE UNIQUE INDEX fuel_schedules_pkey ON public.fuel_schedules USING btree (id);

CREATE UNIQUE INDEX fuel_transactions_pkey ON public.fuel_transactions USING btree (id);

CREATE UNIQUE INDEX global_config_pkey ON public.global_config USING btree (key);

CREATE UNIQUE INDEX history_pkey ON public.history USING btree (id);

CREATE INDEX idx_activities_created_by ON public.activities USING btree (created_by);

CREATE INDEX idx_configs_workspace_id ON public.configs USING btree (workspace_id);

CREATE INDEX idx_configs_workspace_type ON public.configs USING btree (workspace_id, type);

CREATE INDEX idx_global_config_updated_by ON public.global_config USING btree (updated_by);

CREATE INDEX idx_history_workspace_id ON public.history USING btree (workspace_id);

CREATE INDEX idx_history_workspace_type ON public.history USING btree (workspace_id, type);

CREATE INDEX idx_lookups_workspace_id ON public.lookups USING btree (workspace_id);

CREATE INDEX idx_lookups_workspace_type ON public.lookups USING btree (workspace_id, type);

CREATE INDEX idx_personnel_workspace_id ON public.personnel USING btree (workspace_id);

CREATE INDEX idx_reports_workspace_id ON public.reports USING btree (workspace_id);

CREATE INDEX idx_sync_channels_code ON public.sync_channels USING btree (code);

CREATE INDEX idx_sync_channels_owner ON public.sync_channels USING btree (owner_user_id);

CREATE INDEX idx_sync_reports_channel ON public.sync_reports USING btree (channel_id);

CREATE INDEX idx_sync_reports_sent_at ON public.sync_reports USING btree (sent_at);

CREATE INDEX idx_sync_reports_status ON public.sync_reports USING btree (status);

CREATE UNIQUE INDEX loans_pkey ON public.loans USING btree (id);

CREATE UNIQUE INDEX lookups_pkey ON public.lookups USING btree (id);

CREATE UNIQUE INDEX municipalities_pkey ON public.municipalities USING btree (id);

CREATE UNIQUE INDEX municipalities_state_id_name_key ON public.municipalities USING btree (state_id, name);

CREATE UNIQUE INDEX pending_activities_pkey ON public.pending_activities USING btree (id);

CREATE UNIQUE INDEX personnel_pkey ON public.personnel USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);

CREATE UNIQUE INDEX scheduled_messages_pkey ON public.scheduled_messages USING btree (id);

CREATE UNIQUE INDEX states_name_key ON public.states USING btree (name);

CREATE UNIQUE INDEX states_pkey ON public.states USING btree (id);

CREATE UNIQUE INDEX sync_channels_code_key ON public.sync_channels USING btree (code);

CREATE UNIQUE INDEX sync_channels_pkey ON public.sync_channels USING btree (id);

CREATE UNIQUE INDEX sync_reports_pkey ON public.sync_reports USING btree (id);

CREATE UNIQUE INDEX templates_name_key ON public.templates USING btree (name);

CREATE UNIQUE INDEX templates_pkey ON public.templates USING btree (id);

CREATE UNIQUE INDEX web_push_subscriptions_pkey ON public.web_push_subscriptions USING btree (id);

CREATE UNIQUE INDEX web_push_subscriptions_user_id_subscription_key ON public.web_push_subscriptions USING btree (user_id, subscription);

CREATE UNIQUE INDEX workspaces_pkey ON public.workspaces USING btree (id);

alter table "public"."activities" add constraint "activities_pkey" PRIMARY KEY using index "activities_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."configs" add constraint "configs_pkey" PRIMARY KEY using index "configs_pkey";

alter table "public"."feedback" add constraint "feedback_pkey" PRIMARY KEY using index "feedback_pkey";

alter table "public"."fuel_schedules" add constraint "fuel_schedules_pkey" PRIMARY KEY using index "fuel_schedules_pkey";

alter table "public"."fuel_transactions" add constraint "fuel_transactions_pkey" PRIMARY KEY using index "fuel_transactions_pkey";

alter table "public"."global_config" add constraint "global_config_pkey" PRIMARY KEY using index "global_config_pkey";

alter table "public"."history" add constraint "history_pkey" PRIMARY KEY using index "history_pkey";

alter table "public"."loans" add constraint "loans_pkey" PRIMARY KEY using index "loans_pkey";

alter table "public"."lookups" add constraint "lookups_pkey" PRIMARY KEY using index "lookups_pkey";

alter table "public"."municipalities" add constraint "municipalities_pkey" PRIMARY KEY using index "municipalities_pkey";

alter table "public"."pending_activities" add constraint "pending_activities_pkey" PRIMARY KEY using index "pending_activities_pkey";

alter table "public"."personnel" add constraint "personnel_pkey" PRIMARY KEY using index "personnel_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."reports" add constraint "reports_pkey" PRIMARY KEY using index "reports_pkey";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_pkey" PRIMARY KEY using index "scheduled_messages_pkey";

alter table "public"."states" add constraint "states_pkey" PRIMARY KEY using index "states_pkey";

alter table "public"."sync_channels" add constraint "sync_channels_pkey" PRIMARY KEY using index "sync_channels_pkey";

alter table "public"."sync_reports" add constraint "sync_reports_pkey" PRIMARY KEY using index "sync_reports_pkey";

alter table "public"."templates" add constraint "templates_pkey" PRIMARY KEY using index "templates_pkey";

alter table "public"."web_push_subscriptions" add constraint "web_push_subscriptions_pkey" PRIMARY KEY using index "web_push_subscriptions_pkey";

alter table "public"."workspaces" add constraint "workspaces_pkey" PRIMARY KEY using index "workspaces_pkey";

alter table "public"."activities" add constraint "activities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."activities" validate constraint "activities_created_by_fkey";

alter table "public"."activities" add constraint "activities_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text, 'suspended'::text]))) not valid;

alter table "public"."activities" validate constraint "activities_status_check";

alter table "public"."audit_logs" add constraint "audit_logs_action_check" CHECK ((action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text]))) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_action_check";

alter table "public"."audit_logs" add constraint "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_user_id_fkey";

alter table "public"."configs" add constraint "configs_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."configs" validate constraint "configs_workspace_id_fkey";

alter table "public"."feedback" add constraint "feedback_type_check" CHECK ((type = ANY (ARRAY['sugerencia'::text, 'error'::text, 'elogio'::text, 'otro'::text]))) not valid;

alter table "public"."feedback" validate constraint "feedback_type_check";

alter table "public"."fuel_schedules" add constraint "fuel_schedules_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."fuel_schedules" validate constraint "fuel_schedules_created_by_fkey";

alter table "public"."fuel_transactions" add constraint "fuel_transactions_type_check" CHECK ((type = ANY (ARRAY['in'::text, 'out'::text]))) not valid;

alter table "public"."fuel_transactions" validate constraint "fuel_transactions_type_check";

alter table "public"."global_config" add constraint "global_config_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."global_config" validate constraint "global_config_updated_by_fkey";

alter table "public"."history" add constraint "history_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."history" validate constraint "history_workspace_id_fkey";

alter table "public"."loans" add constraint "loans_status_check" CHECK ((status = ANY (ARRAY['loaned'::text, 'missing'::text, 'returned'::text]))) not valid;

alter table "public"."loans" validate constraint "loans_status_check";

alter table "public"."lookups" add constraint "lookups_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."lookups" validate constraint "lookups_workspace_id_fkey";

alter table "public"."municipalities" add constraint "municipalities_state_id_fkey" FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE not valid;

alter table "public"."municipalities" validate constraint "municipalities_state_id_fkey";

alter table "public"."municipalities" add constraint "municipalities_state_id_name_key" UNIQUE using index "municipalities_state_id_name_key";

alter table "public"."pending_activities" add constraint "pending_activities_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."pending_activities" validate constraint "pending_activities_priority_check";

alter table "public"."pending_activities" add constraint "pending_activities_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text]))) not valid;

alter table "public"."pending_activities" validate constraint "pending_activities_status_check";

alter table "public"."pending_activities" add constraint "pending_activities_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."pending_activities" validate constraint "pending_activities_workspace_id_fkey";

alter table "public"."personnel" add constraint "personnel_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."personnel" validate constraint "personnel_workspace_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."reports" add constraint "reports_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."reports" validate constraint "reports_workspace_id_fkey";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text]))) not valid;

alter table "public"."scheduled_messages" validate constraint "scheduled_messages_status_check";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE not valid;

alter table "public"."scheduled_messages" validate constraint "scheduled_messages_workspace_id_fkey";

alter table "public"."states" add constraint "states_name_key" UNIQUE using index "states_name_key";

alter table "public"."sync_channels" add constraint "sync_channels_code_key" UNIQUE using index "sync_channels_code_key";

alter table "public"."sync_channels" add constraint "sync_channels_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."sync_channels" validate constraint "sync_channels_owner_user_id_fkey";

alter table "public"."sync_reports" add constraint "sync_reports_channel_id_fkey" FOREIGN KEY (channel_id) REFERENCES public.sync_channels(id) ON DELETE CASCADE not valid;

alter table "public"."sync_reports" validate constraint "sync_reports_channel_id_fkey";

alter table "public"."templates" add constraint "templates_name_key" UNIQUE using index "templates_name_key";

alter table "public"."web_push_subscriptions" add constraint "web_push_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."web_push_subscriptions" validate constraint "web_push_subscriptions_user_id_fkey";

alter table "public"."web_push_subscriptions" add constraint "web_push_subscriptions_user_id_subscription_key" UNIQUE using index "web_push_subscriptions_user_id_subscription_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION internal.check_workspace_access(ws_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR ws_id = ANY(allowed_workspaces))
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION internal.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) AND is_admin = TRUE
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION private.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_audit_log()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_record_id TEXT;
BEGIN
    -- Obtenemos ID y Email directamente de la sesión (sin consultar tablas)
    v_user_id := auth.uid();
    v_user_email := auth.jwt() ->> 'email';
    
    v_record_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT ELSE NEW.id::TEXT END;

    INSERT INTO public.audit_logs (table_name, action, record_id, user_id, user_email, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_user_id, v_user_email,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END);
        
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true) THEN
    RAISE EXCEPTION 'Solo los administradores pueden eliminar usuarios.';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN RAISE EXCEPTION 'Solo administradores pueden eliminar'; END IF;
  IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'No puedes eliminarte a ti mismo'; END IF;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.feedback_set_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_users()
 RETURNS SETOF json
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT json_build_object(
    'id', u.id,
    'email', u.email,
    'created_at', u.created_at,
    'banned_until', u.banned_until,
    'raw_user_meta_data', u.raw_user_meta_data,
    'is_admin', p.is_admin,
    'workspace_code', p.workspace_id,
    'full_name', p.full_name
  )
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_workspace()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Retorna el workspace_id del perfil del usuario autenticado
  SELECT workspace_id FROM public.profiles WHERE id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_duplicate_template_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Si existe otra plantilla con el mismo nombre y workspace, pero distinto ID
  IF EXISTS (
    SELECT 1 FROM public.templates 
    WHERE name = NEW.name 
    AND workspace_id = NEW.workspace_id 
    AND id != NEW.id
  ) THEN
    -- Le añadimos la etiqueta de copia para que no viole la restricción UNIQUE
    NEW.name := NEW.name || ' (Copia)';
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, workspace_id, email, is_admin, is_approved, allowed_workspaces)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'workspace_id', 'minutasdb'),
    new.email,
    COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, false),
    true, -- Auto-aprobar por ahora
    ARRAY[COALESCE(new.raw_user_meta_data->>'workspace_id', 'minutasdb')]
  );
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin, is_approved)
  VALUES (NEW.id, NEW.email, FALSE, FALSE);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_approved(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE((SELECT is_approved FROM public.profiles WHERE id = user_id), FALSE);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_verified(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN COALESCE((SELECT is_verified FROM public.profiles WHERE id = user_id), FALSE);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.suspend_user(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true) THEN
    RAISE EXCEPTION 'Solo los administradores pueden suspender usuarios.';
  END IF;

  UPDATE auth.users
  SET banned_until = '2099-12-31 23:59:59+00'::timestamptz
  WHERE id = target_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.suspend_user_by_admin(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  target_email TEXT;
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'No puedes suspenderte a ti mismo'; END IF;
  UPDATE auth.users SET banned_until = '2100-01-01 00:00:00+00' WHERE id = target_user_id;
  UPDATE public.profiles SET is_verified = false WHERE id = target_user_id;
  
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  INSERT INTO public.audit_logs (table_name, action, record_id, user_id, user_email, new_data)
  VALUES ('profiles', 'UPDATE', target_user_id::TEXT, auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), jsonb_build_object('message', 'Suspendió al usuario: ' || COALESCE(target_email, target_user_id::text)));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.unsuspend_user(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true) THEN
    RAISE EXCEPTION 'Solo los administradores pueden reactivar usuarios.';
  END IF;

  UPDATE auth.users
  SET banned_until = NULL
  WHERE id = target_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_metadata(target_user_id uuid, meta jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Actualizar Auth (Compatibilidad)
  UPDATE auth.users 
  SET raw_user_meta_data = raw_user_meta_data || meta
  WHERE id = target_user_id;

  -- Actualizar Profiles (Seguridad Real)
  UPDATE public.profiles
  SET 
    is_admin = COALESCE((meta->>'is_admin')::boolean, is_admin),
    workspace_id = COALESCE(meta->>'workspace_code', workspace_id),
    full_name = COALESCE(meta->>'full_name', full_name)
  WHERE id = target_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_name(target_user_id uuid, display_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.profiles SET full_name = display_name WHERE id = target_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_workspace_code()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select (auth.jwt() -> 'user_metadata' ->> 'workspace_code')
$function$
;

CREATE OR REPLACE FUNCTION public.verify_user_by_admin(target_user_id uuid, display_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  target_email TEXT;
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE auth.users SET banned_until = NULL, email_confirmed_at = COALESCE(email_confirmed_at, NOW()) WHERE id = target_user_id;
  UPDATE public.profiles SET is_verified = true, full_name = COALESCE(NULLIF(display_name, ''), full_name) WHERE id = target_user_id;
  
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  INSERT INTO public.audit_logs (table_name, action, record_id, user_id, user_email, new_data)
  VALUES ('profiles', 'UPDATE', target_user_id::TEXT, auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), jsonb_build_object('message', 'Verificó al usuario: ' || COALESCE(target_email, target_user_id::text)));
END;
$function$
;

grant delete on table "public"."activities" to "anon";

grant insert on table "public"."activities" to "anon";

grant references on table "public"."activities" to "anon";

grant select on table "public"."activities" to "anon";

grant trigger on table "public"."activities" to "anon";

grant truncate on table "public"."activities" to "anon";

grant update on table "public"."activities" to "anon";

grant delete on table "public"."activities" to "authenticated";

grant insert on table "public"."activities" to "authenticated";

grant references on table "public"."activities" to "authenticated";

grant select on table "public"."activities" to "authenticated";

grant trigger on table "public"."activities" to "authenticated";

grant truncate on table "public"."activities" to "authenticated";

grant update on table "public"."activities" to "authenticated";

grant delete on table "public"."activities" to "service_role";

grant insert on table "public"."activities" to "service_role";

grant references on table "public"."activities" to "service_role";

grant select on table "public"."activities" to "service_role";

grant trigger on table "public"."activities" to "service_role";

grant truncate on table "public"."activities" to "service_role";

grant update on table "public"."activities" to "service_role";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."configs" to "anon";

grant insert on table "public"."configs" to "anon";

grant references on table "public"."configs" to "anon";

grant select on table "public"."configs" to "anon";

grant trigger on table "public"."configs" to "anon";

grant truncate on table "public"."configs" to "anon";

grant update on table "public"."configs" to "anon";

grant delete on table "public"."configs" to "authenticated";

grant insert on table "public"."configs" to "authenticated";

grant references on table "public"."configs" to "authenticated";

grant select on table "public"."configs" to "authenticated";

grant trigger on table "public"."configs" to "authenticated";

grant truncate on table "public"."configs" to "authenticated";

grant update on table "public"."configs" to "authenticated";

grant delete on table "public"."configs" to "service_role";

grant insert on table "public"."configs" to "service_role";

grant references on table "public"."configs" to "service_role";

grant select on table "public"."configs" to "service_role";

grant trigger on table "public"."configs" to "service_role";

grant truncate on table "public"."configs" to "service_role";

grant update on table "public"."configs" to "service_role";

grant delete on table "public"."feedback" to "anon";

grant insert on table "public"."feedback" to "anon";

grant references on table "public"."feedback" to "anon";

grant select on table "public"."feedback" to "anon";

grant trigger on table "public"."feedback" to "anon";

grant truncate on table "public"."feedback" to "anon";

grant update on table "public"."feedback" to "anon";

grant delete on table "public"."feedback" to "authenticated";

grant insert on table "public"."feedback" to "authenticated";

grant references on table "public"."feedback" to "authenticated";

grant select on table "public"."feedback" to "authenticated";

grant trigger on table "public"."feedback" to "authenticated";

grant truncate on table "public"."feedback" to "authenticated";

grant update on table "public"."feedback" to "authenticated";

grant delete on table "public"."feedback" to "service_role";

grant insert on table "public"."feedback" to "service_role";

grant references on table "public"."feedback" to "service_role";

grant select on table "public"."feedback" to "service_role";

grant trigger on table "public"."feedback" to "service_role";

grant truncate on table "public"."feedback" to "service_role";

grant update on table "public"."feedback" to "service_role";

grant delete on table "public"."fuel_schedules" to "anon";

grant insert on table "public"."fuel_schedules" to "anon";

grant references on table "public"."fuel_schedules" to "anon";

grant select on table "public"."fuel_schedules" to "anon";

grant trigger on table "public"."fuel_schedules" to "anon";

grant truncate on table "public"."fuel_schedules" to "anon";

grant update on table "public"."fuel_schedules" to "anon";

grant delete on table "public"."fuel_schedules" to "authenticated";

grant insert on table "public"."fuel_schedules" to "authenticated";

grant references on table "public"."fuel_schedules" to "authenticated";

grant select on table "public"."fuel_schedules" to "authenticated";

grant trigger on table "public"."fuel_schedules" to "authenticated";

grant truncate on table "public"."fuel_schedules" to "authenticated";

grant update on table "public"."fuel_schedules" to "authenticated";

grant delete on table "public"."fuel_schedules" to "service_role";

grant insert on table "public"."fuel_schedules" to "service_role";

grant references on table "public"."fuel_schedules" to "service_role";

grant select on table "public"."fuel_schedules" to "service_role";

grant trigger on table "public"."fuel_schedules" to "service_role";

grant truncate on table "public"."fuel_schedules" to "service_role";

grant update on table "public"."fuel_schedules" to "service_role";

grant delete on table "public"."fuel_transactions" to "anon";

grant insert on table "public"."fuel_transactions" to "anon";

grant references on table "public"."fuel_transactions" to "anon";

grant select on table "public"."fuel_transactions" to "anon";

grant trigger on table "public"."fuel_transactions" to "anon";

grant truncate on table "public"."fuel_transactions" to "anon";

grant update on table "public"."fuel_transactions" to "anon";

grant delete on table "public"."fuel_transactions" to "authenticated";

grant insert on table "public"."fuel_transactions" to "authenticated";

grant references on table "public"."fuel_transactions" to "authenticated";

grant select on table "public"."fuel_transactions" to "authenticated";

grant trigger on table "public"."fuel_transactions" to "authenticated";

grant truncate on table "public"."fuel_transactions" to "authenticated";

grant update on table "public"."fuel_transactions" to "authenticated";

grant delete on table "public"."fuel_transactions" to "service_role";

grant insert on table "public"."fuel_transactions" to "service_role";

grant references on table "public"."fuel_transactions" to "service_role";

grant select on table "public"."fuel_transactions" to "service_role";

grant trigger on table "public"."fuel_transactions" to "service_role";

grant truncate on table "public"."fuel_transactions" to "service_role";

grant update on table "public"."fuel_transactions" to "service_role";

grant delete on table "public"."global_config" to "anon";

grant insert on table "public"."global_config" to "anon";

grant references on table "public"."global_config" to "anon";

grant select on table "public"."global_config" to "anon";

grant trigger on table "public"."global_config" to "anon";

grant truncate on table "public"."global_config" to "anon";

grant update on table "public"."global_config" to "anon";

grant delete on table "public"."global_config" to "authenticated";

grant insert on table "public"."global_config" to "authenticated";

grant references on table "public"."global_config" to "authenticated";

grant select on table "public"."global_config" to "authenticated";

grant trigger on table "public"."global_config" to "authenticated";

grant truncate on table "public"."global_config" to "authenticated";

grant update on table "public"."global_config" to "authenticated";

grant delete on table "public"."global_config" to "service_role";

grant insert on table "public"."global_config" to "service_role";

grant references on table "public"."global_config" to "service_role";

grant select on table "public"."global_config" to "service_role";

grant trigger on table "public"."global_config" to "service_role";

grant truncate on table "public"."global_config" to "service_role";

grant update on table "public"."global_config" to "service_role";

grant delete on table "public"."history" to "anon";

grant insert on table "public"."history" to "anon";

grant references on table "public"."history" to "anon";

grant select on table "public"."history" to "anon";

grant trigger on table "public"."history" to "anon";

grant truncate on table "public"."history" to "anon";

grant update on table "public"."history" to "anon";

grant delete on table "public"."history" to "authenticated";

grant insert on table "public"."history" to "authenticated";

grant references on table "public"."history" to "authenticated";

grant select on table "public"."history" to "authenticated";

grant trigger on table "public"."history" to "authenticated";

grant truncate on table "public"."history" to "authenticated";

grant update on table "public"."history" to "authenticated";

grant delete on table "public"."history" to "service_role";

grant insert on table "public"."history" to "service_role";

grant references on table "public"."history" to "service_role";

grant select on table "public"."history" to "service_role";

grant trigger on table "public"."history" to "service_role";

grant truncate on table "public"."history" to "service_role";

grant update on table "public"."history" to "service_role";

grant delete on table "public"."loans" to "anon";

grant insert on table "public"."loans" to "anon";

grant references on table "public"."loans" to "anon";

grant select on table "public"."loans" to "anon";

grant trigger on table "public"."loans" to "anon";

grant truncate on table "public"."loans" to "anon";

grant update on table "public"."loans" to "anon";

grant delete on table "public"."loans" to "authenticated";

grant insert on table "public"."loans" to "authenticated";

grant references on table "public"."loans" to "authenticated";

grant select on table "public"."loans" to "authenticated";

grant trigger on table "public"."loans" to "authenticated";

grant truncate on table "public"."loans" to "authenticated";

grant update on table "public"."loans" to "authenticated";

grant delete on table "public"."loans" to "service_role";

grant insert on table "public"."loans" to "service_role";

grant references on table "public"."loans" to "service_role";

grant select on table "public"."loans" to "service_role";

grant trigger on table "public"."loans" to "service_role";

grant truncate on table "public"."loans" to "service_role";

grant update on table "public"."loans" to "service_role";

grant delete on table "public"."lookups" to "anon";

grant insert on table "public"."lookups" to "anon";

grant references on table "public"."lookups" to "anon";

grant select on table "public"."lookups" to "anon";

grant trigger on table "public"."lookups" to "anon";

grant truncate on table "public"."lookups" to "anon";

grant update on table "public"."lookups" to "anon";

grant delete on table "public"."lookups" to "authenticated";

grant insert on table "public"."lookups" to "authenticated";

grant references on table "public"."lookups" to "authenticated";

grant select on table "public"."lookups" to "authenticated";

grant trigger on table "public"."lookups" to "authenticated";

grant truncate on table "public"."lookups" to "authenticated";

grant update on table "public"."lookups" to "authenticated";

grant delete on table "public"."lookups" to "service_role";

grant insert on table "public"."lookups" to "service_role";

grant references on table "public"."lookups" to "service_role";

grant select on table "public"."lookups" to "service_role";

grant trigger on table "public"."lookups" to "service_role";

grant truncate on table "public"."lookups" to "service_role";

grant update on table "public"."lookups" to "service_role";

grant delete on table "public"."municipalities" to "anon";

grant insert on table "public"."municipalities" to "anon";

grant references on table "public"."municipalities" to "anon";

grant select on table "public"."municipalities" to "anon";

grant trigger on table "public"."municipalities" to "anon";

grant truncate on table "public"."municipalities" to "anon";

grant update on table "public"."municipalities" to "anon";

grant delete on table "public"."municipalities" to "authenticated";

grant insert on table "public"."municipalities" to "authenticated";

grant references on table "public"."municipalities" to "authenticated";

grant select on table "public"."municipalities" to "authenticated";

grant trigger on table "public"."municipalities" to "authenticated";

grant truncate on table "public"."municipalities" to "authenticated";

grant update on table "public"."municipalities" to "authenticated";

grant delete on table "public"."municipalities" to "service_role";

grant insert on table "public"."municipalities" to "service_role";

grant references on table "public"."municipalities" to "service_role";

grant select on table "public"."municipalities" to "service_role";

grant trigger on table "public"."municipalities" to "service_role";

grant truncate on table "public"."municipalities" to "service_role";

grant update on table "public"."municipalities" to "service_role";

grant delete on table "public"."pending_activities" to "anon";

grant insert on table "public"."pending_activities" to "anon";

grant references on table "public"."pending_activities" to "anon";

grant select on table "public"."pending_activities" to "anon";

grant trigger on table "public"."pending_activities" to "anon";

grant truncate on table "public"."pending_activities" to "anon";

grant update on table "public"."pending_activities" to "anon";

grant delete on table "public"."pending_activities" to "authenticated";

grant insert on table "public"."pending_activities" to "authenticated";

grant references on table "public"."pending_activities" to "authenticated";

grant select on table "public"."pending_activities" to "authenticated";

grant trigger on table "public"."pending_activities" to "authenticated";

grant truncate on table "public"."pending_activities" to "authenticated";

grant update on table "public"."pending_activities" to "authenticated";

grant delete on table "public"."pending_activities" to "service_role";

grant insert on table "public"."pending_activities" to "service_role";

grant references on table "public"."pending_activities" to "service_role";

grant select on table "public"."pending_activities" to "service_role";

grant trigger on table "public"."pending_activities" to "service_role";

grant truncate on table "public"."pending_activities" to "service_role";

grant update on table "public"."pending_activities" to "service_role";

grant delete on table "public"."personnel" to "anon";

grant insert on table "public"."personnel" to "anon";

grant references on table "public"."personnel" to "anon";

grant select on table "public"."personnel" to "anon";

grant trigger on table "public"."personnel" to "anon";

grant truncate on table "public"."personnel" to "anon";

grant update on table "public"."personnel" to "anon";

grant delete on table "public"."personnel" to "authenticated";

grant insert on table "public"."personnel" to "authenticated";

grant references on table "public"."personnel" to "authenticated";

grant select on table "public"."personnel" to "authenticated";

grant trigger on table "public"."personnel" to "authenticated";

grant truncate on table "public"."personnel" to "authenticated";

grant update on table "public"."personnel" to "authenticated";

grant delete on table "public"."personnel" to "service_role";

grant insert on table "public"."personnel" to "service_role";

grant references on table "public"."personnel" to "service_role";

grant select on table "public"."personnel" to "service_role";

grant trigger on table "public"."personnel" to "service_role";

grant truncate on table "public"."personnel" to "service_role";

grant update on table "public"."personnel" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."reports" to "anon";

grant insert on table "public"."reports" to "anon";

grant references on table "public"."reports" to "anon";

grant select on table "public"."reports" to "anon";

grant trigger on table "public"."reports" to "anon";

grant truncate on table "public"."reports" to "anon";

grant update on table "public"."reports" to "anon";

grant delete on table "public"."reports" to "authenticated";

grant insert on table "public"."reports" to "authenticated";

grant references on table "public"."reports" to "authenticated";

grant select on table "public"."reports" to "authenticated";

grant trigger on table "public"."reports" to "authenticated";

grant truncate on table "public"."reports" to "authenticated";

grant update on table "public"."reports" to "authenticated";

grant delete on table "public"."reports" to "service_role";

grant insert on table "public"."reports" to "service_role";

grant references on table "public"."reports" to "service_role";

grant select on table "public"."reports" to "service_role";

grant trigger on table "public"."reports" to "service_role";

grant truncate on table "public"."reports" to "service_role";

grant update on table "public"."reports" to "service_role";

grant delete on table "public"."scheduled_messages" to "anon";

grant insert on table "public"."scheduled_messages" to "anon";

grant references on table "public"."scheduled_messages" to "anon";

grant select on table "public"."scheduled_messages" to "anon";

grant trigger on table "public"."scheduled_messages" to "anon";

grant truncate on table "public"."scheduled_messages" to "anon";

grant update on table "public"."scheduled_messages" to "anon";

grant delete on table "public"."scheduled_messages" to "authenticated";

grant insert on table "public"."scheduled_messages" to "authenticated";

grant references on table "public"."scheduled_messages" to "authenticated";

grant select on table "public"."scheduled_messages" to "authenticated";

grant trigger on table "public"."scheduled_messages" to "authenticated";

grant truncate on table "public"."scheduled_messages" to "authenticated";

grant update on table "public"."scheduled_messages" to "authenticated";

grant delete on table "public"."scheduled_messages" to "service_role";

grant insert on table "public"."scheduled_messages" to "service_role";

grant references on table "public"."scheduled_messages" to "service_role";

grant select on table "public"."scheduled_messages" to "service_role";

grant trigger on table "public"."scheduled_messages" to "service_role";

grant truncate on table "public"."scheduled_messages" to "service_role";

grant update on table "public"."scheduled_messages" to "service_role";

grant delete on table "public"."states" to "anon";

grant insert on table "public"."states" to "anon";

grant references on table "public"."states" to "anon";

grant select on table "public"."states" to "anon";

grant trigger on table "public"."states" to "anon";

grant truncate on table "public"."states" to "anon";

grant update on table "public"."states" to "anon";

grant delete on table "public"."states" to "authenticated";

grant insert on table "public"."states" to "authenticated";

grant references on table "public"."states" to "authenticated";

grant select on table "public"."states" to "authenticated";

grant trigger on table "public"."states" to "authenticated";

grant truncate on table "public"."states" to "authenticated";

grant update on table "public"."states" to "authenticated";

grant delete on table "public"."states" to "service_role";

grant insert on table "public"."states" to "service_role";

grant references on table "public"."states" to "service_role";

grant select on table "public"."states" to "service_role";

grant trigger on table "public"."states" to "service_role";

grant truncate on table "public"."states" to "service_role";

grant update on table "public"."states" to "service_role";

grant delete on table "public"."sync_channels" to "anon";

grant insert on table "public"."sync_channels" to "anon";

grant references on table "public"."sync_channels" to "anon";

grant select on table "public"."sync_channels" to "anon";

grant trigger on table "public"."sync_channels" to "anon";

grant truncate on table "public"."sync_channels" to "anon";

grant update on table "public"."sync_channels" to "anon";

grant delete on table "public"."sync_channels" to "authenticated";

grant insert on table "public"."sync_channels" to "authenticated";

grant references on table "public"."sync_channels" to "authenticated";

grant select on table "public"."sync_channels" to "authenticated";

grant trigger on table "public"."sync_channels" to "authenticated";

grant truncate on table "public"."sync_channels" to "authenticated";

grant update on table "public"."sync_channels" to "authenticated";

grant delete on table "public"."sync_channels" to "service_role";

grant insert on table "public"."sync_channels" to "service_role";

grant references on table "public"."sync_channels" to "service_role";

grant select on table "public"."sync_channels" to "service_role";

grant trigger on table "public"."sync_channels" to "service_role";

grant truncate on table "public"."sync_channels" to "service_role";

grant update on table "public"."sync_channels" to "service_role";

grant delete on table "public"."sync_reports" to "anon";

grant insert on table "public"."sync_reports" to "anon";

grant references on table "public"."sync_reports" to "anon";

grant select on table "public"."sync_reports" to "anon";

grant trigger on table "public"."sync_reports" to "anon";

grant truncate on table "public"."sync_reports" to "anon";

grant update on table "public"."sync_reports" to "anon";

grant delete on table "public"."sync_reports" to "authenticated";

grant insert on table "public"."sync_reports" to "authenticated";

grant references on table "public"."sync_reports" to "authenticated";

grant select on table "public"."sync_reports" to "authenticated";

grant trigger on table "public"."sync_reports" to "authenticated";

grant truncate on table "public"."sync_reports" to "authenticated";

grant update on table "public"."sync_reports" to "authenticated";

grant delete on table "public"."sync_reports" to "service_role";

grant insert on table "public"."sync_reports" to "service_role";

grant references on table "public"."sync_reports" to "service_role";

grant select on table "public"."sync_reports" to "service_role";

grant trigger on table "public"."sync_reports" to "service_role";

grant truncate on table "public"."sync_reports" to "service_role";

grant update on table "public"."sync_reports" to "service_role";

grant delete on table "public"."templates" to "anon";

grant insert on table "public"."templates" to "anon";

grant references on table "public"."templates" to "anon";

grant select on table "public"."templates" to "anon";

grant trigger on table "public"."templates" to "anon";

grant truncate on table "public"."templates" to "anon";

grant update on table "public"."templates" to "anon";

grant delete on table "public"."templates" to "authenticated";

grant insert on table "public"."templates" to "authenticated";

grant references on table "public"."templates" to "authenticated";

grant select on table "public"."templates" to "authenticated";

grant trigger on table "public"."templates" to "authenticated";

grant truncate on table "public"."templates" to "authenticated";

grant update on table "public"."templates" to "authenticated";

grant delete on table "public"."templates" to "service_role";

grant insert on table "public"."templates" to "service_role";

grant references on table "public"."templates" to "service_role";

grant select on table "public"."templates" to "service_role";

grant trigger on table "public"."templates" to "service_role";

grant truncate on table "public"."templates" to "service_role";

grant update on table "public"."templates" to "service_role";

grant delete on table "public"."web_push_subscriptions" to "anon";

grant insert on table "public"."web_push_subscriptions" to "anon";

grant references on table "public"."web_push_subscriptions" to "anon";

grant select on table "public"."web_push_subscriptions" to "anon";

grant trigger on table "public"."web_push_subscriptions" to "anon";

grant truncate on table "public"."web_push_subscriptions" to "anon";

grant update on table "public"."web_push_subscriptions" to "anon";

grant delete on table "public"."web_push_subscriptions" to "authenticated";

grant insert on table "public"."web_push_subscriptions" to "authenticated";

grant references on table "public"."web_push_subscriptions" to "authenticated";

grant select on table "public"."web_push_subscriptions" to "authenticated";

grant trigger on table "public"."web_push_subscriptions" to "authenticated";

grant truncate on table "public"."web_push_subscriptions" to "authenticated";

grant update on table "public"."web_push_subscriptions" to "authenticated";

grant delete on table "public"."web_push_subscriptions" to "service_role";

grant insert on table "public"."web_push_subscriptions" to "service_role";

grant references on table "public"."web_push_subscriptions" to "service_role";

grant select on table "public"."web_push_subscriptions" to "service_role";

grant trigger on table "public"."web_push_subscriptions" to "service_role";

grant truncate on table "public"."web_push_subscriptions" to "service_role";

grant update on table "public"."web_push_subscriptions" to "service_role";

grant delete on table "public"."workspaces" to "anon";

grant insert on table "public"."workspaces" to "anon";

grant references on table "public"."workspaces" to "anon";

grant select on table "public"."workspaces" to "anon";

grant trigger on table "public"."workspaces" to "anon";

grant truncate on table "public"."workspaces" to "anon";

grant update on table "public"."workspaces" to "anon";

grant delete on table "public"."workspaces" to "authenticated";

grant insert on table "public"."workspaces" to "authenticated";

grant references on table "public"."workspaces" to "authenticated";

grant select on table "public"."workspaces" to "authenticated";

grant trigger on table "public"."workspaces" to "authenticated";

grant truncate on table "public"."workspaces" to "authenticated";

grant update on table "public"."workspaces" to "authenticated";

grant delete on table "public"."workspaces" to "service_role";

grant insert on table "public"."workspaces" to "service_role";

grant references on table "public"."workspaces" to "service_role";

grant select on table "public"."workspaces" to "service_role";

grant trigger on table "public"."workspaces" to "service_role";

grant truncate on table "public"."workspaces" to "service_role";

grant update on table "public"."workspaces" to "service_role";


  create policy "Acceso total personal aprobado"
  on "public"."activities"
  as permissive
  for all
  to authenticated
  using ((public.is_user_approved((select auth.uid())) = true))
  with check ((public.is_user_approved((select auth.uid())) = true));


  create policy "Solo admins ven actividad"
  on "public"."audit_logs"
  as permissive
  for all
  to public
using (internal.is_admin());



  create policy "Acceso por workspace"
  on "public"."configs"
  as permissive
  for all
  to authenticated
using ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))));



  create policy "Solo admins ven actividad"
  on "public"."feedback"
  as permissive
  for all
  to public
using (internal.is_admin());



  create policy "Admin/Jefe: Gestión Cronograma (Insert)"
  on "public"."fuel_schedules"
  as permissive
  for insert
  to authenticated
  with check (((public.is_user_approved((select auth.uid())) = true) AND (public.get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'service_chief'::text]))));

  create policy "Admin/Jefe: Gestión Cronograma (Update)"
  on "public"."fuel_schedules"
  as permissive
  for update
  to authenticated
  using (((public.is_user_approved((select auth.uid())) = true) AND (public.get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'service_chief'::text]))))
  with check (((public.is_user_approved((select auth.uid())) = true) AND (public.get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'service_chief'::text]))));

  create policy "Admin/Jefe: Gestión Cronograma (Delete)"
  on "public"."fuel_schedules"
  as permissive
  for delete
  to authenticated
  using (((public.is_user_approved((select auth.uid())) = true) AND (public.get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'service_chief'::text]))));

  create policy "Todo Personal: Ver Cronograma"
  on "public"."fuel_schedules"
  as permissive
  for select
  to authenticated
  using ((public.is_user_approved((select auth.uid())) = true));



  create policy "Admin/Jefe: Gestión Combustible (Insert)"
  on "public"."fuel_transactions"
  as permissive
  for insert
  to authenticated
  with check (((public.is_user_approved((select auth.uid())) = true) AND (public.get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'service_chief'::text]))));

  create policy "Admin/Jefe: Gestión Combustible (Update)"
  on "public"."fuel_transactions"
  as permissive
  for update
  to authenticated
  using (((public.is_user_approved((select auth.uid())) = true) AND (public.get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'service_chief'::text]))))
  with check (((public.is_user_approved((select auth.uid())) = true) AND (public.get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'service_chief'::text]))));

  create policy "Admin/Jefe: Gestión Combustible (Delete)"
  on "public"."fuel_transactions"
  as permissive
  for delete
  to authenticated
  using (((public.is_user_approved((select auth.uid())) = true) AND (public.get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'service_chief'::text]))));

  create policy "Todo Personal: Ver Combustible"
  on "public"."fuel_transactions"
  as permissive
  for select
  to authenticated
  using ((public.is_user_approved((select auth.uid())) = true));



  create policy "Escritura de configuración reservada a admins (Insert)"
  on "public"."global_config"
  as permissive
  for insert
  to authenticated
  with check (internal.is_admin());

  create policy "Escritura de configuración reservada a admins (Update)"
  on "public"."global_config"
  as permissive
  for update
  to authenticated
  using (internal.is_admin())
  with check (internal.is_admin());

  create policy "Escritura de configuración reservada a admins (Delete)"
  on "public"."global_config"
  as permissive
  for delete
  to authenticated
  using (internal.is_admin());



  create policy "Lectura pública autenticada de configuración"
  on "public"."global_config"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Acceso por workspace"
  on "public"."history"
  as permissive
  for all
  to authenticated
using ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))));





  create policy "Acceso total personal aprobado"
  on "public"."loans"
  as permissive
  for all
  to authenticated
  using ((public.is_user_approved((select auth.uid())) = true))
  with check ((public.is_user_approved((select auth.uid())) = true));



  create policy "Acceso por workspace"
  on "public"."lookups"
  as permissive
  for all
  to authenticated
using ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))));



  create policy "Lectura publica"
  on "public"."municipalities"
  as permissive
  for select
  to public
using (true);



  create policy "Solo admin gestiona (Insert)"
  on "public"."municipalities"
  as permissive
  for insert
  to public
  with check (internal.is_admin());

  create policy "Solo admin gestiona (Update)"
  on "public"."municipalities"
  as permissive
  for update
  to public
  using (internal.is_admin())
  with check (internal.is_admin());

  create policy "Solo admin gestiona (Delete)"
  on "public"."municipalities"
  as permissive
  for delete
  to public
  using (internal.is_admin());



  create policy "Acceso por workspace"
  on "public"."pending_activities"
  as permissive
  for all
  to authenticated
using ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))))
with check ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))));



  create policy "Acceso por workspace"
  on "public"."personnel"
  as permissive
  for all
  to authenticated
using ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))));



  create policy "Permitir a administradores modificar perfiles"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using (internal.is_admin());



  create policy "Permitir lectura de perfiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
  using ((internal.is_admin() OR ((select auth.uid()) = id)));



  create policy "Acceso por workspace"
  on "public"."reports"
  as permissive
  for all
  to authenticated
using ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))));



  create policy "Acceso por workspace"
  on "public"."scheduled_messages"
  as permissive
  for all
  to authenticated
using ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))))
with check ((internal.is_admin() OR (workspace_id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.is_approved = true))))));



  create policy "Lectura publica"
  on "public"."states"
  as permissive
  for select
  to public
using (true);



  create policy "Solo admin gestiona (Insert)"
  on "public"."states"
  as permissive
  for insert
  to public
  with check (internal.is_admin());

  create policy "Solo admin gestiona (Update)"
  on "public"."states"
  as permissive
  for update
  to public
  using (internal.is_admin())
  with check (internal.is_admin());

  create policy "Solo admin gestiona (Delete)"
  on "public"."states"
  as permissive
  for delete
  to public
  using (internal.is_admin());



  create policy "Permitir lectura general de canales"
  on "public"."sync_channels"
  as permissive
  for select
  to authenticated
  using (true);

  create policy "Permitir insercion de canales"
  on "public"."sync_channels"
  as permissive
  for insert
  to authenticated
  with check (((select auth.uid()) = owner_user_id) OR internal.is_admin());

  create policy "Permitir modificacion de canales"
  on "public"."sync_channels"
  as permissive
  for update
  to authenticated
  using (((select auth.uid()) = owner_user_id) OR internal.is_admin())
  with check (((select auth.uid()) = owner_user_id) OR internal.is_admin());

  create policy "Permitir eliminacion de canales"
  on "public"."sync_channels"
  as permissive
  for delete
  to authenticated
  using (((select auth.uid()) = owner_user_id) OR internal.is_admin());



  create policy "Eliminación de reportes reservada al dueño o admin"
  on "public"."sync_reports"
  as permissive
  for delete
  to authenticated
  using ((internal.is_admin() OR (EXISTS ( SELECT 1
   FROM public.sync_channels
  WHERE ((sync_channels.id = sync_reports.channel_id) AND (sync_channels.owner_user_id = (select auth.uid())))))));

  create policy "Lectura de reportes reservada al dueño o admin"
  on "public"."sync_reports"
  as permissive
  for select
  to authenticated
  using ((internal.is_admin() OR (EXISTS ( SELECT 1
   FROM public.sync_channels
  WHERE ((sync_channels.id = sync_reports.channel_id) AND (sync_channels.owner_user_id = (select auth.uid())))))));

  create policy "Permitir envío de reportes o admin"
  on "public"."sync_reports"
  as permissive
  for insert
  to authenticated
  with check ((internal.is_admin() OR (EXISTS ( SELECT 1
   FROM public.sync_channels
  WHERE (sync_channels.id = sync_reports.channel_id)))));



  create policy "Permitir lectura pública de plantillas"
  on "public"."templates"
  as permissive
  for select
  to public
  using (true);

  create policy "Acceso total para usuarios autenticados (Insert)"
  on "public"."templates"
  as permissive
  for insert
  to authenticated
  with check (((select auth.role()) = 'authenticated'::text));

  create policy "Acceso total para usuarios autenticados (Update)"
  on "public"."templates"
  as permissive
  for update
  to authenticated
  using (((select auth.role()) = 'authenticated'::text))
  with check (((select auth.role()) = 'authenticated'::text));

  create policy "Acceso total para usuarios autenticados (Delete)"
  on "public"."templates"
  as permissive
  for delete
  to authenticated
  using (((select auth.role()) = 'authenticated'::text));



  create policy "Solo admins ven actividad"
  on "public"."web_push_subscriptions"
  as permissive
  for all
  to public
using (internal.is_admin());



  create policy "Escritura de workspaces reservada a admins (Insert)"
  on "public"."workspaces"
  as permissive
  for insert
  to authenticated
  with check (internal.is_admin());

  create policy "Escritura de workspaces reservada a admins (Update)"
  on "public"."workspaces"
  as permissive
  for update
  to authenticated
  using (internal.is_admin())
  with check (internal.is_admin());

  create policy "Escritura de workspaces reservada a admins (Delete)"
  on "public"."workspaces"
  as permissive
  for delete
  to authenticated
  using (internal.is_admin());

  create policy "Lectura segmentada de workspaces"
  on "public"."workspaces"
  as permissive
  for select
  to authenticated
  using ((internal.is_admin() OR (id IN ( SELECT unnest(profiles.allowed_workspaces) AS unnest
   FROM public.profiles
  WHERE (profiles.id = (SELECT auth.uid()))))));


CREATE TRIGGER audit_activities AFTER INSERT OR DELETE OR UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER tr_feedback_set_user_id BEFORE INSERT ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.feedback_set_user_id();

CREATE TRIGGER audit_loans AFTER INSERT OR DELETE OR UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


  create policy "Authenticated can list own images"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'activity-images'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));



  create policy "Usuarios autenticados pueden subir imágenes"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'activity-images'::text));



  create policy "Usuarios autenticados pueden ver sus propios objetos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'activity-images'::text) AND (owner = auth.uid())));



  create policy "Usuarios pueden actualizar sus propios objetos"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'activity-images'::text) AND (owner = auth.uid())))
with check (((bucket_id = 'activity-images'::text) AND (owner = auth.uid())));



  create policy "Usuarios pueden eliminar sus propios objetos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'activity-images'::text) AND (owner = auth.uid())));



CREATE INDEX IF NOT EXISTS fuel_schedules_created_by_idx ON public.fuel_schedules(created_by);
CREATE INDEX IF NOT EXISTS pending_activities_workspace_id_idx ON public.pending_activities(workspace_id);
CREATE INDEX IF NOT EXISTS scheduled_messages_workspace_id_idx ON public.scheduled_messages(workspace_id);
