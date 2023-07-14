import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

import { Model } from 'mongoose';

import * as bcryptjs from 'bcryptjs'

import { CreateUserDto, UpdateAuthDto, LoginDto, RegisterUserDto } from './dto/index';
import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,

    private jwtService: JwtService,
  ) { }

  // metodo que usaremos para crear un usuario
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

  // metodo que usaremos para que un usuario se pueda registrar
  async register(registerUserDto: RegisterUserDto): Promise<LoginResponse> {

    const user = await this.create(registerUserDto);

    return {
      user: user,
      token: this.getJwtToken({ id: user._id }),
    }
  }

  // metodo que usaremos para intentar loggear al usuario
  async login(loginDto: LoginDto): Promise<LoginResponse> {
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
      user: rest,
      token: this.getJwtToken({ id: user.id }),
    }
  }

  // metodo que usaremos para encontrar todos los usuarios creados

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findUserById(id: string) {
    const user = await this.userModel.findById(id);
    const { password, ...rest } = user.toJSON();

    return rest;

  }

  // metodo que usaremos para buscar a un usuario por su id
  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  // metodo que usaremos para actualizar un usuario segun su Id
  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  // metodo que usaremos para eliminar el usuario
  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  // metodo que usaremos para obtener el JWtoken de cada usuario
  getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);

    return token;
  }
}
