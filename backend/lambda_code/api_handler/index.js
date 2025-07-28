const logger = require('./logger');

exports.handler = async (event) => {
    logger.info('API Handler invoked', { path: event.rawPath, method: event.requestContext.http.method });
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' // This should be more specific in production
        },
        body: JSON.stringify({
            message: 'API Handler placeholder - replace with actual implementation',
            path: event.rawPath,
            method: event.requestContext.http.method
        })
    };
};