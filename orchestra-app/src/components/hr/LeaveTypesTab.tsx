import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Stack,
  FormControlLabel,
  Switch,
  Tooltip,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOff as DeactivateIcon,
  ToggleOn as ActivateIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { leaveTypesAPI, LeaveTypeConfig, CreateLeaveTypeRequest, UpdateLeaveTypeRequest } from '../../services/api/leaveTypes.api';

/**
 * Tab de gestion des types de congés configurables
 * Remplace la configuration globale des jours de congés
 *
 * Features:
 * - Affichage des 4 types système par défaut (modifiables mais non supprimables)
 * - Création de types personnalisés
 * - Modification des paramètres (jours par défaut, couleur, icône, etc.)
 * - Désactivation/Réactivation (soft delete)
 * - Suppression définitive (types personnalisés uniquement)
 * - Réorganisation par drag & drop (TODO: future feature)
 */
export const LeaveTypesTab: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [totalDays, setTotalDays] = useState(0);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveTypeConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<LeaveTypeConfig | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateLeaveTypeRequest>({
    name: '',
    code: '',
    description: '',
    defaultDays: 0,
    color: '#1976d2',
    icon: 'event',
    requiresApproval: true,
    isPaid: true,
    countInBalance: true,
    sortOrder: 0,
  });

  // Charger les types de congés
  const loadLeaveTypes = async () => {
    try {
      console.log('🔄 [LeaveTypesTab] Début chargement des types de congés...');
      setLoading(true);
      setError(null);
      const types = await leaveTypesAPI.getAll(includeInactive);
      console.log('✅ [LeaveTypesTab] Types chargés:', types);
      setLeaveTypes(types);

      // Calculer le total des jours par défaut
      const total = await leaveTypesAPI.calculateTotalDays();
      console.log('✅ [LeaveTypesTab] Total calculé:', total);
      setTotalDays(total.totalDays);
    } catch (err: any) {
      console.error('❌ [LeaveTypesTab] Error loading leave types:', err);
      setError(err.message || 'Erreur lors du chargement des types de congés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, [includeInactive]);

  // Ouvrir le dialog de création
  const handleOpenCreateDialog = () => {
    setEditMode(false);
    setSelectedType(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      defaultDays: 0,
      color: '#1976d2',
      icon: 'event',
      requiresApproval: true,
      isPaid: true,
      countInBalance: true,
      sortOrder: leaveTypes.length + 1,
    });
    setDialogOpen(true);
  };

  // Ouvrir le dialog de modification
  const handleOpenEditDialog = (type: LeaveTypeConfig) => {
    setEditMode(true);
    setSelectedType(type);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description,
      defaultDays: type.defaultDays,
      color: type.color,
      icon: type.icon,
      requiresApproval: type.requiresApproval,
      isPaid: type.isPaid,
      countInBalance: type.countInBalance,
      sortOrder: type.sortOrder,
    });
    setDialogOpen(true);
  };

  // Sauvegarder (créer ou modifier)
  const handleSave = async () => {
    try {
      setError(null);

      if (editMode && selectedType) {
        // Modifier
        const { code, ...updateData } = formData; // Exclure code (immutable)
        await leaveTypesAPI.update(selectedType.id, updateData as UpdateLeaveTypeRequest);
      } else {
        // Créer
        await leaveTypesAPI.create(formData);
      }

      setDialogOpen(false);
      loadLeaveTypes();
    } catch (err: any) {
      console.error('Error saving leave type:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Désactiver/Réactiver
  const handleToggleActive = async (type: LeaveTypeConfig) => {
    try {
      setError(null);
      if (type.isActive) {
        await leaveTypesAPI.deactivate(type.id);
      } else {
        await leaveTypesAPI.activate(type.id);
      }
      loadLeaveTypes();
    } catch (err: any) {
      console.error('Error toggling leave type:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de la modification');
    }
  };

  // Ouvrir dialog de confirmation de suppression
  const handleOpenDeleteDialog = (type: LeaveTypeConfig) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  // Supprimer définitivement
  const handleDelete = async () => {
    if (!typeToDelete) return;

    try {
      setError(null);
      await leaveTypesAPI.delete(typeToDelete.id);
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      loadLeaveTypes();
    } catch (err: any) {
      console.error('Error deleting leave type:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de la suppression');
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              🏷️ Types de Congés
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configurez les types de congés disponibles et le nombre de jours par défaut pour chaque type.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Nouveau type
          </Button>
        </Box>

        {/* Total des jours par défaut */}
        <Card variant="outlined" sx={{ mb: 2, backgroundColor: 'info.50' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Total des jours par défaut (types actifs uniquement)
            </Typography>
            <Typography variant="h4" color="primary">
              {totalDays} jours
            </Typography>
          </CardContent>
        </Card>

        {/* Toggle pour afficher/masquer les types inactifs */}
        <FormControlLabel
          control={
            <Switch
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
          }
          label="Afficher les types désactivés"
        />
      </Box>

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table des types de congés */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}></TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Code</TableCell>
              <TableCell align="right">Jours par défaut</TableCell>
              <TableCell>Couleur</TableCell>
              <TableCell>Icône</TableCell>
              <TableCell align="center">Validation</TableCell>
              <TableCell align="center">Payé</TableCell>
              <TableCell align="center">Comptabilisé</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaveTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography color="text.secondary">
                    Aucun type de congé configuré
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              leaveTypes.map((type) => (
                <TableRow
                  key={type.id}
                  sx={{
                    opacity: type.isActive ? 1 : 0.5,
                    backgroundColor: type.isActive ? 'inherit' : 'action.disabledBackground',
                  }}
                >
                  <TableCell>
                    <IconButton size="small" disabled>
                      <DragIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {type.name}
                    </Typography>
                    {type.description && (
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={type.code} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {type.defaultDays} jours
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: type.color,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </TableCell>
                  <TableCell>{type.icon}</TableCell>
                  <TableCell align="center">
                    {type.requiresApproval ? '✅' : '❌'}
                  </TableCell>
                  <TableCell align="center">
                    {type.isPaid ? '✅' : '❌'}
                  </TableCell>
                  <TableCell align="center">
                    {type.countInBalance ? '✅' : '❌'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={type.isActive ? 'Actif' : 'Inactif'}
                      size="small"
                      color={type.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {type.isSystem && (
                      <Chip label="Système" size="small" color="info" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(type)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={type.isActive ? 'Désactiver' : 'Réactiver'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(type)}
                          disabled={type.isSystem && type.isActive}
                        >
                          {type.isActive ? (
                            <DeactivateIcon fontSize="small" />
                          ) : (
                            <ActivateIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          type.isSystem
                            ? 'Les types système ne peuvent pas être supprimés'
                            : 'Supprimer définitivement'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteDialog(type)}
                            disabled={type.isSystem}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de création/modification */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Modifier le type de congé' : 'Créer un nouveau type de congé'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Nom du type"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              helperText="Ex: CONGÉ PRINCIPAL, RTT, etc."
            />
            <TextField
              label="Code unique"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              fullWidth
              required
              disabled={editMode}
              helperText={editMode ? 'Le code ne peut pas être modifié' : 'Ex: PAID_LEAVE, RTT (majuscules, sans espaces)'}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Jours par défaut"
              type="number"
              value={formData.defaultDays}
              onChange={(e) => setFormData({ ...formData, defaultDays: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
              inputProps={{ min: 0, max: 365, step: 0.5 }}
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Couleur (hex)"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                fullWidth
                helperText="Format: #1976d2"
              />
              <TextField
                label="Icône Material-UI"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                fullWidth
                helperText="Ex: event, beach_access"
              />
            </Box>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  />
                }
                label="Nécessite validation"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  />
                }
                label="Congé payé"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.countInBalance}
                    onChange={(e) => setFormData({ ...formData, countInBalance: e.target.checked })}
                  />
                }
                label="Comptabilisé dans le solde"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!formData.name || !formData.code}
          >
            {editMode ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="error" />
            Confirmer la suppression
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer définitivement le type de congé{' '}
            <strong>{typeToDelete?.name}</strong> ?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Cette action est irréversible. Il est recommandé de désactiver le type plutôt que de le supprimer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Supprimer définitivement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
