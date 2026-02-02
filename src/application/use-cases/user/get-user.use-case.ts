import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserResponseDto } from '../../dtos/user.dto';

export class GetUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      return null;
    }

    return user.toUserResponse();
  }
}

