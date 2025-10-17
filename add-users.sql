-- Ajouter des utilisateurs de test supplémentaires
-- Mot de passe pour tous : "password123"

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES
-- Développeurs (CONTRIBUTOR)
('user-001', 'marie.dubois@orchestra.local', '$2b$10$tonnFB1VZBCrM6FRJBEyPuWy7ekAfJXNWZ/Qu.LHTOGut/ux8n1HW', 'Marie', 'Dubois', 'CONTRIBUTOR', true, NOW(), NOW()),
('user-002', 'jean.martin@orchestra.local', '$2b$10$tonnFB1VZBCrM6FRJBEyPuWy7ekAfJXNWZ/Qu.LHTOGut/ux8n1HW', 'Jean', 'Martin', 'CONTRIBUTOR', true, NOW(), NOW()),
('user-003', 'sophie.bernard@orchestra.local', '$2b$10$tonnFB1VZBCrM6FRJBEyPuWy7ekAfJXNWZ/Qu.LHTOGut/ux8n1HW', 'Sophie', 'Bernard', 'CONTRIBUTOR', true, NOW(), NOW()),

-- Managers
('user-004', 'pierre.leroy@orchestra.local', '$2b$10$tonnFB1VZBCrM6FRJBEyPuWy7ekAfJXNWZ/Qu.LHTOGut/ux8n1HW', 'Pierre', 'Leroy', 'MANAGER', true, NOW(), NOW()),
('user-005', 'claire.moreau@orchestra.local', '$2b$10$tonnFB1VZBCrM6FRJBEyPuWy7ekAfJXNWZ/Qu.LHTOGut/ux8n1HW', 'Claire', 'Moreau', 'RESPONSABLE', true, NOW(), NOW()),

-- Viewers
('user-006', 'thomas.petit@orchestra.local', '$2b$10$tonnFB1VZBCrM6FRJBEyPuWy7ekAfJXNWZ/Qu.LHTOGut/ux8n1HW', 'Thomas', 'Petit', 'VIEWER', true, NOW(), NOW());

-- Ajouter les utilisateurs aux projets existants
INSERT INTO project_members (id, project_id, user_id, role, joined_at) VALUES
-- Projet E-commerce
('member-101', 'proj-001', 'user-001', 'Developer', NOW()),
('member-102', 'proj-001', 'user-002', 'Developer', NOW()),
('member-103', 'proj-001', 'user-004', 'Manager', NOW()),

-- Projet Mobile
('member-104', 'proj-002', 'user-002', 'Developer', NOW()),
('member-105', 'proj-002', 'user-003', 'Developer', NOW()),
('member-106', 'proj-002', 'user-004', 'Tech Lead', NOW()),

-- Projet Cloud
('member-107', 'proj-003', 'user-001', 'DevOps', NOW()),
('member-108', 'proj-003', 'user-005', 'Manager', NOW()),

-- Projet Analytics
('member-109', 'proj-004', 'user-003', 'Data Analyst', NOW()),
('member-110', 'proj-004', 'user-005', 'Product Owner', NOW());

-- Réassigner quelques tâches aux nouveaux utilisateurs
UPDATE tasks SET assignee_id = 'user-001' WHERE id IN ('task-001', 'task-007', 'task-013');
UPDATE tasks SET assignee_id = 'user-002' WHERE id IN ('task-002', 'task-005', 'task-008');
UPDATE tasks SET assignee_id = 'user-003' WHERE id IN ('task-003', 'task-006', 'task-011');
UPDATE tasks SET assignee_id = 'user-004' WHERE id IN ('task-004', 'task-009', 'task-014');
UPDATE tasks SET assignee_id = 'user-005' WHERE id IN ('task-010', 'task-012', 'task-015');
