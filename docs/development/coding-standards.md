# 📐 Standards de Codage - Orchestr'A

> Guide complet des standards de développement pour maintenir une qualité A++ niveau ingénieur senior.

**Version**: 2.0.0
**Dernière mise à jour**: 2025-10-15
**Audience**: Développeurs, Lead Tech, Architectes

---

## 📑 Table des Matières

1. [TypeScript](#typescript)
2. [NestJS Backend](#nestjs-backend)
3. [React Frontend](#react-frontend)
4. [Naming Conventions](#naming-conventions)
5. [Error Handling](#error-handling)
6. [Testing Patterns](#testing-patterns)
7. [Database & Prisma](#database--prisma)
8. [API Design](#api-design)
9. [Security](#security)
10. [Performance](#performance)

---

## TypeScript

### Configuration stricte

**tsconfig.json** doit avoir ces flags activés :

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Types explicites

#### ✅ BON
```typescript
// Paramètres avec types explicites
function createUser(name: string, age: number): Promise<User> {
  return userService.create({ name, age });
}

// Types pour objets complexes
interface CreateProjectDto {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  ownerId: string;
}

// Return types explicites
async function getProjects(): Promise<Project[]> {
  return projectRepository.findAll();
}
```

#### ❌ MAUVAIS
```typescript
// Types implicites - à éviter
function createUser(name, age) {
  return userService.create({ name, age });
}

// Any - INTERDIT sauf cas extrêmes documentés
function processData(data: any) {
  return data.map(item => item.value);
}
```

### Utility Types

Utilisez les utility types TypeScript :

```typescript
// Partial - rendre toutes les propriétés optionnelles
type UpdateUserDto = Partial<CreateUserDto>;

// Pick - sélectionner des propriétés
type UserBasicInfo = Pick<User, 'id' | 'name' | 'email'>;

// Omit - exclure des propriétés
type UserWithoutPassword = Omit<User, 'password'>;

// Record - créer un objet avec clés typées
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>;

// NonNullable - exclure null/undefined
type ValidUser = NonNullable<User | null>;
```

### Enums vs Union Types

#### Union Types (préféré pour les constantes)
```typescript
// ✅ BON - Type-safe et léger
type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';
type Priority = 'low' | 'medium' | 'high' | 'critical';

const status: ProjectStatus = 'active'; // ✅ OK
const status: ProjectStatus = 'invalid'; // ❌ Erreur TypeScript
```

#### Enums (pour les valeurs numériques ou exportées)
```typescript
// ✅ BON - Quand vous avez besoin de valeurs numériques
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}

// ✅ BON - Quand exporté dans une API
export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  TEAM_MEMBER = 'team_member',
  CLIENT = 'client',
  GUEST = 'guest',
}
```

### Type Guards

```typescript
// Type guard personnalisé
function isProject(obj: any): obj is Project {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.startDate instanceof Date
  );
}

// Utilisation
function processEntity(entity: Project | Task) {
  if (isProject(entity)) {
    // TypeScript sait que entity est Project ici
    console.log(entity.startDate);
  } else {
    // TypeScript sait que entity est Task ici
    console.log(entity.dueDate);
  }
}
```

### Generics

```typescript
// Generic pour réutilisabilité
interface ApiResponse<T> {
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

// Utilisation
const projectsResponse: ApiResponse<Project[]> = await api.get('/projects');
const userResponse: ApiResponse<User> = await api.get('/users/1');

// Generic avec contraintes
function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}
```

---

## NestJS Backend

### Architecture en couches

```
src/
├── modules/
│   └── projects/
│       ├── projects.module.ts       # Module NestJS
│       ├── projects.controller.ts   # HTTP endpoints
│       ├── projects.service.ts      # Business logic
│       ├── projects.repository.ts   # Data access (Prisma)
│       ├── dto/                     # Data Transfer Objects
│       │   ├── create-project.dto.ts
│       │   ├── update-project.dto.ts
│       │   └── query-project.dto.ts
│       ├── entities/                # Domain models
│       │   └── project.entity.ts
│       └── __tests__/               # Tests unitaires
│           ├── projects.controller.spec.ts
│           └── projects.service.spec.ts
```

### Controllers - Endpoints HTTP

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user-role.enum';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les projets' })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès' })
  async findAll(@Query() query: QueryProjectDto): Promise<ApiResponse<Project[]>> {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupère un projet par ID' })
  @ApiResponse({ status: 200, description: 'Projet trouvé' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Crée un nouveau projet' })
  @ApiResponse({ status: 201, description: 'Projet créé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createDto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Met à jour un projet' })
  @ApiResponse({ status: 200, description: 'Projet mis à jour' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprime un projet' })
  @ApiResponse({ status: 204, description: 'Projet supprimé' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.projectsService.remove(id);
  }
}
```

### Services - Business Logic

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto } from './dto';
import { Project } from './entities/project.entity';
import { ApiResponse } from '@/common/interfaces/api-response.interface';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async findAll(query: QueryProjectDto): Promise<ApiResponse<Project[]>> {
    const { page = 1, limit = 10, status, ownerId } = query;

    // Validation
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page et limit doivent être > 0');
    }

    // Déléguer à la couche repository
    const [data, total] = await this.projectsRepository.findAllWithCount({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        ...(status && { status }),
        ...(ownerId && { ownerId }),
      },
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException(`Projet #${id} introuvable`);
    }

    return project;
  }

  async create(createDto: CreateProjectDto): Promise<Project> {
    // Validation métier
    if (createDto.endDate <= createDto.startDate) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }

    // Créer le projet
    const project = await this.projectsRepository.create(createDto);

    // Business logic supplémentaire (ex: notifications)
    await this.notifyProjectCreated(project);

    return project;
  }

  async update(id: string, updateDto: UpdateProjectDto): Promise<Project> {
    // Vérifier existence
    await this.findOne(id);

    // Validation métier
    if (updateDto.endDate && updateDto.startDate && updateDto.endDate <= updateDto.startDate) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }

    return this.projectsRepository.update(id, updateDto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.projectsRepository.delete(id);
  }

  // Méthodes privées pour business logic
  private async notifyProjectCreated(project: Project): Promise<void> {
    // Logique de notification
  }
}
```

### Repository - Data Access

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Project } from '@prisma/client';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
        members: true,
        tasks: true,
      },
    });
  }

  async findAllWithCount(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProjectWhereInput;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }): Promise<[Project[], number]> {
    const { skip, take, where, orderBy } = params;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          owner: true,
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return [data, total];
  }

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({
      data,
      include: {
        owner: true,
      },
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        owner: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }
}
```

### DTOs - Data Transfer Objects

```typescript
import { IsString, IsNotEmpty, IsDate, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Nom du projet', example: 'Migration Docker' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description détaillée' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Date de début', example: '2025-01-01' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: 'Date de fin', example: '2025-12-31' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ description: 'ID du propriétaire' })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiPropertyOptional({ description: 'Statut du projet', enum: ['draft', 'active', 'completed'] })
  @IsEnum(['draft', 'active', 'completed', 'archived'])
  @IsOptional()
  status?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsEnum(['draft', 'active', 'completed', 'archived'])
  @IsOptional()
  status?: string;
}

export class QueryProjectDto {
  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Nombre par page', default: 10 })
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filtrer par statut' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtrer par propriétaire' })
  @IsString()
  @IsOptional()
  ownerId?: string;
}
```

---

## React Frontend

### Architecture des composants

```
src/
├── components/
│   ├── common/              # Composants réutilisables
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── layout/              # Layout principal
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── projects/            # Composants spécifiques
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   └── ProjectList.tsx
│   └── __tests__/
├── pages/                   # Pages/routes
│   ├── Dashboard.tsx
│   ├── ProjectDetail.tsx
│   └── ProjectEdit.tsx
├── hooks/                   # Custom hooks
│   ├── useProjects.ts
│   ├── useAuth.ts
│   └── usePermissions.ts
├── services/                # API calls
│   ├── api/
│   │   ├── projects.api.ts
│   │   └── tasks.api.ts
│   └── project.service.ts
├── store/                   # Redux state
│   ├── slices/
│   │   ├── authSlice.ts
│   │   └── projectsSlice.ts
│   └── store.ts
└── types/                   # TypeScript types
    ├── project.types.ts
    └── user.types.ts
```

### Composants fonctionnels

```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { fetchProjects } from '@/store/slices/projectsSlice';
import type { Project } from '@/types/project.types';

interface ProjectListProps {
  status?: 'active' | 'completed' | 'archived';
  limit?: number;
  onProjectClick?: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  status,
  limit = 10,
  onProjectClick,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const { projects, loading, error } = useAppSelector(state => state.projects);
  const currentUser = useAppSelector(state => state.auth.user);

  // Local state
  const [page, setPage] = useState(1);

  // Fetch projects on mount and when filters change
  useEffect(() => {
    dispatch(fetchProjects({ page, limit, status }));
  }, [dispatch, page, limit, status]);

  // Event handlers avec useCallback
  const handleProjectClick = useCallback((project: Project) => {
    if (onProjectClick) {
      onProjectClick(project);
    } else {
      navigate(`/projects/${project.id}`);
    }
  }, [navigate, onProjectClick]);

  const handleNextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  // Computed values avec useMemo
  const userProjects = useMemo(() => {
    return projects.filter(p => p.ownerId === currentUser?.id);
  }, [projects, currentUser]);

  // Loading state
  if (loading && page === 1) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <CircularProgress />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">
            Erreur lors du chargement : {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography>Aucun projet trouvé</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => handleProjectClick(project)}
        />
      ))}

      {projects.length >= limit && (
        <Button onClick={handleNextPage} disabled={loading}>
          Charger plus
        </Button>
      )}
    </div>
  );
};

// Export avec React.memo pour optimisation
export default React.memo(ProjectList);
```

### Custom Hooks

```typescript
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { fetchProjects, createProject, updateProject, deleteProject } from '@/store/slices/projectsSlice';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@/types/project.types';

interface UseProjectsOptions {
  autoFetch?: boolean;
  status?: string;
  limit?: number;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { autoFetch = true, status, limit = 10 } = options;

  const dispatch = useAppDispatch();
  const { projects, loading, error } = useAppSelector(state => state.projects);

  const [page, setPage] = useState(1);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchProjects({ page, limit, status }));
    }
  }, [dispatch, autoFetch, page, limit, status]);

  // CRUD operations
  const create = async (data: CreateProjectDto): Promise<Project> => {
    const result = await dispatch(createProject(data)).unwrap();
    return result;
  };

  const update = async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const result = await dispatch(updateProject({ id, data })).unwrap();
    return result;
  };

  const remove = async (id: string): Promise<void> => {
    await dispatch(deleteProject(id)).unwrap();
  };

  const refresh = () => {
    dispatch(fetchProjects({ page, limit, status }));
  };

  const nextPage = () => setPage(prev => prev + 1);
  const prevPage = () => setPage(prev => Math.max(1, prev - 1));

  return {
    projects,
    loading,
    error,
    page,
    create,
    update,
    remove,
    refresh,
    nextPage,
    prevPage,
  };
}
```

### Redux Slices

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { projectsAPI } from '@/services/api/projects.api';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@/types/project.types';
import type { ApiResponse } from '@/types/api.types';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  meta: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchProjects = createAsyncThunk<
  ApiResponse<Project[]>,
  { page?: number; limit?: number; status?: string }
>('projects/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await projectsAPI.getAll(params);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération');
  }
});

export const fetchProjectById = createAsyncThunk<Project, string>(
  'projects/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await projectsAPI.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Projet introuvable');
    }
  }
);

export const createProject = createAsyncThunk<Project, CreateProjectDto>(
  'projects/create',
  async (data, { rejectWithValue }) => {
    try {
      return await projectsAPI.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateProject = createAsyncThunk<
  Project,
  { id: string; data: UpdateProjectDto }
>('projects/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await projectsAPI.update(id, data);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour');
  }
});

export const deleteProject = createAsyncThunk<void, string>(
  'projects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await projectsAPI.delete(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }
);

// Slice
const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchProjects.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProjects.fulfilled, (state, action) => {
      state.loading = false;
      state.projects = action.payload.data;
      state.meta = action.payload.meta;
    });
    builder.addCase(fetchProjects.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch by ID
    builder.addCase(fetchProjectById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProjectById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentProject = action.payload;
    });
    builder.addCase(fetchProjectById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create
    builder.addCase(createProject.fulfilled, (state, action) => {
      state.projects.unshift(action.payload);
    });

    // Update
    builder.addCase(updateProject.fulfilled, (state, action) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
    });

    // Delete
    builder.addCase(deleteProject.fulfilled, (state, action) => {
      state.projects = state.projects.filter(p => p.id !== action.meta.arg);
      if (state.currentProject?.id === action.meta.arg) {
        state.currentProject = null;
      }
    });
  },
});

export const { clearError, clearCurrentProject } = projectsSlice.actions;
export default projectsSlice.reducer;
```

---

## Naming Conventions

### Général

| Type | Convention | Exemple |
|------|------------|---------|
| **Variables** | camelCase | `userName`, `projectList` |
| **Constantes** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| **Fonctions** | camelCase | `fetchProjects()`, `calculateTotal()` |
| **Classes** | PascalCase | `ProjectService`, `UserRepository` |
| **Interfaces** | PascalCase | `IProjectService`, `Project` |
| **Types** | PascalCase | `ProjectStatus`, `ApiResponse<T>` |
| **Enums** | PascalCase | `UserRole`, `HttpStatus` |
| **Fichiers** | kebab-case | `project-service.ts`, `user-repository.ts` |

### Backend NestJS

```typescript
// Modules
export class ProjectsModule {}

// Controllers
@Controller('projects')
export class ProjectsController {}

// Services
@Injectable()
export class ProjectsService {}

// Repositories
@Injectable()
export class ProjectsRepository {}

// DTOs
export class CreateProjectDto {}
export class UpdateProjectDto {}
export class QueryProjectDto {}

// Entities
export class Project {}

// Guards
@Injectable()
export class JwtAuthGuard {}

// Decorators
export const Roles = (...roles: UserRole[]) => {};

// Pipes
@Injectable()
export class ValidationPipe {}

// Filters
@Catch()
export class HttpExceptionFilter {}

// Interceptors
@Injectable()
export class LoggingInterceptor {}
```

### Frontend React

```typescript
// Composants
export const ProjectList: React.FC = () => {};
export const ProjectCard: React.FC<ProjectCardProps> = () => {};

// Pages
export const ProjectDetailPage: React.FC = () => {};

// Hooks
export function useProjects() {}
export function useAuth() {}

// Services
export const projectsAPI = {
  getAll: () => {},
  getById: () => {},
};

// Types/Interfaces
export interface Project {}
export type ProjectStatus = 'active' | 'completed';

// Redux slices
export const projectsSlice = createSlice({});

// Actions
export const fetchProjects = createAsyncThunk();
```

---

## Error Handling

### Backend - HTTP Exceptions

```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// 400 - Bad Request
throw new BadRequestException('Les données fournies sont invalides');
throw new BadRequestException({
  message: 'Validation failed',
  errors: ['Name is required', 'Email format is invalid'],
});

// 401 - Unauthorized
throw new UnauthorizedException('Token invalide ou expiré');

// 403 - Forbidden
throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires');

// 404 - Not Found
throw new NotFoundException(`Projet #${id} introuvable`);

// 409 - Conflict
throw new ConflictException('Un projet avec ce nom existe déjà');

// 500 - Internal Server Error
throw new InternalServerErrorException('Une erreur inattendue s\'est produite');
```

### Backend - Global Exception Filter

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log l'erreur
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Réponse structurée
    response.status(status).json({
      statusCode: status,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Frontend - Error Handling

```typescript
import { toast } from 'react-toastify';

// Dans les composants
try {
  await projectsService.create(data);
  toast.success('Projet créé avec succès');
} catch (error: any) {
  const message = error.response?.data?.message || 'Une erreur est survenue';
  toast.error(message);
  console.error('Error creating project:', error);
}

// Dans les Redux thunks (déjà géré par rejectWithValue)
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await projectsAPI.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur');
    }
  }
);

// Hook d'erreur personnalisé
export function useErrorHandler() {
  return useCallback((error: any, fallbackMessage = 'Une erreur est survenue') => {
    const message = error.response?.data?.message || error.message || fallbackMessage;
    toast.error(message);
    console.error(error);
  }, []);
}
```

---

## Testing Patterns

### Backend - Tests unitaires

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: ProjectsRepository;

  const mockProject = {
    id: '1',
    name: 'Test Project',
    description: 'Test description',
    status: 'active',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    ownerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
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

    it('should throw NotFoundException when project not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Project',
      description: 'Description',
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

    it('should throw BadRequestException when endDate is before startDate', async () => {
      const invalidDto = {
        ...createDto,
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });
});
```

### Frontend - Tests composants React

```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { ProjectList } from './ProjectList';
import type { RootState } from '@/store/store';

const mockStore = configureStore<Partial<RootState>>([]);

describe('ProjectList', () => {
  let store: any;

  const mockProjects = [
    {
      id: '1',
      name: 'Project 1',
      status: 'active',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      ownerId: 'user-1',
    },
    {
      id: '2',
      name: 'Project 2',
      status: 'completed',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      ownerId: 'user-1',
    },
  ];

  beforeEach(() => {
    store = mockStore({
      projects: {
        projects: mockProjects,
        loading: false,
        error: null,
        meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      },
      auth: {
        user: { id: 'user-1', email: 'test@example.com' },
        isAuthenticated: true,
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
      projects: { projects: [], loading: true, error: null, meta: {} },
      auth: { user: null, isAuthenticated: false },
    });

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error state', () => {
    store = mockStore({
      projects: { projects: [], loading: false, error: 'Failed to fetch', meta: {} },
      auth: { user: null, isAuthenticated: false },
    });

    renderComponent();

    expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
  });

  it('should call onProjectClick when project is clicked', async () => {
    const onProjectClick = jest.fn();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProjectList onProjectClick={onProjectClick} />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText('Project 1'));

    await waitFor(() => {
      expect(onProjectClick).toHaveBeenCalledWith(mockProjects[0]);
    });
  });
});
```

---

## Database & Prisma

### Schéma Prisma

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(100)
  description String?  @db.Text
  status      String   @default("draft") @db.VarChar(20)
  startDate   DateTime @map("start_date")
  endDate     DateTime @map("end_date")
  budget      Float?

  // Relations
  ownerId     String   @map("owner_id")
  owner       User     @relation("OwnedProjects", fields: [ownerId], references: [id])

  members     ProjectMember[]
  tasks       Task[]
  milestones  Milestone[]
  documents   Document[]

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([ownerId])
  @@index([status])
  @@index([startDate, endDate])
  @@map("projects")
}

model Task {
  id          String    @id @default(uuid())
  title       String    @db.VarChar(200)
  description String?   @db.Text
  status      String    @default("todo") @db.VarChar(20)
  priority    String    @default("medium") @db.VarChar(20)
  dueDate     DateTime? @map("due_date")

  // Relations
  projectId   String    @map("project_id")
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  assigneeId  String?   @map("assignee_id")
  assignee    User?     @relation(fields: [assigneeId], references: [id])

  // Dependencies
  dependencies TaskDependency[] @relation("TaskDependencies")
  dependents   TaskDependency[] @relation("DependentTasks")

  // Timestamps
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([projectId])
  @@index([assigneeId])
  @@index([status])
  @@index([dueDate])
  @@map("tasks")
}
```

### Migrations

```bash
# Créer une migration
npx prisma migrate dev --name add_project_budget

# Appliquer migrations en production
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate

# Reset la DB (DEV ONLY!)
npx prisma migrate reset
```

### Requêtes Prisma optimisées

```typescript
// Select spécifique (éviter over-fetching)
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
});

// Pagination
const projects = await prisma.project.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

// Filtres complexes
const projects = await prisma.project.findMany({
  where: {
    AND: [
      { status: 'active' },
      {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    ],
  },
});

// Transactions
await prisma.$transaction(async (tx) => {
  const project = await tx.project.create({ data: projectData });
  await tx.projectMember.createMany({
    data: memberIds.map(userId => ({ projectId: project.id, userId })),
  });
  return project;
});

// Aggregations
const stats = await prisma.project.groupBy({
  by: ['status'],
  _count: true,
  _avg: { budget: true },
});
```

---

## API Design

### Structure de réponse standard

```typescript
// Success - Liste paginée
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}

// Success - Objet unique
{
  "id": "123",
  "name": "Project Name",
  ...
}

// Error
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Name is required",
    "Email format is invalid"
  ],
  "timestamp": "2025-10-15T10:30:00.000Z",
  "path": "/api/projects"
}
```

### REST Endpoints conventions

```typescript
// GET - Liste
GET    /api/projects?page=1&limit=10&status=active

// GET - Un élément
GET    /api/projects/:id

// POST - Créer
POST   /api/projects
Body:  { name, description, startDate, endDate }

// PUT - Remplacer complètement
PUT    /api/projects/:id
Body:  { name, description, startDate, endDate, status }

// PATCH - Mise à jour partielle
PATCH  /api/projects/:id
Body:  { status: "completed" }

// DELETE - Supprimer
DELETE /api/projects/:id

// Actions spécifiques
POST   /api/projects/:id/archive
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

### Filtres et recherche

```typescript
// Filtres multiples
GET /api/projects?status=active&ownerId=123&startDate[gte]=2025-01-01

// Recherche textuelle
GET /api/projects?search=migration

// Tri
GET /api/projects?orderBy=createdAt&order=desc

// Includes (relations)
GET /api/projects?include=owner,members,tasks

// Champs spécifiques (projection)
GET /api/projects?fields=id,name,status
```

---

## Security

### Authentication JWT

```typescript
// Guard JWT
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
    return user;
  }
}

// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### Authorization RBAC

```typescript
// Roles decorator
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Roles guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage dans controller
@Post()
@Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
@UseGuards(JwtAuthGuard, RolesGuard)
async create(@Body() createDto: CreateProjectDto) {
  return this.projectsService.create(createDto);
}
```

### Validation

```typescript
// DTOs avec validation
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsAfter('startDate') // Custom validator
  endDate: Date;
}

// Custom validator
export function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value > relatedValue;
        },
      },
    });
  };
}
```

### Sanitization

```typescript
// Nettoyer les inputs
import { sanitize } from 'class-sanitizer';

@Post()
async create(@Body() createDto: CreateProjectDto) {
  sanitize(createDto); // Retire les propriétés non définies
  return this.projectsService.create(createDto);
}

// SQL Injection - Prisma protège automatiquement
// ✅ BON - Prisma échappe les paramètres
await prisma.user.findMany({
  where: { email: userInput },
});

// ❌ MAUVAIS - Raw SQL non protégé
await prisma.$executeRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`);

// ✅ BON - Raw SQL avec paramètres
await prisma.$executeRaw`SELECT * FROM users WHERE email = ${userInput}`;
```

---

## Performance

### Backend optimizations

```typescript
// 1. Caching avec Redis
@Injectable()
export class ProjectsService {
  constructor(
    private repository: ProjectsRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findOne(id: string): Promise<Project> {
    const cacheKey = `project:${id}`;

    // Check cache
    const cached = await this.cacheManager.get<Project>(cacheKey);
    if (cached) return cached;

    // Fetch from DB
    const project = await this.repository.findById(id);

    // Store in cache (TTL 5min)
    await this.cacheManager.set(cacheKey, project, 300);

    return project;
  }
}

// 2. Database indexes (dans schema.prisma)
@@index([ownerId])
@@index([status])
@@index([startDate, endDate])

// 3. Pagination obligatoire
async findAll(query: QueryDto) {
  const { page = 1, limit = 10 } = query;

  if (limit > 100) {
    throw new BadRequestException('Limit maximum: 100');
  }

  return this.repository.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}

// 4. Select only needed fields
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    // Ne pas fetcher description, createdAt, etc.
  },
});

// 5. Eager loading vs N+1 queries
// ❌ MAUVAIS - N+1 queries
const projects = await prisma.project.findMany();
for (const project of projects) {
  const owner = await prisma.user.findUnique({ where: { id: project.ownerId } });
}

// ✅ BON - 1 seule requête avec include
const projects = await prisma.project.findMany({
  include: { owner: true },
});
```

### Frontend optimizations

```typescript
// 1. React.memo pour éviter re-renders
export const ProjectCard = React.memo<ProjectCardProps>(({ project }) => {
  return <Card>{project.name}</Card>;
});

// 2. useMemo pour calculations coûteuses
const sortedProjects = useMemo(() => {
  return projects.sort((a, b) => b.startDate - a.startDate);
}, [projects]);

// 3. useCallback pour event handlers
const handleClick = useCallback((projectId: string) => {
  navigate(`/projects/${projectId}`);
}, [navigate]);

// 4. Lazy loading routes
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Routes>
    </Suspense>
  );
}

// 5. Virtualization pour grandes listes
import { FixedSizeList } from 'react-window';

function ProjectList({ projects }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={projects.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ProjectCard project={projects[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}

// 6. Code splitting
// Automatique avec Vite/Create React App pour chaque route lazy
```

---

## Références

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [Material-UI](https://mui.com/)

---

**Version**: 2.0.0
**Dernière mise à jour**: 2025-10-15
**Auteur**: Orchestr'A Team

Ce document doit être maintenu à jour avec les évolutions du projet.
