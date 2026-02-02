import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  create(user: Partial<UserEntity>): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByPhoneNumber(countryCode: string, phoneNumber: string): Promise<UserEntity | null>;
  findByUsernameOrEmail(identifier: string): Promise<UserEntity | null>;
  update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null>;
  updateWallet(id: string, walletUpdates: Partial<UserEntity['wallet']>): Promise<UserEntity | null>;
}

