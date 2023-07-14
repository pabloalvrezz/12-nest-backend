import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';

import { JwtPayload } from 'src/auth/interfaces/jwt-payload';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private jwtService: JwtService,
    private authService: AuthService) { }

  // metodo que usaremos para verificar el token que esta intentando acceder a los usuarios
  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No existe un token en la petición');
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        {
          secret: process.env.JWT_SEED,
        }
      );
      const user = await this.authService.findUserById(payload.id);

      if (!user) throw new UnauthorizedException('Usuario no autorizado')
      if (!user.isActive) throw new UnauthorizedException('Usuario no activo')

      request['user'] = user;
    }
    catch (error) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
