import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Checkbox,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { personalTodoService } from '../../services/personalTodo.service';
import type { PersonalTodo } from '../../services/api';

const MAX_TODOS = 15;

// Backend : 1=high, 2=medium, 3=low
const priorityColors: Record<number, string> = {
  1: '#f44336', // high = rouge
  2: '#ff9800', // medium = orange
  3: '#4caf50', // low = vert
};

export const PersonalTodoWidget: React.FC = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<PersonalTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoText, setNewTodoText] = useState('');
  const [adding, setAdding] = useState(false);

  // Charger les to-dos
  useEffect(() => {
    const loadTodos = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // ✅ REST API : getUserTodos() utilise le JWT, pas besoin de userId
        const userTodos = await personalTodoService.getUserTodos();
        setTodos(userTodos);

        // Cleanup automatique des anciennes to-dos complétées
        await personalTodoService.cleanupOldCompleted();
      } catch (error) {
        console.error('Erreur chargement to-dos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTodos();
  }, [user?.id]);

  // Ajouter une to-do
  const handleAddTodo = async () => {
    if (!user?.id || !newTodoText.trim()) return;
    if (todos.length >= MAX_TODOS) return;

    try {
      setAdding(true);
      // ✅ REST API : create() utilise le JWT, pas besoin de userId
      const newTodo = await personalTodoService.create({
        text: newTodoText.trim(),
      });
      setTodos([newTodo, ...todos]);
      setNewTodoText('');
    } catch (error) {
      console.error('Erreur ajout to-do:', error);
    } finally {
      setAdding(false);
    }
  };

  // Toggle completed
  const handleToggleCompleted = async (todo: PersonalTodo) => {
    try {
      // ✅ REST API : toggleCompleted() ne prend que l'id
      await personalTodoService.toggleCompleted(todo.id);
      setTodos(todos.map(t =>
        t.id === todo.id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : undefined }
          : t
      ));
    } catch (error) {
      console.error('Erreur toggle to-do:', error);
    }
  };

  // Supprimer une to-do
  const handleDelete = async (todoId: string) => {
    try {
      await personalTodoService.delete(todoId);
      setTodos(todos.filter(t => t.id !== todoId));
    } catch (error) {
      console.error('Erreur suppression to-do:', error);
    }
  };

  // Changer priorité (cycle: none -> high -> medium -> low -> none)
  const handleCyclePriority = async (todo: PersonalTodo) => {
    // Backend : 1=high, 2=medium, 3=low
    const priorities: (number | undefined)[] = [undefined, 1, 2, 3];
    const currentIndex = priorities.indexOf(todo.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];

    try {
      // ✅ REST API : updatePriority attend un number
      if (nextPriority !== undefined) {
        await personalTodoService.updatePriority(todo.id, nextPriority);
      } else {
        // Pour supprimer la priorité, utiliser update avec priority: undefined
        await personalTodoService.update(todo.id, { priority: undefined });
      }
      setTodos(todos.map(t =>
        t.id === todo.id ? { ...t, priority: nextPriority } : t
      ));
    } catch (error) {
      console.error('Erreur priorité to-do:', error);
    }
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ✅ Ma To-Do
          </Typography>
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={30} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* En-tête */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="600">
            ✅ Ma To-Do
          </Typography>
          <Chip
            label={`${activeTodos.length}/${todos.length}`}
            size="small"
            color={activeTodos.length > 0 ? 'primary' : 'success'}
            variant="outlined"
          />
        </Stack>

        {/* Input ajout rapide */}
        <Stack direction="row" spacing={1} mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ajouter une to-do..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTodo();
              }
            }}
            disabled={todos.length >= MAX_TODOS || adding}
          />
          <IconButton
            color="primary"
            onClick={handleAddTodo}
            disabled={!newTodoText.trim() || todos.length >= MAX_TODOS || adding}
          >
            <AddIcon />
          </IconButton>
        </Stack>

        {/* Limite atteinte */}
        {todos.length >= MAX_TODOS && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Limite de {MAX_TODOS} to-dos atteinte
          </Alert>
        )}

        {/* Liste des to-dos */}
        {todos.length === 0 ? (
          <Alert severity="info">
            Aucune to-do. Commencez par en ajouter une ci-dessus !
          </Alert>
        ) : (
          <Stack spacing={1} sx={{ flex: 1, overflow: 'auto' }}>
            {/* To-dos actives */}
            {activeTodos.map((todo) => (
              <Box
                key={todo.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <Checkbox
                  size="small"
                  checked={todo.completed}
                  onChange={() => handleToggleCompleted(todo)}
                />

                {/* Indicateur priorité */}
                <Tooltip title={
                  todo.priority === 1 ? 'Priorité haute' :
                  todo.priority === 2 ? 'Priorité moyenne' :
                  todo.priority === 3 ? 'Priorité basse' :
                  'Clic pour définir priorité'
                }>
                  <IconButton
                    size="small"
                    onClick={() => handleCyclePriority(todo)}
                    sx={{ p: 0.5 }}
                  >
                    <CircleIcon
                      sx={{
                        fontSize: 12,
                        color: todo.priority ? priorityColors[todo.priority] : 'transparent',
                        border: todo.priority ? 'none' : '1px solid #ccc',
                        borderRadius: '50%',
                      }}
                    />
                  </IconButton>
                </Tooltip>

                <Typography
                  variant="body2"
                  sx={{ flex: 1, wordBreak: 'break-word' }}
                >
                  {todo.text}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => handleDelete(todo.id)}
                  sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {/* To-dos complétées */}
            {completedTodos.map((todo) => (
              <Box
                key={todo.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  opacity: 0.6,
                  transition: 'all 0.2s',
                  '&:hover': {
                    opacity: 1,
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Checkbox
                  size="small"
                  checked={todo.completed}
                  onChange={() => handleToggleCompleted(todo)}
                />

                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                    wordBreak: 'break-word',
                  }}
                >
                  {todo.text}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => handleDelete(todo.id)}
                  sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}

        {/* Footer stats */}
        {todos.length > 0 && (
          <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
            <Typography variant="caption" color="text.secondary">
              {activeTodos.length} restante{activeTodos.length > 1 ? 's' : ''} · {completedTodos.length} complétée{completedTodos.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalTodoWidget;
