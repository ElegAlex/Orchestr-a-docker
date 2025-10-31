import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { UserRole } from '../../types';
import { getRoleDisplayLabel } from '../../utils/roleUtils';

interface CSVImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (users: ImportedUser[], commonPassword: string) => Promise<void>;
  departments: { id: string; name: string }[];
  services: { id: string; name: string }[];
}

export interface ImportedUser {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: string;
  service?: string;
  password?: string;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

interface CSVRow {
  [key: string]: string;
}

const TEMPLATE_CSV = `prenom,nom,email,role,departement,service
Jean,Dupont,jean.dupont@example.com,USER,Développement,Service Technique
Marie,Martin,marie.martin@example.com,MANAGER,Commercial,Service Ventes
Pierre,Durand,pierre.durand@example.com,USER,RH,Service Administration`;

export const CSVImportDialog: React.FC<CSVImportDialogProps> = ({
  open,
  onClose,
  onImport,
  departments,
  services,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [commonPassword, setCommonPassword] = useState('');
  const [useCommonPassword, setUseCommonPassword] = useState(true);
  const [importing, setImporting] = useState(false);

  const steps = ['Charger le fichier CSV', 'Vérifier les données', 'Importer'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setErrors(['Le fichier doit être au format CSV']);
        return;
      }
      setCsvFile(file);
      parseCSV(file);
    }
  };

  const parseCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setErrors(['Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données']);
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Validate required columns
      const requiredColumns = ['prenom', 'nom'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));

      if (missingColumns.length > 0) {
        setErrors([`Colonnes manquantes : ${missingColumns.join(', ')}`]);
        return;
      }

      // Parse data rows
      const users: ImportedUser[] = [];
      const parseErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const row: CSVRow = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate and create user object
        const firstName = row['prenom'] || row['prénom'] || row['firstname'];
        const lastName = row['nom'] || row['name'] || row['lastname'];
        const email = row['email'] || row['mail'];
        const roleStr = (row['role'] || 'USER').toUpperCase();
        const department = row['departement'] || row['département'] || row['department'];
        const service = row['service'];
        const password = row['motdepasse'] || row['password'];

        if (!firstName || !lastName) {
          parseErrors.push(`Ligne ${i + 1}: Prénom et nom requis`);
          continue;
        }

        // Validate role
        const validRoles: UserRole[] = ['ADMIN', 'RESPONSABLE', 'MANAGER', 'USER', 'CONTRIBUTOR'];
        let role: UserRole = 'USER';

        if (validRoles.includes(roleStr as UserRole)) {
          role = roleStr as UserRole;
        } else {
          parseErrors.push(`Ligne ${i + 1}: Rôle invalide "${roleStr}", USER sera utilisé par défaut`);
        }

        // Generate email if not provided
        const finalEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@orchestr-a.internal`;

        users.push({
          firstName,
          lastName,
          email: finalEmail,
          role,
          department,
          service,
          password,
          status: 'pending',
        });
      }

      setImportedUsers(users);
      setErrors(parseErrors);

      if (users.length > 0) {
        setActiveStep(1);
      }
    } catch (error) {
      setErrors(['Erreur lors de la lecture du fichier CSV']);
      console.error('CSV parse error:', error);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!useCommonPassword && !commonPassword) {
      setErrors(['Veuillez définir un mot de passe commun']);
      return;
    }

    setImporting(true);
    try {
      await onImport(importedUsers, commonPassword);
      setActiveStep(2);
    } catch (error) {
      setErrors(['Erreur lors de l\'importation']);
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setCsvFile(null);
    setImportedUsers([]);
    setErrors([]);
    setCommonPassword('');
    setUseCommonPassword(true);
    setImporting(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Le fichier CSV doit contenir les colonnes suivantes :
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ marginTop: 8, marginBottom: 8 }}>
                  <li><strong>prenom</strong> (obligatoire)</li>
                  <li><strong>nom</strong> (obligatoire)</li>
                  <li><strong>email</strong> (optionnel, sera généré automatiquement si absent)</li>
                  <li><strong>role</strong> (optionnel, USER par défaut) : ADMIN, RESPONSABLE, MANAGER, USER, CONTRIBUTOR</li>
                  <li><strong>departement</strong> (optionnel)</li>
                  <li><strong>service</strong> (optionnel)</li>
                  <li><strong>password</strong> (optionnel, utilisera le mot de passe commun si absent)</li>
                </ul>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                fullWidth
              >
                Télécharger le template CSV
              </Button>
            </Box>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: 'background.default',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {csvFile ? csvFile.name : 'Cliquez pour sélectionner un fichier CSV'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ou glissez-déposez votre fichier ici
              </Typography>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Box>

            {errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {importedUsers.length} utilisateur(s) détecté(s)
            </Typography>

            {errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Avertissements :
                </Typography>
                {errors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    • {error}
                  </Typography>
                ))}
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  label="Mot de passe commun pour tous les utilisateurs"
                  type="password"
                  value={commonPassword}
                  onChange={(e) => setCommonPassword(e.target.value)}
                  required
                  helperText="Ce mot de passe sera utilisé pour tous les utilisateurs sans mot de passe spécifié dans le CSV"
                />
              </FormControl>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Prénom</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Mot de passe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importedUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplayLabel(user.role)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>{user.service || '-'}</TableCell>
                      <TableCell>
                        {user.password ? (
                          <Chip label="Spécifique" size="small" color="success" />
                        ) : (
                          <Chip label="Commun" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Import terminé avec succès !
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {importedUsers.filter(u => u.status === 'success').length} utilisateur(s) créé(s)
            </Typography>
            {importedUsers.filter(u => u.status === 'error').length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {importedUsers.filter(u => u.status === 'error').length} utilisateur(s) en erreur
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Import d'utilisateurs par CSV
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        {activeStep < 2 && (
          <Button onClick={handleClose}>
            Annuler
          </Button>
        )}
        {activeStep === 0 && csvFile && importedUsers.length > 0 && (
          <Button
            variant="contained"
            onClick={() => setActiveStep(1)}
          >
            Suivant
          </Button>
        )}
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>
              Retour
            </Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={importing || !commonPassword}
              startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {importing ? 'Import en cours...' : `Importer ${importedUsers.length} utilisateur(s)`}
            </Button>
          </>
        )}
        {activeStep === 2 && (
          <Button variant="contained" onClick={handleClose}>
            Fermer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
