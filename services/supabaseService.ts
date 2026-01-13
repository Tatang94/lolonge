
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pebxcwpnmtjmwlbeseor.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYnhjd3BubXRqbXdsYmVzZW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTAzNjEsImV4cCI6MjA4Mzg2NjM2MX0.cBOPVlF5WYTb9XkDmOMAZrDUTKCskotGbSwN0dotq8s';

export const supabase = createClient(supabaseUrl, supabaseKey);
