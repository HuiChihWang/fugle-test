import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';

function setUpSwaggerInApp(path: string, app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fugle Interview Test')
    .setDescription('the doc is for fugle api testing')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  setUpSwaggerInApp('api', app);
  await app.listen(3000);
  Logger.log(`Server running on http://localhost:3000`, 'NestApplication');
  Logger.log(
    `Swagger UI is available on http://localhost:3000/api`,
    'SwaggerModule',
  );
}
bootstrap();
