import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private _prismaService: PrismaService,
    private _JwtService: JwtService,
    private config: ConfigService,
  ) {}
  async signin(dto: AuthDto) {
    // find user by email
    const user = await this._prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // if user does no exist throw error
    if (!user) throw new ForbiddenException('Invalid credentials');
    // compare password
    const pwMatch = await argon.verify(user.hash, dto.password);
    // if password does not match throw error
    if (!pwMatch) throw new ForbiddenException('Invalid password');

    // send back the user
    return this.singToken(user.id, user.email);
  }

  async signup(dto: AuthDto) {
    // generate password h>ash
    const hash = await argon.hash(dto.password);

    // save the new user in DB
    try {
      const user = await this._prismaService.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

      return this.singToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials already in use');
        }
      }
      throw error;
    }
  }

  async singToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const token = await this._JwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }
}
