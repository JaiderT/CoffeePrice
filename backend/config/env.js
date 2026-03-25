const requiredEnv = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
    'FRONTEND_URL',
];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Falta la variable de entorno obligatoria: ${key}`);
    }
}