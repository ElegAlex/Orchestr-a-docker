import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication Workflow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test user data
  const testUser = {
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'E2E',
    lastName: 'Test',
    role: 'CONTRIBUTOR',
  };

  let userId: string;
  let accessToken: string;
  let refreshToken: string;

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
    // Cleanup: delete test user
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await app.close();
  });

  describe('1. User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.firstName).toBe(testUser.firstName);
      expect(response.body.user.lastName).toBe(testUser.lastName);
      expect(response.body.user).not.toHaveProperty('passwordHash');

      // Store user ID and tokens for next tests
      userId = response.body.user.id;
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;

      // Verify user was actually created in database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user).toBeTruthy();
      expect(user.email).toBe(testUser.email);
    });

    it('should fail to register with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409); // Conflict
    });

    it('should fail to register with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail to register with weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'another@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should fail to register with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'incomplete@example.com',
          // Missing password, firstName, lastName
        })
        .expect(400);
    });
  });

  describe('2. User Login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);

      // Update tokens
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;

      // Verify lastLoginAt was updated in database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user.lastLoginAt).toBeTruthy();
    });

    it('should fail to login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should fail to login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });

    it('should fail to login with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);
    });
  });

  describe('3. Get User Profile', () => {
    it('should get user profile with valid access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.firstName).toBe(testUser.firstName);
      expect(response.body.lastName).toBe(testUser.lastName);
      expect(response.body.role).toBe(testUser.role);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should fail to get profile without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should fail to get profile with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail to get profile with malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });

  describe('4. Token Refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();

      // Update tokens
      const oldAccessToken = accessToken;
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;

      // Verify new token works
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.id).toBe(userId);

      // Verify tokens are different (new tokens were generated)
      expect(accessToken).not.toBe(oldAccessToken);
    });

    it('should fail to refresh with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });

    it('should fail to refresh without refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('5. User Logout', () => {
    it('should logout successfully with valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should fail to logout without token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should fail to logout with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('6. Complete Workflow Integration', () => {
    it('should complete full authentication cycle', async () => {
      // 1. Register new user
      const newUser = {
        email: `e2e-full-cycle-${Date.now()}@example.com`,
        password: 'FullCycle123!',
        firstName: 'Full',
        lastName: 'Cycle',
        role: 'CONTRIBUTOR',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      const newUserId = registerResponse.body.user.id;
      let token = registerResponse.body.accessToken;
      let refresh = registerResponse.body.refreshToken;

      // 2. Get profile with token from registration
      const profileResponse1 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse1.body.email).toBe(newUser.email);

      // 3. Login again
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(200);

      token = loginResponse.body.accessToken;
      refresh = loginResponse.body.refreshToken;

      // 4. Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: refresh })
        .expect(200);

      token = refreshResponse.body.accessToken;

      // 5. Get profile with refreshed token
      const profileResponse2 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse2.body.id).toBe(newUserId);

      // 6. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 7. Cleanup
      await prisma.user.delete({ where: { id: newUserId } }).catch(() => {});
    });
  });
});
