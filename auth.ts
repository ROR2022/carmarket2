import { createClient } from '@/utils/supabase/server';
//import { cookies } from 'next/headers';

// Define session type
export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

// Auth function that returns the current session
export async function auth(): Promise<Session | null> {
  try {
    //const cookieStore = cookies();
    const supabase = await createClient();
    
    //const { data: { session }, error } = await supabase.auth.getSession();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    
    return {
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata.name
      }
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
} 