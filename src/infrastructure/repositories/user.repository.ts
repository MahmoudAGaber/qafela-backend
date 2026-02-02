import mongoose from 'mongoose';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { User } from '../../modules/user/user.model';

export class UserRepository implements IUserRepository {
  async create(userData: Partial<UserEntity>): Promise<UserEntity> {
    const user = await User.create({
      username: userData.username,
      fullName: userData.fullName,
      email: userData.email,
      countryCode: userData.countryCode,
      phoneNumber: userData.phoneNumber,
      avatarUrl: userData.avatarUrl,
      passwordHash: userData.passwordHash,
      points: userData.points ?? 1000,
      weeklyPoints: userData.weeklyPoints ?? 0,
      wallet: userData.wallet ?? { dinar: 1000, usdMinor: 0, txCount: 0 },
      level: userData.level ?? 1,
      xp: userData.xp ?? 0,
      xpToNext: userData.xpToNext ?? 100,
      profile: userData.profile ?? {},
      stats: userData.stats ?? {
        dropsParticipated: 0,
        itemsPurchased: 0,
        barterTrades: 0,
        rewardsClaimed: 0,
        badgesEarned: 0,
      },
    });

    return UserEntity.fromDocument(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await User.findById(id).lean();
    return user ? UserEntity.fromDocument(user) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await User.findOne({ username }).select('+passwordHash').lean();
    return user ? UserEntity.fromDocument(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash').lean();
    return user ? UserEntity.fromDocument(user) : null;
  }

  async findByPhoneNumber(countryCode: string, phoneNumber: string): Promise<UserEntity | null> {
    const user = await User.findOne({
      countryCode,
      phoneNumber,
    }).lean();
    return user ? UserEntity.fromDocument(user) : null;
  }

  async findByUsernameOrEmail(identifier: string): Promise<UserEntity | null> {
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() },
      ],
    }).lean();
    return user ? UserEntity.fromDocument(user) : null;
  }

  async update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const updateData: any = {};
    
    // Handle top-level fields
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.fullName !== undefined) updateData.fullName = updates.fullName;
    if (updates.email !== undefined) updateData.email = updates.email.toLowerCase();
    if (updates.avatarUrl !== undefined) {
      updateData.avatarUrl = updates.avatarUrl;
      // Also update profile.avatarUrl if profile exists
      if (!updateData.profile) updateData.profile = {};
      updateData.profile.avatarUrl = updates.avatarUrl;
    }
    
    // Handle nested profile object
    if (updates.profile) {
      if (!updateData.profile) updateData.profile = {};
      if (updates.profile.avatarUrl !== undefined) {
        updateData.profile.avatarUrl = updates.profile.avatarUrl;
        updateData.avatarUrl = updates.profile.avatarUrl; // Also update top-level
      }
      if (updates.profile.bio !== undefined) updateData.profile.bio = updates.profile.bio;
      if (updates.profile.bannerColor !== undefined) updateData.profile.bannerColor = updates.profile.bannerColor;
    }
    
    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    return user ? UserEntity.fromDocument(user) : null;
  }

  async updateWallet(id: string, walletUpdates: Partial<UserEntity['wallet']>): Promise<UserEntity | null> {
    const updateData: any = {};
    if (walletUpdates.dinar !== undefined) {
      updateData['wallet.dinar'] = walletUpdates.dinar;
    }
    if (walletUpdates.usdMinor !== undefined) {
      updateData['wallet.usdMinor'] = walletUpdates.usdMinor;
    }
    if (walletUpdates.txCount !== undefined) {
      updateData['wallet.txCount'] = walletUpdates.txCount;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $inc: updateData },
      { new: true }
    ).lean();
    
    return user ? UserEntity.fromDocument(user) : null;
  }
}

