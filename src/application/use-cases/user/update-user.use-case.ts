import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UpdateUserDto, UserResponseDto } from '../../dtos/user.dto';

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, input: UpdateUserDto): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      return null;
    }

    // Check username uniqueness if username is being changed
    if (input.username && input.username.toLowerCase() !== user.username.toLowerCase()) {
      const existingUser = await this.userRepository.findByUsername(input.username.toLowerCase());
      if (existingUser && existingUser.id !== userId) {
        throw new Error('USERNAME_TAKEN');
      }
    }

    // Check email uniqueness if email is being changed
    if (input.email && input.email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await this.userRepository.findByEmail(input.email.toLowerCase());
      if (existingUser && existingUser.id !== userId) {
        throw new Error('EMAIL_TAKEN');
      }
    }

    // Prepare update data
    const updateData: Partial<typeof user> = {};
    
    if (input.username) {
      updateData.username = input.username;
    }
    
    if (input.fullName) {
      updateData.fullName = input.fullName;
    }
    
    if (input.email) {
      updateData.email = input.email.toLowerCase();
    }
    
    // Always handle avatarUrl - can be null to clear it, or a string to set it
    if (input.avatarUrl !== undefined) {
      if (input.avatarUrl === null || input.avatarUrl === '') {
        // Clear avatar if null or empty string
        updateData.avatarUrl = null;
        updateData.profile = {
          ...user.profile,
          avatarUrl: null,
        };
      } else {
        // Set new avatar URL
        updateData.avatarUrl = input.avatarUrl;
        updateData.profile = {
          ...user.profile,
          avatarUrl: input.avatarUrl,
        };
      }
    }

    const updatedUser = await this.userRepository.update(userId, updateData);
    
    if (!updatedUser) {
      return null;
    }

    return updatedUser.toUserResponse();
  }
}

