import { Injectable } from '@nestjs/common';

@Injectable({})
export class AuthService {
  signin() {
    return { msg: 'Hello singing in' };
  }

  signup() {
    return { msg: 'Hello' };
  }
}
