export class UserProfileEntity {
  constructor(
    public id: string,
    public userId: string,
    public companyName: string | null,
    public age: number | null,
    public cnic: string | null,
    public mobileNo: string | null,
    public phoneNo: string | null,
    public city: string | null,
    public address: string | null,
    public whatsappNo: string | null,
    public facebookUrl: string | null,
    public instagramUrl: string | null,
    public twitterUrl: string | null,
    public linkedinUrl: string | null,
    public dateOfBirth: Date | null,
    public bio: string | null,
    public website: string | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}

