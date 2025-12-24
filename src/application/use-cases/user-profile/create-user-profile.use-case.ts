import { IUserProfileRepository } from '../../../domain/repositories/iuser-profile-repository';
import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { UserProfileEntity } from '../../../domain/entities/user-profile.entity';
import { CreateUserProfileDto } from '../../../application/dto/user-profile.dto';
import { NotFoundException } from '../../../domain/exceptions/domain-exceptions';
import { v4 as uuidv4 } from 'uuid';

/**
 * Calculates age from a date of birth
 * @param dateOfBirth - The date of birth
 * @returns The age in years, or null if dateOfBirth is null
 */
function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  // Adjust age if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}

export class CreateUserProfileUseCase {
  constructor(
    private userProfileRepository: IUserProfileRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: CreateUserProfileDto, tenantId: string): Promise<UserProfileEntity> {
    // Verify user exists
    const user = await this.userRepository.findById(dto.userId, tenantId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if profile already exists
    const existingProfile = await this.userProfileRepository.findByUserId(dto.userId);
    if (existingProfile) {
      throw new Error('User profile already exists. Use update instead.');
    }

    // Convert dateOfBirth string to Date if provided
    let dateOfBirth: Date | null = null;
    if (dto.dateOfBirth) {
      if (typeof dto.dateOfBirth === 'string') {
        // Handle ISO date strings (e.g., "2025-11-20" or "2025-11-20T00:00:00Z")
        const date = new Date(dto.dateOfBirth);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format for dateOfBirth');
        }
        dateOfBirth = date;
      } else if (dto.dateOfBirth instanceof Date) {
        dateOfBirth = dto.dateOfBirth;
      }
    }

    // Calculate age from dateOfBirth (ignore age from DTO)
    const age = calculateAge(dateOfBirth);

    const profile = new UserProfileEntity(
      uuidv4(),
      dto.userId,
      dto.companyName || null,
      age,
      dto.cnic || null,
      dto.mobileNo || null,
      dto.phoneNo || null,
      dto.city || null,
      dto.address || null,
      dto.whatsappNo || null,
      dto.facebookUrl || null,
      dto.instagramUrl || null,
      dto.twitterUrl || null,
      dto.linkedinUrl || null,
      dateOfBirth,
      dto.bio || null,
      dto.website || null,
      new Date(),
      new Date()
    );

    return await this.userProfileRepository.create(profile);
  }
}

