export class DomainException extends Error {
  public readonly statusCode: number;
  public readonly errors?: string[];

  constructor(message: string, statusCode: number = 500, errors?: string[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationException extends DomainException {
  constructor(message: string, errors?: string[]) {
    super(message, 400, errors);
  }
}

export class NotFoundException extends DomainException {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404);
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenException extends DomainException {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictException extends DomainException {
  constructor(message: string) {
    super(message, 409);
  }
}

export class BusinessRuleException extends DomainException {
  constructor(message: string) {
    super(message, 422); // 422 Unprocessable Entity for business rule violations
  }
}

export class BadRequestException extends DomainException {
  constructor(message: string, errors?: string[]) {
    super(message, 400, errors);
  }
}

export class InternalServerException extends DomainException {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}
