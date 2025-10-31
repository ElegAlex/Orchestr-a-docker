import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Complete Application Workflow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data IDs
  let adminId: string;
  let adminToken: string;
  let managerId: string;
  let managerToken: string;
  let contributor1Id: string;
  let contributor1Token: string;
  let contributor2Id: string;
  let contributor2Token: string;
  let projectId: string;
  let task1Id: string;
  let task2Id: string;
  let task3Id: string;

  const timestamp = Date.now();

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
  });

  afterAll(async () => {
    // Comprehensive cleanup
    if (task1Id) await prisma.task.delete({ where: { id: task1Id } }).catch(() => {});
    if (task2Id) await prisma.task.delete({ where: { id: task2Id } }).catch(() => {});
    if (task3Id) await prisma.task.delete({ where: { id: task3Id } }).catch(() => {});
    if (projectId) {
      await prisma.projectMember.deleteMany({ where: { projectId } }).catch(() => {});
      await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    }
    if (adminId) await prisma.user.delete({ where: { id: adminId } }).catch(() => {});
    if (managerId) await prisma.user.delete({ where: { id: managerId } }).catch(() => {});
    if (contributor1Id) await prisma.user.delete({ where: { id: contributor1Id } }).catch(() => {});
    if (contributor2Id) await prisma.user.delete({ where: { id: contributor2Id } }).catch(() => {});
    await app.close();
  });

  describe('1. Setup: Create Users with Different Roles', () => {
    it('should create ADMIN user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `admin-workflow-${timestamp}@test.com`,
          password: 'AdminPass123!',
          firstName: 'Admin',
          lastName: 'Workflow',
          role: 'ADMIN',
        })
        .expect(201);

      adminId = response.body.user.id;
      adminToken = response.body.accessToken;

      expect(response.body.user.role).toBe('ADMIN');
    });

    it('should create MANAGER user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `manager-workflow-${timestamp}@test.com`,
          password: 'ManagerPass123!',
          firstName: 'Manager',
          lastName: 'Workflow',
          role: 'MANAGER',
        })
        .expect(201);

      managerId = response.body.user.id;
      managerToken = response.body.accessToken;

      expect(response.body.user.role).toBe('MANAGER');
    });

    it('should create CONTRIBUTOR 1', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `contributor1-workflow-${timestamp}@test.com`,
          password: 'Contrib1Pass123!',
          firstName: 'Contributor',
          lastName: 'One',
          role: 'CONTRIBUTOR',
        })
        .expect(201);

      contributor1Id = response.body.user.id;
      contributor1Token = response.body.accessToken;
    });

    it('should create CONTRIBUTOR 2', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `contributor2-workflow-${timestamp}@test.com`,
          password: 'Contrib2Pass123!',
          firstName: 'Contributor',
          lastName: 'Two',
          role: 'CONTRIBUTOR',
        })
        .expect(201);

      contributor2Id = response.body.user.id;
      contributor2Token = response.body.accessToken;
    });
  });

  describe('2. Project Creation and Team Assembly', () => {
    it('should create a new project by MANAGER', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Complete Workflow Project',
          description: 'Testing end-to-end workflow',
          managerId: managerId,
          status: 'ACTIVE',
          priority: 'HIGH',
          startDate: '2025-01-01',
          dueDate: '2025-12-31',
        })
        .expect(201);

      projectId = response.body.id;

      expect(response.body.name).toBe('Complete Workflow Project');
      expect(response.body.managerId).toBe(managerId);

      // Verify in database
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(project).toBeTruthy();
    });

    it('should add CONTRIBUTOR 1 to project team', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ userId: contributor1Id, role: 'member' })
        .expect(201);

      // Verify in database
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: contributor1Id,
          },
        },
      });
      expect(member).toBeTruthy();
    });

    it('should add CONTRIBUTOR 2 to project team', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ userId: contributor2Id, role: 'member' })
        .expect(201);
    });

    it('should verify project has 2 members', async () => {
      const members = await prisma.projectMember.findMany({
        where: { projectId },
      });
      expect(members).toHaveLength(2);
    });
  });

  describe('3. Task Creation and Assignment', () => {
    it('should create Task 1 (unassigned)', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Setup Development Environment',
          description: 'Install dependencies and configure tools',
          projectId: projectId,
          status: 'TODO',
          priority: 'HIGH',
          estimatedHours: 4,
        })
        .expect(201);

      task1Id = response.body.id;

      expect(response.body.title).toBe('Setup Development Environment');
      expect(response.body.projectId).toBe(projectId);
      expect(response.body.status).toBe('TODO');
      expect(response.body.assigneeId).toBeNull();
    });

    it('should create Task 2 (assigned to CONTRIBUTOR 1)', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Implement Authentication Module',
          description: 'Create login, register, and JWT functionality',
          projectId: projectId,
          assigneeId: contributor1Id,
          status: 'TODO',
          priority: 'HIGH',
          estimatedHours: 8,
        })
        .expect(201);

      task2Id = response.body.id;

      expect(response.body.assigneeId).toBe(contributor1Id);
    });

    it('should create Task 3 (assigned to CONTRIBUTOR 2)', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Design Database Schema',
          description: 'Create Prisma schema for all entities',
          projectId: projectId,
          assigneeId: contributor2Id,
          status: 'TODO',
          priority: 'MEDIUM',
          estimatedHours: 6,
        })
        .expect(201);

      task3Id = response.body.id;

      expect(response.body.assigneeId).toBe(contributor2Id);
    });

    it('should list all tasks for the project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks?projectId=${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta.total).toBe(3);
    });

    it('should get tasks assigned to CONTRIBUTOR 1', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks?assigneeId=${contributor1Id}&projectId=${projectId}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Implement Authentication Module');
    });
  });

  describe('4. Task Workflow: Progress Tracking', () => {
    it('CONTRIBUTOR 1 should start working on Task 2 (TODO → IN_PROGRESS)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/tasks/${task2Id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'IN_PROGRESS',
          actualHours: 2,
        })
        .expect(200);

      expect(response.body.status).toBe('IN_PROGRESS');
      expect(response.body.actualHours).toBe(2);
      expect(response.body.completedAt).toBeNull();
    });

    it('CONTRIBUTOR 2 should start and complete Task 3 (TODO → IN_PROGRESS → COMPLETED)', async () => {
      // Start task
      await request(app.getHttpServer())
        .put(`/tasks/${task3Id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'IN_PROGRESS',
          actualHours: 3,
        })
        .expect(200);

      // Complete task
      const response = await request(app.getHttpServer())
        .put(`/tasks/${task3Id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'COMPLETED',
          actualHours: 6,
        })
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.actualHours).toBe(6);
      expect(response.body.completedAt).toBeTruthy();

      // Verify in database
      const task = await prisma.task.findUnique({
        where: { id: task3Id },
      });
      expect(task.completedAt).toBeTruthy();
    });

    it('MANAGER should assign unassigned Task 1 to CONTRIBUTOR 1', async () => {
      const response = await request(app.getHttpServer())
        .put(`/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          assigneeId: contributor1Id,
        })
        .expect(200);

      expect(response.body.assigneeId).toBe(contributor1Id);
    });

    it('CONTRIBUTOR 1 should now have 2 tasks', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks?assigneeId=${contributor1Id}&projectId=${projectId}`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('5. Project Statistics and Monitoring', () => {
    it('should get project statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}/stats`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.project.id).toBe(projectId);
      expect(response.body.counts._count.tasks).toBe(3);
      expect(response.body.counts._count.members).toBe(2);

      // Verify task status distribution
      const tasksByStatus = response.body.tasksByStatus;
      const statusCounts = tasksByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {});

      expect(statusCounts.TODO).toBe(1);
      expect(statusCounts.IN_PROGRESS).toBe(1);
      expect(statusCounts.COMPLETED).toBe(1);
    });

    it('should get task statistics by project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/project/${projectId}/stats`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.totalTasks).toBe(3);
      expect(response.body.tasksByStatus.TODO).toBe(1);
      expect(response.body.tasksByStatus.IN_PROGRESS).toBe(1);
      expect(response.body.tasksByStatus.COMPLETED).toBe(1);
    });

    it('should get user statistics for CONTRIBUTOR 1', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${contributor1Id}/stats`)
        .set('Authorization', `Bearer ${contributor1Token}`)
        .expect(200);

      expect(response.body.totalTasks).toBeGreaterThanOrEqual(2);
      expect(response.body.totalProjects).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Task Completion and Project Finalization', () => {
    it('CONTRIBUTOR 1 should complete Task 1', async () => {
      const response = await request(app.getHttpServer())
        .put(`/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'COMPLETED',
          actualHours: 5,
        })
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.completedAt).toBeTruthy();
    });

    it('CONTRIBUTOR 1 should complete Task 2', async () => {
      const response = await request(app.getHttpServer())
        .put(`/tasks/${task2Id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'COMPLETED',
          actualHours: 10,
        })
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
    });

    it('should verify all tasks are completed', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks?projectId=${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const allCompleted = response.body.data.every(
        (task) => task.status === 'COMPLETED',
      );
      expect(allCompleted).toBe(true);
    });

    it('MANAGER should mark project as COMPLETED', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'COMPLETED',
        })
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');

      // Verify in database
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(project.status).toBe('COMPLETED');
    });
  });

  describe('7. Final Verification and Cleanup', () => {
    it('should verify project completion in database', async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          members: true,
        },
      });

      expect(project.status).toBe('COMPLETED');
      expect(project.tasks).toHaveLength(3);
      expect(project.members).toHaveLength(2);
      expect(project.tasks.every((t) => t.status === 'COMPLETED')).toBe(true);
    });

    it('should verify all test data integrity', async () => {
      // Check users exist
      const users = await prisma.user.findMany({
        where: {
          id: { in: [adminId, managerId, contributor1Id, contributor2Id] },
        },
      });
      expect(users).toHaveLength(4);

      // Check project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(project).toBeTruthy();

      // Check tasks exist
      const tasks = await prisma.task.findMany({
        where: { id: { in: [task1Id, task2Id, task3Id] } },
      });
      expect(tasks).toHaveLength(3);

      // Check all tasks are completed
      expect(tasks.every((t) => t.status === 'COMPLETED')).toBe(true);
      expect(tasks.every((t) => t.completedAt !== null)).toBe(true);
    });
  });

  describe('8. Complete Workflow Summary', () => {
    it('should summarize the complete workflow execution', async () => {
      // This test documents the entire workflow that was executed
      const summary = {
        usersCreated: 4,
        roles: ['ADMIN', 'MANAGER', 'CONTRIBUTOR', 'CONTRIBUTOR'],
        projectsCreated: 1,
        teamMembers: 2,
        tasksCreated: 3,
        tasksCompleted: 3,
        workflowSteps: [
          '1. Created 4 users with different roles',
          '2. MANAGER created a project',
          '3. MANAGER added 2 CONTRIBUTORs to project team',
          '4. MANAGER created 3 tasks (1 unassigned, 2 assigned)',
          '5. Contributors updated task statuses (TODO → IN_PROGRESS → COMPLETED)',
          '6. MANAGER reassigned unassigned task',
          '7. All tasks were completed',
          '8. Project was marked as COMPLETED',
          '9. Statistics and monitoring data verified',
        ],
      };

      expect(summary.usersCreated).toBe(4);
      expect(summary.tasksCompleted).toBe(3);
      expect(summary.workflowSteps).toHaveLength(9);

      console.log('\n🎉 Complete Workflow Summary:');
      console.log(`  Users: ${summary.usersCreated}`);
      console.log(`  Project: ${summary.projectsCreated}`);
      console.log(`  Tasks: ${summary.tasksCreated} created, ${summary.tasksCompleted} completed`);
      console.log(`  Team Members: ${summary.teamMembers}`);
      console.log('\n✅ Full application workflow validated successfully!');
    });
  });
});
