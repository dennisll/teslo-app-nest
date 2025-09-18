import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductImage } from './product-image.entity';
import { User } from 'src/auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({name: 'products'})
export class Product {

  @ApiProperty({
    example: '25a942f6-79bf-429d-a047-276b54726912',
    description: 'Product id',
    uniqueItems: true
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'T-Shirt Teslo',
    description: 'Product title',
    uniqueItems: true
  })
  @Column('text', {
    unique: true,
  })
  title: string;

  @ApiProperty({
    example: 0,
    description: 'Product price',
  })
  @Column('float', {
    default: 0,
  })
  price: number;

  @ApiProperty({
    example: 'Nulla amet sit laborum minim adipisicing officia minim id consequat eiusmod amet.',
    description: 'Product description',
    default: null
  })
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @ApiProperty({
    example: 't_shirt_teslo',
    description: 'Product-SLUG for SEO',
    uniqueItems: true
  })
  @Column('text', {
    unique: true,
  })
  slug: string;

  @ApiProperty({
    example: 10,
    description: 'Product stock',
    default: 0
  })
  @Column('int', {
    default: 0,
  })
  stock: number;

  @ApiProperty({
    example: ['M', 'XL', 'XXL'],
    description: 'Products sizes',
  })
  @Column('text', {
    array: true,
  })
  sizes: string[];

  @ApiProperty({
    example: 'women',
    description: 'Product gender',
  })
  @Column('text')
  gender: string;

  @ApiProperty({
    example: [
      "shirt"
  ],
    description: 'Product tags',
  }) 
  @Column('text',{
      array: true,
      default: []
  })
  tags: string [];

  @ApiProperty({
    example: [
      "8528839-00-A_0_2000.jpg",
      "8528839-00-A_2.jpg"
  ],
    description: 'Product images',
  })
  @OneToMany(
    ()=> ProductImage,
    (productImage)=> productImage.product,
    {
      // crea y elimina ProductImage [] en cascada al crear o eliminar uno o varios productos
      cascade: true,
    // carga la tabla relacionada, en este caso ProductImage,  al ejecutar cualquier metodo find
    // al consultar la bd
    eager: true
  })
  images?: ProductImage [];

  @ManyToOne(
          ()=> User,
          (user) => user.product,
          {eager: true} 
      )
      user: User

  @BeforeInsert()  //realiza esta operacion antes de hacer la insercion en la bd
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate(){
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
