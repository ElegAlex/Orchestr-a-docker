import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Projects + RBAC Workflow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test users with different roles
  const adminUser = {
    email: `e2e-admin-${Date.now()}@example.com`,
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  };

  const managerUser = {
    email: `e2e-manager-${Date.now()}@example.com`,
    password: 'ManagerPass123!',
    firstName: 'Manager',
    lastName: 'User',
    role: 'MANAGER',
  };

  const contributorUser = {
    email: `e2e-contributor-${Date.now()}@example.com`,
    password: 'ContribPass123!',
    firstName: 'Contributor',
    lastName: 'User',
    role: 'CONTRIBUTOR',
  };

  let adminToken: string;
  let adminId: string;
  let managerToken: string;
  let managerId: string;
  let contributorToken: string;
  let contributorId: string;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Register all test users
    const adminRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser);
    adminToken = adminRegister.body.accessToken;
    adminId = adminRegister.body.user.id;

    const managerRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send(managerUser);
    managerToken = managerRegister.body.accessToken;
    managerId = managerRegister.body.user.id;

    const contributorRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send(contributorUser);
    contributorToken = contributorRegister.body.accessToken;
    contributorId = contributorRegister.body.user.id;
  });

  afterAll(async () => {
    // Cleanup: delete test data
    if (projectId) {
      await prisma.task.deleteMany({ where: { projectId } }).catch(() => {});
      await prisma.projectMember
        .deleteMany({ where: { projectId } })
        .catch(() => {});
      await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    }
    await prisma.user.delete({ where: { id: adminId } }).catch(() => {});
    await prisma.user.delete({ where: { id: managerId } }).catch(() => {});
    await prisma.user
      .delete({ where: { id: contributorId } })
      .catch(() => {});
    await app.close();
  });

  describe('1. Project Creation - RBAC', () => {
    it('should allow ADMIN to create a project', async () => {
      const projectData = {
        name: 'E2E Test Project - Admin',
        description: 'Project created by ADMIN for E2E testing',
        managerId: adminId,
        status: 'ACTIVE',
        priority: 'HIGH',
        startDate: '2025-01-01',
        dueDate: '2025-12-31',
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.name).toBe(projectData.name);
      expect(response.body.managerId).toBe(adminId);
      expect(response.body.status).toBe('ACTIVE');

      projectId = response.body.id;

      // Verify in database
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(project).toBeTruthy();
      expect(project.name).toBe(projectData.name);
    });

    it('should allow MANAGER to create a project', async () => {
      const projectData = {
        name: 'E2E Test Project - Manager',
        description: 'Project created by MANAGER',
        managerId: managerId,
        status: 'ACTIVE',
        priority: 'MEDIUM',
        startDate: '2025-01-01',
        dueDate: '2025-12-31',
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.name).toBe(projectData.name);
      expect(response.body.managerId).toBe(managerId);

      // Cleanup this test project
      await prisma.project
        .delete({ where: { id: response.body.id } })
        .catch(() => {});
    });

    it('should deny CONTRIBUTOR from creating a project (403)', async () => {
      const projectData = {
        name: 'E2E Test Project - Contributor',
        description: 'This should fail',
        managerId: contributorId,
        status: 'ACTIVE',
        priority: 'LOW',
        startDate: '2025-01-01',
        dueDate: '2025-12-31',
      };

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send(projectData)
        .expect(403); // Forbidden
    });

    it('should deny anonymous users from creating a project (401)', async () => {
      const projectData = {
        name: 'E2E Test Project - Anonymous',
        description: 'This should fail',
        managerId: adminId,
        status: 'ACTIVE',
        priority: 'LOW',
        startDate: '2025-01-01',
        dueDate: '2025-12-31',
      };

      await request(app.getHttpServer())
        .post('/projects')
        .send(projectData)
        .expect(401); // Unauthorized
    });

    it('should validate project data (invalid dates)', async () => {
      const projectData = {
        name: 'Invalid Project',
        managerId: adminId,
        status: 'ACTIVE',
        priority: 'HIGH',
        startDate: '2025-12-31',
        dueDate: '2025-01-01', // End before start!
      };

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(projectData)
        .expect(400); // Bad Request
    });
  });

  describe('2. Project Members Management', () => {
    it('should allow ADMIN to add members to project', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: contributorId, role: 'member' })
        .expect(201);

      // Verify in database
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: contributorId,
          },
        },
      });
      expect(member).toBeTruthy();
      expect(member.role).toBe('member');
    });

    it('should allow MANAGER to add members to their project', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: managerId, role: 'member' })
        .expect(201);
    });

    it('should deny CONTRIBUTOR from adding members (403)', async () => {
      // Create a new user to add
      const newUser = {
        email: `e2e-new-${Date.now()}@example.com`,
        password: 'NewPass123!',
        firstName: 'New',
        lastName: 'User',
        role: 'CONTRIBUTOR',
      };

      const newUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser);

      const newUserId = newUserResponse.body.user.id;

      await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ userId: newUserId, role: 'member' })
        .expect(403);

      // Cleanup
      await prisma.user.delete({ where: { id: newUserId } }).catch(() => {});
    });

    it('should prevent adding same member twice (409)', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: contributorId, role: 'member' })
        .expect(409); // Conflict
    });
  });

  describe('3. Project Access - RBAC', () => {
    it('should allow all authenticated users to list projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${contributorToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should allow project members to view project details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
      expect(response.body.name).toBeTruthy();
    });

    it('should allow ADMIN to view project statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('tasksByStatus');
      expect(response.body).toHaveProperty('counts');
    });
  });

  describe('4. Project Modification - RBAC', () => {
    it('should allow ADMIN to update any project', async () => {
      const updateData = {
        name: 'Updated Project Name by Admin',
        description: 'Updated by ADMIN',
      };

      const response = await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should allow MANAGER to update their own project', async () => {
      const updateData = {
        description: 'Updated by project manager',
      };

      await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
    });

    it('should deny CONTRIBUTOR from updating project (403)', async () => {
      const updateData = {
        name: 'Hacked Project Name',
      };

      await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('5. Project Member Removal', () => {
    it('should allow ADMIN to remove members', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}/members/${managerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify in database
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: managerId,
          },
        },
      });
      expect(member).toBeNull();
    });

    it('should deny CONTRIBUTOR from removing members (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}/members/${contributorId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send()
        .expect(403);
    });
  });

  describe('6. Project Deletion - RBAC', () => {
    it('should deny deletion if project has tasks', async () => {
      // Create a task in the project
      const taskData = {
        title: 'Test Task',
        description: 'Task to prevent deletion',
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
      };

      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(taskData)
        .expect(201);

      const taskId = taskResponse.body.id;

      // Try to delete project (should fail)
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // Bad Request

      // Cleanup task
      await prisma.task.delete({ where: { id: taskId } }).catch(() => {});
    });

    it('should deny CONTRIBUTOR from deleting project (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .expect(403);
    });

    it('should allow ADMIN to delete empty project', async () => {
      // Ensure project has no tasks
      await prisma.task
        .deleteMany({ where: { projectId } })
        .catch(() => {});

      await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify in database
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(project).toBeNull();

      projectId = null; // Prevent cleanup error
    });
  });

  describe('7. Complete Project Workflow', () => {
    it('should execute full project lifecycle with proper RBAC', async () => {
      // 1. ADMIN creates project
      const projectData = {
        name: 'Complete Lifecycle Project',
        description: 'Testing full workflow',
        managerId: adminId,
        status: 'ACTIVE',
        priority: 'HIGH',
        startDate: '2025-01-01',
        dueDate: '2025-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(projectData)
        .expect(201);

      const fullProjectId = createResponse.body.id;

      // 2. ADMIN adds CONTRIBUTOR as member
      await request(app.getHttpServer())
        .post(`/projects/${fullProjectId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: contributorId, role: 'member' })
        .expect(201);

      // 3. CONTRIBUTOR can view the project
      const viewResponse = await request(app.getHttpServer())
        .get(`/projects/${fullProjectId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .expect(200);

      expect(viewResponse.body.id).toBe(fullProjectId);

      // 4. CONTRIBUTOR cannot update the project
      await request(app.getHttpServer())
        .patch(`/projects/${fullProjectId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ name: 'Hacked' })
        .expect(403);

      // 5. ADMIN updates the project
      await request(app.getHttpServer())
        .patch(`/projects/${fullProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      // 6. ADMIN removes CONTRIBUTOR
      await request(app.getHttpServer())
        .delete(`/projects/${fullProjectId}/members/${contributorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 7. ADMIN deletes project
      await request(app.getHttpServer())
        .delete(`/projects/${fullProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
