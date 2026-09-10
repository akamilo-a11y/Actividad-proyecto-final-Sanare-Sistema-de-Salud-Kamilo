import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/interfaces/authenticated-user.interface';

export class UserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ required: false })
  dni?: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

export class AuthResponseEntity {
  @ApiProperty({ type: UserEntity })
  user: UserEntity;

  @ApiProperty()
  accessToken: string;

  constructor(user: UserEntity, accessToken: string) {
    this.user = user;
    this.accessToken = accessToken;
  }
}