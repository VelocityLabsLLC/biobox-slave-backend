import { Test, TestingModule } from '@nestjs/testing';
import { DevicedataService } from './devicedata.service';

describe('DevicedataService', () => {
  let service: DevicedataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevicedataService],
    }).compile();

    service = module.get<DevicedataService>(DevicedataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
