export class PermissionEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly description: string | null,
    public readonly tenantId: string
  ) {}
}

