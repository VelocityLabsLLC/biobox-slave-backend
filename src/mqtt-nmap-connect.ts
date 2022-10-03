const nmap = require('node-nmap');
import axios from 'axios';
import { find } from 'lodash';
import { Client, connect } from 'mqtt';
import { networkInterfaces } from 'os';
const getMAC = require('getmac').default;
const ip = require('ip');

const getNmapSearchString = () => {
  let myIp = ip.address();
  const splitted = myIp.split('.');
  splitted.splice(3);
  const nmapSearchString = `${splitted.join('.')}.1/24`;
  console.log(nmapSearchString);
  return nmapSearchString
};


nmap.nmapLocation = 'nmap'; //default
let client: Client;
const deviceMac = getMAC();
let masterDetails = null;

const connectToMQTT = (hostIP) => {
  client = connect(`mqtt://${hostIP}`);
  // client = connect(`mqtt://test.mosquitto.org`);
  client.on('connect', function () {
    console.log('connectd to MQTT ');
    const deviceDetails = {
      macAddress: deviceMac,
      ipAddress: null,
    };

    console.log('networkInterfaces() >>> ', networkInterfaces());
    const networkObjectToUse =
      networkInterfaces()['wlan0'] || networkInterfaces()['eth0'];
    if (networkObjectToUse) {
      const ipv4 = find(networkObjectToUse, { family: 'IPv4' });
      if (ipv4) {
        deviceDetails.ipAddress = ipv4.address;
      }
    }
    console.log('deviceDetails >>> ', deviceDetails);
    client.publish('deviceconnect', JSON.stringify(deviceDetails));
  });
};

export const scanAndConnect = async () => {
  const quickscan = new nmap.QuickScan(getNmapSearchString(), '-sp');

  const nmapResult: any = await new Promise((res, rej) => {
    quickscan.on('complete', function (deviceList) {
      res(deviceList);
    });
    quickscan.on('error', (error) => {
      rej(error);
    });
  });

  console.log('nmapResult >>> ', nmapResult);

  if (nmapResult && nmapResult.length) {
    try {
      const devicesApiRes = await Promise.all(
        nmapResult.map((req) => {
          const apiUrl = `http://${req.ip}:3000/isMaster`;
          return apiCall(apiUrl, req);
        }),
      );

      console.log('devicesApiRes >>> ', devicesApiRes);
      const masterIpIndex = devicesApiRes.findIndex((res) => {
        if (res !== 'Not Found') {
          return true;
        }
        return false;
      });

      console.log('masterIpIndex >>> ', masterIpIndex);
      if (masterIpIndex < 0) {
        console.log('===== No MASTER device Found in devices ! ===== ');
        scanAndConnect();
      } else {
        masterDetails = devicesApiRes[masterIpIndex];
        connectToMQTT(masterDetails.ip);
        return masterDetails.ip;
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log('===== No devices Found ! ===== ');
    scanAndConnect();
  }
};

export const getclient = () => {
  return client;
};

export const getMasterDetails = () => {
  return masterDetails || null;
};

const apiCall = async (url: string, nmapObj: any) => {
  try {
    await axios({
      method: 'get',
      url,
      timeout: 2000,
    });
    return nmapObj;
  } catch (error) {
    return 'Not Found';
  }
};
