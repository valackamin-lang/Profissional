'use client';
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { createGlobalStyle } from "styled-components";
import bgHero from "@/assets/backgrounds/instituicoes/impal_default.png";
import Button from "@/components/ui/Button";
import { studentService, Course as ApiCourse, StudentProfile, Document } from "@/services/studentService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
// Types
interface Subject {
  subject: string;
  hours: number;
}

interface Semester {
  "1º Semestre": Subject[];
  "2º Semestre": Subject[];
}

interface Curriculum {
  "1º ano": Semester;
  "2º ano": Semester;
  "3º ano"?: Semester;
  "4º ano"?: Semester;
}

interface CourseData {
  name: string;
  relation: string;
  duration: string;
  students: string;
  image: string;
  curriculum: Curriculum;
  requirements: string[];
}


const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  font-family: ${(props) => props.theme.fonts.family.poppins};
  }
  html, body {
    margin: 0;
    padding: 0;
  }
`;

const Container = styled.div`
  width: 100vw;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 100vh;
`;

const Header = styled.div`
  position: relative;
  height: 300px;
  overflow: hidden;
`;

const HeaderImage = styled.div<{ $imageUrl?: string }>`
  width: 100%;
  height: 100%;
  background: ${({ $imageUrl }) =>
    $imageUrl
      ? `url(${$imageUrl}) center/cover no-repeat`
      : `linear-gradient(135deg, rgba(124, 116, 175, 0.8), rgba(164, 149, 211, 0.8))`};
  background-color: #e9ecef;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 18px;

  &:hover {
    background: white;
  }
`;

const InfoCard = styled.div`
  background: ${(props) => props.theme.colors.background};
  margin: -60px 20px 20px;
  border-radius: 20px;
  padding: 30px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 5;
`;

const InfoHeader = styled.div`
  margin-bottom: 20px;
`;

const InfoLabel = styled.p`
  color: ${(props) => props.theme.colors.foreground};
  font-size: 14px;
  margin: 0 0 5px 0;
  font-weight: ${(props) => props.theme.fonts.weight.regular};
`;

const CourseName = styled.h1`
  font-size: 22px;
  font-weight: ${(props) => props.theme.fonts.weight.semibold};
  color: ${(props) => props.theme.colors.textBlack};
  margin: 0 0 8px 0;
`;

const CourseRelation = styled.p`
  color: ${(props) => props.theme.colors.foreground};
  font-size: 14px;
  margin: 0 0 10px 0;
  font-weight: ${(props) => props.theme.fonts.weight.regular};
`;

const InfoStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(props) => props.theme.colors.primary};
  font-size: 14px;
`;

const StatIcon = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e9ecef;
`;

const YearTabs = styled.div`
  display: flex;
  gap: 10px;
  margin: 30px 0 20px 0;
  overflow-x: auto;
  padding-bottom: 5px;
`;

const YearTab = styled.button<{ $active: boolean }>`
  background: ${(props) => (props.$active ? "#7c74af" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#6c757d")};
  border: ${(props) => (props.$active ? "none" : "1px solid #dee2e6")};
  border-radius: 25px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => (props.$active ? "#7c74af" : "#f8f9fa")};
  }
`;

const SemesterSection = styled.div`
  margin-bottom: 30px;
`;

const SemesterTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textBlack};
  margin: 0 0 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HoursLabel = styled.span`
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
`;

const SubjectsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SubjectItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
`;

const SubjectName = styled.span`
  color: #495057;
  font-size: 13px;
`;

const SubjectHours = styled.span`
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 30px 0;
`;

const ExamsSection = styled.div`
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
`;

const ExamsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textBlack};
  margin: 0 0 15px 0;
`;

const ExamCard = styled.div`
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid ${(props) => props.theme.colors.primary};
`;

const ExamName = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textBlack};
  margin: 0 0 8px 0;
`;

const ExamInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 14px;
  color: #6c757d;
`;

const ExamDate = styled.span`
  color: ${(props) => props.theme.colors.primary};
  font-weight: 500;
`;

const EnrollButton = styled.button`
  background: linear-gradient(135deg, #7c74af, #a495d3);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(124, 116, 175, 0.4);
  }
`;

const RequirementsButton = styled.button`
  background: transparent;
  color: #7c74af;
  border: 2px solid #7c74af;
  border-radius: 50px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #7c74af;
    color: white;
  }
`;

const AuthDialog = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const AuthDialogContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const AuthDialogTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
  text-align: center;
`;

const AuthDialogSubtitle = styled.p`
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 25px 0;
  text-align: center;
`;

const AuthButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AuthButton = styled.button<{ $primary?: boolean }>`
  width: 100%;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  border: ${props => props.$primary ? 'none' : '2px solid #7c74af'};
  background: ${props => props.$primary ? '#7c74af' : 'transparent'};
  color: ${props => props.$primary ? 'white' : '#7c74af'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 24px;
  color: #6c757d;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    background: #f8f9fa;
  }
`;

// Função para verificar se uma string é um UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Função para mapear dados da API para o formato da UI
const mapApiCourseToUIData = (apiCourse: ApiCourse): CourseData => {
  const isTechnical = apiCourse.education_level === 'medio';
  const durationMonths = apiCourse.duration_months || 0;
  const duration = durationMonths > 0 
    ? `${durationMonths} meses` 
    : isTechnical ? "9 meses" : "48 meses";
  
  // Organizar disciplinas por semestre/trimestre baseado nos dados reais da API
  const subjects = apiCourse.subjects || [];
  
  // Debug: verificar se as disciplinas estão sendo recebidas
  console.log('📚 Disciplinas recebidas da API:', subjects.length, subjects);
  
  // Inicializar curriculum vazio
  const curriculum: Curriculum = {
    "1º ano": {
      "1º Semestre": [],
      "2º Semestre": [],
    },
    "2º ano": {
      "1º Semestre": [],
      "2º Semestre": [],
    },
  };

  if (isTechnical) {
    // Ensino médio: organizar por trimestre
    // Agrupar por trimestre
    const subjectsByTrimester: { [key: number]: typeof subjects } = {};
    
    subjects.forEach(subject => {
      const trimester = subject.trimester || 1;
      if (!subjectsByTrimester[trimester]) {
        subjectsByTrimester[trimester] = [];
      }
      subjectsByTrimester[trimester].push(subject);
    });
    
    // Mapear trimestres para semestres do 1º ano
    // 1º Trimestre -> 1º Semestre
    // 2º Trimestre -> 1º Semestre (continuação)
    // 3º Trimestre -> 2º Semestre
    
    if (subjectsByTrimester[1]) {
      curriculum["1º ano"]["1º Semestre"].push(...subjectsByTrimester[1].map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      })));
    }
    
    if (subjectsByTrimester[2]) {
      curriculum["1º ano"]["1º Semestre"].push(...subjectsByTrimester[2].map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      })));
    }
    
    if (subjectsByTrimester[3]) {
      curriculum["1º ano"]["2º Semestre"].push(...subjectsByTrimester[3].map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      })));
    }
    
    // Se houver mais disciplinas, distribuir no 2º ano
    if (subjects.length > 18) {
      const remainingSubjects = subjects.slice(18);
      curriculum["2º ano"]["1º Semestre"] = remainingSubjects.slice(0, Math.ceil(remainingSubjects.length / 2)).map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      }));
      curriculum["2º ano"]["2º Semestre"] = remainingSubjects.slice(Math.ceil(remainingSubjects.length / 2)).map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      }));
    }
  } else {
    // Ensino superior: organizar por semestre
    const subjectsBySemester: { [key: number]: typeof subjects } = {};
    
    subjects.forEach(subject => {
      const semester = subject.semester || 1;
      if (!subjectsBySemester[semester]) {
        subjectsBySemester[semester] = [];
      }
      subjectsBySemester[semester].push(subject);
    });
    
    // 1º Semestre -> 1º Semestre do 1º ano
    if (subjectsBySemester[1]) {
      curriculum["1º ano"]["1º Semestre"] = subjectsBySemester[1].map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      }));
    }
    
    // 2º Semestre -> 2º Semestre do 1º ano
    if (subjectsBySemester[2]) {
      curriculum["1º ano"]["2º Semestre"] = subjectsBySemester[2].map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      }));
    }
    
    // Se houver mais semestres, distribuir no 2º ano
    if (subjectsBySemester[3]) {
      curriculum["2º ano"]["1º Semestre"] = subjectsBySemester[3].map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      }));
    }
    
    if (subjectsBySemester[4]) {
      curriculum["2º ano"]["2º Semestre"] = subjectsBySemester[4].map(s => ({
        subject: s.name,
        hours: s.hours || 45,
      }));
    }
  }

  return {
    name: apiCourse.name,
    relation: apiCourse.school?.name || apiCourse.school?.short_name || "Instituição",
    duration: duration,
    students: "Estudantes",
    image: apiCourse.image_url || bgHero.src,
    curriculum,
    requirements: [
      "BI frente e verso (escaneado)",
      "Fotografia tipo passe (escaneada)",
      isTechnical
        ? "Declaração do ensino secundário com notas discriminadas"
        : "Certificado do ensino médio",
      "Atestado médico válido",
      "Cartão de vacina",
    ],
  };
};

const CourseDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { showToast, ToastElement } = useToast();
  const [activeYear, setActiveYear] = useState<keyof Curriculum>("1º ano");
  const [showRequirements, setShowRequirements] = useState(false);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [apiCourse, setApiCourse] = useState<ApiCourse | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [checkingDocuments, setCheckingDocuments] = useState(false);

  const courseId = params.id as string;

  // Buscar curso da API
  useEffect(() => {
    const loadCourse = async () => {
      setIsLoading(true);
      setError(null);

      // Verificar se é um UUID válido
      if (!isUUID(courseId)) {
        setError("ID do curso inválido. O ID deve ser um UUID válido.");
        setIsLoading(false);
        return;
      }

      try {
        const course = await studentService.getCourse(courseId, true, true);
        console.log('📖 Curso completo recebido:', course);
        console.log('📚 Disciplinas no curso:', course.subjects?.length || 0, course.subjects);
        setApiCourse(course);
        const mappedData = mapApiCourseToUIData(course);
        console.log('📋 Curriculum mapeado:', mappedData.curriculum);
        setCourseData(mappedData);
      } catch (err: any) {
        console.error("Erro ao carregar curso da API:", err);
        setError(err.message || "Erro ao carregar curso");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Carregar perfil e documentos quando autenticado
  useEffect(() => {
    const loadProfileAndDocuments = async () => {
      if (isAuthenticated && user) {
        try {
          const [profileData, documentsData] = await Promise.all([
            studentService.getProfile(),
            studentService.getDocuments()
          ]);
          setProfile(profileData);
          setDocuments(documentsData);
        } catch (error) {
          console.error('Erro ao carregar perfil/documentos:', error);
        }
      }
    };

    loadProfileAndDocuments();
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <Container>
        <div style={{ padding: "100px 20px", textAlign: "center" }}>
          <p>Carregando curso...</p>
        </div>
      </Container>
    );
  }

  if (error && !courseData) {
    return (
      <Container>
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <h2>Curso não encontrado</h2>
          <p>{error}</p>
          <button onClick={() => router.back()}>Voltar</button>
        </div>
      </Container>
    );
  }

  if (!courseData) {
    return (
      <Container>
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <h2>Curso não encontrado</h2>
          <button onClick={() => router.back()}>Voltar</button>
        </div>
      </Container>
    );
  }

  const handleBack = () => {
    router.back();
  };

  // Verificar se todos os documentos estão completos
  const checkDocumentsComplete = async (): Promise<boolean> => {
    setCheckingDocuments(true);
    try {
      const profileData = await studentService.getProfile();
      const documentsData = await studentService.getDocuments();
      
      setProfile(profileData);
      setDocuments(documentsData);
      
      // Verificar se tem todos os documentos necessários
      // A API deve retornar has_all_documents no perfil
      if (profileData.has_all_documents === false) {
        showToast("Por favor, complete todos os documentos antes de se matricular", "warning");
        router.push("/candidato/documentos");
        return false;
      }
      
      // Verificar se há documentos pendentes ou rejeitados
      const hasRejectedDocs = documentsData.some(doc => doc.status === 'rejected');
      const hasPendingDocs = documentsData.some(doc => doc.status === 'pending');
      
      if (hasRejectedDocs) {
        showToast("Você tem documentos rejeitados. Por favor, atualize-os antes de se matricular", "warning");
        router.push("/candidato/documentos");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar documentos:', error);
      showToast("Erro ao verificar documentos. Tente novamente.", "error");
      return false;
    } finally {
      setCheckingDocuments(false);
    }
  };

  const handleEnroll = async () => {
    // Verificar se o usuário está autenticado
    if (!isAuthenticated || !user) {
      // Mostrar diálogo de login/register
      setShowAuthDialog(true);
      setAuthMode('login');
      return;
    }
    
    // Verificar se temos o ID do curso
    if (!apiCourse || !apiCourse.id) {
      showToast("Erro: Curso não encontrado", "error");
      return;
    }

    // Verificar documentos completos antes de permitir matrícula
    const documentsComplete = await checkDocumentsComplete();
    if (!documentsComplete) {
      return;
    }

    setIsEnrolling(true);

    try {
      // Verificar se existe pagamento antes de criar matrícula
      const { paymentService } = await import('@/services/paymentService');
      const paymentCheck = await paymentService.checkPaymentByCourse(apiCourse.id, user.id);
      
      // Se não houver pagamento ou se o curso requer pagamento, redirecionar para página de pagamento
      if (!paymentCheck.has_payment || paymentCheck.requires_payment) {
        // Verificar se o curso tem preço (requer pagamento)
        if (apiCourse.price && apiCourse.price > 0) {
          // Redirecionar imediatamente para página de pagamento
          showToast("Redirecionando para o pagamento...", "info");
          router.push(`/curso/${apiCourse.id}/pagamento`);
          setIsEnrolling(false);
          return;
        }
      }

      // Criar matrícula na API
      const enrollment = await studentService.createEnrollment(apiCourse.id);
      
      showToast("Matrícula realizada com sucesso! Aguarde aprovação da escola.", "success");
      
      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        router.push("/estudante/dashboard");
      }, 2000);
    } catch (error: any) {
      let errorMessage = "Erro ao fazer matrícula. Tente novamente.";
      
      // Verificar se é erro de pagamento necessário
      if (error.status === 402 || (error.message && error.message.includes('pagamento'))) {
        errorMessage = error.message || "É necessário efetuar o pagamento antes de se matricular";
        showToast(errorMessage, "info");
        setTimeout(() => {
          router.push(`/curso/${apiCourse?.id}/pagamento`);
        }, 1500);
      } else {
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error.status === 'error' && error.message) {
          errorMessage = error.message;
        } else if (error.errors && typeof error.errors === 'object') {
          // Se houver erros de validação, mostrar o primeiro
          const firstError = Object.values(error.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0] as string;
          }
        }
        
        showToast(errorMessage, "error");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleShowRequirements = () => {
    setShowRequirements(!showRequirements);
  };

  const availableYears = Object.keys(courseData.curriculum) as Array<
    keyof Curriculum
  >;

  // Get current year curriculum safely
  const currentYearCurriculum = courseData.curriculum[activeYear];

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <HeaderImage $imageUrl={courseData.image}>
            <BackButton onClick={handleBack}>←</BackButton>
          </HeaderImage>
        </Header>

        <InfoCard>
          <InfoHeader>
            <InfoLabel>Informações</InfoLabel>
            <CourseName>{courseData.name}</CourseName>
            <CourseRelation>Rel: {courseData.relation}</CourseRelation>

            <InfoStats>
              <StatItem>
                {/* <StatIcon /> */}
                Duração: {courseData.duration}
              </StatItem>
              <StatItem>
                <span>{courseData.students}</span>
              </StatItem>
            </InfoStats>
          </InfoHeader>

          <YearTabs>
            {availableYears.map((year) => (
              <YearTab
                key={year}
                $active={activeYear === year}
                onClick={() => setActiveYear(year)}
              >
                {year}
              </YearTab>
            ))}
          </YearTabs>

          {currentYearCurriculum && (
            <div>
              {Object.entries(currentYearCurriculum).map(
                ([semester, subjects]) => {
                  // Só exibir seção se houver disciplinas
                  if (subjects.length === 0) {
                    return null;
                  }
                  return (
                    <SemesterSection key={semester}>
                      <SemesterTitle>
                        {semester}
                        <HoursLabel>Carga horária</HoursLabel>
                      </SemesterTitle>
                      <SubjectsList>
                        {subjects.map((subject: Subject, index: number) => (
                          <SubjectItem key={index}>
                            <SubjectName>{subject.subject}</SubjectName>
                            <SubjectHours>{subject.hours}</SubjectHours>
                          </SubjectItem>
                        ))}
                      </SubjectsList>
                    </SemesterSection>
                  );
                }
              )}
              {/* Mensagem quando não há disciplinas */}
              {currentYearCurriculum["1º Semestre"].length === 0 && 
               currentYearCurriculum["2º Semestre"].length === 0 && (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  Nenhuma disciplina disponível para este curso.
                </div>
              )}
            </div>
          )}

          {/* Exibir exames de admissão se houver */}
          {apiCourse?.admission_exams && apiCourse.admission_exams.length > 0 && (
            <ExamsSection>
              <ExamsTitle>Exames de Admissão</ExamsTitle>
              {apiCourse.admission_exams.map((exam: any) => {
                const examDate = exam.exam_date ? new Date(exam.exam_date) : null;
                const registrationDeadline = exam.registration_deadline ? new Date(exam.registration_deadline) : null;
                
                return (
                  <ExamCard key={exam.id}>
                    <ExamName>{exam.name}</ExamName>
                    <ExamInfo>
                      {exam.description && <div>{exam.description}</div>}
                      {examDate && (
                        <div>
                          <strong>Data do exame:</strong>{" "}
                          <ExamDate>
                            {examDate.toLocaleDateString('pt-PT', { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </ExamDate>
                        </div>
                      )}
                      {registrationDeadline && (
                        <div>
                          <strong>Prazo de inscrição:</strong>{" "}
                          {registrationDeadline.toLocaleDateString('pt-PT', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {exam.exam_fee && (
                        <div>
                          <strong>Taxa de exame:</strong> {exam.exam_fee.toLocaleString('pt-PT')} kz
                        </div>
                      )}
                      {exam.max_candidates && (
                        <div>
                          <strong>Vagas disponíveis:</strong> {exam.max_candidates} candidatos
                        </div>
                      )}
                      {exam.status && (
                        <div>
                          <strong>Status:</strong>{" "}
                          <span style={{ 
                            color: exam.status === 'scheduled' ? '#28a745' : '#6c757d',
                            fontWeight: 500
                          }}>
                            {exam.status === 'scheduled' ? 'Agendado' : exam.status === 'marked' ? 'Realizado' : exam.status}
                          </span>
                        </div>
                      )}
                    </ExamInfo>
                  </ExamCard>
                );
              })}
            </ExamsSection>
          )}

          {showRequirements && (
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                background: "#f8f9fa",
                borderRadius: "12px",
              }}
            >
              <h4 style={{ marginBottom: "15px", color: "#2c3e50" }}>
                Requisitos para inscrição:
              </h4>
              <ul style={{ paddingLeft: "20px", color: "#495057" }}>
                {courseData.requirements.map((req, index) => (
                  <li key={index} style={{ marginBottom: "8px" }}>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ActionButtons>
            <Button
              bgColor="background"
              textColor="#6C5F8D"
              text="Ver requisitos"
              hasBorder={true}
              onClick={handleShowRequirements}
            >
              {showRequirements ? "Ocultar requisitos" : "Ver requisitos"}
            </Button>
            
            {/* Mostrar botão de matrícula apenas se o usuário estiver autenticado */}
            {isAuthenticated && user ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEnroll();
                }}
                disabled={isEnrolling || checkingDocuments}
                style={{
                  width: "100%",
                  padding: "13px 24px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  backgroundColor: "#6B46C1",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: (isEnrolling || checkingDocuments) ? "not-allowed" : "pointer",
                  opacity: (isEnrolling || checkingDocuments) ? 0.6 : 1,
                  position: "relative",
                  zIndex: 10,
                }}
              >
                {(isEnrolling || checkingDocuments) ? "Processando..." : "Fazer matrícula"}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAuthDialog(true);
                  setAuthMode('login');
                }}
                style={{
                  width: "100%",
                  padding: "13px 24px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  backgroundColor: "#6B46C1",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                Fazer matrícula
              </button>
            )}
          </ActionButtons>
        </InfoCard>
      </Container>
      
      {/* Diálogo de Login/Register */}
      <AuthDialog $show={showAuthDialog}>
        <AuthDialogContent>
          <CloseButton onClick={() => setShowAuthDialog(false)}>×</CloseButton>
          <AuthDialogTitle>
            {authMode === 'login' ? 'Fazer Login' : 'Criar Conta'}
          </AuthDialogTitle>
          <AuthDialogSubtitle>
            {authMode === 'login' 
              ? 'Faça login para se matricular neste curso'
              : 'Crie uma conta para se matricular neste curso'}
          </AuthDialogSubtitle>
          <AuthButtonsContainer>
            <AuthButton
              $primary={authMode === 'login'}
              onClick={() => {
                const currentUrl = `/curso/${courseId}`;
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('redirectAfterLogin', currentUrl);
                }
                router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
              }}
            >
              Fazer Login
            </AuthButton>
            <AuthButton
              $primary={authMode === 'register'}
              onClick={() => {
                const currentUrl = `/curso/${courseId}`;
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('redirectAfterRegister', currentUrl);
                }
                router.push(`/registo?redirect=${encodeURIComponent(currentUrl)}`);
              }}
            >
              Criar Conta
            </AuthButton>
          </AuthButtonsContainer>
        </AuthDialogContent>
      </AuthDialog>
      
      {ToastElement}
    </>
  );
};

export default CourseDetailPage;
