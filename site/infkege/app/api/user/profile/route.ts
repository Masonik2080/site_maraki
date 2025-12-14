// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthRepository, UserRepository } from '@/lib/dao';

// GET /api/user/profile — get current user profile
export async function GET() {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await UserRepository.getProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: profile.id,
      email: user.email,
      fullName: profile.fullName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      balance: profile.balance,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/user/profile — update profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, username } = await request.json();

    // Validate username format
    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: 'Никнейм должен содержать 3-20 символов (буквы, цифры, _)' },
        { status: 400 }
      );
    }

    const updated = await UserRepository.updateUser(user.id, {
      fullName,
      username,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
