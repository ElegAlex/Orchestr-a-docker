import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Tooltip,
  Badge,
  Grid,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  BeachAccess as VacationIcon,
  LocalHospital as SickIcon,
  School as TrainingIcon,
  Business as WorkIcon,
  Event as EventIcon,
  MoneyOff as UnpaidIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeaveRequest, LeaveType, LeaveStatus } from '../types';
import { RootState } from '../store';
import { leaveService } from '../services/leave.service';

// Définition des types de congés avec leurs icônes et couleurs
const LEAVE_TYPE_CONFIG: Record<LeaveType, { label: string; icon: React.ReactNode; color: any }> = {
  PAID_LEAVE: { label: 'Congés payés', icon: <VacationIcon />, color: 'primary' },
  RTT: { label: 'RTT', icon: <WorkIcon />, color: 'secondary' },
  SICK_LEAVE: { label: 'Congé maladie', icon: <SickIcon />, color: 'error' },
  TRAINING: { label: 'Formation', icon: <TrainingIcon />, color: 'info' },
  EXCEPTIONAL_LEAVE: { label: 'Congé exceptionnel', icon: <EventIcon />, color: 'warning' },
  UNPAID_LEAVE: { label: 'Congé sans solde', icon: <UnpaidIcon />, color: 'default' },
  MATERNITY_LEAVE: { label: 'Congé maternité', icon: <VacationIcon />, color: 'success' },
  PATERNITY_LEAVE: { label: 'Congé paternité', icon: <VacationIcon />, color: 'success' },
  CONVENTIONAL_LEAVE: { label: 'Congé conventionnel', icon: <EventIcon />, color: 'info' },
};

// Configuration des statuts
const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: any }> = {
  PENDING: { label: 'En attente', color: 'warning' },
  APPROVED: { label: 'Approuvé', color: 'success' },
  REJECTED: { label: 'Refusé', color: 'error' },
  CANCELLED: { label: 'Annulé', color: 'default' },
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );
};

export const LeaveApprovalPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Dialog de rejet
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Dialog de détails
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Chargement des demandes de congés
  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      // Pour un manager, on récupère toutes les demandes (à filtrer côté backend par département si nécessaire)
      const allRequests = await leaveService.getAllLeaves();
      setLeaveRequests(allRequests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      setErrorMessage('Erreur lors du chargement des demandes de congés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  // Filtrer les demandes par statut
  const getPendingLeaves = () => leaveRequests.filter(l => l.status === 'PENDING');
  const getApprovedLeaves = () => leaveRequests.filter(l => l.status === 'APPROVED');
  const getRejectedLeaves = () => leaveRequests.filter(l => l.status === 'REJECTED');

  // FEAT-01 FIX: Approuver une demande
  const handleApprove = async (leaveId: string) => {
    try {
      setLoading(true);
      await leaveService.approveLeave(leaveId);
      setSuccessMessage('Demande de congé approuvée avec succès');
      await loadLeaveRequests(); // Recharger la liste
    } catch (error: any) {
      console.error('Error approving leave:', error);
      setErrorMessage(error?.message || 'Erreur lors de l\'approbation de la demande');
    } finally {
      setLoading(false);
    }
  };

  // FEAT-01 FIX: Rejeter une demande
  const handleRejectClick = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedLeave || !rejectReason.trim()) {
      setErrorMessage('Veuillez fournir une raison pour le rejet');
      return;
    }

    try {
      setLoading(true);
      await leaveService.rejectLeave(selectedLeave.id, rejectReason);
      setSuccessMessage('Demande de congé rejetée');
      setRejectDialogOpen(false);
      setSelectedLeave(null);
      setRejectReason('');
      await loadLeaveRequests(); // Recharger la liste
    } catch (error: any) {
      console.error('Error rejecting leave:', error);
      setErrorMessage(error?.message || 'Erreur lors du rejet de la demande');
    } finally {
      setLoading(false);
    }
  };

  // Voir les détails
  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setDetailsDialogOpen(true);
  };

  // Rendu d'une ligne de tableau
  const renderLeaveRow = (leave: LeaveRequest) => {
    const typeConfig = LEAVE_TYPE_CONFIG[leave.type];
    const statusConfig = STATUS_CONFIG[leave.status];

    return (
      <TableRow key={leave.id} hover>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            {typeConfig.icon}
            <Typography variant="body2">{leave.user?.firstName} {leave.user?.lastName}</Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Chip
            label={typeConfig.label}
            color={typeConfig.color}
            size="small"
            icon={typeConfig.icon}
          />
        </TableCell>
        <TableCell>
          {format(new Date(leave.startDate), 'dd MMM yyyy', { locale: fr })}
        </TableCell>
        <TableCell>
          {format(new Date(leave.endDate), 'dd MMM yyyy', { locale: fr })}
        </TableCell>
        <TableCell align="center">
          <strong>{leave.totalDays}</strong>
        </TableCell>
        <TableCell>
          <Chip
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
          />
        </TableCell>
        <TableCell align="right">
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Voir détails">
              <IconButton size="small" onClick={() => handleViewDetails(leave)}>
                <ViewIcon />
              </IconButton>
            </Tooltip>

            {leave.status === 'PENDING' && (
              <>
                <Tooltip title="Approuver">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleApprove(leave.id)}
                    disabled={loading}
                  >
                    <ApproveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refuser">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRejectClick(leave)}
                    disabled={loading}
                  >
                    <RejectIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  // Rendu du tableau
  const renderLeaveTable = (leaves: LeaveRequest[]) => {
    if (leaves.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune demande de congé à afficher
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Employé</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Date début</strong></TableCell>
              <TableCell><strong>Date fin</strong></TableCell>
              <TableCell align="center"><strong>Jours</strong></TableCell>
              <TableCell><strong>Statut</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map(renderLeaveRow)}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const pendingLeaves = getPendingLeaves();
  const approvedLeaves = getApprovedLeaves();
  const rejectedLeaves = getRejectedLeaves();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            Validation des Congés
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadLeaveRequests}
            disabled={loading}
          >
            Actualiser
          </Button>
        </Stack>

        {/* Messages */}
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      En attente
                    </Typography>
                    <Typography variant="h3" color="warning.main">
                      {pendingLeaves.length}
                    </Typography>
                  </Box>
                  <Badge badgeContent={pendingLeaves.length} color="warning">
                    <EventIcon sx={{ fontSize: 48 }} color="action" />
                  </Badge>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Approuvées
                    </Typography>
                    <Typography variant="h3" color="success.main">
                      {approvedLeaves.length}
                    </Typography>
                  </Box>
                  <ApproveIcon sx={{ fontSize: 48 }} color="success" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Refusées
                    </Typography>
                    <Typography variant="h3" color="error.main">
                      {rejectedLeaves.length}
                    </Typography>
                  </Box>
                  <RejectIcon sx={{ fontSize: 48 }} color="error" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab
              label={
                <Badge badgeContent={pendingLeaves.length} color="warning">
                  En attente
                </Badge>
              }
            />
            <Tab label={`Approuvées (${approvedLeaves.length})`} />
            <Tab label={`Refusées (${rejectedLeaves.length})`} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {loading ? <CircularProgress /> : renderLeaveTable(pendingLeaves)}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {loading ? <CircularProgress /> : renderLeaveTable(approvedLeaves)}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {loading ? <CircularProgress /> : renderLeaveTable(rejectedLeaves)}
          </TabPanel>
        </Card>
      </Box>

      {/* Dialog de rejet */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Refuser la demande de congé</DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{selectedLeave.user?.firstName} {selectedLeave.user?.lastName}</strong>
                {' - '}
                {LEAVE_TYPE_CONFIG[selectedLeave.type].label}
                {' du '}
                {format(new Date(selectedLeave.startDate), 'dd/MM/yyyy', { locale: fr })}
                {' au '}
                {format(new Date(selectedLeave.endDate), 'dd/MM/yyyy', { locale: fr })}
                {' '}({selectedLeave.totalDays} jour{selectedLeave.totalDays > 1 ? 's' : ''})
              </Typography>
            </Box>
          )}
          <TextField
            label="Raison du refus"
            multiline
            rows={4}
            fullWidth
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Expliquez la raison du refus..."
            helperText="La raison sera communiquée à l'employé"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleRejectConfirm}
            color="error"
            variant="contained"
            disabled={!rejectReason.trim() || loading}
          >
            Refuser la demande
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détails */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de la demande</DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Employé</Typography>
                <Typography variant="body1">
                  {selectedLeave.user?.firstName} {selectedLeave.user?.lastName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body1">
                  {LEAVE_TYPE_CONFIG[selectedLeave.type].label}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Période</Typography>
                <Typography variant="body1">
                  Du {format(new Date(selectedLeave.startDate), 'dd MMMM yyyy', { locale: fr })}
                  {' au '}
                  {format(new Date(selectedLeave.endDate), 'dd MMMM yyyy', { locale: fr })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre de jours</Typography>
                <Typography variant="body1">{selectedLeave.totalDays} jour{selectedLeave.totalDays > 1 ? 's' : ''}</Typography>
              </Box>
              {selectedLeave.reason && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Motif</Typography>
                  <Typography variant="body1">{selectedLeave.reason}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">Statut</Typography>
                <Chip
                  label={STATUS_CONFIG[selectedLeave.status].label}
                  color={STATUS_CONFIG[selectedLeave.status].color}
                  size="small"
                />
              </Box>
              {selectedLeave.status === 'REJECTED' && selectedLeave.rejectionReason && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Raison du refus</Typography>
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {selectedLeave.rejectionReason}
                  </Alert>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeaveApprovalPage;
