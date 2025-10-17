import fs from 'fs';
import path from 'path';

const envContent = `PORT=5050
JWT_SECRET=al_buruj_stock_management_secret_key_2024_very_long_and_secure
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=al_buruj_stock
HOST=127.0.0.1`;

const envPath = path.join(process.cwd(), '.env');

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('Environment variables:');
    console.log('- PORT: 5050');
    console.log('- DB_HOST: 127.0.0.1');
    console.log('- DB_USER: root');
    console.log('- DB_PASSWORD: (empty)');
    console.log('- DB_NAME: al_buruj_stock');
    console.log('- JWT_SECRET: (set)');
} catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
}



