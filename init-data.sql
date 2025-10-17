-- Données de test complètes pour Orchestr'A

-- 5 Projets variés
INSERT INTO projects (id, name, description, status, priority, start_date, due_date, manager_id, tags, created_at, updated_at) VALUES
('proj-001', 'Site Web E-commerce', 'Refonte complète du site e-commerce avec nouvelles fonctionnalités', 'ACTIVE', 'HIGH', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', '00000000-0000-0000-0000-000000000001', ARRAY['web', 'ecommerce'], NOW(), NOW()),
('proj-002', 'Application Mobile', 'Application mobile iOS et Android pour les clients', 'ACTIVE', 'HIGH', NOW() - INTERVAL '15 days', NOW() + INTERVAL '90 days', '00000000-0000-0000-0000-000000000001', ARRAY['mobile', 'ios', 'android'], NOW(), NOW()),
('proj-003', 'Migration Cloud', 'Migration infrastructure vers AWS', 'ACTIVE', 'CRITICAL', NOW() - INTERVAL '45 days', NOW() + INTERVAL '30 days', '00000000-0000-0000-0000-000000000001', ARRAY['cloud', 'aws'], NOW(), NOW()),
('proj-004', 'Dashboard Analytics', 'Tableau de bord analytics temps réel', 'DRAFT', 'MEDIUM', NOW(), NOW() + INTERVAL '120 days', '00000000-0000-0000-0000-000000000001', ARRAY['analytics', 'dashboard'], NOW(), NOW()),
('proj-005', 'API v2', 'Nouvelle version de l API REST', 'COMPLETED', 'HIGH', NOW() - INTERVAL '90 days', NOW() - INTERVAL '10 days', '00000000-0000-0000-0000-000000000001', ARRAY['api', 'backend'], NOW(), NOW());

-- Membres des projets
INSERT INTO project_members (id, project_id, user_id, role, joined_at) VALUES
('member-001', 'proj-001', '00000000-0000-0000-0000-000000000001', 'Manager', NOW()),
('member-002', 'proj-002', '00000000-0000-0000-0000-000000000001', 'Manager', NOW()),
('member-003', 'proj-003', '00000000-0000-0000-0000-000000000001', 'Manager', NOW()),
('member-004', 'proj-004', '00000000-0000-0000-0000-000000000001', 'Manager', NOW()),
('member-005', 'proj-005', '00000000-0000-0000-0000-000000000001', 'Manager', NOW());

-- 15 Tâches variées
INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, estimated_hours, due_date, tags, created_at, updated_at) VALUES
-- Projet 1: E-commerce (3 tâches)
('task-001', 'Design page accueil', 'Créer les maquettes de la nouvelle page accueil', 'COMPLETED', 'HIGH', 'proj-001', '00000000-0000-0000-0000-000000000001', 16, NOW() + INTERVAL '10 days', ARRAY['design', 'ui'], NOW(), NOW()),
('task-002', 'Intégration panier', 'Développer la fonctionnalité panier', 'IN_PROGRESS', 'HIGH', 'proj-001', '00000000-0000-0000-0000-000000000001', 24, NOW() + INTERVAL '20 days', ARRAY['dev', 'frontend'], NOW(), NOW()),
('task-003', 'Tests paiement', 'Tester intégration Stripe', 'TODO', 'CRITICAL', 'proj-001', '00000000-0000-0000-0000-000000000001', 8, NOW() + INTERVAL '25 days', ARRAY['test', 'payment'], NOW(), NOW()),
-- Projet 2: Mobile (3 tâches)
('task-004', 'Setup React Native', 'Configuration du projet', 'COMPLETED', 'HIGH', 'proj-002', '00000000-0000-0000-0000-000000000001', 8, NOW() - INTERVAL '5 days', ARRAY['setup', 'mobile'], NOW(), NOW()),
('task-005', 'Écran connexion', 'Développer écran de connexion', 'IN_PROGRESS', 'HIGH', 'proj-002', '00000000-0000-0000-0000-000000000001', 12, NOW() + INTERVAL '5 days', ARRAY['dev', 'auth'], NOW(), NOW()),
('task-006', 'Notifications push', 'Implémenter notifications', 'TODO', 'MEDIUM', 'proj-002', '00000000-0000-0000-0000-000000000001', 16, NOW() + INTERVAL '30 days', ARRAY['feature', 'notif'], NOW(), NOW()),
-- Projet 3: Cloud (4 tâches)
('task-007', 'Audit infrastructure', 'Analyser infrastructure actuelle', 'COMPLETED', 'CRITICAL', 'proj-003', '00000000-0000-0000-0000-000000000001', 16, NOW() - INTERVAL '30 days', ARRAY['audit', 'infra'], NOW(), NOW()),
('task-008', 'Setup AWS', 'Configurer les services AWS', 'COMPLETED', 'CRITICAL', 'proj-003', '00000000-0000-0000-0000-000000000001', 24, NOW() - INTERVAL '15 days', ARRAY['aws', 'setup'], NOW(), NOW()),
('task-009', 'Migration base de données', 'Migrer PostgreSQL vers RDS', 'IN_PROGRESS', 'CRITICAL', 'proj-003', '00000000-0000-0000-0000-000000000001', 32, NOW() + INTERVAL '10 days', ARRAY['database', 'migration'], NOW(), NOW()),
('task-010', 'Tests de charge', 'Tests de performance', 'TODO', 'HIGH', 'proj-003', '00000000-0000-0000-0000-000000000001', 16, NOW() + INTERVAL '20 days', ARRAY['test', 'perf'], NOW(), NOW()),
-- Projet 4: Analytics (2 tâches)
('task-011', 'Maquettes dashboard', 'Créer les wireframes', 'TODO', 'MEDIUM', 'proj-004', '00000000-0000-0000-0000-000000000001', 8, NOW() + INTERVAL '15 days', ARRAY['design', 'ux'], NOW(), NOW()),
('task-012', 'Choix stack technique', 'Sélectionner les technologies', 'TODO', 'MEDIUM', 'proj-004', '00000000-0000-0000-0000-000000000001', 4, NOW() + INTERVAL '10 days', ARRAY['tech', 'decision'], NOW(), NOW()),
-- Projet 5: API v2 (3 tâches complétées)
('task-013', 'Documentation API', 'Rédiger la doc Swagger', 'COMPLETED', 'HIGH', 'proj-005', '00000000-0000-0000-0000-000000000001', 16, NOW() - INTERVAL '20 days', ARRAY['doc', 'api'], NOW(), NOW()),
('task-014', 'Tests intégration', 'Créer les tests E2E', 'COMPLETED', 'HIGH', 'proj-005', '00000000-0000-0000-0000-000000000001', 24, NOW() - INTERVAL '15 days', ARRAY['test', 'e2e'], NOW(), NOW()),
('task-015', 'Déploiement prod', 'Mise en prod API v2', 'COMPLETED', 'CRITICAL', 'proj-005', '00000000-0000-0000-0000-000000000001', 8, NOW() - INTERVAL '10 days', ARRAY['deploy', 'prod'], NOW(), NOW());
