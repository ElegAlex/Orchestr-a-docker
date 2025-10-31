import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentIsolationGuard } from './auth/guards/department-isolation.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { DocumentsModule } from './documents/documents.module';
import { CommentsModule } from './comments/comments.module';
import { LeavesModule } from './leaves/leaves.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivitiesModule } from './activities/activities.module';
import { DepartmentsModule } from './departments/departments.module';
import { SimpleTasksModule } from './simple-tasks/simple-tasks.module';
import { MilestonesModule } from './milestones/milestones.module';
import { PresencesModule } from './presences/presences.module';
import { PersonalTodosModule } from './personal-todos/personal-todos.module';
import { EpicsModule } from './epics/epics.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { SchoolHolidaysModule } from './school-holidays/school-holidays.module';
import { HolidaysModule } from './holidays/holidays.module';
import { SettingsModule } from './settings/settings.module';
import { ProfileModule } from './profile/profile.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CapacityModule } from './capacity/capacity.module';
import { SkillsModule } from './skills/skills.module';
import { ReportsModule } from './reports/reports.module';
import { TeleworkModule } from './telework/telework.module';
import { ServicesModule } from './services/services.module';
import { UserServiceAssignmentsModule } from './user-service-assignments/user-service-assignments.module';
import { SessionsModule } from './sessions/sessions.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';

@Module({
  imports: [
    // Configuration globale (variables d'environnement)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Module Prisma pour la base de données
    PrismaModule,
    // Module d'authentification
    AuthModule,
    // Module de gestion des utilisateurs
    UsersModule,
    // Module de gestion du profil utilisateur
    ProfileModule,
    // Module de gestion des départements
    DepartmentsModule,
    // Module de gestion des projets
    ProjectsModule,
    // Module de gestion des tâches
    TasksModule,
    // Module de gestion des jalons (milestones)
    MilestonesModule,
    // Module de gestion des documents
    DocumentsModule,
    // Module de gestion des commentaires
    CommentsModule,
    // Module de gestion des congés
    LeavesModule,
    // Module de gestion des types de congés (paramétrage)
    LeaveTypesModule,
    // Module de gestion des notifications
    NotificationsModule,
    // Module de gestion des logs d'activité
    ActivitiesModule,
    // Module de gestion des tâches simples
    SimpleTasksModule,
    // Module de gestion des présences
    PresencesModule,
    // Module de gestion du télétravail
    TeleworkModule,
    // Module de gestion des todos personnelles
    PersonalTodosModule,
    // Module de gestion des epics
    EpicsModule,
    // Module de gestion des time entries
    TimeEntriesModule,
    // Module de gestion des congés scolaires
    SchoolHolidaysModule,
    // Module de gestion des jours fériés
    HolidaysModule,
    // Module de gestion de la configuration système
    SettingsModule,
    // Module de gestion des webhooks
    WebhooksModule,
    // Module d'analytics et rapports
    AnalyticsModule,
    // Module de gestion de la capacité et allocations
    CapacityModule,
    // Module de gestion des compétences (skills)
    SkillsModule,
    // Module de gestion des rapports et exports
    ReportsModule,
    // Module de gestion des services métier
    ServicesModule,
    // Module de gestion des assignations utilisateurs-services
    UserServiceAssignmentsModule,
    // Module de gestion des sessions utilisateurs (audit logging)
    SessionsModule,
    // Module de gestion des pièces jointes (Service 33)
    AttachmentsModule,
    // Module de gestion des notifications push (Service 35)
    PushNotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 🔒 Guard d'isolation par département (appliqué globalement)
    {
      provide: APP_GUARD,
      useClass: DepartmentIsolationGuard,
    },
  ],
})
export class AppModule {}
