import { Test, TestingModule } from '@nestjs/testing';
import { DevicedataController } from './devicedata.controller';
import { DevicedataService } from './devicedata.service';

describe('DevicedataController', () => {
  let controller: DevicedataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicedataController],
      providers: [DevicedataService],
    }).compile();

    controller = module.get<DevicedataController>(DevicedataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
