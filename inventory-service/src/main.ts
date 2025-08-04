import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:80',
      'http://localhost',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('ERP Inventory Service')
    .setDescription('Inventory Management API for ERP System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('inventory', 'Inventory management operations')
    .addTag('products', 'Product management operations')
    .addTag('categories', 'Category management operations')
    .addTag('suppliers', 'Supplier management operations')
    .addTag('warehouses', 'Warehouse management operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'inventory-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  const port = configService.get<number>('PORT', 8002);
  await app.listen(port);

  console.log(`🚀 Inventory Service is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
  console.log(`🎯 GraphQL playground: http://localhost:${port}/graphql`);
}

bootstrap();
