import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcryptjs from 'bcryptjs'

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {


    try {
      const { password, ...userData } = createUserDto;

      // encriptamos la contraseña
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

      await newUser.save();
      const { password: _, ...user } = newUser.toJSON();

      //TODO: guardar el usuario




      return user;
    }
    catch (error) {
      if (error.code === 11000)
        throw new BadRequestException(`${createUserDto.email} ya existe`)
      throw new InternalServerErrorException('Algo malo ha ocurrido')
    }

  }

  // metodo que usaremos para intentar loggear al usuario
  async login(loginDto: LoginDto) {
    // obtenemos la contraseña y el correo del usuario
    const { email, password } = loginDto;

    // almacenamos el correo del usuario
    const user = await this.userModel.findOne({ email })

    // verificamos que el correo del usuario este en la base de datos
    if (!user) throw new UnauthorizedException('Datos del usuario incorrectos - email')

    // verificamos que la contraseña del usuario este en la base de datos
    if (!bcryptjs.compareSync(password, user.password)) throw new UnauthorizedException('Datos del usuario incorrectos - password')

    const { password: _, ...rest } = user.toJSON();

    return {
      ...rest,
      token: '123',
    }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
