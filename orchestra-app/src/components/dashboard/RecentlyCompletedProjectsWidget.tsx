import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Project } from '../../types';
import { projectService } from '../../services/project.service';

interface RecentlyCompletedProjectsWidgetProps {
  limit?: number;
  daysWindow?: number;
}

/**
 * FEAT-04: Widget affichant les projets récemment terminés
 *
 * Affiche les N derniers projets terminés dans une fenêtre de temps donnée.
 * Par défaut: 5 projets dans les 30 derniers jours.
 */
export const RecentlyCompletedProjectsWidget: React.FC<RecentlyCompletedProjectsWidgetProps> = ({
  limit = 5,
  daysWindow = 30,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadRecentlyCompletedProjects();
  }, [daysWindow, limit]);

  const loadRecentlyCompletedProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les projets
      const allProjects = await projectService.getProjects();

      // Filtrer les projets terminés récemment
      const now = new Date();
      const recentlyCompleted = allProjects
        .filter(p => p.status === 'COMPLETED' && p.updatedAt)
        .filter(p => {
          const daysSinceCompletion = differenceInDays(now, new Date(p.updatedAt!));
          return daysSinceCompletion <= daysWindow;
        })
        .sort((a, b) => {
          // Trier par date de complétion (plus récent en premier)
          const dateA = new Date(a.updatedAt!).getTime();
          const dateB = new Date(b.updatedAt!).getTime();
          return dateB - dateA;
        })
        .slice(0, limit);

      setProjects(recentlyCompleted);
    } catch (err: any) {
      console.error('Error loading recently completed projects:', err);
      setError(err?.message || 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const getDaysAgo = (date: string | Date): string => {
    const days = differenceInDays(new Date(), new Date(date));
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    return `Il y a ${days} jours`;
  };

  return (
    <Card>
      <CardHeader
        title="Projets Récemment Terminés"
        subheader={`${daysWindow} derniers jours`}
        action={
          <IconButton
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label="Afficher plus"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        }
        avatar={<CompletedIcon color="success" />}
      />

      <Collapse in={expanded} timeout="auto">
        <CardContent sx={{ pt: 0 }}>
          {loading && (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={40} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && projects.length === 0 && (
            <Alert severity="info">
              Aucun projet terminé dans les {daysWindow} derniers jours
            </Alert>
          )}

          {!loading && !error && projects.length > 0 && (
            <List disablePadding>
              {projects.map((project, index) => (
                <ListItem
                  key={project.id}
                  divider={index < projects.length - 1}
                  sx={{ px: 0 }}
                >
                  <ListItemIcon>
                    <CompletedIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="medium">
                        {project.name}
                      </Typography>
                    }
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {project.description && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {project.description}
                          </Typography>
                        )}

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Chip
                            icon={<CalendarIcon />}
                            label={getDaysAgo(project.updatedAt!)}
                            size="small"
                            variant="outlined"
                            color="success"
                          />

                          {project.manager && (
                            <Chip
                              icon={<PersonIcon />}
                              label={`${project.manager.firstName} ${project.manager.lastName}`}
                              size="small"
                              variant="outlined"
                            />
                          )}

                          {project.endDate && (
                            <Typography variant="caption" color="text.secondary">
                              Terminé le {format(new Date(project.endDate), 'dd MMM yyyy', { locale: fr })}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default RecentlyCompletedProjectsWidget;
