import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import {
  Close as CloseIcon,
  EventBusy as LeaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { User, LeaveType } from '../../types';
import { leaveService } from '../../services/leave.service';
import { userService } from '../../services/user.service';
import { userServiceAssignmentService } from '../../services/user-service-assignment.service';
import { permissionsService } from '../../services/permissions.service';
import { leaveTypesAPI, LeaveTypeConfig } from '../../services/api/leaveTypes.api';

interface AdminLeaveDeclarationModalProps {
  open: boolean;
  currentUser: User;
  onClose: () => void;
  onSave: () => void;
}

export const AdminLeaveDeclarationModal: React.FC<AdminLeaveDeclarationModalProps> = ({
  open,
  currentUser,
  onClose,
  onSave,
}) => {
  // États du formulaire
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveType>('PAID_LEAVE');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [halfDayStart, setHalfDayStart] = useState(false);
  const [halfDayEnd, setHalfDayEnd] = useState(false);
  const [reason, setReason] = useState('');

  // États de chargement et erreur
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);

  // Charger les types de congés configurables
  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const types = await leaveTypesAPI.getActive();
        setLeaveTypes(types);
        // Initialiser le type par défaut avec le premier type actif
        if (types.length > 0 && !leaveType) {
          setLeaveType(types[0].code as LeaveType);
        }
      } catch (error) {
        console.error('Error loading leave types:', error);
      }
    };
    if (open) {
      loadLeaveTypes();
    }
  }, [open]);

  // Charger les utilisateurs disponibles selon le rôle
  useEffect(() => {
    if (open) {
      loadAvailableUsers();
    }
  }, [open, currentUser]);

  // Charger le solde de congés quand un utilisateur est sélectionné
  useEffect(() => {
    if (selectedUserId) {
      loadLeaveBalance(selectedUserId);
    } else {
      setLeaveBalance(null);
    }
  }, [selectedUserId]);

  const loadAvailableUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let users: User[] = [];

      if (currentUser.role === 'admin' || currentUser.role === 'responsable') {
        // Admin et responsable peuvent gérer tous les utilisateurs
        users = await userService.getAllUsers();
      } else if (currentUser.role === 'manager') {
        // Manager peut gérer les utilisateurs de ses services
        const userServiceIds = currentUser.serviceIds || [];
        const allServiceUsers: User[] = [];

        for (const serviceId of userServiceIds) {
          const serviceUsers = await userServiceAssignmentService.getUsersByService(serviceId);
          allServiceUsers.push(...serviceUsers);
        }

        // Dédupliquer les utilisateurs
        users = Array.from(new Map(allServiceUsers.map(u => [u.id, u])).values());
      } else {
        setError('Vous n\'avez pas les permissions nécessaires pour déclarer des congés.');
        return;
      }

      // Filtrer les utilisateurs actifs et exclure l'utilisateur connecté
      users = users.filter(u => u.isActive && u.id !== currentUser.id);

      setAvailableUsers(users);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveBalance = async (userId: string) => {
    try {
      const balance = await leaveService.getLeaveBalance(userId);
      setLeaveBalance(balance);
    } catch (err) {
      console.error('Erreur chargement solde:', err);
    }
  };

  // Reset sur fermeture
  useEffect(() => {
    if (!open) {
      setSelectedUserId('');
      setLeaveType('PAID_LEAVE');
      setStartDate('');
      setEndDate('');
      setHalfDayStart(false);
      setHalfDayEnd(false);
      setReason('');
      setError(null);
      setLeaveBalance(null);
    }
  }, [open]);

  const handleUserChange = (event: SelectChangeEvent) => {
    setSelectedUserId(event.target.value);
  };

  const handleLeaveTypeChange = (event: SelectChangeEvent) => {
    setLeaveType(event.target.value as LeaveType);
  };

  const handleSave = async () => {
    // Validation
    if (!selectedUserId) {
      setError('Veuillez sélectionner un utilisateur');
      return;
    }
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner les dates de début et de fin');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('La date de début doit être antérieure à la date de fin');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await leaveService.createLeaveRequest({
        userId: selectedUserId,
        type: leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        halfDayStart,
        halfDayEnd,
        reason: reason || `Déclaré par ${currentUser.firstName} ${currentUser.lastName}`,
        status: 'APPROVED', // Directement approuvé
        approvedBy: currentUser.id,
      });

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const selectedUser = availableUsers.find(u => u.id === selectedUserId);
  const selectedLeaveType = leaveTypes.find(t => t.code === leaveType);

  // Calculer le solde restant pour le type sélectionné
  const getRemainingBalance = () => {
    if (!leaveBalance) return null;

    switch (leaveType) {
      case 'PAID_LEAVE':
        return leaveBalance.paidLeave - leaveBalance.used.paidLeave;
      case 'RTT':
        return leaveBalance.rtt - leaveBalance.used.rtt;
      case 'EXCEPTIONAL_LEAVE':
        return leaveBalance.exceptional - leaveBalance.used.exceptional;
      case 'CONVENTIONAL_LEAVE':
        // Traité comme congé sans limite pour le moment
        return 'Selon convention';
      case 'SICK_LEAVE':
        return 'Illimité';
      default:
        return 'N/A';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <LeaveIcon color="primary" />
            <Typography variant="h6">
              Déclarer un congé pour un collaborateur
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          En tant que {permissionsService.getAvailableRoles().find(r => r.value === currentUser.role)?.label}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Sélection de l'utilisateur */}
          <FormControl fullWidth>
            <InputLabel>Collaborateur *</InputLabel>
            <Select
              value={selectedUserId}
              onChange={handleUserChange}
              label="Collaborateur *"
              disabled={loading}
              startAdornment={<PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              {loading ? (
                <MenuItem value="">
                  <CircularProgress size={20} />
                </MenuItem>
              ) : availableUsers.length === 0 ? (
                <MenuItem value="" disabled>
                  Aucun utilisateur disponible
                </MenuItem>
              ) : (
                availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                    {user.serviceIds && user.serviceIds.length > 0 && (
                      <Chip
                        label={user.serviceIds[0]}
                        size="small"
                        sx={{ ml: 1, height: 20 }}
                      />
                    )}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Type de congé */}
          <FormControl fullWidth>
            <InputLabel>Type de congé *</InputLabel>
            <Select
              value={leaveType}
              onChange={handleLeaveTypeChange}
              label="Type de congé *"
              disabled={!selectedUserId || leaveTypes.length === 0}
            >
              {leaveTypes.map((type) => (
                <MenuItem key={type.id} value={type.code}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: type.color
                      }}
                    />
                    <Typography>{type.name}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Solde de congés */}
          {leaveBalance && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Solde de congés ({selectedUser?.firstName} {selectedUser?.lastName})
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {selectedLeaveType && (
                  <Chip
                    label={`${selectedLeaveType.name}: ${getRemainingBalance()} jour(s)`}
                    sx={{
                      bgcolor: selectedLeaveType.color,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Dates */}
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              type="date"
              label="Date de début"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!selectedUserId}
              required
            />
            <TextField
              fullWidth
              type="date"
              label="Date de fin"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!selectedUserId}
              required
            />
          </Stack>

          {/* Demi-journées */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Début</InputLabel>
              <Select
                value={halfDayStart ? 'afternoon' : 'full'}
                onChange={(e) => setHalfDayStart(e.target.value === 'afternoon')}
                label="Début"
                disabled={!selectedUserId}
              >
                <MenuItem value="full">Journée complète</MenuItem>
                <MenuItem value="afternoon">Après-midi uniquement</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Fin</InputLabel>
              <Select
                value={halfDayEnd ? 'morning' : 'full'}
                onChange={(e) => setHalfDayEnd(e.target.value === 'morning')}
                label="Fin"
                disabled={!selectedUserId}
              >
                <MenuItem value="full">Journée complète</MenuItem>
                <MenuItem value="morning">Matin uniquement</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Motif */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Motif (optionnel)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={!selectedUserId}
            placeholder="Ex: Congé pour raison personnelle..."
          />

          {/* Résumé */}
          {selectedUserId && startDate && endDate && (
            <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="primary.dark">
                <strong>Résumé :</strong> Déclaration de {leaveTypeInfo.emoji} {leaveTypeInfo.label.toLowerCase()}
                pour <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
                {' '}du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}
                {halfDayStart && ' (après-midi début)'}
                {halfDayEnd && ' (matin fin)'}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !selectedUserId || !startDate || !endDate}
          startIcon={saving ? <CircularProgress size={16} /> : <LeaveIcon />}
        >
          {saving ? 'Déclaration...' : 'Déclarer le congé'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
