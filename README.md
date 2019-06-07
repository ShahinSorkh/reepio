# reep.io
[![Build Status](https://api.travis-ci.org/ShahinSorkh/reepio.svg?branch=master)](https://travis-ci.org/ShahinSorkh/reepio)


A browser based peer-to-peer file transfer platform.
~~It is running at [https://reep.io](https://reep.io)~~

## What is reep.io?
reep.io uses WebRTC technology to enable peer-to-peer file transfers between two browser without any server interaction.
This repository holds the sources to run the reep.io frontend.
**You will need an [ICE](https://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment) and a [peering server](https://en.wikipedia.org/wiki/Peering#Multilateral_peering) to run this project.**
~~You can find the reep.io peering server [here](https://github.com/KodeKraftwerk/reepio-peering-server)~~

_Note:_ Unfortunately the domain `reep.io` and the `peering server` source code are unavailable.

## TODO
- [x] Find replacement for [peerjs](https://github.com/KodeKraftwerk/peerjs.git)
- [x] Fix tests errors
- [ ] Update all dependencies

## Configuration
You can set some options in the `config/config.{NODE_ENV}.js`.
Have a look into the `config.dev.js` to get an overview over the available options

_Note_: `NODE_ENV` defaults to `production`.

## Running locally

```sh
cd reepio
yarn
yarn build
yarn start
```

The build script is run every time something has changed inside the `src` folder.

You can now access the site by visiting [http://127.0.0.1:9001/](http://127.0.0.1:9001/)

## Running with Vagrant

```sh
vagrant up
vagrant ssh
cd reepio
yarn
yarn build
yarn start
```

You can now access the site by visiting [http://192.168.0.120:9001/](http://192.168.0.120:9001/)

## Running Unit-Tests
You will have to run the end-to-end unit tests on your local machine, as the vagrant box has no gui or browser binaries.

To do so, just run the following command:

```sh
yarn test
```

## License
reep.io uses the [GPL v2](http://www.gnu.org/licenses/gpl-2.0.html) license
