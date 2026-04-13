const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const start = async () => {
    await app.listen({ 
        port: PORT,
        host: '0.0.0.0'
    });
};

start();