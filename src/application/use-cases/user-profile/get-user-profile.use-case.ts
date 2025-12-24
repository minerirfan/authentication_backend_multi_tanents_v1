import { IUserProfileRepository } from '../../../domain/repositories/iuser-profile-repository';
import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { UserProfileEntity } from '../../../domain/entities/user-profile.entity';
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

export class GetUserProfileUseCase {
  constructor(
    private userProfileRepository: IUserProfileRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, tenantId: string): Promise<UserProfileEntity | null> {
    // Verify user exists
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.userProfileRepository.findByUserId(userId);
    
    // Recalculate age to ensure it's always current
    if (profile) {
      const recalculatedAge = calculateAge(profile.dateOfBirth);
      return new UserProfileEntity(
        profile.id,
        profile.userId,
        profile.companyName,
        recalculatedAge,
        profile.cnic,
        profile.mobileNo,
        profile.phoneNo,
        profile.city,
        profile.address,
        profile.whatsappNo,
        profile.facebookUrl,
        profile.instagramUrl,
        profile.twitterUrl,
        profile.linkedinUrl,
        profile.dateOfBirth,
        profile.bio,
        profile.website,
        profile.createdAt,
        profile.updatedAt
      );
    }

    return null;
  }
}

