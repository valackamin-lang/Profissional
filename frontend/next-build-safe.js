#!/usr/bin/env node
/**
 * Wrapper para next build que ignora erros de .env.local
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env.local', '.env'];

// Tentar remover arquivos .env problemáticos silenciosamente
envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    if (fs.existsSync(filePath)) {
      // Tentar ler para verificar permissões
      fs.accessSync(filePath, fs.constants.R_OK);
    }
  } catch (error) {
    if (error.code === 'EACCES') {
      console.warn(`⚠️  Arquivo ${file} tem permissões incorretas. Execute: sudo rm -f ${file}`);
      console.warn(`   Ou execute: ./limpar-env.sh`);
    }
  }
});

// Executar build normalmente
try {
  execSync('next build', { 
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
    }
  });
} catch (error) {
  if (error.message && error.message.includes('EACCES')) {
    console.error('\n❌ Erro de permissão no arquivo .env.local');
    console.error('   Execute: ./limpar-env.sh');
    console.error('   Ou: sudo rm -f .env .env.local\n');
  }
  process.exit(error.status || 1);
}
