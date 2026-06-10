import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://hzrfiyqvyilnojrwwdyu.supabase.co/";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cmZpeXF2eWlsbm9qcnd3ZHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTY2NDMsImV4cCI6MjA5NjQ3MjY0M30.AD0cAPOE1RnyrtxfgkvNLiVxjLs2D8AqwyXEHQpGBzA";

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);
