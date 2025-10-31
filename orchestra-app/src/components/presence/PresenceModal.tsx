/**
 * Modal d'affichage des présences
 * Affiche qui est sur site, en télétravail ou absent pour une date donnée
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  BeachAccess as AbsentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { presenceService, PresenceStatus, UserPresence, DepartmentPresence } from '../../services/presence.service';

interface PresenceModalProps {
  open: boolean;
  onClose: () => void;
}

export const PresenceModal: React.FC<PresenceModalProps> = ({ open, onClose }) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presences, setPresences] = useState<PresenceStatus | null>(null);

  // Charger les présences
  const loadPresences = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      // Filtrer par département sauf pour admin et responsable
      const shouldFilterByDepartment = currentUser?.role !== 'admin' && currentUser?.role !== 'responsable';
      const userDepartment = shouldFilterByDepartment ? currentUser?.department : null;

      const data = await presenceService.getPresencesForDate(date, userDepartment);
      setPresences(data);
    } catch (err) {
      console.error('Erreur chargement présences:', err);
      setError('Erreur lors du chargement des présences');
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage et quand la date change
  useEffect(() => {
    if (open && currentUser) {
      loadPresences(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDate, currentUser?.id, currentUser?.department, currentUser?.role]);

  // Composant pour afficher une liste d'utilisateurs
  const UserList: React.FC<{ users: UserPresence[]; emptyMessage: string }> = ({ users, emptyMessage }) => {
    if (users.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 1 }}>
          {emptyMessage}
        </Alert>
      );
    }

    return (
      <List dense>
        {users.map((userPresence) => {
          const { user, details, validationStatus } = userPresence;
          return (
            <ListItem key={user.id}>
              <ListItemAvatar>
                <Avatar src={user.avatarUrl}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${user.firstName} ${user.lastName}`}
                secondary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {user.serviceId || 'Service non défini'}
                    </Typography>
                    {validationStatus && (
                      <Chip
                        label={
                          validationStatus === 'APPROVED' ? 'Validé' :
                          validationStatus === 'PENDING' ? 'En attente' :
                          'Rejeté'
                        }
                        size="small"
                        color={
                          validationStatus === 'APPROVED' ? 'success' :
                          validationStatus === 'PENDING' ? 'warning' :
                          'error'
                        }
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    )}
                  </Stack>
                }
              />
              {details && (
                <Chip label={details} size="small" variant="outlined" />
              )}
            </ListItem>
          );
        })}
      </List>
    );
  };

  // Déterminer si on filtre par département
  const shouldFilterByDepartment = currentUser?.role !== 'admin' && currentUser?.role !== 'responsable';
  const departmentName = shouldFilterByDepartment ? currentUser?.department : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon />
              <Typography variant="h6">
                Présences du {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </Typography>
            </Box>
            {departmentName && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                Département : {departmentName}
              </Typography>
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Sélecteur de date */}
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <CalendarIcon color="primary" />
                <DatePicker
                  label="Sélectionner une date"
                  value={selectedDate}
                  onChange={(newDate) => newDate && setSelectedDate(newDate)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Stack>
            </Paper>

            {/* Loading */}
            {loading && (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            )}

            {/* Error */}
            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            {/* Résultats */}
            {!loading && !error && presences && (
              <Stack spacing={2}>
                {/* Statistiques globales */}
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Stack direction="row" spacing={3} justifyContent="center">
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {presences.onSite.length + presences.telework.length + presences.absent.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total collaborateurs
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {presences.onSite.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sur site
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {presences.telework.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Télétravail
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {presences.absent.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Absents
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Vue par département (pour responsables) */}
                {presences.byDepartment && presences.byDepartment.length > 0 ? (
                  presences.byDepartment.map((dept) => (
                    <Accordion key={dept.departmentName} defaultExpanded={presences.byDepartment!.length === 1}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ bgcolor: 'action.hover' }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <Box display="flex" alignItems="center" gap={1}>
                            <BusinessIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                              {dept.departmentName}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${dept.totalUsers} collaborateur${dept.totalUsers > 1 ? 's' : ''}`}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.5}>
                          {/* Stats du département */}
                          <Paper variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction="row" spacing={2} justifyContent="space-around">
                              <Box textAlign="center">
                                <Typography variant="h6" color="success.main">
                                  {dept.onSite.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Sur site
                                </Typography>
                              </Box>
                              <Box textAlign="center">
                                <Typography variant="h6" color="info.main">
                                  {dept.telework.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Télétravail
                                </Typography>
                              </Box>
                              <Box textAlign="center">
                                <Typography variant="h6" color="warning.main">
                                  {dept.absent.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Absents
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>

                          {/* Détails par catégorie */}
                          {dept.onSite.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <BusinessIcon fontSize="small" /> Sur site ({dept.onSite.length})
                              </Typography>
                              <UserList users={dept.onSite} emptyMessage="" />
                            </Box>
                          )}

                          {dept.telework.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" color="info.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <HomeIcon fontSize="small" /> Télétravail ({dept.telework.length})
                              </Typography>
                              <UserList users={dept.telework} emptyMessage="" />
                            </Box>
                          )}

                          {dept.absent.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AbsentIcon fontSize="small" /> Absents ({dept.absent.length})
                              </Typography>
                              <UserList users={dept.absent} emptyMessage="" />
                            </Box>
                          )}

                          {dept.totalUsers === 0 && (
                            <Alert severity="info">Aucun collaborateur dans ce département</Alert>
                          )}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))
                ) : (
                  <>
                    {/* Vue standard (par statut) pour les utilisateurs normaux */}
                    {/* Sur site */}
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <BusinessIcon color="success" />
                          <Typography variant="subtitle1" fontWeight="bold">
                            Sur site ({presences.onSite.length})
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <UserList
                          users={presences.onSite}
                          emptyMessage="Aucun collaborateur sur site ce jour"
                        />
                      </AccordionDetails>
                    </Accordion>

                    {/* Télétravail */}
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <HomeIcon color="info" />
                          <Typography variant="subtitle1" fontWeight="bold">
                            Télétravail ({presences.telework.length})
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <UserList
                          users={presences.telework}
                          emptyMessage="Aucun collaborateur en télétravail ce jour"
                        />
                      </AccordionDetails>
                    </Accordion>

                    {/* Absents */}
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AbsentIcon color="warning" />
                          <Typography variant="subtitle1" fontWeight="bold">
                            Absents ({presences.absent.length})
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <UserList
                          users={presences.absent}
                          emptyMessage="Aucun absent ce jour"
                        />
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
