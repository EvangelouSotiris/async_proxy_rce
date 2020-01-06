# ASYNXY : World Wide Web Technologies ECE U-188 Final Project

## Description
Asynxy implements a Master-Proxy-Slave formation. The web application is acting as middleware, receiving commands from masters, informing online slaves of commands and collecting their results to show back to the masters' web interface. The whole process is achieved through asynchronous REST API calls from the slaves to the middleware, which means that the master can control an online slave without the need for the slave machine to have a public IP or be in the same network.

## Technical Information

- <b>Backend:</b> NodeJS, Express, Mysql and Mongoose clients for database calls.
- <b>Slave script:</b> Python 3, requests and subprocess modules.
- <b>Frontend:</b> HTML, CSS, Javascript, Handlebars.js
- <b>Databases:</b> MariaDB, MongoDB v3.6.3

## Using Asynxy

In order for a new master to use asynxy to remotely control his machine, he must first run the script <b> slave.py </b> in the slave machine after manually editing the fields for <i> master name , slave name </i> and the link for the webapp on http://snf-871528.vm.okeanos.grnet.gr:3000/ .

## Authors

**Evangelou Sotiris** - *Developer* - [Github](https://github.com/EvangelouSotiris)

**Iliades John** - *Developer* - [Github](https://github.com/johneliades)
