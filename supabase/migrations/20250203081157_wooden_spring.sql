/*
  # Add tokens table and related functions

  1. New Tables
    - `tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token_amount` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `tokens` table
    - Add policies for users to read and update their own tokens
*/

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  token_amount integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT token_amount_positive CHECK (token_amount >= 0)
);

-- Enable RLS
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own tokens"
  ON tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user token creation
CREATE OR REPLACE FUNCTION handle_new_user_tokens()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tokens (user_id, token_amount)
  VALUES (new.id, 10);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user token creation
CREATE TRIGGER on_auth_user_created_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_tokens();