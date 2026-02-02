// Application DTOs - Data Transfer Objects
export interface RegisterUserDto {
  username: string;
  fullName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  password: string;
  avatarUrl?: string | null; // Will be set after file upload (or null to clear)
}

export interface LoginUserDto {
  usernameOrEmail: string; // Can be username or email
  password: string;
}

export interface AuthTokensDto {
  access: string;
  refresh: string;
}

export interface UserResponseDto {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  points: number;
  wallet: {
    dinar: number;
    usdMinor: number;
    txCount: number;
  };
  level: number;
  xp: number;
  xpToNext: number;
  profile: {
    avatarUrl?: string | null;
    bio?: string | null;
    bannerColor?: string | null;
  };
  stats: {
    dropsParticipated: number;
    itemsPurchased: number;
    barterTrades: number;
    rewardsClaimed: number;
    badgesEarned: number;
    lastLevelUp?: Date | null;
  };
}

export interface AuthResponseDto {
  user: UserResponseDto;
  tokens: AuthTokensDto;
}

export interface UpdateUserDto {
  username?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string | null;
}
