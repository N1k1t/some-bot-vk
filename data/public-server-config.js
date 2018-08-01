let isProduction = process.env['NODE_ENV'] == 'production';

module.exports = {
	port: isProduction ? 7171 : 80,
	host: isProduction ? '[notForPublic]' : '127.0.0.15',
	serviceAccessToken: '[notForPublic]'
}