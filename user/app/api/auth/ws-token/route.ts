import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * WebSocket 연결용 토큰 반환 (클라이언트가 HttpOnly 쿠키를 읽을 수 없으므로)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('WS token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
