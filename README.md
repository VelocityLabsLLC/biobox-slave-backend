<h1 align="center">Biobox Slave Backend</h1>

<p align="center">
<a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

## Description
A [Node.js](https://nodejs.org/en/) service built using [Nest.js](https://nestjs.com/) framework.

This service runs on slave box using the environment variables.

The service performs following operations:
- Creates a MQTT server
- Collects sensor data from GPIO pins
- Saves the sensor data to a file and transfers it to master once the trial is complete

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

Nest is [MIT licensed](LICENSE).
