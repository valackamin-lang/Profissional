import { connectDatabase } from '../config/database';
import { syncDatabase } from '../config/syncDatabase';
import User from '../models/User';
import Role from '../models/Role';
import Profile from '../models/Profile';
import { comparePassword, hashPassword } from '../utils/bcrypt';
import logger from '../config/logger';

async function checkAdmin() {
  try {
    await connectDatabase();
    await syncDatabase(false);
    
    logger.info('🔍 Verificando usuário admin...');

    let admin = await User.findOne({
      where: { email: 'admin@forgetech.com' },
    });

    if (!admin) {
      logger.warn('⚠️  Usuário admin não encontrado! Criando...');
      
      const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
      if (!adminRole) {
        logger.error('❌ Role ADMIN não encontrada! Execute: npm run seed:roles');
        process.exit(1);
      }

      const hashedPassword = await hashPassword('admin123');
      admin = await User.create({
        email: 'admin@forgetech.com',
        password: hashedPassword,
        roleId: adminRole.id,
        isEmailVerified: true,
      });

      await Profile.create({
        userId: admin.id,
        type: 'COMPANY',
        firstName: 'Admin',
        lastName: 'FORGETECH',
        bio: 'Administrador do sistema FORGETECH Professional',
        approvalStatus: 'APPROVED',
      });

      logger.info('✅ Usuário admin criado com sucesso!');
    } else {
      logger.info('✅ Usuário admin encontrado:');
      logger.info(`   ID: ${admin.id}`);
      logger.info(`   Email: ${admin.email}`);
      logger.info(`   Role ID: ${admin.roleId}`);
      logger.info(`   Email verificado: ${admin.isEmailVerified}`);
    }

    // Testar senha
    logger.info('\n🔐 Testando senha...');
    const testPassword = 'admin123';
    const isValid = await comparePassword(testPassword, admin.password);
    
    if (isValid) {
      logger.info('✅ Senha está correta!');
    } else {
      logger.warn('⚠️  Senha está incorreta! Corrigindo...');
      
      const newHash = await hashPassword(testPassword);
      admin.password = newHash;
      await admin.save();
      logger.info('✅ Senha corrigida com sucesso!');
    }

    logger.info('\n📝 Credenciais:');
    logger.info('   Email: admin@forgetech.com');
    logger.info('   Senha: admin123');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkAdmin();
