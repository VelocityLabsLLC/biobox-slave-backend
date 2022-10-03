import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import * as FormData from 'form-data';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rename,
  rmSync,
  WriteStream,
} from 'fs';
import getMAC from 'getmac';
import { sumBy } from 'lodash';
import * as moment from 'moment';
import { join } from 'path';
import { close, init, INPUT, open, PULL_DOWN, read } from 'rpio';
import { Readable } from 'stream';
import { v4 } from 'uuid';
import { getclient, getMasterDetails } from '../mqtt-nmap-connect';
import { DevicedataDto } from './dto/devicedata.dto';

const macId = getMAC();

@ApiTags('devicedata')
@Controller('devicedata')
export class DevicedataController {
  constructor() {
    if (process.env.SLAVE_ENV !== 'CLOUD') {
      init({
        gpiomem: true,
        mapping: 'physical',
        close_on_exit: true,
      });
    }

    const dir = join(__dirname, 'TrialDataCSVs');
    if (!existsSync(dir)) {
      mkdirSync(dir);
    }
  }

  private deviceListInterval = {};
  private deviceListPausedIntervals = {};
  private trials = {};
  private dataToPublish = {};
  private fileName: string = null;
  private writeStream: WriteStream = null;
  private readStream: Readable = null;
  private intervals: any = {};
  private cumulative: number = 0;

  writeToCSV(data: any) {
    if (!this.readStream) {
      this.readStream = new Readable({
        read() {},
      });
    }

    if (!this.fileName) {
      //initial file name here
      const filename = `${data.trialSubjectId}_processing.csv`;
      this.fileName = join(__dirname, 'TrialDataCSVs', `${filename}`);
    }

    // output file in the same folder
    if (!this.writeStream) {
      this.writeStream = createWriteStream(this.fileName, { flags: 'a' });
      this.readStream.pipe(this.writeStream);
    }

    Object.keys(data.sensorData).forEach((valueKey: string) => {
      const formatedData = {
        id: v4(),
        phaseId: data.phaseId,
        trialSubjectId: data.trialSubjectId,
        measure_value_double: data.sensorData[valueKey].value,
        measure_name: valueKey,
        measureUnite: data.sensorData[valueKey].unit,
        time: moment(data.time).utc().format('YYYY-MM-DD HH:mm:ss:SSSSSS'),
        masterMacAddress: getMasterDetails()?.mac,
        createdAt: null,
        phaseName: data.phaseName,
        timeRemaining: data.timeRemaining,
      };
      this.readStream.push(Object.values(formatedData).join(',') + '\n');
      // const used = process.memoryUsage().heapUsed / 1024 / 1024;
      // console.log(
      //   `The script uses approximately ${Math.round(used * 100) / 100} MB`,
      // );
    });
  }

  @Get('isConnected')
  checkConnection() {
    return macId;
  }

  @Post('start')
  startSending(@Body() trialMeta: DevicedataDto) {
    if (process.env.SLAVE_ENV !== 'CLOUD') {
      open(29, INPUT, PULL_DOWN);
      open(31, INPUT, PULL_DOWN);
      open(33, INPUT, PULL_DOWN);
    }

    const mqttClient = getclient();

    const totalDuration = trialMeta.trialDuration * 60 * 1000;
    const keyToUse = `${trialMeta.trialId}_${trialMeta.deviceId}_${trialMeta.subjectId}`;
    if (!this.deviceListInterval[trialMeta.deviceId]) {
      const deviceTimeRemaining = `${trialMeta.deviceId}-timeRemaining`;

      //this is condition will work if request coming from resume event
      const resumeTimeRemain = trialMeta['deviceTimeRemaining'];
      if (resumeTimeRemain) {
        this.deviceListInterval[deviceTimeRemaining] = resumeTimeRemain;
      } else {
        this.deviceListInterval[deviceTimeRemaining] = totalDuration;
      }

      const intervalTime = trialMeta.frequency
        ? 1000 / +trialMeta.frequency
        : 1000;

      this.deviceListInterval[trialMeta.deviceId] = setInterval(() => {
        if (this.deviceListInterval[deviceTimeRemaining] <= 0) {
          console.log('trialCompleted');
          // when trial duration completes emmit to mqtt topic that trial has been finished.
          if (mqttClient) {
            mqttClient.publish(
              'trialCompleted',
              JSON.stringify({ ...trialMeta }),
            );
            clearInterval(this.intervals[keyToUse]);
            delete this.intervals[keyToUse];
          }
          this.stopSending(trialMeta.deviceId, true);
          delete this.deviceListInterval[deviceTimeRemaining];
          rename(
            this.fileName,
            `${this.fileName.split('_processing')[0]}.csv`,
            () => {
              // call a function here to send the file to master and then delete it.
              this.sendCreatedFileToMaster();
            },
          );
          return;
        }

        // find phase index and provide proper phaseId
        const phaseIndex = trialMeta.phases.findIndex((ph) => {
          const timeElapsed =
            (totalDuration - this.deviceListInterval[deviceTimeRemaining]) /
            (60 * 1000);

          if (ph.startAt <= timeElapsed && ph.endAt >= timeElapsed) {
            return 1;
          }
          return 0;
        });

        const currentDateTime = new Date();

        const phaseId = trialMeta.phases[phaseIndex].id;
        const phaseName = trialMeta.phases[phaseIndex].name;

        const publishData = {
          ...trialMeta,
          phaseId,
          value:
            process.env.SLAVE_ENV !== 'CLOUD'
              ? read(29)
              : Math.round(Math.random()),
          timeRemaining: this.deviceListInterval[deviceTimeRemaining],
          sensorData: {
            pin_29: {
              value:
                process.env.SLAVE_ENV !== 'CLOUD'
                  ? read(29)
                  : Math.round(Math.random()),
              unit: 'bool',
            },
            pin_31: {
              value:
                process.env.SLAVE_ENV !== 'CLOUD'
                  ? read(31)
                  : Math.round(Math.random()),
              unit: 'bool',
            },
            pin_33: {
              value:
                process.env.SLAVE_ENV !== 'CLOUD'
                  ? read(33)
                  : Math.round(Math.random()),
              unit: 'bool',
            },
          },
          time: currentDateTime,
          fifteen: false,
          thirty: false,
          minute: false,
          phaseName,
        };

        if (!this.trials[trialMeta.trialId]) {
          this.trials[trialMeta.trialId] = {};
        }

        const remainingTime =
          this.deviceListInterval[deviceTimeRemaining] - intervalTime;
        if (!this.dataToPublish[keyToUse]) {
          this.dataToPublish[keyToUse] = [];
        }
        if (!this.intervals[keyToUse]) {
          this.intervals[keyToUse] = setInterval(
            this.emitOnMQTT,
            1000,
            keyToUse,
          );
        }
        this.writeToCSV(publishData);
        let val =
          publishData.sensorData.pin_29.value +
          publishData.sensorData.pin_31.value +
          publishData.sensorData.pin_33.value;
        this.cumulative = this.cumulative + val;
        this.dataToPublish[keyToUse].push({
          trialId: publishData.trialId,
          deviceId: publishData.deviceId,
          subjectId: publishData.subjectId,
          phaseId: publishData.phaseId,
          pin_29: publishData.sensorData.pin_29.value,
          pin_31: publishData.sensorData.pin_31.value,
          pin_33: publishData.sensorData.pin_33.value,
          timeRemaining: publishData.timeRemaining,
          time: publishData.time,
          trialDuration: publishData.trialDuration,
          cumulativeData: this.cumulative,
        });

        this.deviceListInterval[deviceTimeRemaining] = remainingTime;
      }, intervalTime);

      let returnMessage = resumeTimeRemain
        ? 'resumed sending paused data'
        : 'started sending data';

      console.log(returnMessage);

      return { message: returnMessage };
    } else {
      return { message: 'already sending data' };
    }
  }

  emitOnMQTT = (keyToUse: string) => {
    const mqttClient = getclient();
    if (this.dataToPublish[keyToUse]?.length > 0) {
      const obj = {
        ...this.dataToPublish[keyToUse][
          this.dataToPublish[keyToUse].length - 1
        ],
        pin_29: sumBy(this.dataToPublish[keyToUse], 'pin_29'),
        pin_31: sumBy(this.dataToPublish[keyToUse], 'pin_31'),
        pin_33: sumBy(this.dataToPublish[keyToUse], 'pin_33'),
      };
      const dataToEmit = [obj];
      if (mqttClient) {
        mqttClient.publish('devdata-socket', JSON.stringify(dataToEmit));
      }
      this.dataToPublish[keyToUse] = [];
    }
  };

  @Get('stop/:id')
  async stopSending(
    @Param('id') id: string,
    calledFromStart = false,
    calledFromPause = false,
  ) {
    if (process.env.SLAVE_ENV !== 'CLOUD') {
      close(29);
      close(31);
      close(33);
    }

    if (calledFromStart) {
      this.trials = {};
    }
    clearInterval(this.deviceListInterval[id]);
    delete this.deviceListInterval[id];
    delete this.deviceListInterval[`${id}-timeRemaining`];
    if (!calledFromPause && !calledFromStart) {
      await this.sendCreatedFileToMaster();
    }
    if (calledFromStart) {
      await this.sendCreatedFileToMaster();
    }
    console.log('stop sending data for ' + id);
    return { message: 'stop sending data for ' + id };
  }

  @Post('pause')
  pause(@Body() trialMeta: DevicedataDto) {
    //save device meta data and deviceTimeRemaining in other list which will be used in resuming paused event

    const deviceTimeRemaining = this.deviceListInterval[
      `${trialMeta.deviceId}-timeRemaining`
    ];
    if (deviceTimeRemaining && deviceTimeRemaining > 0) {
      this.deviceListPausedIntervals[trialMeta.deviceId] = {
        ...trialMeta,
        deviceTimeRemaining: deviceTimeRemaining,
      };
      console.log('device meta saved in "deviceListPausedIntervals" ');

      //stop the interval for specific device
      this.stopSending(trialMeta.deviceId, false, true);

      return {
        message: `data sending paused for device ${trialMeta.deviceId}`,
      };
    } else {
      delete this.deviceListInterval[trialMeta.deviceId];
      delete this.deviceListInterval[`${trialMeta.deviceId}-timeRemaining`];

      console.log(`no event found to pause for device ${trialMeta.deviceId}`);
      return {
        message: `no event found to pause for device ${trialMeta.deviceId}`,
      };
    }
  }

  @Post('resume')
  async resume(@Body() trialMeta: DevicedataDto) {
    // resume device data which was earlier paused using metadata from "deviceListPausedIntervals"
    // re-use startSending function for resuming data
    const id = trialMeta.deviceId;
    const memoryTrialMeta = this.deviceListPausedIntervals[id];
    if (memoryTrialMeta) {
      this.startSending(memoryTrialMeta);

      // remove the metadata from "deviceListPausedIntervals" as it is now resumed

      delete this.deviceListPausedIntervals[id];
      console.log(`data sending resumed for device ${id}`);

      return { message: `data sending resumed for device ${id}` };
    } else {
      const timeRemaining = await this.getTimeRemainingFromFile(
        trialMeta.trialSubjectId,
      );
      if (timeRemaining) {
        const trialMetaObj: any = {
          ...trialMeta,
          deviceTimeRemaining: timeRemaining,
        };
        this.startSending(trialMetaObj);
        console.log(`data sending resumed for device ${id}`);

        return { message: `data sending resumed for device ${id}` };
      } else {
        this.startSending(trialMeta);
        console.log(`paused data not found calling start for device ${id}`);
        return {
          message: `paused data not found calling start for device ${id}`,
        };
      }
    }
  }

  getTimeRemainingFromFile(trialSubjectId: string): Promise<number | null> {
    return new Promise((resolve) => {
      const filePath = join(
        __dirname,
        'TrialDataCSVs',
        `${trialSubjectId}_processing.csv`,
      );
      console.log('getting remaining time from file >>> ', filePath);
      if (existsSync(filePath)) {
        const fileData = readFileSync(filePath, { encoding: 'utf-8' });
        const lines = fileData.split('\n');
        if (lines && lines.length >= 3) {
          // console.log('lines >>> ', lines);
          const lastLine = lines[lines.length - 2] || lines[lines.length - 3];
          console.log('last line >>> ', lastLine);
          const splitted = lastLine.split(',');
          const timeRemainingVal = splitted[splitted.length - 1];
          console.log('timeRemaining >>> ', timeRemainingVal);
          resolve(timeRemainingVal ? parseInt(timeRemainingVal) : null);
        }
      }
      resolve(null);
    });
  }

  sendCreatedFileToMaster() {
    this.cumulative = 0;
    return new Promise((resolve) => {
      if (this.fileName) {
        const fileToRemove = this.fileName;
        if (this.writeStream) {
          this.writeStream.close();
          this.writeStream = null;
        }
        if (this.readStream) {
          this.readStream.destroy();
          this.readStream = null;
        }

        const masterDetails = getMasterDetails();
        if (masterDetails) {
          const fileToSend = createReadStream(this.fileName);
          const splitted = this.fileName.split(
            this.fileName.indexOf('/') > -1 ? '/' : '\\',
          );
          const filename = splitted[splitted.length - 1];
          const form = new FormData();
          form.append('file', fileToSend, filename);
          const url = `http://${masterDetails.ip}:3000/trialDataFile`;
          const headers = form.getHeaders();

          const trialSubjectId = filename.split('.')[0];
          axios.patch(
            `http://${masterDetails.ip}:3000/trialsubject/${trialSubjectId}`,
            { trialDataStatus: 'DATA_FILE_TRANSFER_IN_PROGRESS' },
          );

          axios
            .post(url, form, {
              headers,
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
            })
            .then((res) => {
              // console.log(res);
              axios.patch(
                `http://${masterDetails.ip}:3000/trialsubject/${trialSubjectId}`,
                { trialDataStatus: 'DATA_FILE_TRANSFERED' },
              );

              const mqttClient = getclient();
              if (mqttClient) {
                console.log('Emitting fileTransfered', {
                  macAddress: macId,
                  trialSubjectId,
                });
                mqttClient.publish(
                  `fileTransfered`,
                  JSON.stringify({ macAddress: macId, trialSubjectId }),
                );
              }

              console.log('removing file >>> ', fileToRemove);
              rmSync(fileToRemove, { force: true });
              this.fileName = null;
              resolve(true);
            })
            .catch((err) => {
              this.fileName = null;
              console.log(err);
              resolve(true);
            });
        } else {
          resolve(true);
        }
      } else {
        resolve(true);
      }
    });
  }
}
