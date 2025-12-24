import { IUserProfileRepository } from '../../../domain/repositories/iuser-profile-repository';
import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { UserProfileEntity } from '../../../domain/entities/user-profile.entity';
import { UpdateUserProfileDto } from '../../../application/dto/user-profile.dto';
import { NotFoundException } from '../../../domain/exceptions/domain-exceptions';

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

export class UpdateUserProfileUseCase {
  constructor(
    private userProfileRepository: IUserProfileRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, dto: UpdateUserProfileDto, tenantId: string): Promise<UserProfileEntity> {
    // Verify user exists
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get existing profile or create new one
    let profile = await this.userProfileRepository.findByUserId(userId);

    if (!profile) {
      // Create new profile if it doesn't exist
      const { CreateUserProfileUseCase } = await import('./create-user-profile.use-case');
      const createUseCase = new CreateUserProfileUseCase(
        this.userProfileRepository,
        this.userRepository
      );
      return await createUseCase.execute({ userId, ...dto }, tenantId);
    }

    // Convert dateOfBirth string to Date if provided
    let dateOfBirth: Date | null = profile.dateOfBirth;
    if (dto.dateOfBirth !== undefined) {
      if (typeof dto.dateOfBirth === 'string') {
        // Handle ISO date strings (e.g., "2025-11-20" or "2025-11-20T00:00:00Z")
        const date = new Date(dto.dateOfBirth);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format for dateOfBirth');
        }
        dateOfBirth = date;
      } else if (dto.dateOfBirth instanceof Date) {
        dateOfBirth = dto.dateOfBirth;
      } else if (dto.dateOfBirth === null) {
        dateOfBirth = null;
      }
    }

    // Calculate age from dateOfBirth (ignore age from DTO)
    // Always recalculate age to ensure it's current
    const age = calculateAge(dateOfBirth);

    // Update existing profile
    const updatedProfile = new UserProfileEntity(
      profile.id,
      profile.userId,
      dto.companyName !== undefined ? dto.companyName : profile.companyName,
      age,
      dto.cnic !== undefined ? dto.cnic : profile.cnic,
      dto.mobileNo !== undefined ? dto.mobileNo : profile.mobileNo,
      dto.phoneNo !== undefined ? dto.phoneNo : profile.phoneNo,
      dto.city !== undefined ? dto.city : profile.city,
      dto.address !== undefined ? dto.address : profile.address,
      dto.whatsappNo !== undefined ? dto.whatsappNo : profile.whatsappNo,
      dto.facebookUrl !== undefined ? dto.facebookUrl : profile.facebookUrl,
      dto.instagramUrl !== undefined ? dto.instagramUrl : profile.instagramUrl,
      dto.twitterUrl !== undefined ? dto.twitterUrl : profile.twitterUrl,
      dto.linkedinUrl !== undefined ? dto.linkedinUrl : profile.linkedinUrl,
      dateOfBirth,
      dto.bio !== undefined ? dto.bio : profile.bio,
      dto.website !== undefined ? dto.website : profile.website,
      profile.createdAt,
      new Date()
    );

    return await this.userProfileRepository.update(updatedProfile);
  }
}

