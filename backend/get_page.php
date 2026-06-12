<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once 'headers.php';
require_once 'db.php';

try {
    // Ensure table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS custom_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Ensure content column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM custom_pages LIKE 'content'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE custom_pages ADD COLUMN content LONGTEXT");
    }

    // Ensure owner column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM custom_pages LIKE 'owner'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE custom_pages ADD COLUMN owner VARCHAR(100) DEFAULT 'default'");
    }

    // Ensure type column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM custom_pages LIKE 'type'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE custom_pages ADD COLUMN type VARCHAR(100) DEFAULT 'default'");
    }

    // Ensure title_en column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM custom_pages LIKE 'title_en'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE custom_pages ADD COLUMN title_en VARCHAR(255) DEFAULT NULL");
    }

    // Ensure content_en column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM custom_pages LIKE 'content_en'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE custom_pages ADD COLUMN content_en LONGTEXT DEFAULT NULL");
    }

    // Removed seeding logic so empty states are allowed

    if (!isset($_GET['slug'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Slug is required']);
        exit;
    }

    $slug = $_GET['slug'];
    
    if ($slug === 'privacy-policy') {
        $policy_title = "Política de Privacidade";
        $policy_content = <<<HTML
<h2>1. Informações Gerais e Compromisso de Privacidade</h2>
<p>O <strong>Antestreias</strong> compromete-se a proteger a privacidade e os dados pessoais de todos os utilizadores da nossa plataforma, em estrita conformidade com o Regulamento Geral sobre a Proteção de Dados (<strong>RGPD</strong> - Regulamento (UE) 2016/679 do Parlamento Europeu e do Conselho) e com a legislação portuguesa aplicável em matéria de proteção de dados.</p>
<p>Esta Política de Privacidade descreve de forma clara e transparente as práticas adotadas pelo Antestreias no que diz respeito à recolha, utilização, conservação, segurança e partilha dos dados pessoais associados a todas as funcionalidades e atividades da nossa aplicação web, incluindo registo de contas, participação em passatempos de cinema, avaliações de filmes e gestão de segurança.</p>

<h2>2. Dados Pessoais Recolhidos</h2>
<p>No âmbito do funcionamento da plataforma Antestreias, procedemos à recolha e tratamento das seguintes categorias de dados pessoais, consoante a interação do utilizador:</p>
<ul>
    <li><strong>Dados de Registo e Conta de Utilizador:</strong> Nome de utilizador (username), endereço de e-mail, palavra-passe encriptada, e definições de segurança avançada, tais como chaves de Autenticação de Dois Fatores (2FA / TOTP via Google Authenticator).</li>
    <li><strong>Dados de Participação em Passatempos e Sorteios:</strong> Nome completo, endereço de e-mail de contacto e número de documento de identificação (CC/BI). Estes dados adicionais são estritamente necessários e solicitados com o único propósito de verificação de identidade e acreditação à entrada das salas de cinema e eventos de antestreia pelos promotores e distribuidoras parceiras.</li>
    <li><strong>Dados de Interação e Navegação:</strong> Avaliações, pontuações e críticas de filmes e séries submetidas na plataforma, preferências de interface (ex.: modo escuro/claro), registos de atividade (logs de segurança e auditoria de acessos), endereço IP e dados técnicos do dispositivo e navegador (essenciais para o funcionamento do sistema de segurança e verificação Recaptcha).</li>
</ul>

<h2>3. Finalidades do Tratamento dos Dados</h2>
<p>Os dados pessoais recolhidos pelo Antestreias destinam-se exclusivamente às seguintes finalidades operacionais e funcionais:</p>
<ul>
    <li><strong>Gestão de Contas e Autenticação:</strong> Criação, manutenção e proteção da conta de utilizador, garantindo um acesso seguro e exclusivo através de encriptação robusta e sistemas de verificação em duas etapas (2FA).</li>
    <li><strong>Organização e Processamento de Passatempos:</strong> Registo de participações em passatempos de cinema, realização de sorteios automatizados (algoritmos de seleção aleatória) e comunicação direta de vitória aos premiados através do envio de e-mails dinâmicos com os detalhes da sessão (filme, cinema, data e hora).</li>
    <li><strong>Acreditação em Eventos de Cinema:</strong> Transmissão estritamente necessária do nome e número de identificação dos vencedores às entidades distribuidoras e exibidoras parceiras para a garantia do acesso às salas de cinema.</li>
    <li><strong>Comunicações Transacionais e de Serviço:</strong> Envio de mensagens de correio eletrónico indispensáveis para o funcionamento da plataforma, tais como verificação de conta, redefinição de palavra-passe e alertas de segurança.</li>
    <li><strong>Personalização e Dinamização do Catálogo:</strong> Exibição pública do nome de utilizador associado às críticas e classificações atribuídas no catálogo de filmes e séries.</li>
    <li><strong>Segurança e Manutenção da Plataforma:</strong> Monitorização de tráfego, prevenção de fraudes, deteção de acessos não autorizados, proteção contra abusos automatizados (Recaptcha) e gestão de métricas de desempenho do sistema.</li>
</ul>

<h2>4. Fundamentos de Ilicitude para o Tratamento</h2>
<p>O tratamento de dados pessoais realizado pelo Antestreias fundamenta-se nas seguintes bases legais previstas no Artigo 6.º do RGPD:</p>
<ul>
    <li><strong>Execução do Contrato e Diligências Pré-Contratuais (Art. 6.º, 1, b):</strong> Essencial para a prestação dos serviços subscritos pelo utilizador, incluindo a gestão da conta, o acesso às funcionalidades da plataforma e a administração de passatempos em que o utilizador decida participar.</li>
    <li><strong>Consentimento do Titular dos Dados (Art. 6.º, 1, a):</strong> Solicitado de forma livre, específica, informada e inequívoca para finalidades específicas, como a subscrição de newsletters ou a participação em campanhas promocionais particulares. O consentimento pode ser retirado a qualquer momento.</li>
    <li><strong>Interesses Legítimos do Responsável pelo Tratamento (Art. 6.º, 1, f):</strong> Necessário para garantir a segurança da rede e da informação, prevenir fraudes, gerir registos técnicos (logs) e otimizar a experiência do utilizador na plataforma.</li>
    <li><strong>Cumprimento de Obrigações Jurídicas (Art. 6.º, 1, c):</strong> Resposta a solicitações de autoridades judiciais ou de controlo competentes (como a CNPD), bem como a conservação de dados exigida por disposições legais aplicáveis.</li>
</ul>

<h2>5. Conservação e Retenção dos Dados</h2>
<p>O Antestreias conserva os dados pessoais apenas durante o período estritamente necessário para o cumprimento das finalidades que motivaram a sua recolha, aplicando os seguintes critérios de retenção:</p>
<ul>
    <li><strong>Dados da Conta de Utilizador:</strong> Mantidos enquanto a conta permanecer ativa. Caso o utilizador decida desativar ou eliminar a sua conta, os dados identificativos diretos são removidos ou anonimizados permanentemente dos nossos sistemas de produção.</li>
    <li><strong>Dados de Passatempos e Sorteios:</strong> Os dados específicos fornecidos para efeitos de acreditação em passatempos (como o número de identificação) são conservados apenas durante o período necessário para a realização do evento e decurso do prazo legal de reclamação, sendo posteriormente eliminados ou expurgados através das rotinas de limpeza RGPD geridas pela administração.</li>
    <li><strong>Registos Técnicos e de Segurança (Logs):</strong> Mantidos por períodos limitados e definidos nas configurações de manutenção do sistema, com o objetivo exclusivo de auditoria de segurança e resolução de incidentes técnicos.</li>
</ul>

<h2>6. Partilha e Transmissão de Dados (Destinatários)</h2>
<p>O Antestreias garante que <strong>nunca comercializa, vende ou aluga</strong> dados pessoais de utilizadores a terceiros sob nenhuma circunstância. A transmissão de dados a entidades externas ocorre exclusivamente nos seguintes cenários e sob estritas garantias de confidencialidade:</p>
<ul>
    <li><strong>Parceiros de Cinema e Distribuidoras:</strong> Partilha estrita do nome completo e número de identificação dos vencedores de passatempos com os promotores dos eventos e cinemas exibidores, exclusivamente para efeitos de verificação de lista à porta das salas.</li>
    <li><strong>Prestadores de Serviços Técnicos (Subcontratantes):</strong> Recurso a infraestruturas de alojamento seguro, serviços de entrega de e-mail transacional (servidores SMTP configurados) e serviços de proteção cibernética (Google Recaptcha e APIs de metadados como o TMDB). Todos os subcontratantes atuam sob as instruções diretas do Antestreias e estão contratualmente obrigados a cumprir as normas do RGPD.</li>
    <li><strong>Autoridades Competentes:</strong> Quando exigido por lei ou por decisão judicial vinculativa.</li>
</ul>

<h2>7. Medidas de Segurança e Proteção de Dados</h2>
<p>Para proteger os dados pessoais contra o acesso não autorizado, perda, destruição, alteração ou divulgação indevida, o Antestreias implementa medidas técnicas e organizativas de segurança de vanguarda, que incluem:</p>
<ul>
    <li><strong>Encriptação de Palavras-Passe:</strong> Armazenamento de credenciais utilizando algoritmos de <em>hashing</em> unidirecional de alta segurança (tais como Bcrypt/Argon2).</li>
    <li><strong>Autenticação de Dois Fatores (2FA):</strong> Disponibilização de segurança acrescida através da geração de senhas temporárias de uso único (TOTP) compatíveis com o Google Authenticator.</li>
    <li><strong>Comunicações Seguras:</strong> Toda a informação transmitida entre o dispositivo do utilizador e os nossos servidores é protegida através de protocolos de encriptação SSL/HTTPS.</li>
    <li><strong>Proteção de Infraestrutura:</strong> Utilização de consultas parametrizadas (PDO) para eliminar riscos de injeção SQL, firewalls de aplicação e monitorização contínua de acessos administrativos.</li>
</ul>

<h2>8. Direitos dos Titulares dos Dados</h2>
<p>Nos termos do RGPD, o Antestreias assegura aos utilizadores o exercício pleno e facilitado dos seus direitos relativos aos dados pessoais:</p>
<ul>
    <li><strong>Direito de Acesso e Retificação:</strong> O utilizador pode consultar, atualizar e corrigir os seus dados pessoais a qualquer momento acedendo diretamente à página de <em>Definições de Conta</em> e <em>Perfil</em>.</li>
    <li><strong>Direito ao Apagamento ("Direito ao Esquecimento"):</strong> O utilizador tem a liberdade de solicitar a eliminação ou desativação permanente da sua conta de registo através das opções de gestão na plataforma, cessando o tratamento dos seus dados.</li>
    <li><strong>Direito à Limitação e Oposição:</strong> Possibilidade de contestar ou limitar o tratamento de dados para fins específicos (como comunicações não essenciais).</li>
    <li><strong>Direito à Portabilidade:</strong> Obtenção dos dados pessoais fornecidos num formato estruturado, de uso corrente e de leitura automática.</li>
    <li><strong>Direito de Apresentar Reclamação:</strong> Caso considere que o tratamento dos seus dados viola o RGPD, o utilizador tem o direito de apresentar uma reclamação junto da autoridade de controlo nacional competente em Portugal: a <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong> (www.cnpd.pt).</li>
</ul>

<h2>9. Política de Cookies e Tecnologias de Rastreio</h2>
<p>A plataforma Antestreias utiliza cookies e tecnologias de armazenamento local (<em>LocalStorage</em> / <em>SessionStorage</em>) estritamente necessários para o funcionamento correto da aplicação. Estes incluem cookies de sessão para manter o utilizador autenticado, tokens de verificação 2FA, preferências de tema (modo escuro) e cookies de segurança associados ao serviço Recaptcha. Não utilizamos cookies de rastreio publicitário invasivo ou de terceiros sem o consentimento prévio do utilizador.</p>

<h2>10. Contactos e Encarregado da Proteção de Dados</h2>
<p>Para o exercício de qualquer direito de proteção de dados, esclarecimento de dúvidas sobre a presente Política de Privacidade ou questões relacionadas com o tratamento de informações pessoais, o utilizador pode entrar em contacto direto com a equipa de administração e proteção de dados do Antestreias através do nosso endereço de correio eletrónico oficial de suporte ou através dos formulários de contacto disponibilizados na plataforma.</p>
<hr style="border-color: var(--glass-border); margin: 40px 0;">
<p style="font-size: 14px; color: var(--text-secondary);">Política de Privacidade atualizada e em vigor a partir de Maio de 2026. O Antestreias reserva-se o direito de atualizar este documento periodicamente para refletir alterações legais ou funcionais na plataforma, sendo as modificações devidamente publicitadas no site.</p>
HTML;

        $policy_title_en = "Privacy Policy";
        $policy_content_en = <<<HTML
<h2>1. General Information and Privacy Commitment</h2>
<p><strong>Antestreias</strong> is committed to protecting the privacy and personal data of all users of our platform, in strict compliance with the General Data Protection Regulation (<strong>GDPR</strong> - Regulation (EU) 2016/679 of the European Parliament and of the Council) and applicable Portuguese legislation on data protection.</p>
<p>This Privacy Policy describes in a clear and transparent manner the practices adopted by Antestreias regarding the collection, use, conservation, security, and sharing of personal data associated with all features and activities of our web application, including account registration, participation in movie contests, movie reviews, and security management.</p>

<h2>2. Personal Data Collected</h2>
<p>Within the scope of the operation of the Antestreias platform, we collect and process the following categories of personal data, depending on the user's interaction:</p>
<ul>
    <li><strong>Registration Data and User Account:</strong> Username, email address, encrypted password, and advanced security settings, such as Two-Factor Authentication keys (2FA / TOTP via Google Authenticator).</li>
    <li><strong>Movie Contest and Sweepstakes Participation Data:</strong> Full name, contact email address, and identification document number (CC/BI). These additional data are strictly necessary and requested for the sole purpose of identity verification and accreditation at the entrance of movie theaters and preview events by promoting partners and distributors.</li>
    <li><strong>Interaction and Navigation Data:</strong> Reviews, ratings, and feedback on movies and series submitted on the platform, interface preferences (e.g., dark/light mode), activity records (security logs and access audits), IP address, and technical device and browser data (essential for the security system and Recaptcha verification).</li>
</ul>

<h2>3. Purposes of Data Processing</h2>
<p>The personal data collected by Antestreias are intended exclusively for the following operational and functional purposes:</p>
<ul>
    <li><strong>Account Management and Authentication:</strong> Creation, maintenance, and protection of the user account, ensuring secure and exclusive access through robust encryption and two-step verification systems (2FA).</li>
    <li><strong>Organization and Processing of Contests:</strong> Registration of participations in movie contests, automated draws (random selection algorithms), and direct communication of victory to the winners by sending dynamic emails with session details (movie, cinema, date, and time).</li>
    <li><strong>Accreditation in Movie Events:</strong> Strictly necessary transmission of the name and identification number of the winners to the partner distributor and exhibitor entities to guarantee access to the movie theaters.</li>
    <li><strong>Transactional and Service Communications:</strong> Sending email messages indispensable for the functioning of the platform, such as account verification, password reset, and security alerts.</li>
    <li><strong>Personalization and Catalog Dynamization:</strong> Public display of the username associated with reviews and ratings assigned in the movie and series catalog.</li>
    <li><strong>Platform Security and Maintenance:</strong> Traffic monitoring, fraud prevention, detection of unauthorized access, protection against automated abuse (Recaptcha), and management of system performance metrics.</li>
</ul>

<h2>4. Legal Bases for Processing</h2>
<p>The processing of personal data carried out by Antestreias is based on the following legal bases provided for in Article 6 of the GDPR:</p>
<ul>
    <li><strong>Performance of a Contract and Pre-contractual Steps (Art. 6(1)(b)):</strong> Essential for the provision of services subscribed to by the user, including account management, access to platform features, and administration of contests in which the user decides to participate.</li>
    <li><strong>Consent of the Data Subject (Art. 6(1)(a)):</strong> Requested freely, specifically, informedly, and unambiguously for specific purposes, such as subscribing to newsletters or participating in particular promotional campaigns. Consent can be withdrawn at any time.</li>
    <li><strong>Legitimate Interests of the Controller (Art. 6(1)(f)):</strong> Necessary to guarantee network and information security, prevent fraud, manage technical records (logs), and optimize the user experience on the platform.</li>
    <li><strong>Compliance with Legal Obligations (Art. 6(1)(c)):</strong> Response to requests from competent judicial or control authorities (such as CNPD), as well as the conservation of data required by applicable legal provisions.</li>
</ul>

<h2>5. Data Retention and Conservation</h2>
<p>Antestreias retains personal data only for the period strictly necessary to fulfill the purposes that motivated its collection, applying the following retention criteria:</p>
<ul>
    <li><strong>User Account Data:</strong> Maintained as long as the account remains active. If the user decides to deactivate or delete their account, the direct identifying data are removed or permanently anonymized from our production systems.</li>
    <li><strong>Contest and Sweepstakes Data:</strong> Specific data provided for accreditation purposes in contests (such as the identification number) are kept only for the period necessary for the event and the course of the legal claim period, being subsequently deleted or purged through GDPR cleaning routines managed by the administration.</li>
    <li><strong>Technical and Security Records (Logs):</strong> Kept for limited periods defined in the system maintenance settings, with the exclusive objective of security auditing and technical incident resolution.</li>
</ul>

<h2>6. Sharing and Transmission of Data (Recipients)</h2>
<p>Antestreias guarantees that it <strong>never commercializes, sells, or rents</strong> personal data of users to third parties under any circumstances. The transmission of data to external entities occurs exclusively in the following scenarios and under strict guarantees of confidentiality:</p>
<ul>
    <li><strong>Cinema Partners and Distributors:</strong> Strict sharing of the full name and identification number of contest winners with event promoters and exhibiting cinemas, exclusively for verification of the list at the entrance of the theaters.</li>
    <li><strong>Technical Service Providers (Processors):</strong> Use of secure hosting infrastructures, configured SMTP transaction email delivery services, and cyber protection services (Google Recaptcha and metadata APIs such as TMDB). All processors act under the direct instructions of Antestreias and are contractually obliged to comply with GDPR rules.</li>
    <li><strong>Competent Authorities:</strong> When required by law or binding court decision.</li>
</ul>

<h2>7. Security and Data Protection Measures</h2>
<p>To protect personal data against unauthorized access, loss, destruction, alteration, or undue disclosure, Antestreias implements state-of-the-art technical and organizational security measures, including:</p>
<ul>
    <li><strong>Password Encryption:</strong> Storage of credentials using high-security one-way hashing algorithms (such as Bcrypt/Argon2).</li>
    <li><strong>Two-Factor Authentication (2FA):</strong> Provision of increased security through the generation of temporary one-time passwords (TOTP) compatible with Google Authenticator.</li>
    <li><strong>Secure Communications:</strong> All information transmitted between the user's device and our servers is protected using SSL/HTTPS encryption protocols.</li>
    <li><strong>Infrastructure Protection:</strong> Use of parameterized queries (PDO) to eliminate SQL injection risks, application firewalls, and continuous monitoring of administrative access.</li>
</ul>

<h2>8. Rights of Data Subjects</h2>
<p>Under the GDPR, Antestreias ensures users full and facilitated exercise of their rights regarding personal data:</p>
<ul>
    <li><strong>Right of Access and Rectification:</strong> The user can consult, update, and correct their personal data at any time by directly accessing the <em>Account Settings</em> and <em>Profile</em> page.</li>
    <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> The user has the freedom to request the permanent deletion or deactivation of their registration account through the management options on the platform, ceasing the processing of their data.</li>
    <li><strong>Right to Restriction and Objection:</strong> Possibility of contesting or restricting the processing of data for specific purposes (such as non-essential communications).</li>
    <li><strong>Right to Portability:</strong> Obtaining personal data provided in a structured, commonly used, and machine-readable format.</li>
    <li><strong>Right to Lodge a Complaint:</strong> If the user considers that the processing of their data violates the GDPR, they have the right to lodge a complaint with the competent national control authority in Portugal: the <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong> (www.cnpd.pt).</li>
</ul>

<h2>9. Cookies Policy and Tracking Technologies</h2>
<p>The Antestreias platform uses cookies and local storage technologies (<em>LocalStorage</em> / <em>SessionStorage</em>) strictly necessary for the correct operation of the application. These include session cookies to keep the user authenticated, 2FA verification tokens, theme preferences (dark mode), and security cookies associated with the Recaptcha service. We do not use invasive tracking or third-party cookies without prior user consent.</p>

<h2>10. Contacts and Data Protection Officer</h2>
<p>For the exercise of any data protection rights, clarification of doubts about this Privacy Policy, or questions related to the treatment of personal information, the user can contact the Antestreias administration and data protection team directly through our official support email address or the contact forms provided on the platform.</p>
<hr style="border-color: var(--glass-border); margin: 40px 0;">
<p style="font-size: 14px; color: var(--text-secondary);">Privacy Policy updated and in effect as of May 2026. Antestreias reserves the right to update this document periodically to reflect legal or functional changes to the platform, with changes being properly publicized on the website.</p>
HTML;

        // Check if privacy policy exists in custom_pages
        $check = $pdo->prepare("SELECT id FROM custom_pages WHERE slug = 'privacy-policy'");
        $check->execute();
        $existing = $check->fetch();

        if (!$existing) {
            $ins = $pdo->prepare("INSERT INTO custom_pages (title, title_en, slug, content, content_en, owner, type) VALUES (?, ?, 'privacy-policy', ?, ?, 'Antestreias', 'Institucional')");
            $ins->execute([$policy_title, $policy_title_en, $policy_content, $policy_content_en]);
        } else {
            $upd = $pdo->prepare("UPDATE custom_pages SET title_en = ?, content_en = ? WHERE slug = 'privacy-policy' AND (title_en IS NULL OR title_en = '' OR content_en IS NULL OR content_en = '')");
            $upd->execute([$policy_title_en, $policy_content_en]);
        }
    }

    if ($slug === 'cookies') {
        $cookies_title = "Política de Cookies";
        $cookies_content = <<<HTML
<h2>1. O que são Cookies?</h2>
<p>Cookies são pequenos ficheiros de texto que um website, ao ser visitado, coloca no computador ou no dispositivo móvel do utilizador através do navegador de internet (browser). A colocação de cookies ajudará o site a reconhecer o seu dispositivo na próxima vez que o visitar, permitindo uma navegação mais rápida, eficiente e adaptada às suas preferências.</p>
<p>No <strong>Antestreias</strong>, utilizamos o termo "cookies" para nos referirmos tanto aos cookies tradicionais como a tecnologias de armazenamento local similares (tais como <em>LocalStorage</em> e <em>SessionStorage</em> do HTML5).</p>

<h2>2. Finalidade dos Cookies no Antestreias</h2>
<p>A nossa plataforma foi concebida com um compromisso estrito com a privacidade. <strong>Não utilizamos cookies para fins de rastreio publicitário invasivo ou comercialização de perfis de utilizador.</strong> Os cookies e tecnologias de armazenamento que utilizamos são estritamente necessários para o funcionamento técnico da plataforma, para a garantia da segurança das contas e para a preservação das preferências de interface de utilizador.</p>

<h2>3. Categorias de Cookies e Tecnologias Utilizadas</h2>
<p>Abaixo detalhamos as categorias específicas de cookies e tecnologias ativas no Antestreias:</p>
<ul>
    <li><strong>Cookies de Sessão e Autenticação (Estritamente Necessários):</strong> Essenciais para permitir o início de sessão (login) na plataforma, manter a sessão ativa enquanto navega entre páginas e validar as credenciais e chaves de Autenticação de Dois Fatores (2FA / TOTP). Sem estes cookies, as áreas reservadas e a participação em passatempos ficam indisponíveis.</li>
    <li><strong>Cookies de Segurança e Prevenção de Abuso (Google Recaptcha):</strong> Utilizados em formulários críticos (registo, login e submissão de passatempos) para distinguir utilizadores humanos de robôs automatizados (bots). Estes cookies são geridos pelo serviço Google Recaptcha e são vitais para proteger a plataforma contra ataques de força bruta e spam.</li>
    <li><strong>Armazenamento de Preferências (LocalStorage):</strong> Utilizado para memorizar as escolhas de interface do utilizador, especificamente o estado do tema visual selecionado (Modo Escuro / Modo Claro) e o registo de que o utilizador já visualizou e aceitou o aviso de cookies (evitando que o banner seja apresentado repetidamente).</li>
</ul>

<h2>4. Cookies de Terceiros e Serviços Externos</h2>
<p>O Antestreias recorre a APIs de terceiros, primariamente o <strong>The Movie Database (TMDB)</strong>, para a obtenção direta e em tempo real de metadados, sinopses e cartazes de filmes e séries. As requisições feitas a estes serviços externos são realizadas de forma segura e não envolvem a partilha de históricos de navegação ou a colocação de cookies de rastreio de terceiros no seu dispositivo através da nossa plataforma.</p>

<h2>5. Gestão e Desativação de Cookies</h2>
<p>Todos os navegadores permitem ao utilizador aceitar, recusar ou apagar cookies, nomeadamente através da seleção das definições apropriadas no respetivo navegador. Pode configurar os cookies no menu "opções" ou "preferências" do seu browser.</p>
<p>Note, no entanto, que ao desativar ou bloquear os cookies estritamente necessários (como os de sessão e autenticação), <strong>não conseguirá iniciar sessão na sua conta Antestreias nem participar nos passatempos de cinema</strong>, uma vez que o sistema não conseguirá validar a sua identidade de forma segura.</p>
<p>Para saber mais sobre como gerir cookies no seu navegador específico, consulte a documentação oficial de suporte:</p>
<ul>
    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" style="color: var(--accent);">Google Chrome</a></li>
    <li><a href="https://support.mozilla.org/pt-PT/kb/ativar-e-desativar-cookies-que-os-websites-utiliza" target="_blank" rel="noreferrer" style="color: var(--accent);">Mozilla Firefox</a></li>
    <li><a href="https://support.apple.com/pt-pt/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer" style="color: var(--accent);">Apple Safari</a></li>
    <li><a href="https://support.microsoft.com/pt-pt/microsoft-edge/eliminar-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer" style="color: var(--accent);">Microsoft Edge</a></li>
</ul>

<h2>6. Atualizações e Contacto</h2>
<p>Esta Política de Cookies pode ser revista periodicamente para refletir melhorias técnicas ou alterações regulamentares. Para qualquer questão relacionada com a utilização de cookies ou com a privacidade na nossa plataforma, entre em contacto com o nosso Encarregado da Proteção de Dados através do e-mail <strong>info@antestreias.com</strong>.</p>
<hr style="border-color: var(--glass-border); margin: 40px 0;">
<p style="font-size: 14px; color: var(--text-secondary);">Política de Cookies atualizada e em vigor a partir de Maio de 2026.</p>
HTML;

        $cookies_title_en = "Cookies Policy";
        $cookies_content_en = <<<HTML
<h2>1. What are Cookies?</h2>
<p>Cookies are small text files that a website, when visited, places on the user's computer or mobile device through the web browser. The use of cookies will help the site recognize your device the next time you visit it, allowing for faster, more efficient, and personalized navigation based on your preferences.</p>
<p>On <strong>Antestreias</strong>, we use the term "cookies" to refer to both traditional cookies and similar local storage technologies (such as HTML5 <em>LocalStorage</em> and <em>SessionStorage</em>).</p>

<h2>2. Purpose of Cookies on Antestreias</h2>
<p>Our platform was designed with a strict commitment to privacy. <strong>We do not use cookies for invasive advertising tracking or user profiling purposes.</strong> The cookies and storage technologies we use are strictly necessary for the technical operation of the platform, the guarantee of account security, and the preservation of user interface preferences.</p>

<h2>3. Categories of Cookies and Technologies Used</h2>
<p>Below we detail the specific categories of cookies and active technologies on Antestreias:</p>
<ul>
    <li><strong>Session and Authentication Cookies (Strictly Necessary):</strong> Essential to allow logging in to the platform, keeping the session active while navigating between pages, and validating credentials and Two-Factor Authentication (2FA / TOTP) keys. Without these cookies, reserved areas and participation in contests will be unavailable.</li>
    <li><strong>Security and Abuse Prevention Cookies (Google Recaptcha):</strong> Used on critical forms (registration, login, and contest submission) to distinguish human users from automated bots. These cookies are managed by the Google Recaptcha service and are vital to protect the platform against brute-force attacks and spam.</li>
    <li><strong>Preference Storage (LocalStorage):</strong> Used to remember user interface choices, specifically the selected visual theme state (Dark Mode / Light Mode) and the record that the user has already viewed and accepted the cookies notice (preventing the banner from being presented repeatedly).</li>
</ul>

<h2>4. Third-Party Cookies and External Services</h2>
<p>Antestreias uses third-party APIs, primarily <strong>The Movie Database (TMDB)</strong>, for direct and real-time retrieval of metadata, sinopses, and posters of movies and series. Requests made to these external services are executed securely and do not involve sharing browsing history or placing third-party tracking cookies on your device through our platform.</p>

<h2>5. Management and Deactivation of Cookies</h2>
<p>All browsers allow the user to accept, refuse, or delete cookies, namely by selecting the appropriate settings in the respective browser. You can configure cookies in your browser's "options" or "preferences" menu.</p>
<p>Note, however, that by disabling or blocking strictly necessary cookies (such as session and authentication cookies), <strong>you will not be able to log in to your Antestreias account or participate in movie contests</strong>, as the system will not be able to validate your identity securely.</p>
<p>To learn more about managing cookies in your specific browser, consult the official support documentation:</p>
<ul>
    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" style="color: var(--accent);">Google Chrome</a></li>
    <li><a href="https://support.mozilla.org/pt-PT/kb/ativar-e-desativar-cookies-que-os-websites-utiliza" target="_blank" rel="noreferrer" style="color: var(--accent);">Mozilla Firefox</a></li>
    <li><a href="https://support.apple.com/pt-pt/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer" style="color: var(--accent);">Apple Safari</a></li>
    <li><a href="https://support.microsoft.com/pt-pt/microsoft-edge/eliminar-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer" style="color: var(--accent);">Microsoft Edge</a></li>
</ul>

<h2>6. Updates and Contact</h2>
<p>This Cookies Policy may be revised periodically to reflect technical improvements or regulatory changes. For any question related to the use of cookies or privacy on our platform, contact our Data Protection Officer at <strong>info@antestreias.com</strong>.</p>
<hr style="border-color: var(--glass-border); margin: 40px 0;">
<p style="font-size: 14px; color: var(--text-secondary);">Cookies Policy updated and in effect as of May 2026.</p>
HTML;

        $check = $pdo->prepare("SELECT id FROM custom_pages WHERE slug = 'cookies'");
        $check->execute();
        $existing = $check->fetch();

        if (!$existing) {
            $ins = $pdo->prepare("INSERT INTO custom_pages (title, title_en, slug, content, content_en, owner, type) VALUES (?, ?, 'cookies', ?, ?, 'Antestreias', 'Institucional')");
            $ins->execute([$cookies_title, $cookies_title_en, $cookies_content, $cookies_content_en]);
        } else {
            $upd = $pdo->prepare("UPDATE custom_pages SET title_en = ?, content_en = ? WHERE slug = 'cookies' AND (title_en IS NULL OR title_en = '' OR content_en IS NULL OR content_en = '')");
            $upd->execute([$cookies_title_en, $cookies_content_en]);
        }
    }

    if ($slug === 'terms-and-conditions') {
        $terms_title = "Termos e Condições";
        $terms_content = <<<HTML
<h2>1. Enquadramento e Aceitação dos Termos</h2>
<p>Bem-vindo ao <strong>Antestreias</strong>. Ao aceder e utilizar esta plataforma web dedicada à divulgação cinematográfica, crítica de filmes e séries, e atribuição de convites para antevisões exclusivas, o utilizador concorda em cumprir e vincular-se na totalidade aos presentes <strong>Termos e Condições de Utilização</strong>, bem como à nossa Política de Privacidade e Política de Cookies.</p>
<p>Se não concordar com alguma das condições estabelecidas neste documento, não deverá registar-se ou utilizar as funcionalidades interativas da nossa plataforma.</p>

<h2>2. Registo de Conta, Segurança e Conduta</h2>
<p>Para interagir na plataforma, classificar títulos, redigir críticas e submeter participações em passatempos de cinema, é necessário proceder à criação de uma conta de utilizador de forma gratuita. O utilizador compromete-se a:</p>
<ul>
    <li>Fornecer dados de registo fidedignos, completos e atualizados.</li>
    <li>Garantir a confidencialidade das suas credenciais de acesso, sendo inteiramente responsável pelas atividades realizadas sob a sua conta.</li>
    <li>Não utilizar nomes de utilizador (usernames) ofensivos, abusivos, que infrinjam direitos de terceiros ou se façam passar por outras entidades.</li>
    <li>Ativar, sempre que possível, o sistema de <strong>Autenticação de Dois Fatores (2FA)</strong> para reforçar a segurança do seu acesso contra tentativas de intrusão.</li>
</ul>

<h2>3. Regras Específicas de Participação em Passatempos</h2>
<p>Os passatempos organizados no Antestreias oferecem a oportunidade de ganhar convites duplos para sessões de antestreia de cinema. O utilizador aceita de forma expressa as seguintes regras fundamentais:</p>
<ul>
    <li><strong>Unicidade de Participação:</strong> Cada utilizador individual apenas pode submeter uma única participação por passatempo. É estritamente proibida a criação de múltiplas contas (clones), utilização de dados de terceiros, ou automatizações para aumentar artificialmente as hipóteses de vitória. Qualquer comportamento suspeito resultará na desqualificação imediata e potencial bloqueio permanente da conta.</li>
    <li><strong>Veracidade dos Dados de Acreditação:</strong> Para efeitos de levantamento de bilhetes ou entrada nas salas, o utilizador deve preencher corretamente o seu nome completo e o número de identificação pessoal (CC/BI) no formulário do passatempo. Estes dados serão transmitidos às distribuidoras de cinema promotoras para constarem nas listas de acreditação à porta do evento.</li>
    <li><strong>Proibição de Venda e Comercialização:</strong> Os convites atribuídos são <strong>estritamente pessoais, intransmissíveis e têm caráter inteiramente gratuito</strong>. É absolutamente proibida a venda, leilão, troca ou comercialização de convites obtidos através do Antestreias. A tentativa de venda de convites em plataformas externas (redes sociais, OLX, etc.) resultará na eliminação imediata e permanente da conta e na comunicação da infração às distribuidoras.</li>
    <li><strong>Lugares e Overbooking:</strong> Os convites obtidos garantem o direito de acesso, contudo o utilizador fica ciente de que as sessões de antestreia são geridas pelas respetivas distribuidoras de cinema e exibidores parceiros, as quais podem praticar <em>overbooking</em> técnico para garantir salas cheias. Aconselha-se a chegada atempada às bilheteiras do cinema, uma vez que a atribuição de lugares físicos é efetuada por estrita ordem de chegada dos convidados e sujeita à lotação da sala de projeção.</li>
</ul>

<h2>4. Conteúdo Gerado pelo Utilizador e Moderação</h2>
<p>Ao publicar críticas, classificações ou qualquer outro conteúdo na plataforma, o utilizador concede ao Antestreias uma licença gratuita, perpétua, não exclusiva e global para exibir, alojar, formatar e indexar esse conteúdo no catálogo público da plataforma.</p>
<p>O utilizador compromete-se a respeitar as seguintes diretrizes de escrita:</p>
<ul>
    <li><strong>Respeito e Urbanidade:</strong> Não publicar críticas contendo linguagem abusiva, discriminatória, difamatória, ou ataques de teor pessoal a artistas, equipas técnicas ou outros utilizadores da comunidade.</li>
    <li><strong>Política de Spoilers:</strong> Utilizar as etiquetas apropriadas de revelação de enredo (spoilers) quando descrever partes cruciais de uma história, preservando a experiência visual de outros membros da comunidade.</li>
    <li><strong>Direitos de Autor e Plágio:</strong> Toda e qualquer crítica submetida deve ser da autoria original do utilizador. Não é permitida a cópia integral ou parcial de críticas publicadas em blogues, redes sociais ou outros meios de comunicação social sem a devida autorização ou sem menção clara do autor.</li>
</ul>

<h2>5. Propriedade Intelectual e Acesso a APIs</h2>
<p>A plataforma Antestreias utiliza metadados, sinopses e imagens promocionais obtidos legitimamente através da API do <strong>The Movie Database (TMDB)</strong>, em conformidade com os termos de utilização desse mesmo serviço. O logótipo, design original, código-fonte e marcas associadas ao Antestreias são propriedade intelectual exclusiva da administração da plataforma e não podem ser reproduzidos sem consentimento por escrito.</p>

<h2>6. Limitação de Responsabilidade e Falhas de Serviço</h2>
<p>O Antestreias envida todos os esforços técnicos para manter a plataforma ativa, segura e livre de erros. Contudo, não assumimos responsabilidade por eventuais falhas de comunicação no envio de e-mails de confirmação de passatempos (resultantes de bloqueios SMTP alheios ao nosso controlo), indisponibilidade temporária de servidores, ou cancelamento abrupto de sessões de antestreia por decisão exclusiva dos estúdios ou salas de cinema exibidoras.</p>

<h2>7. Alterações aos Termos de Utilização</h2>
<p>O Antestreias reserva-se o direito de alterar ou atualizar os presentes Termos e Condições a qualquer momento, sem aviso prévio. As alterações entrarão em vigor no momento da sua publicação nesta página, sendo recomendada a consulta regular deste documento.</p>

<h2>8. Contacto para Suporte e Esclarecimentos</h2>
<p>Caso tenha qualquer dúvida ou necessite de suporte técnico relativo à plataforma e às regras dos passatempos, pode contactar-nos diretamente através do e-mail <strong>info@antestreias.com</strong> ou do formulário oficial de contacto.</p>
<hr style="border-color: var(--glass-border); margin: 40px 0;">
<p style="font-size: 14px; color: var(--text-secondary);">Termos e Condições de Utilização em vigor a partir de Maio de 2026.</p>
HTML;

        $terms_title_en = "Terms and Conditions";
        $terms_content_en = <<<HTML
<h2>1. Framework and Acceptance of Terms</h2>
<p>Welcome to <strong>Antestreias</strong>. By accessing and using this web platform dedicated to movie promotion, movie and series reviews, and distribution of invitations for exclusive previews, the user agrees to comply with and be bound in full by these <strong>Terms and Conditions of Use</strong>, as well as our Privacy Policy and Cookies Policy.</p>
<p>If you do not agree with any of the conditions set forth in this document, you should not register or use the interactive features of our platform.</p>

<h2>2. Account Registration, Security, and Conduct</h2>
<p>To interact on the platform, rate titles, write reviews, and submit entries for movie contests, it is necessary to create a user account free of charge. The user agrees to:</p>
<ul>
    <li>Provide truthful, complete, and updated registration data.</li>
    <li>Guarantee the confidentiality of their access credentials, being entirely responsible for the activities carried out under their account.</li>
    <li>Not use offensive or abusive usernames that infringe the rights of third parties or impersonate other entities.</li>
    <li>Enable, whenever possible, the <strong>Two-Factor Authentication (2FA)</strong> system to reinforce the security of their access against intrusion attempts.</li>
</ul>

<h2>3. Specific Rules for Participation in Contests</h2>
<p>Contests organized on Antestreias offer the opportunity to win double invitations for movie previews. The user expressly accepts the following fundamental rules:</p>
<ul>
    <li><strong>Uniqueness of Participation:</strong> Each individual user may only submit a single entry per contest. The creation of multiple accounts (clones), use of third-party data, or automation to artificially increase winning chances is strictly prohibited. Any suspicious behavior will result in immediate disqualification and potential permanent blocking of the account.</li>
    <li><strong>Veracity of Accreditation Data:</strong> For the purpose of ticket pick-up or entry into movie theaters, the user must correctly fill in their full name and personal identification number (CC/BI) in the contest form. These data will be transmitted to the promoting movie distributors to be included in the accreditation lists at the entrance of the event.</li>
    <li><strong>Prohibition of Sale and Commercialization:</strong> The assigned invitations are <strong>strictly personal, non-transferable, and entirely free of charge</strong>. The sale, auction, exchange, or commercialization of invitations obtained through Antestreias is absolutely prohibited. The attempt to sell invitations on external platforms (social networks, OLX, etc.) will result in immediate and permanent account termination and communication of the violation to the distributors.</li>
    <li><strong>Seating and Overbooking:</strong> Invitations obtained guarantee the right of access, however, the user is aware that preview sessions are managed by the respective movie distributors and partner exhibitors, who may practice technical <em>overbooking</em> to guarantee full theaters. Early arrival at the movie theater box offices is advised, as the allocation of physical seats is made on a strict first-come, first-served basis and subject to theater capacity.</li>
</ul>

<h2>4. User Generated Content and Moderation</h2>
<p>By publishing reviews, ratings, or any other content on the platform, the user grants Antestreias a free, perpetual, non-exclusive, and global license to display, host, format, and index that content in the public catalog of the platform.</p>
<p>The user agrees to respect the following writing guidelines:</p>
<ul>
    <li><strong>Respect and Civility:</strong> Do not publish reviews containing abusive, discriminatory, defamatory language, or personal attacks on artists, technical teams, or other members of the community.</li>
    <li><strong>Spoiler Policy:</strong> Use the appropriate plot reveal labels (spoilers) when describing crucial parts of a story, preserving the viewing experience of other community members.</li>
    <li><strong>Copyright and Plagiarism:</strong> Any and all submitted reviews must be of the user's original authorship. The full or partial copying of reviews published in blogs, social networks, or other media is not allowed without proper authorization or clear mention of the author.</li>
</ul>

<h2>5. Intellectual Property and API Access</h2>
<p>The Antestreias platform uses metadata, sinopses, and promotional images legitimately obtained through the API of <strong>The Movie Database (TMDB)</strong>, in compliance with the terms of use of that service. The logo, original design, source code, and trademarks associated with Antestreias are the exclusive intellectual property of the platform administration and cannot be reproduced without written consent.</p>

<h2>6. Limitation of Liability and Service Failures</h2>
<p>Antestreias makes every technical effort to keep the platform active, secure, and error-free. However, we do not assume responsibility for eventual communication failures in sending contest confirmation emails (resulting from SMTP blocks beyond our control), temporary unavailability of servers, or abrupt cancellation of preview sessions by exclusive decision of the studios or exhibiting movie theaters.</p>

<h2>7. Changes to the Terms of Use</h2>
<p>Antestreias reserves the right to change or update these Terms and Conditions at any time without prior notice. Changes will take effect upon their publication on this page, and regular consultation of this document is recommended.</p>

<h2>8. Contact for Support and Clarification</h2>
<p>If you have any questions or need technical support regarding the platform and contest rules, you can contact us directly at <strong>info@antestreias.com</strong> or through the official contact form.</p>
<hr style="border-color: var(--glass-border); margin: 40px 0;">
<p style="font-size: 14px; color: var(--text-secondary);">Terms and Conditions of Use in effect as of May 2026.</p>
HTML;

        $check = $pdo->prepare("SELECT id FROM custom_pages WHERE slug = 'terms-and-conditions'");
        $check->execute();
        $existing = $check->fetch();

        if (!$existing) {
            $ins = $pdo->prepare("INSERT INTO custom_pages (title, title_en, slug, content, content_en, owner, type) VALUES (?, ?, 'terms-and-conditions', ?, ?, 'Antestreias', 'Institucional')");
            $ins->execute([$terms_title, $terms_title_en, $terms_content, $terms_content_en]);
        } else {
            $upd = $pdo->prepare("UPDATE custom_pages SET title_en = ?, content_en = ? WHERE slug = 'terms-and-conditions' AND (title_en IS NULL OR title_en = '' OR content_en IS NULL OR content_en = '')");
            $upd->execute([$terms_title_en, $terms_content_en]);
        }
    }

    if ($slug === 'contest-rules') {
        $rules_title = "Regulamento Oficial de Passatempos";
        $rules_title_en = "Official Contest Rules";
        
        $rules_content = <<<HTML
<h2>1. Introdução e Âmbito</h2>
<p>O presente Regulamento Oficial estabelece as normas gerais aplicáveis a todos os passatempos e sorteios organizados pelo Antestreias, quer sejam promovidos diretamente na plataforma ou em parceria com distribuidoras, exibidores e promotores de eventos.</p>

<h2>2. Condições de Participação</h2>
<p>Salvo indicação expressa em contrário na página específica de cada passatempo, a participação está aberta a todos os cidadãos residentes em Portugal. No caso de passatempos exclusivos, pode ou não ser necessário que o participante tenha uma conta de utilizador ativa e tenha efetuado o início de sessão.</p>
<p>Só é válida uma participação por pessoa. As participações repetidas (utilizando o mesmo e-mail ou número de documento de identificação/Cartão de Cidadão) serão <strong>ANULADAS</strong>. Nos casos em que o passatempo inclua mais do que um prémio ou local (por exemplo, antestreias do mesmo filme em Lisboa e no Porto), o participante pode submeter uma participação para cada prémio/local. Contudo, o participante não poderá ser vencedor de mais do que um prémio (por exemplo, se receber o bilhete duplo para a antestreia no Porto, ficará inelegível para a antestreia de Lisboa, e vice-versa).</p>
<p>Para a atribuição de qualquer prémio, designadamente convites, DVDs, Blu-rays, CDs, jogos ou livros, serão apenas consideradas participações válidas aquelas que incluam todos os dados pessoais solicitados com nome completo, além da indicação das respostas corretas à pergunta colocada.</p>

<h2>3. Identificação Obrigatória e Levantamento de Prémios</h2>
<p>Para efeitos de atribuição e levantamento de bilhetes e convites de antestreia, é obrigatória a introdução do número do Cartão de Cidadão (CC) ou Bilhete de Identidade (BI). No local de levantamento do convite, pode ser solicitada pelo Cinema exibidor a identificação via documento adequado dentro do prazo de validade.</p>
<p>Os convites atribuídos são estritamente pessoais e intransmissíveis, só podendo ser levantados pelos próprios vencedores. Não é aceite a apresentação de declarações ou autorizações para levantamento por terceiros.</p>

<h2>4. Caráter Privado e Admissão de Eventos</h2>
<p>As antestreias e eventos organizados são privados, sendo que a admissão nas salas de cinema pode ser vetada pelos responsáveis e organizadores do evento, a qualquer momento do mesmo.</p>

<h2>5. Desistências e Não Comparecimento</h2>
<p>As desistências de última hora ou a falta de comparência injustificada às antestreias serão penalizadas. Apenas deve concorrer quem sabe e tem a certeza de que poderá usufruir do prémio, uma vez que o não comparecimento prejudica diretamente o Distribuidor Sponsor do passatempo, o Cinema exibidor, o Antestreias e os restantes participantes que gostariam de ter usufruído do prémio.</p>

<h2>6. Seleção de Vencedores e Sorteios</h2>
<p>Os vencedores serão selecionados de forma automática e aleatória através de um algoritmo de sorteio de entre todas as participações válidas que cumpram os requisitos do passatempo. A decisão do sorteio é soberana e não passível de recurso.</p>

<h2>7. Comunicação dos Resultados</h2>
<p>Os nomes dos vencedores de cada passatempo serão publicados diretamente na página do respetivo filme na plataforma Antestreias. Adicionalmente, cada vencedor receberá uma notificação oficial por correio eletrónico com todas as informações necessárias para usufruir do prémio (local, sala, data, hora e regras de levantamento de bilhetes). O Antestreias não se responsabiliza por eventuais falhas na entrega de e-mails resultantes de filtros de spam ou erros na introdução do endereço eletrónico por parte do utilizador.</p>

<h2>8. Portes de Envio</h2>
<p>Salvo indicação expressa em contrário na página específica do passatempo, os custos de portes de envio de prémios físicos (DVDs, Blu-rays, livros, etc.) não estão incluídos.</p>

<h2>10. Utilização de Dados Pessoais</h2>
<p>Todos os dados pessoais recolhidos no âmbito dos passatempos são tratados de forma estritamente confidencial e em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD). Os dados de identificação dos vencedores serão transmitidos exclusivamente aos promotores e distribuidores responsáveis pela lista de convites na bilheteira do evento.</p>
HTML;

        $rules_content_en = <<<HTML
<h2>1. Introduction and Scope</h2>
<p>These Official Rules establish the general standards applicable to all contests and giveaways organized by Antestreias, whether promoted directly on the platform or in partnership with distributors, exhibitors, and event promoters.</p>

<h2>2. Conditions of Participation</h2>
<p>Unless expressly stated otherwise on the specific page of each contest, participation is open to all citizens residing in Portugal. In the case of exclusive contests, the participant may or may not be required to have an active user account and be logged in.</p>
<p>Only one entry per person is valid. Repeated entries (using the same email or identification document/Citizen Card number) will be <strong>ANNULLED</strong>. In cases where the contest includes more than one prize or location (for example, previews of the same film in Lisbon and Porto), the participant may submit one entry for each prize/location. However, the participant cannot win more than one prize (for example, if they receive a double ticket for the preview in Porto, they will be ineligible for the Lisbon preview, and vice-versa).</p>
<p>For the awarding of any prize, namely invitations, DVDs, Blu-rays, CDs, games, or books, only valid entries that include all requested personal data with full name, in addition to the correct answers to the question asked, will be considered.</p>

<h2>3. Mandatory Identification and Prize Collection</h2>
<p>For the purposes of awarding and collecting tickets and preview invitations, entering the Citizen Card (CC) or Identity Card (BI) number is mandatory. At the invitation collection venue, identification via a suitable and valid document may be requested by the exhibiting Cinema.</p>
<p>The awarded invitations are strictly personal and non-transferable, and can only be collected by the winners themselves. Third-party collection via declarations or authorizations is not accepted.</p>

<h2>4. Private Nature and Admission to Events</h2>
<p>The previews and organized events are private, and admission to movie theaters may be vetoed by the event managers and organizers at any time during the event.</p>

<h2>5. Withdrawals and Non-Attendance</h2>
<p>Last-minute withdrawals or unjustified non-attendance at previews will be penalized. You should only enter if you are certain you can attend, as non-attendance directly harms the sponsoring Distributor of the contest, the exhibiting Cinema, Antestreias, and other participants who would have liked to enjoy the prize.</p>

<h2>6. Selection of Winners and Draws</h2>
<p>Winners will be selected automatically and randomly through a draw algorithm from among all valid entries that meet the contest requirements. The draw decision is final and not subject to appeal.</p>

<h2>7. Communication of Results</h2>
<p>The names of the winners of each contest will be published directly on the page of the respective movie on the Antestreias platform. Additionally, each winner will receive an official notification by email with all the necessary information to enjoy the prize (location, hall, date, time, and ticket pickup rules). Antestreias is not responsible for any email delivery failures resulting from spam filters or errors in entering the email address by the user.</p>

<h2>8. Shipping Costs</h2>
<p>Unless expressly stated otherwise on the specific contest page, shipping costs for physical prizes (DVDs, Blu-rays, books, etc.) are not included.</p>

<h2>10. Use of Personal Data</h2>
<p>All personal data collected within the scope of the contests are treated in strict confidence and in compliance with the General Data Protection Regulation (GDPR). The identification data of the winners will be transmitted exclusively to the promoters and distributors responsible for the invitation list at the event's box office.</p>
HTML;

        $check = $pdo->prepare("SELECT id FROM custom_pages WHERE slug = 'contest-rules'");
        $check->execute();
        $existing = $check->fetch();

        if (!$existing) {
            $ins = $pdo->prepare("INSERT INTO custom_pages (title, title_en, slug, content, content_en, owner, type) VALUES (?, ?, 'contest-rules', ?, ?, 'Antestreias', 'Institucional')");
            $ins->execute([$rules_title, $rules_title_en, $rules_content, $rules_content_en]);
        } else {
            $upd = $pdo->prepare("UPDATE custom_pages SET title_en = ?, content_en = ? WHERE slug = 'contest-rules' AND (title_en IS NULL OR title_en = '' OR content_en IS NULL OR content_en = '')");
            $upd->execute([$rules_title_en, $rules_content_en]);
        }
    }

    $lang = $_GET['lang'] ?? $_COOKIE['app_lang'] ?? 'pt';
    $lang = strtolower(trim($lang));

    $stmt = $pdo->prepare("SELECT title, title_en, content, content_en, owner, updated_at FROM custom_pages WHERE slug = ?");
    $stmt->execute([$slug]);
    $page = $stmt->fetch();

    if ($page) {
        if ($lang === 'en') {
            if (!empty($page['title_en'])) {
                $page['title'] = $page['title_en'];
            }
            if (!empty($page['content_en'])) {
                $page['content'] = $page['content_en'];
            }
        }
        unset($page['title_en']);
        unset($page['content_en']);
        
        echo json_encode($page);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Page not found']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
}
