# 🤝 Guide de Contribution - Orchestr'A

> Standards de développement et workflow de contribution pour le projet Orchestr'A

---

## 📋 Table des Matières

- [Avant de Commencer](#avant-de-commencer)
- [Workflow Git](#workflow-git)
- [Standards de Code](#standards-de-code)
- [Conventions de Nommage](#conventions-de-nommage)
- [Structure des Fichiers](#structure-des-fichiers)
- [Tests](#tests)
- [Documentation](#documentation)
- [Pull Requests](#pull-requests)
- [Code Review](#code-review)

---

## 🚀 Avant de Commencer

### Prérequis Techniques

```bash
Node.js >= 18.0.0
npm >= 8.0.0
Docker >= 20.10.0
Docker Compose >= 2.0.0
Git >= 2.30.0
```

### Setup Initial

```bash
# 1. Fork le repository
# 2. Clone ton fork
git clone https://github.com/YOUR_USERNAME/orchestr-a-docker.git
cd orchestr-a-docker

# 3. Ajouter le remote upstream
git remote add upstream https://github.com/ORIGINAL/orchestr-a-docker.git

# 4. Installer les dépendances
npm install
cd backend && npm install
cd ../orchestra-app && npm install

# 5. Setup environnement
cp .env.example .env
cp backend/.env.example backend/.env

# 6. Démarrer Docker
docker-compose -f docker-compose.full.yml up -d
```

---

## 🌿 Workflow Git

### Branches

#### Branches Principales

- **`master`** - Production stable
- **`develop`** - Développement actif (n'existe pas encore, à créer si besoin)

#### Branches Feature

```bash
# Format: feature/courte-description
git checkout -b feature/add-user-avatar
git checkout -b feature/improve-dashboard-performance
```

#### Branches Bugfix

```bash
# Format: fix/courte-description
git checkout -b fix/login-redirect-issue
git checkout -b fix/memory-leak-departments
```

#### Branches Hotfix

```bash
# Format: hotfix/version-courte-description
git checkout -b hotfix/1.2.1-security-patch
```

### Workflow Complet

```bash
# 1. Sync avec upstream
git checkout master
git pull upstream master

# 2. Créer feature branch
git checkout -b feature/my-awesome-feature

# 3. Développer + commits réguliers
git add .
git commit -m "feat: add user profile page"

# 4. Sync avant push (si long développement)
git fetch upstream
git rebase upstream/master

# 5. Push vers ton fork
git push origin feature/my-awesome-feature

# 6. Créer Pull Request sur GitHub
```

### Conventional Commits

**Format strict** : `<type>(<scope>): <description>`

#### Types de Commits

| Type | Description | Exemple |
|------|-------------|---------|
| **feat** | Nouvelle fonctionnalité | `feat(auth): add OAuth2 login` |
| **fix** | Correction de bug | `fix(api): handle null user error` |
| **docs** | Documentation | `docs(readme): update installation steps` |
| **style** | Formatage (pas de changement logique) | `style(button): fix indentation` |
| **refactor** | Refactoring sans changement fonctionnel | `refactor(users): extract validation logic` |
| **perf** | Amélioration performance | `perf(db): add index on users.email` |
| **test** | Ajout/modification tests | `test(auth): add login unit tests` |
| **chore** | Tâches maintenance | `chore(deps): update nestjs to 10.0` |
| **ci** | CI/CD | `ci: add GitHub Actions workflow` |

#### Exemples Complets

```bash
# ✅ BON
git commit -m "feat(projects): add Gantt chart view"
git commit -m "fix(tasks): correct date validation in create form"
git commit -m "docs(api): add Swagger annotations to user endpoints"
git commit -m "perf(dashboard): lazy load chart components"

# ❌ MAUVAIS
git commit -m "update"
git commit -m "fix bug"
git commit -m "WIP"
git commit -m "changes"
```

#### Commit Message Complet

```bash
git commit -m "feat(auth): add two-factor authentication

- Implement TOTP generation and validation
- Add QR code display for easy setup
- Create migration for user 2FA settings
- Add unit tests for TOTP service

Closes #123"
```

---

## 💻 Standards de Code

### TypeScript

#### Configuration Stricte

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Types vs Interfaces

```typescript
// ✅ Utiliser INTERFACE pour les objets et contrats
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface UserService {
  getUser(id: string): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
}

// ✅ Utiliser TYPE pour les unions, intersections, utilitaires
type UserRole = 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR';
type PartialUser = Partial<User>;
type UserWithRole = User & { role: UserRole };
```

#### Fonctions

```typescript
// ✅ BON - Types explicites, arrow function pour méthodes
const getUserById = async (userId: string): Promise<User | null> => {
  const user = await userRepository.findById(userId);
  return user ?? null;
};

// ✅ BON - Paramètres déstructurés avec types
const createProject = async ({
  name,
  managerId,
  startDate,
}: CreateProjectDto): Promise<Project> => {
  // Implementation
};

// ❌ MAUVAIS - Pas de types
const getUser = async (id) => {
  return await db.users.find(id);
};
```

#### Gestion Erreurs

```typescript
// ✅ BON - Erreurs typées
class UserNotFoundException extends Error {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundException';
  }
}

const getUser = async (userId: string): Promise<User> => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new UserNotFoundException(userId);
  }

  return user;
};

// ✅ BON - Gestion avec try/catch
try {
  const user = await getUser(userId);
  // Process user
} catch (error) {
  if (error instanceof UserNotFoundException) {
    return { error: 'User not found', code: 404 };
  }
  throw error; // Re-throw unexpected errors
}
```

### Backend (NestJS)

#### Structure Module

```typescript
// users/users.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export si utilisé ailleurs
})
export class UsersModule {}
```

#### Controller Pattern

```typescript
// users/users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserDto] })
  async findAll(
    @Query() query: PaginationDto,
  ): Promise<PaginatedResponse<UserDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserDto> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, type: UserDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
  }
}
```

#### Service Pattern

```typescript
// users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        password: await this.hashPassword(data.password),
      },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
```

### Frontend (React)

#### Component Pattern

```typescript
// components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector } from '@/hooks/redux';
import { userService } from '@/services/user.service';
import type { User } from '@/types';

interface UserProfileProps {
  userId: string;
  onEdit?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onEdit
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await userService.getUser(userId);
        setUser(data);
      } catch (err) {
        setError('Failed to load user');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error || !user) {
    return <Typography color="error">{error || 'User not found'}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5">
        {user.firstName} {user.lastName}
      </Typography>
      <Typography color="textSecondary">{user.email}</Typography>
    </Box>
  );
};
```

#### Custom Hooks

```typescript
// hooks/useUser.ts
import { useState, useEffect } from 'react';
import { userService } from '@/services/user.service';
import type { User } from '@/types';

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUser = (userId: string): UseUserResult => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUser(userId);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  return { user, loading, error, refetch: fetchUser };
};
```

---

## 🏷️ Conventions de Nommage

### Fichiers & Dossiers

| Type | Convention | Exemple |
|------|------------|---------|
| **Composants React** | PascalCase | `UserProfile.tsx` |
| **Hooks** | camelCase avec `use` | `useUser.ts` |
| **Services** | camelCase | `user.service.ts` |
| **Types/Interfaces** | PascalCase | `User.ts` |
| **Utils** | camelCase | `formatDate.ts` |
| **Constants** | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| **Dossiers** | kebab-case | `user-management/` |

### Variables & Fonctions

```typescript
// ✅ BON
const userName = 'John Doe';
const userAge = 30;
const isActive = true;
const getUserById = (id: string) => { /* ... */ };
const fetchUserData = async () => { /* ... */ };

// ❌ MAUVAIS
const UserName = 'John'; // PascalCase pour variable
const user_age = 30; // snake_case
const active = true; // pas explicite
const getuser = () => {}; // pas de camelCase
```

### Classes & Interfaces

```typescript
// ✅ BON
class UserService { }
class HttpException extends Error { }
interface User { }
interface CreateUserDto { }
type UserRole = 'ADMIN' | 'USER';

// ❌ MAUVAIS
class userService { } // pas PascalCase
interface user { } // pas PascalCase
type userrole = string; // pas explicite
```

### Constantes

```typescript
// ✅ BON
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'http://localhost:4000/api';
const DEFAULT_PAGE_SIZE = 20;

// ❌ MAUVAIS
const maxRetry = 3; // pas UPPER_SNAKE_CASE
const apiUrl = 'http://...'; // pas explicite
```

---

## 📁 Structure des Fichiers

### Backend Module

```
src/users/
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── entities/
│   └── user.entity.ts
├── users.controller.ts
├── users.service.ts
├── users.module.ts
└── users.controller.spec.ts
    users.service.spec.ts
```

### Frontend Feature

```
src/features/users/
├── components/
│   ├── UserList.tsx
│   ├── UserCard.tsx
│   └── UserForm.tsx
├── hooks/
│   └── useUsers.ts
├── types/
│   └── user.types.ts
├── utils/
│   └── userHelpers.ts
└── index.ts (exports publics)
```

---

## 🧪 Tests

### Backend Tests

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });
});
```

### Frontend Tests

```typescript
// UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import { userService } from '@/services/user.service';

jest.mock('@/services/user.service');

describe('UserProfile', () => {
  it('should display user information', async () => {
    const mockUser = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    (userService.getUser as jest.Mock).mockResolvedValue(mockUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (userService.getUser as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<UserProfile userId="1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

### Coverage Minimum

- **Backend** : 80% minimum (statements, branches, functions, lines)
- **Frontend** : 70% minimum (composants critiques)

---

## 📝 Documentation

### JSDoc/TSDoc

```typescript
/**
 * Retrieves a user by their unique identifier
 *
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to the User object, or null if not found
 * @throws {DatabaseException} If database query fails
 *
 * @example
 * ```typescript
 * const user = await userService.findOne('123e4567-e89b-12d3-a456-426614174000');
 * if (user) {
 *   console.log(user.email);
 * }
 * ```
 */
async findOne(userId: string): Promise<User | null> {
  // Implementation
}
```

### README par Module

Chaque module backend/frontend doit avoir un README.md:

```markdown
# Users Module

## Description
Gestion des utilisateurs (CRUD, authentification, permissions)

## Endpoints
- `GET /api/users` - Liste paginée
- `GET /api/users/:id` - Détail utilisateur
- `POST /api/users` - Création (ADMIN only)
- `PATCH /api/users/:id` - Mise à jour
- `DELETE /api/users/:id` - Suppression (soft delete)

## Permissions
- Liste : Authentifié
- Détail : Authentifié
- Création : ADMIN
- Modification : ADMIN ou propriétaire
- Suppression : ADMIN
```

---

## 🔄 Pull Requests

### Checklist PR

Avant de créer une PR, vérifier:

- [ ] **Code** : Fonctionne localement sans erreur
- [ ] **Tests** : Nouveaux tests ajoutés, tous les tests passent
- [ ] **Linting** : `npm run lint` passe sans erreur
- [ ] **Types** : `npm run type-check` passe
- [ ] **Commits** : Messages suivent Conventional Commits
- [ ] **Documentation** : README/docs mis à jour si nécessaire
- [ ] **Breaking changes** : Documentés dans la PR
- [ ] **Screenshots** : Ajoutés pour changements UI

### Template PR

```markdown
## 📝 Description
Brève description des changements

## 🎯 Type de Changement
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## 🧪 Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests E2E ajoutés (si applicable)
- [ ] Tous les tests passent

## 📸 Screenshots (si UI)
Avant / Après

## 🔗 Issues Liées
Closes #123
Related to #456

## ✅ Checklist
- [ ] Code reviewed par moi-même
- [ ] Documentation mise à jour
- [ ] Pas de régression détectée
```

---

## 👀 Code Review

### Pour le Reviewer

#### Checklist

- [ ] **Logique** : Le code fait ce qu'il est censé faire
- [ ] **Clarté** : Code lisible et compréhensible
- [ ] **Performance** : Pas de problème évident de performance
- [ ] **Sécurité** : Pas de faille de sécurité
- [ ] **Tests** : Coverage suffisante
- [ ] **Standards** : Respect des conventions du projet

#### Feedback Constructif

```markdown
# ✅ BON
"Bonne idée d'utiliser useMemo ici pour la performance.
Suggestion : on pourrait aussi déplacer cette logique dans un hook custom
pour la réutilisabilité."

# ❌ MAUVAIS
"C'est mauvais, refais tout."
```

### Pour l'Auteur

- **Répondre** à tous les commentaires
- **Expliquer** les choix techniques si demandé
- **Accepter** les critiques constructives
- **Demander** des clarifications si besoin

---

## 🔧 Outils de Qualité

### Configuration ESLint

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "react/react-in-jsx-scope": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Configuration Prettier

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

---

## 🆘 Support

### Questions ou Problèmes ?

- **Issues GitHub** : Créer une issue avec le label `question`
- **Discussions** : Utiliser GitHub Discussions
- **Documentation** : Consulter [docs/README.md](docs/README.md)

---

## 📄 License

Ce projet est sous licence propriétaire. Voir [LICENSE](LICENSE).

---

<div align="center">

**Merci de contribuer à Orchestr'A ! 🎉**

Construit avec ❤️ par la communauté

</div>
