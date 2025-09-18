import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SeedService {

  constructor(
    private readonly productService : ProductsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  async runSeed() { 

    await this.deleteTables();

    const adminUser = await this.insertUsers();

    await this.insertNewProducts(adminUser);
    return `Seed executed`;
  }

  private async deleteTables(){

    await this.productService.deleteAll();

    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder
    .delete()
    .where({}) // borra toda la tabla de usuarios
    .execute();
  }

  private async insertUsers(){

   const seedUsers = initialData.users;

   seedUsers.forEach(user => {

    this.userRepository.create(user);

   });

   const users = await this.userRepository.save(seedUsers);

   return users[0];
  }

  private async insertNewProducts(user: User){
    

    const products = initialData.products;

    const insertPromises: any [] = [];

    products.forEach(product => {
        insertPromises.push(this.productService.create(product, user));
     });

    await Promise.all(insertPromises);

    return true;
  }
}
 