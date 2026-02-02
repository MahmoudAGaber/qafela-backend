import { UserEntity } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { RegisterUserDto, AuthResponseDto } from '../../dtos/user.dto';
import * as bcrypt from 'bcryptjs';
import { signAccess, signRefresh } from '../../../infrastructure/utils/jwt';

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: RegisterUserDto): Promise<AuthResponseDto> {
    const usernameLower = input.username.toLowerCase();
    const emailLower = input.email.toLowerCase();

    // Check username uniqueness
    const existingUsername = await this.userRepository.findByUsername(usernameLower);
    if (existingUsername) {
      throw new Error('USERNAME_TAKEN');
    }

    // Check email uniqueness
    const existingEmail = await this.userRepository.findByEmail(emailLower);
    if (existingEmail) {
      throw new Error('EMAIL_TAKEN');
    }

    // Check phone number uniqueness
    const existingPhone = await this.userRepository.findByPhoneNumber(
      input.countryCode,
      input.phoneNumber
    );
    if (existingPhone) {
      throw new Error('PHONE_TAKEN');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.userRepository.create({
      username: input.username,
      fullName: input.fullName,
      email: input.email,
      countryCode: input.countryCode,
      phoneNumber: input.phoneNumber,
      avatarUrl: input.avatarUrl,
      passwordHash,
      points: 1000,
    });

    const access = signAccess({ id: user.id, username: user.username });
    const refresh = signRefresh({ id: user.id });

    return {
      user: user.toUserResponse(),
      tokens: { access, refresh },
    };
  }
}

