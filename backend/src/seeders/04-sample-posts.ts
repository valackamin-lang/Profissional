import Post from '../models/Post';
import PostLike from '../models/PostLike';
import PostComment from '../models/PostComment';
import Profile from '../models/Profile';
import FeedItem from '../models/FeedItem';
import { addToFeed } from '../services/feedService';
import logger from '../config/logger';

export const seedSamplePosts = async (): Promise<void> => {
  try {
    logger.info('📝 Seeding sample posts...');

    // Buscar perfis existentes
    const profiles = await Profile.findAll({
      where: {
        approvalStatus: 'APPROVED',
      },
      limit: 10,
    });

    if (profiles.length === 0) {
      logger.warn('⚠️  No approved profiles found. Skipping posts seeder.');
      return;
    }

    const samplePosts = [
      {
        content: 'Acabei de concluir um curso incrível sobre desenvolvimento web! Aprendi muito sobre React e Next.js. Recomendo muito para quem está começando na área de tecnologia. 🚀 #DesenvolvimentoWeb #React #NextJS',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Estou procurando um mentor na área de Data Science. Alguém tem experiência com machine learning e poderia me ajudar? Seria uma grande oportunidade de aprendizado! 📊 #DataScience #MachineLearning #Mentoria',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Compartilhando uma dica valiosa: sempre mantenha seu portfólio atualizado! Isso faz toda a diferença na hora de conseguir oportunidades. Acabei de atualizar o meu e já recebi várias propostas interessantes. 💼',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Workshop gratuito sobre empreendedorismo digital acontecerá na próxima semana! Vamos discutir estratégias de marketing digital, gestão de negócios online e muito mais. Interessados podem se inscrever pelo link na bio! 🎯 #Empreendedorismo #MarketingDigital',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Dica para estudantes: não subestimem o poder das soft skills! Comunicação, trabalho em equipe e resolução de problemas são tão importantes quanto as habilidades técnicas. Invistam no desenvolvimento pessoal! 🌟',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Acabei de lançar uma nova mentoria sobre carreira em tecnologia! Vamos cobrir desde os fundamentos até estratégias avançadas para crescimento profissional. Vagas limitadas! 🎓 #Mentoria #CarreiraTech',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Networking é essencial! Participei de um evento incrível ontem e conheci profissionais fantásticos. A troca de experiências é fundamental para o crescimento. Vamos nos conectar! 🤝 #Networking #Profissional',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Reflexão do dia: o aprendizado contínuo é a chave para o sucesso. Não importa onde você está na sua jornada, sempre há algo novo para aprender. Mantenham-se curiosos e abertos a novas oportunidades! 📚',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Estou oferecendo consultoria gratuita para startups em fase inicial. Se você tem uma ideia e precisa de orientação sobre validação, MVP ou estratégia de mercado, entre em contato! 🚀 #Startup #Consultoria',
        visibility: 'PUBLIC' as const,
      },
      {
        content: 'Compartilhando uma conquista pessoal: consegui minha primeira vaga como desenvolvedor júnior! Foi uma jornada desafiadora, mas com dedicação e foco, consegui alcançar meu objetivo. Para quem está na mesma jornada, não desistam! 💪 #Sucesso #Carreira',
        visibility: 'PUBLIC' as const,
      },
    ];

    const createdPosts = [];

    // Criar posts
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const author = profiles[i % profiles.length]; // Distribuir posts entre os perfis

      const post = await Post.create({
        authorId: author.id,
        content: postData.content,
        visibility: postData.visibility,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      });

      createdPosts.push(post);
      logger.info(`✅ Created post ${i + 1}/${samplePosts.length} by ${author.firstName || author.companyName || 'User'}`);

      // Adicionar ao feed
      await addToFeed('POST', post.id, 3);
    }

    // Criar algumas curtidas
    logger.info('❤️  Creating sample likes...');
    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      const numLikes = Math.floor(Math.random() * 5) + 1; // 1 a 5 curtidas por post

      for (let j = 0; j < numLikes && j < profiles.length; j++) {
        const liker = profiles[(i + j + 1) % profiles.length];
        
        // Não deixar o autor curtir seu próprio post
        if (liker.id !== post.authorId) {
          try {
            await PostLike.create({
              postId: post.id,
              userId: liker.id,
            });
            await post.increment('likesCount');
          } catch (error) {
            // Ignorar se já existe (unique constraint)
          }
        }
      }
    }

    // Criar alguns comentários
    logger.info('💬 Creating sample comments...');
    const commentTemplates = [
      'Ótimo post! Muito útil.',
      'Concordo totalmente!',
      'Excelente dica, obrigado por compartilhar!',
      'Isso é muito interessante, vou pesquisar mais sobre.',
      'Parabéns pela iniciativa!',
      'Adorei o conteúdo!',
      'Muito bem explicado!',
      'Vou compartilhar isso com minha rede.',
    ];

    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      const numComments = Math.floor(Math.random() * 3) + 1; // 1 a 3 comentários por post

      for (let j = 0; j < numComments && j < profiles.length; j++) {
        const commenter = profiles[(i + j + 2) % profiles.length];
        
        // Não deixar o autor comentar seu próprio post
        if (commenter.id !== post.authorId) {
          const comment = await PostComment.create({
            postId: post.id,
            authorId: commenter.id,
            content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
            likesCount: 0,
          });
          await post.increment('commentsCount');
          logger.info(`  💬 Comment created on post ${i + 1}`);
        }
      }
    }

    logger.info(`✅ Created ${createdPosts.length} posts with likes and comments!`);
  } catch (error) {
    logger.error('❌ Error seeding sample posts:', error);
    throw error;
  }
};
