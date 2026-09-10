import { Injectable } from '@nestjs/common';
import { JwtModuleOptions, JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtModuleAsyncOptions: JwtModuleAsyncOptions = {
  useFactory: (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
    signOptions: { expiresIn: '7d' },
  }),
};