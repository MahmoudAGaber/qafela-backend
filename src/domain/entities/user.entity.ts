// Domain Entity - Pure business logic, no framework dependencies
export interface Wallet {
  dinar: number;
  usdMinor: number;
  txCount: number;
}

export interface ProfileInfo {
  avatarUrl?: string | null;
  bio?: string | null;
  bannerColor?: string | null;
}

export interface UserStats {
  dropsParticipated: number;
  itemsPurchased: number;
  barterTrades: number;
  rewardsClaimed: number;
  badgesEarned: number;
  lastLevelUp?: Date;
}

export class UserEntity {
  constructor(
    public id: string,
    public username: string,
    public fullName: string,
    public email: string,
    public countryCode: string,
    public phoneNumber: string,
    public avatarUrl?: string | null,
    public passwordHash?: string,
    public points: number = 0,
    public weeklyPoints: number = 0,
    public wallet: Wallet = { dinar: 1000, usdMinor: 0, txCount: 0 },
    public level: number = 1,
    public xp: number = 0,
    public xpToNext: number = 100,
    public profile: ProfileInfo = {},
    public stats: UserStats = {
      dropsParticipated: 0,
      itemsPurchased: 0,
      barterTrades: 0,
      rewardsClaimed: 0,
      badgesEarned: 0,
    },
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}

  static fromDocument(doc: any): UserEntity {
    return new UserEntity(
      String(doc._id),
      doc.username,
      doc.fullName || doc.username,
      doc.email || '',
      doc.countryCode || '',
      doc.phoneNumber || '',
      doc.avatarUrl || doc.profile?.avatarUrl,
      doc.passwordHash,
      doc.points,
      doc.weeklyPoints,
      doc.wallet || { dinar: 1000, usdMinor: 0, txCount: 0 },
      doc.level,
      doc.xp,
      doc.xpToNext,
      doc.profile || {},
      doc.stats || {
        dropsParticipated: 0,
        itemsPurchased: 0,
        barterTrades: 0,
        rewardsClaimed: 0,
        badgesEarned: 0,
      },
      doc.createdAt,
      doc.updatedAt
    );
  }

  toUserResponse() {
    // Get avatarUrl from top-level or profile, prioritize top-level
    const avatarUrl = this.avatarUrl || this.profile?.avatarUrl || null;
    
    return {
      _id: this.id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
      countryCode: this.countryCode,
      phoneNumber: this.phoneNumber,
      avatarUrl: avatarUrl, // Always include avatarUrl, even if null
      points: this.points,
      wallet: {
        dinar: this.wallet.dinar,
        usdMinor: this.wallet.usdMinor,
        txCount: this.wallet.txCount,
      },
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      profile: {
        avatarUrl: this.profile.avatarUrl || null, // Always include in profile too
        bio: this.profile.bio || null,
        bannerColor: this.profile.bannerColor || null,
      },
      stats: {
        dropsParticipated: this.stats.dropsParticipated,
        itemsPurchased: this.stats.itemsPurchased,
        barterTrades: this.stats.barterTrades,
        rewardsClaimed: this.stats.rewardsClaimed,
        badgesEarned: this.stats.badgesEarned,
        lastLevelUp: this.stats.lastLevelUp || null,
      },
    };
  }
}
