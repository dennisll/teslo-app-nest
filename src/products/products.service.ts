import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { validate as isUUID } from 'uuid';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Product, ProductImage } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,

    private readonly datasource: DataSource
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      
      const {images=[], ...productDetails} = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        //aca se crean las imagenes con la relacion a productos automaticamente
        images: images.map( (image) => this.productImagesRepository.create ({url: image}))
      });

      // guarda el registro creado en la tabla products  y tambien en productImages
      await this.productRepository.save(product);

      return {...product, images: images};

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOnePlain(term: string){
    const {images = [], ...product} = await this.findOne(term);
    return {
      ...product,
      images: images.map( image => image.url)
    }
  }


  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });

    return products.map( (product) => ({
      ...product,
      images: product.images?.map( image => image.url)
    }));
  }

  async findOne(term: string) {
    let product: Product | null;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {

      // 'prod' es un alias de la tabla productos y al igual que 'prodImages' un alias de la tabla
      // ProductImages, se usan para hacer el leftJoinAndSelect
      //  para incluir ProductImages al obtener products usando queryBuilder
      const queryBuilder = this.productRepository.createQueryBuilder('prod');

      // obtencion del producto por title o por slug, ambas propiedades son unicas, comparando
      // el title sin tener en cuenta mayusculas y minusculas gracias a la funcion UPPER de postgres
      product = await queryBuilder
        .where('UPPER(title) =:title or slug=:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    if (!product)
      throw new NotFoundException(`Product with term ${term} not found`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const {images, ...toUpdate} = updateProductDto;

    //es como hacer un find, trae toas pa propiedades de product
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
      images: []
    });

    if (!product)
      throw new NotFoundException(`This product with id ${id} not exist`);

    //esto no va a permitir ninguna actualizacion de la bd sino se ha hecho 
    // un commit de la misma  primero
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction()

    try {

      if(images){
        // va a borrar las imagenes relacionadas al producto con id: id
        await queryRunner.manager.delete(ProductImage, {product: {id}});

        // va a crear el nuevo arreglo de imagenes para este producto
        product.images = images.map( 
          image => this.productImagesRepository.create({url: image}));
      }
   
      // va a salvar el producto actualizado
      await queryRunner.manager.save(product);

      // si las operaciones se realizan sin error 
      // entonces realiza los cambios en la base de datos
      await queryRunner.commitTransaction();

      // termina la utilizacion del queryRunner
      await queryRunner.release();


      //await this.productRepository.save(product);

      return this.findOnePlain(id);

    } catch (error) {

      //si se produce algun error en el procedimiento del queryRunner, entonces revierte 
      // las operaciones realizadas al estado anterior de la bd
      await queryRunner.rollbackTransaction();

      await queryRunner.release();
      
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected Error, check server logs',
    );
  }

  async deleteAll(){
    const query = this.productRepository.createQueryBuilder('product');

    try {
       return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
