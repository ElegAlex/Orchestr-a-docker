import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Stack,
  Button,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  BeachAccess as BeachAccessIcon,
  Business as BusinessIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

export const Tutorial: React.FC = () => {
  const [expandedPanel, setExpandedPanel] = useState<string | false>('panel1');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* En-tête */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <SchoolIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Guide d'utilisation Orchestr'A
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Tout ce que vous devez savoir pour utiliser efficacement la plateforme
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Aperçu rapide */}
        <Box mb={4}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Aperçu rapide
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1}>
                    <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Mon Espace
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tableau de bord personnalisé avec vos tâches, congés et projets en un coup d'œil
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1}>
                    <FolderIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Gestion de projets
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Créez et suivez vos projets avec des tâches RACI et des jalons
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1}>
                    <CalendarIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Calendrier unifié
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visualisez congés, télétravail et disponibilités de l'équipe
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Box>

        {/* Sections détaillées */}
        <Typography variant="h5" fontWeight="bold" gutterBottom mb={2}>
          Guide détaillé
        </Typography>

        {/* 1. Mon Espace */}
        <Accordion expanded={expandedPanel === 'panel1'} onChange={handleChange('panel1')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} alignItems="center">
              <DashboardIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Mon Espace (Dashboard Hub)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Votre tableau de bord personnalisé
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body1">
                Le Dashboard Hub est votre point d'entrée principal. Il vous donne une vue d'ensemble de votre activité :
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Mes tâches en cours"
                    secondary="Visualisez toutes vos tâches assignées et leur priorité"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Mes projets"
                    secondary="Suivi de vos projets actifs avec indicateurs de progression"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Mes congés"
                    secondary="Solde de congés, RTT et demandes en cours"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Bouton Présences"
                    secondary="Consultez qui est sur site, en télétravail ou absent"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Tâches simples"
                    secondary="Créez rapidement des tâches personnelles ou d'équipe"
                  />
                </ListItem>
              </List>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* 2. Projets */}
        <Accordion expanded={expandedPanel === 'panel2'} onChange={handleChange('panel2')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} alignItems="center">
              <FolderIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Gestion des Projets
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Créer, suivre et gérer vos projets
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body1">
                <strong>Créer un projet :</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Cliquez sur 'Nouveau Projet' dans l'onglet Projets" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Renseignez nom, description, dates et budget" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Ajoutez des membres à l'équipe projet" />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1">
                <strong>Tâches avec modèle RACI :</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
                  <ListItemText
                    primary="R - Responsible (Réalisateur)"
                    secondary="Qui fait le travail"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
                  <ListItemText
                    primary="A - Accountable (Approbateur)"
                    secondary="Qui valide le résultat"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
                  <ListItemText
                    primary="C - Consulted (Consulté)"
                    secondary="Qui donne son avis"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
                  <ListItemText
                    primary="I - Informed (Informé)"
                    secondary="Qui est tenu au courant"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1">
                <strong>Jalons (Milestones) :</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Les jalons marquent les étapes importantes du projet. Utilisez-les pour suivre l'avancement global.
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* 3. Calendrier */}
        <Accordion expanded={expandedPanel === 'panel3'} onChange={handleChange('panel3')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CalendarIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Calendrier
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gérez congés, télétravail et planification
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body1">
                Le calendrier vous permet de :
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><BeachAccessIcon color="info" /></ListItemIcon>
                  <ListItemText
                    primary="Visualiser les congés de l'équipe"
                    secondary="Voir qui est absent et planifier en conséquence"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BusinessIcon color="info" /></ListItemIcon>
                  <ListItemText
                    primary="Déclarer votre télétravail"
                    secondary="Indiquez vos jours de télétravail pour informer l'équipe"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Consulter les jours fériés"
                    secondary="Les jours fériés et vacances scolaires sont affichés automatiquement"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Filtrage par département"
                    secondary="Les utilisateurs standard voient uniquement leur département"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                <Typography variant="subtitle2" color="info.main" gutterBottom>
                  <HelpIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Astuce Télétravail
                </Typography>
                <Typography variant="body2">
                  Vous pouvez déclarer plusieurs jours de télétravail en une seule fois avec la fonction de déclaration groupée.
                </Typography>
              </Paper>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* 4. Congés */}
        <Accordion expanded={expandedPanel === 'panel4'} onChange={handleChange('panel4')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} alignItems="center">
              <BeachAccessIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Gestion des Congés
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Demander et suivre vos congés
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body1">
                <strong>Demander un congé :</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Depuis Mon Espace ou votre Profil"
                    secondary="Onglet 'Congés' → Bouton 'Nouvelle demande'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Choisissez le type"
                    secondary="Congé payé, RTT, Congé exceptionnel, etc."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Sélectionnez les dates"
                    secondary="Dates de début et fin, avec calcul automatique des jours ouvrés"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Suivez l'état"
                    secondary="En attente → Approuvé → Validé par RH"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1">
                <strong>Votre solde de congés :</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consultez votre solde de congés payés, RTT et congés exceptionnels directement dans votre profil ou le dashboard.
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* 5. Paramètres */}
        <Accordion expanded={expandedPanel === 'panel5'} onChange={handleChange('panel5')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} alignItems="center">
              <SettingsIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Paramètres & Administration
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Configuration et gestion (selon vos droits)
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body1">
                Les paramètres disponibles dépendent de votre rôle :
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon><PeopleIcon color="info" /></ListItemIcon>
                  <ListItemText
                    primary="Gestion des utilisateurs"
                    secondary="Admins et responsables : créer, modifier, désactiver des comptes"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BusinessIcon color="info" /></ListItemIcon>
                  <ListItemText
                    primary="Départements et Services"
                    secondary="Organisation de l'entreprise par départements et services"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AssignmentIcon color="info" /></ListItemIcon>
                  <ListItemText
                    primary="Compétences"
                    secondary="Gérer le référentiel de compétences"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                  <HelpIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Note sur les départements
                </Typography>
                <Typography variant="body2">
                  Les utilisateurs standard ne voient que les données de leur département (présences, congés, etc.).
                  Les responsables voient tous les départements avec une vue segmentée.
                </Typography>
              </Paper>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Section aide supplémentaire */}
        <Box mt={4}>
          <Paper sx={{ p: 3, bgcolor: 'primary.50' }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                Besoin d'aide ?
              </Typography>
              <Typography variant="body2">
                Si vous rencontrez des difficultés ou avez des questions, n'hésitez pas à contacter :
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="Votre responsable de département"
                    secondary="Pour les questions opérationnelles"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="L'administrateur système"
                    secondary="Pour les problèmes techniques"
                  />
                </ListItem>
              </List>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Tutorial;
