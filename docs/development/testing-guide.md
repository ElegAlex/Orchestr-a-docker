# 🧪 Guide des Tests - Orchestr'A

> Guide complet pour tester l'application Orchestr'A

**Version**: 2.0.0
**Dernière mise à jour**: 2025-10-15
**Audience**: Développeurs, QA, DevOps

---

## 📑 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Tests Infrastructure](#tests-infrastructure)
3. [Tests Backend](#tests-backend)
4. [Tests Frontend](#tests-frontend)
5. [Tests d'Intégration](#tests-dintégration)
6. [Tests E2E](#tests-e2e)
7. [CI/CD](#cicd)

---

## Vue d'ensemble

### Pyramide des Tests

```
         ╱╲
        ╱E2E╲           ← Tests End-to-End (peu, lents)
       ╱──────╲
      ╱ Intég. ╲        ← Tests d'Intégration (moyens)
     ╱──────────╲
    ╱  Unitaires ╲      ← Tests Unitaires (nombreux, rapides)
   ╱──────────────╲
```

### Coverage Objectifs

| Couche | Coverage Cible |
|--------|----------------|
| Backend Services | 80%+ |
| Backend Controllers | 70%+ |
| Frontend Components | 70%+ |
| Frontend Hooks | 80%+ |
| E2E Critical Paths | 100% |

---

## Tests Infrastructure

### Script de Test Automatique

Le script `test-infrastructure.sh` valide que toute l'infrastructure fonctionne correctement.

#### Utilisation

```bash
# Lancer les tests
./test-infrastructure.sh

# Avec Docker déjà démarré
docker compose -f docker-compose.full.yml up -d
./test-infrastructure.sh
```

#### Tests Effectués

**1. Prérequis** (2 tests)
- Docker installé
- Docker Compose disponible

**2. Conteneurs** (5 tests)
- PostgreSQL running
- Redis running
- MinIO running
- Backend running
- Frontend running

**3. Healthchecks** (5 tests)
- PostgreSQL healthy (`pg_isready`)
- Redis healthy (`redis-cli ping`)
- MinIO healthy (`/minio/health/live`)
- Backend healthy (`/api/health`)
- Frontend healthy (`/health`)

**4. Connectivité Réseau** (3 tests)
- Backend → PostgreSQL (port 5432)
- Backend → Redis (port 6379)
- Backend → MinIO (port 9000)

**5. Endpoints API** (3 tests)
- GET `/api/health`
- GET `/api/docs` (Swagger)
- POST `/api/auth/login` (reachable)

**6. Base de Données** (2 tests)
- Prisma migrations à jour
- Tables existantes (>10 tables)

**7. Volumes** (3 tests)
- Volume `postgres-data`
- Volume `redis-data`
- Volume `minio-data`

**8. Nginx** (4 tests)
- Config Nginx valide
- Gzip compression active
- Security header `X-Frame-Options`
- Security header `X-Content-Type-Options`

**9. Performance** (1 test)
- Backend memory usage < 500MiB

#### Output Exemple

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🧪 TEST INFRASTRUCTURE - ORCHESTR'A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ 1. Vérification Prérequis ━━━
✅ PASS - Docker installé
✅ PASS - Docker Compose disponible

━━━ 2. Conteneurs Docker ━━━
✅ PASS - Container postgres running
✅ PASS - Container redis running
✅ PASS - Container minio running
✅ PASS - Container backend running
✅ PASS - Container frontend running

━━━ 3. Healthchecks Services ━━━
✅ PASS - PostgreSQL healthy
✅ PASS - Redis healthy
✅ PASS - MinIO healthy
✅ PASS - Backend healthy
✅ PASS - Frontend healthy

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 RÉSULTATS DES TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Total:  28 tests
   Passed: 28
   Failed: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ TOUS LES TESTS PASSENT !
  Infrastructure Orchestr'A opérationnelle.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Tests Backend

### Setup Tests Unitaires

Le backend utilise Jest pour les tests unitaires.

#### Configuration

**`backend/jest.config.js`** :
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### Commandes

```bash
# Tous les tests
cd backend
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# Tests d'un fichier
npm test -- projects.service.spec.ts

# Tests avec verbose
npm test -- --verbose
```

### Exemple: Test Service

**`backend/src/modules/projects/projects.service.spec.ts`** :
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: ProjectsRepository;

  const mockProject = {
    id: '1',
    name: 'Test Project',
    status: 'active',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    ownerId: 'user-1',
  };

  const mockRepository = {
    findById: jest.fn(),
    findAllWithCount: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repository = module.get<ProjectsRepository>(ProjectsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a project when found', async () => {
      mockRepository.findById.mockResolvedValue(mockProject);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProject);
      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(repository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Project',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      ownerId: 'user-1',
    };

    it('should create a project successfully', async () => {
      mockRepository.create.mockResolvedValue(mockProject);

      const result = await service.create(createDto);

      expect(result).toEqual(mockProject);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException when dates invalid', async () => {
      const invalidDto = {
        ...createDto,
        endDate: new Date('2024-01-01'),
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });
});
```

### Exemple: Test Controller

**`backend/src/modules/projects/projects.controller.spec.ts`** :
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProject = {
    id: '1',
    name: 'Test Project',
    status: 'active',
  };

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const response = {
        data: [mockProject],
        meta: { page: 1, limit: 10, total: 1 },
      };

      mockService.findAll.mockResolvedValue(response);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(response);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createDto = { name: 'New Project' };
      mockService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockProject);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });
});
```

### Tests d'Intégration Backend

**`backend/test/projects.e2e-spec.ts`** :
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ProjectsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login pour obtenir token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test.admin@orchestra.local',
        password: 'Admin1234',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/projects (GET)', () => {
    it('should return projects list', () => {
      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/projects')
        .expect(401);
    });
  });

  describe('/projects (POST)', () => {
    it('should create a new project', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project E2E',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          ownerId: 'test-user-id',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Project E2E');
        });
    });

    it('should validate project data', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
        })
        .expect(400);
    });
  });
});
```

---

## Tests Frontend

### Setup Tests React

Le frontend utilise React Testing Library + Jest.

#### Configuration

**`orchestra-app/jest.config.js`** :
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/setupTests.ts',
  ],
};
```

### Commandes

```bash
# Tous les tests
cd orchestra-app
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Tests d'un fichier
npm test -- ProjectList.test.tsx
```

### Exemple: Test Composant

**`orchestra-app/src/components/projects/ProjectList.test.tsx`** :
```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { ProjectList } from './ProjectList';

const mockStore = configureStore([]);

describe('ProjectList', () => {
  let store;

  const mockProjects = [
    { id: '1', name: 'Project 1', status: 'active' },
    { id: '2', name: 'Project 2', status: 'completed' },
  ];

  beforeEach(() => {
    store = mockStore({
      projects: {
        projects: mockProjects,
        loading: false,
        error: null,
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ProjectList />
        </BrowserRouter>
      </Provider>
    );
  };

  it('should render projects list', () => {
    renderComponent();

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    store = mockStore({
      projects: { projects: [], loading: true, error: null },
    });

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error state', () => {
    store = mockStore({
      projects: { projects: [], loading: false, error: 'Failed to fetch' },
    });

    renderComponent();

    expect(screen.getByText(/erreur/i)).toBeInTheDocument();
  });

  it('should navigate on project click', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Project 1'));

    await waitFor(() => {
      // Assert navigation occurred
    });
  });
});
```

### Exemple: Test Hook

**`orchestra-app/src/hooks/useProjects.test.ts`** :
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useProjects } from './useProjects';
import projectsReducer from '@/store/slices/projectsSlice';

describe('useProjects', () => {
  const wrapper = ({ children }) => (
    <Provider store={configureStore({ reducer: { projects: projectsReducer } })}>
      {children}
    </Provider>
  );

  it('should fetch projects on mount', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.projects)).toBe(true);
  });

  it('should provide CRUD operations', () => {
    const { result } = renderHook(() => useProjects({ autoFetch: false }), { wrapper });

    expect(typeof result.current.create).toBe('function');
    expect(typeof result.current.update).toBe('function');
    expect(typeof result.current.remove).toBe('function');
  });
});
```

---

## Tests d'Intégration

### Tests Services Migrés

Pour chaque service migré, un script de test bash valide l'API.

#### Exemple: Test Comments

**`test-comments.sh`** :
```bash
#!/bin/bash

# Login et récupération token
TOKEN=$(curl -s "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test.admin@orchestra.local","password":"Admin1234"}' \
  | jq -r '.access_token')

# Test GET /api/comments
curl -s "http://localhost:4000/api/comments" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Test POST /api/comments
curl -s "http://localhost:4000/api/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-task-id",
    "content": "Test comment from integration test"
  }' \
  | jq
```

---

## Tests E2E

### Playwright (Recommandé)

#### Installation

```bash
cd orchestra-app
npm install -D @playwright/test
npx playwright install
```

#### Configuration

**`playwright.config.ts`** :
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Exemple Test E2E

**`e2e/login.spec.ts`** :
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/');

    // Fill login form
    await page.fill('input[name="email"]', 'test.admin@orchestra.local');
    await page.fill('input[name="password"]', 'Admin1234');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
  });
});

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    // Login avant chaque test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test.admin@orchestra.local');
    await page.fill('input[name="password"]', 'Admin1234');
    await page.click('button[type="submit"]');
  });

  test('should create a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('button:has-text("Nouveau Projet")');

    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-12-31');
    await page.click('button:has-text("Créer")');

    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });
});
```

#### Commandes Playwright

```bash
# Run all tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Run specific test
npx playwright test login.spec.ts

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

---

## CI/CD

### GitHub Actions

**`.github/workflows/test.yml`** :
```yaml
name: Tests

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run tests
        run: cd backend && npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd orchestra-app && npm ci

      - name: Run tests
        run: cd orchestra-app && npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start Docker Compose
        run: docker compose -f docker-compose.full.yml up -d

      - name: Wait for services
        run: sleep 30

      - name: Run infrastructure tests
        run: ./test-infrastructure.sh

      - name: Run E2E tests
        run: cd orchestra-app && npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: orchestra-app/playwright-report/
```

---

## Références

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Version**: 2.0.0
**Dernière mise à jour**: 2025-10-15
**Auteur**: Orchestr'A Team
