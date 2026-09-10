import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseEntity, UserEntity } from './entities/auth.entity';
import { AuthenticatedUser, UserRole } from '../common/interfaces/authenticated-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseEntity> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, ...(dto.dni ? [{ dni: dto.dni }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException(
        existing.email === dto.email
          ? 'El email ya está registrado'
          : 'El DNI ya está registrado',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        dni: dto.dni,
        role: UserRole.PATIENT,
      },
    });

    const userEntity = new UserEntity({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      dni: user.dni,
      role: user.role as UserRole,
    });

    return new AuthResponseEntity(userEntity, this.generateToken(user));
  }

  async login(dto: LoginDto): Promise<AuthResponseEntity> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const userEntity = new UserEntity({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      dni: user.dni,
      role: user.role as UserRole,
    });

    return new AuthResponseEntity(userEntity, this.generateToken(user));
  }

  async getProfile(user: AuthenticatedUser): Promise<UserEntity> {
    return new UserEntity({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? undefined,
      dni: user.dni ?? undefined,
      role: user.role as UserRole,
    });
  }

  private generateToken(user: { id: string; email: string; role: string }): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}