import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Biobox-slave')
    .setDescription("Api's for BioBox slave device")
    .setVersion('1.0')
    .addTag('api')
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, doc);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const PORT = 3000;
  app.enableCors();
  await app.listen(PORT);

  console.log('App is running on port ' + PORT);
}
bootstrap();
