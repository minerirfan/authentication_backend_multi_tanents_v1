import { UserProfileEntity } from '../entities/user-profile.entity';

export interface IUserProfileRepository {
  findByUserId(userId: string): Promise<UserProfileEntity | null>;
  create(profile: UserProfileEntity): Promise<UserProfileEntity>;
  update(profile: UserProfileEntity): Promise<UserProfileEntity>;
  delete(userId: string): Promise<void>;
}

