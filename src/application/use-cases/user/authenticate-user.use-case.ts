import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { LoginUserDto, AuthResponseDto } from '../../dtos/user.dto';
import * as bcrypt from 'bcryptjs';
import { signAccess, signRefresh } from '../../../infrastructure/utils/jwt';

export class AuthenticateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginUserDto): Promise<AuthResponseDto> {
    const identifier = input.usernameOrEmail.trim().toLowerCase();

    // Try to find user by username or email
    let user = null;
    if (identifier.includes('@')) {
      user = await this.userRepository.findByEmail(identifier);
    } else {
      user = await this.userRepository.findByUsername(identifier);
    }

    if (!user || !user.passwordHash) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const access = signAccess({ id: user.id, username: user.username });
    const refresh = signRefresh({ id: user.id });

    return {
      user: user.toUserResponse(),
      tokens: { access, refresh },
    };
  }
}

