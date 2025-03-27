-- Create the function to ensure profiles table exists
create or replace function create_profiles_if_not_exists()
returns void
language plpgsql
as $$
begin
  -- Check if the profiles table exists
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'profiles') then
    -- Create the profiles table
    create table public.profiles (
      id uuid references auth.users on delete cascade primary key,
      email text unique not null,
      first_name text,
      last_name text,
      user_type text not null check (user_type in ('patient', 'doctor', 'sponsor')),
      organization_name text,
      contact_name text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Set up RLS
    alter table public.profiles enable row level security;

    -- Create policies
    create policy "Public profiles are viewable by everyone."
      on profiles for select
      using ( true );

    create policy "Users can insert their own profile."
      on profiles for insert
      with check ( auth.uid() = id );

    create policy "Users can update own profile."
      on profiles for update
      using ( auth.uid() = id );

    -- Create indexes
    create index profiles_user_type_idx on profiles(user_type);
    create index profiles_email_idx on profiles(email);
  end if;
end;
$$; 