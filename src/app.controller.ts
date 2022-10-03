import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import getMAC from 'getmac';
import { find } from 'lodash';
import {
  GroupedDataDto,
  ResetDataDto,
  TrialMetaDto,
  UpdateTrialsubjectDto,
} from './app.dto';
import { AppService } from './app.service';
import { getMasterDetails, scanAndConnect } from './mqtt-nmap-connect';

const macId = getMAC();

@ApiTags()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  onApplicationBootstrap() {
    // console.log(process.env.MASTER_HOSTNAME);
    scanAndConnect();
  }

  @Get('masterIp')
  getmasterIp() {
    return new Promise((resolve, reject) => {
      const masterDetails = getMasterDetails();
      if (masterDetails) {
        resolve(masterDetails.ip);
      } else {
        reject(
          new BadRequestException({ message: 'Master details not found' }),
        );
      }
    });
  }

  @Post('livedata/deviceList')
  async slaveDetails() {
    try {
      const masterDetails = getMasterDetails();
      if (masterDetails) {
        const apiUrl = `http://${masterDetails.ip}:3000/livedata/deviceList`;
        const devices = await axios.post(apiUrl);
        if (devices?.data) {
          return find(devices.data, { macAddress: macId }) || [];
        }
        return [];
      } else {
        throw new BadRequestException({ message: 'Master details not found' });
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('devices/start')
  start(@Body() trialMeta: TrialMetaDto) {
    return this.callAPI({
      url: 'devices/start',
      method: 'POST',
      data: trialMeta,
    });
  }

  @Get('devices/stop/:id')
  stop(@Param('id') id: string) {
    return this.callAPI({
      url: `devices/stop/${id}`,
      method: 'GET',
    });
  }

  @Get('devices/resume')
  resume(@Body() trialMeta: TrialMetaDto) {
    return this.callAPI({
      url: `devices/resume`,
      method: 'POST',
      data: trialMeta,
    });
  }

  @Post('devices/pause')
  pause(@Body() trialMeta: TrialMetaDto) {
    return this.callAPI({
      url: 'devices/pause',
      method: 'POST',
      data: trialMeta,
    });
  }

  @Post('devices/reset')
  reset(@Body() resetReq: ResetDataDto) {
    return this.callAPI({
      url: 'devices/reset',
      method: 'POST',
      data: resetReq,
    });
  }

  @Post('/trialdata/forSubject/grouped')
  trialDataForSubjectGrouped(@Body() groupReq: GroupedDataDto) {
    return this.callAPI({
      url: 'trialdata/forSubject/grouped',
      method: 'POST',
      data: groupReq,
    });
  }

  @Patch('trialsubject/:id')
  trialsubject(
    @Param('id') id: string,
    @Body() updateTrialsubjectDto: UpdateTrialsubjectDto,
  ) {
    return this.callAPI({
      url: `trialsubject/${id}`,
      method: 'PATCH',
      data: updateTrialsubjectDto,
    });
  }

  @Get('trials/:id')
  trials(@Param('id') id: string) {
    return this.callAPI({
      url: `trials/${id}`,
      method: 'GET',
    });
  }

  callAPI(axiosReq: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const masterDetails = getMasterDetails();
        if (masterDetails) {
          const baseUrl = `http://${masterDetails.ip}:3000/`;
          axiosReq.url = baseUrl + axiosReq.url;
          const result = await axios(axiosReq);
          resolve(result.data);
        } else {
          reject(
            new BadRequestException({
              message: 'Master details not found',
            }),
          );
        }
      } catch (error) {
        reject(new BadRequestException(error.message));
      }
    });
  }
}
