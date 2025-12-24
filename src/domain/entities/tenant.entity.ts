/**
 * Tenant entity representing a tenant in the multi-tenant system
 * Contains validation logic for tenant data
 */
export class TenantEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Validate if a slug is valid
   * @param slug - The slug to validate
   * @returns true if the slug is valid
   */
  static isValidSlug(slug: string): boolean {
    // Slug should be lowercase, alphanumeric with hyphens, 3-50 characters
    const slugRegex = /^[a-z0-9-]{3,50}$/;
    return slugRegex.test(slug) && !slug.startsWith('-') && !slug.endsWith('-');
  }

  /**
   * Validate the tenant name
   * @param name - The name to validate
   * @returns true if the name is valid
   */
  static validateName(name: string): boolean {
    // Name should be 2-100 characters, not empty
    return name.trim().length >= 2 && name.trim().length <= 100;
  }

  /**
   * Check if this tenant's slug matches the provided slug
   * @param slug - The slug to compare
   * @returns true if the slugs match
   */
  hasSlug(slug: string): boolean {
    return this.slug === slug;
  }
}

