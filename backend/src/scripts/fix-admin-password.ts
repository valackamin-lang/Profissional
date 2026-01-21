import { connectDatabase } from '../config/database';
import User from '../models/User';
import { hashPassword } from '../utils/bcrypt';
import logger from '../config/logger';

async function fixAdminPassword() {
  try {
    await connectDatabase();
    logger.info('🔧 Corrigindo senha do admin...');

    const admin = await User.findOne({
      where: { email: 'admin@forgetech.com' },
    });

    if (!admin) {
      logger.error('❌ Usuário admin não encontrado!');
      logger.info('💡 Execute: npm run seed');
      process.exit(1);
    }

    logger.info(`✅ Usuário encontrado: ${admin.email}`);
    logger.info('🔐 Gerando novo hash da senha...');
    
    const newHash = await hashPassword('admin123');
    admin.password = newHash;
    await admin.save();
    
    logger.info('✅ Senha do admin corrigida com sucesso!');
    logger.info('📝 Credenciais:');
    logger.info('   Email: admin@forgetech.com');
    logger.info('   Senha: admin123');
    
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Erro:', error.message || error);
    if (error.stack) {
      logger.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

fixAdminPassword();
