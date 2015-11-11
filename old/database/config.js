var config = {};
config.tables = [];

config.tables.push({
  name: 'bears',
  columns : ['name']
});

config.tables.push({
  name: 'users',
  columns : ['username', 'password']
});

// config.tables.push({
// 	name: 'dropped',
// 	columns:['username', 'lat', 'lon', 'timestamp','lat_r', 'lon_r', 'headline']
// });
//
// config.tables.push({
// 	name: 'user',
// 	columns:['username', 'password', 'name', 'email', 'mobile', 'join_date', 'reputation']
// });

module.exports = config;
