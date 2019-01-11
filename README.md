GXB-UI 1.0
============

GXB data exchange wallet client-side, functions including transfer, transaction search, block search, account search, data product search, alliance search, merchant and data source authentication are supported

>  This project was forked form official light wallet of BitShares2.0 [bitshares-ui](https://github.com/bitshares/bitshares-ui), trade modules were removed, modification based on the need of GXB data exchange, some extra modules were not removed due to dependent coupling issues, will be solved in the following version。

<img width="400px" src='https://raw.githubusercontent.com/gxchain/gxips/master/assets/images/task-wallet.png'/>

## Install

Required: Node 6+

Operation system: OSX、Ubuntu

Recommend to use NVM([Node Version Manager](https://github.com/creationix/nvm))for installation:

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
. ~/.nvm/nvm.sh
nvm install v6
nvm use v6
```

Clone project:

```
git clone https://github.com/gxchain/gxb-light.git
cd gxb-light
```

Shift to `/web` catalog to install dependencies :

```
cd web
npm install
```

## launch
Develop mode depend on Express and webpack2, after install dependencies, under catalog `/web` and execute below scripts to start the project:
```
npm start
```

open: `localhost:8080` or `127.0.0.1:8080` in your browser.
Hot reload is supported.

## Deploy
Compile static web page by using commands below
```
npm run build
```
Results in the catalog `/dist` , Deploy through nginx、apache or others based on your preference
## Packing wallet installation files

Electron is used to packing the wallet, Windows, OSX, Linux ,and Debian are supported.Execute the following scripts for packing:
```
cd web
npm run electron
cd ../electron ##First time launch need execute install depend npm install

npm run release
```

Under different environment, packing corresponding installation package, respectively
## Development style

- bug prioritization

## Code style

[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

We highly recommend to use _eslint_ for formating your code
