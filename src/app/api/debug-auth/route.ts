import { createClient } from '@/lib/db/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const result = await supabase.auth.getUser();

  return NextResponse.json({
    user: result.data.user,
    error: result.error ? {
      message: result.error.message,
      status: result.error.status,
    } : null,
    hasUser: !!result.data.user,
    hasError: !!result.error,
  });
}
