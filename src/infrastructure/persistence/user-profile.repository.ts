import { IUserProfileRepository } from '../../domain/repositories/iuser-profile-repository';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';
import { prisma } from '../config/database';

export class UserProfileRepository implements IUserProfileRepository {
  async findByUserId(userId: string): Promise<UserProfileEntity | null> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) return null;

    return this.toEntity(profile);
  }

  async create(profile: UserProfileEntity): Promise<UserProfileEntity> {
    // Ensure dateOfBirth is a Date object or null
    const dateOfBirth = this.normalizeDate(profile.dateOfBirth);

    const created = await prisma.userProfile.create({
      data: {
        id: profile.id,
        userId: profile.userId,
        companyName: profile.companyName,
        age: profile.age,
        cnic: profile.cnic,
        mobileNo: profile.mobileNo,
        phoneNo: profile.phoneNo,
        city: profile.city,
        address: profile.address,
        whatsappNo: profile.whatsappNo,
        facebookUrl: profile.facebookUrl,
        instagramUrl: profile.instagramUrl,
        twitterUrl: profile.twitterUrl,
        linkedinUrl: profile.linkedinUrl,
        dateOfBirth: dateOfBirth,
        bio: profile.bio,
        website: profile.website,
      },
    });

    return this.toEntity(created);
  }

  async update(profile: UserProfileEntity): Promise<UserProfileEntity> {
    // Ensure dateOfBirth is a Date object or null
    const dateOfBirth = this.normalizeDate(profile.dateOfBirth);

    const updated = await prisma.userProfile.update({
      where: { userId: profile.userId },
      data: {
        companyName: profile.companyName,
        age: profile.age,
        cnic: profile.cnic,
        mobileNo: profile.mobileNo,
        phoneNo: profile.phoneNo,
        city: profile.city,
        address: profile.address,
        whatsappNo: profile.whatsappNo,
        facebookUrl: profile.facebookUrl,
        instagramUrl: profile.instagramUrl,
        twitterUrl: profile.twitterUrl,
        linkedinUrl: profile.linkedinUrl,
        dateOfBirth: dateOfBirth,
        bio: profile.bio,
        website: profile.website,
      },
    });

    return this.toEntity(updated);
  }

  async delete(userId: string): Promise<void> {
    await prisma.userProfile.delete({
      where: { userId },
    });
  }

  private toEntity(profile: any): UserProfileEntity {
    return new UserProfileEntity(
      profile.id,
      profile.userId,
      profile.companyName,
      profile.age,
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

  /**
   * Normalizes a date value to a Date object or null.
   * Handles string dates (e.g., "2025-11-20") by converting them to Date objects.
   */
  private normalizeDate(date: Date | string | null | undefined): Date | null {
    if (date === null || date === undefined) {
      return null;
    }

    if (date instanceof Date) {
      return date;
    }

    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid date format: ${date}`);
      }
      return parsedDate;
    }

    return null;
  }
}

