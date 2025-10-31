import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { settingsAPI } from '../../services/api/settings.api';

const WEEK_DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

export const CalendarConfigTab: React.FC = () => {
  const [visibleWeekDays, setVisibleWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await settingsAPI.getSettings();
      setVisibleWeekDays(settings.visibleWeekDays || [1, 2, 3, 4, 5]);
    } catch (err: any) {
      console.error('Erreur chargement settings:', err);
      setError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayValue: number) => {
    setVisibleWeekDays(prev => {
      if (prev.includes(dayValue)) {
        // Ne pas permettre de tout décocher
        if (prev.length === 1) {
          setError('Au moins un jour doit être visible');
          return prev;
        }
        return prev.filter(d => d !== dayValue);
      } else {
        return [...prev, dayValue].sort((a, b) => {
          // Tri personnalisé : lundi (1) en premier, dimanche (0) en dernier
          if (a === 0) return 1;
          if (b === 0) return -1;
          return a - b;
        });
      }
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await settingsAPI.updateSettings({
        visibleWeekDays,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erreur sauvegarde settings:', err);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Chargement...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration du Calendrier
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Sélectionnez les jours de la semaine à afficher dans la vue semaine du calendrier.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <FormGroup>
            {WEEK_DAYS.map(day => (
              <FormControlLabel
                key={day.value}
                control={
                  <Checkbox
                    checked={visibleWeekDays.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    disabled={saving}
                  />
                }
                label={day.label}
              />
            ))}
          </FormGroup>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Paramètres sauvegardés avec succès
            </Alert>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || visibleWeekDays.length === 0}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button
              variant="outlined"
              onClick={loadSettings}
              disabled={saving}
            >
              Annuler
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
