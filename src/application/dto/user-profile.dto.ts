export interface CreateUserProfileDto {
  userId: string;
  companyName?: string;
  /**
   * @deprecated Age is automatically calculated from dateOfBirth. This field is ignored if provided.
   */
  age?: number;
  cnic?: string;
  mobileNo?: string;
  phoneNo?: string;
  city?: string;
  address?: string;
  whatsappNo?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  dateOfBirth?: Date | string;
  bio?: string;
  website?: string;
}

export interface UpdateUserProfileDto {
  companyName?: string;
  /**
   * @deprecated Age is automatically calculated from dateOfBirth. This field is ignored if provided.
   */
  age?: number;
  cnic?: string;
  mobileNo?: string;
  phoneNo?: string;
  city?: string;
  address?: string;
  whatsappNo?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  dateOfBirth?: Date | string;
  bio?: string;
  website?: string;
}

