#!/usr/bin/env node
var util = require('util');
var geocoderProvider = 'google';
var httpAdapter = 'https';

var extra = {
    apiKey: null, // for mapquest, opencagedata, Google premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder').getGeocoder(geocoderProvider, httpAdapter, extra);

var myTester = require('./myTester');

var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 1000);

var Sequelize = require('sequelize'), 
    sequelize = new Sequelize('actout', 'root', 'unc3@Uniform', {
        dialect: "mysql", // or 'sqlite', 'postgres', 'mariadb'
        port:    3306, // or 5432 (for postgres)
    }
)
 
sequelize
    .authenticate()
    .complete(function(err) {
        if (!!err) {
        console.log('Unable to connect to the database:', err)
    } else {
        console.log('Connection has been established successfully.');
    }
})

var Address = sequelize.define('Address', {
    id: { type: Sequelize.INTEGER, field: 'address_id', primaryKey: true, autoIncrement: true, allowNull: false },
    street: { type: Sequelize.STRING, field: 'address_street'},
    street2: { type: Sequelize.STRING, field: 'address_street2'},
    city: { type: Sequelize.STRING, field: 'address_city'},
    state: { type: Sequelize.STRING, field: 'address_state'},
    zip: { type: Sequelize.INTEGER, field: 'address_zip'}
}, {
    tableName: 'act_address',
    timestamps: false
})

var Location = sequelize.define('Location', {
    id: { type: Sequelize.INTEGER, field: 'loc_id', primaryKey: true, autoIncrement: true, allowNull: false },
    formatted_address: { type: Sequelize.STRING, field: 'loc_address' },
    lat: { type: Sequelize.DECIMAL(10,8), field: 'loc_lat' },
    lng: { type: Sequelize.DECIMAL(11,8), field: 'loc_lng' }
}, {
    tableName: 'act_location',
    timestamps: false
})

Address.hasMany(Location, {
    foreignKey: {
        fieldName: 'loc_address_id'
    }
})

Location.belongsTo(Address)

// Read from DB

Address
  .all()
  .complete(function(err, results) {
    if (!!err) {
      console.log('An error occurred: ', err)
    } else if (!results) {
      console.log('No results have been found.')
    } else {

        results.forEach(function(result){

            limiter.removeTokens(1, function() {

                var address = result.selectedValues;
                var strAddress = util.format('%s %s, %s  %s', address.address_street, address.address_city, address.address_state, address.address_zip);

                geocoder.geocode(strAddress, function(err, res) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log(strAddress);
                        console.log(res); 
                    }
                });

            });

        })

    }
  })
