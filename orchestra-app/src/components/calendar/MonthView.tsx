import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Collapse,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { format, isSameDay, isToday } from 'date-fns';
import { User, Department, Project, Holiday, SchoolHoliday } from '../../types';
import { Service } from '../../types/service';
import { holidayService } from '../../services/holiday.service';
import { schoolHolidaysService } from '../../services/schoolHolidays.service';

// Types pour les workload days
interface CalendarItem {
  id: string;
  title: string;
  type: 'task' | 'meeting' | 'admin' | 'training' | 'leave' | 'remote' | 'simple_task';
  startTime: Date;
  endTime: Date;
  userId: string;
  projectId?: string;
  project?: Project;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  assignee?: User;
  color: string;
  isRemote: boolean;
  canMove: boolean;
  canResize: boolean;
  originalTaskId?: string;
  isSpanning?: boolean;
  spanDay?: number;
  totalSpanDays?: number;
  // Congés - demi-journées
  halfDayType?: 'morning' | 'afternoon' | 'full';
  description?: string;
}

interface UserWorkloadDay {
  userId: string;
  user: User;
  date: Date;
  items: CalendarItem[];
}

interface MonthViewProps {
  monthDays: Date[];
  workloadDaysByService: Map<string, UserWorkloadDay[]>;
  departments: Department[];
  services: Service[];
  expandedServices: Set<string>;
  onToggleService: (serviceId: string) => void;
  onItemClick: (item: CalendarItem) => void;
  getUserDisplayName: (user: User) => string;
  teleworkSystem: any;
  viewFilter: 'all' | 'availability' | 'activity';
}

export const MonthView: React.FC<MonthViewProps> = ({
  monthDays,
  workloadDaysByService,
  departments,
  services,
  expandedServices,
  onToggleService,
  onItemClick,
  getUserDisplayName,
  teleworkSystem,
  viewFilter,
}) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [schoolHolidays, setSchoolHolidays] = useState<SchoolHoliday[]>([]);

  // CORRECTION FONDAMENTALE: Agréger tous les items par userId pour la vue mois
  // workloadDaysByService contient UserWorkloadDay[] où chaque élément = 1 jour
  // Pour la vue mois, on doit combiner tous les jours d'un même utilisateur
  const usersByService = React.useMemo(() => {
    const result = new Map<string, Array<{ user: any; items: CalendarItem[] }>>();

    workloadDaysByService.forEach((workloadDays, serviceId) => {
      // Grouper par userId pour agréger tous les items du mois
      const userItemsMap = new Map<string, { user: any; items: CalendarItem[] }>();

      workloadDays.forEach((workloadDay) => {
        if (!userItemsMap.has(workloadDay.userId)) {
          userItemsMap.set(workloadDay.userId, {
            user: workloadDay.user,
            items: []
          });
        }
        // Ajouter tous les items de ce jour
        userItemsMap.get(workloadDay.userId)!.items.push(...workloadDay.items);
      });

      result.set(serviceId, Array.from(userItemsMap.values()));
    });

    return result;
  }, [workloadDaysByService]);

  // Charger les jours fériés pour le mois affiché
  useEffect(() => {
    const loadHolidays = async () => {
      if (monthDays.length > 0) {
        const startDate = monthDays[0];
        const endDate = monthDays[monthDays.length - 1];
        try {
          const fetchedHolidays = await holidayService.getHolidaysByPeriod(startDate, endDate);
          setHolidays(fetchedHolidays);
        } catch (error) {
          console.error('Error loading holidays:', error);
          setHolidays([]);
        }
      }
    };
    loadHolidays();
  }, [monthDays]);

  // Charger les congés scolaires pour le mois affiché
  useEffect(() => {
    const loadSchoolHolidays = async () => {
      if (monthDays.length > 0) {
        const startDate = monthDays[0];
        const endDate = monthDays[monthDays.length - 1];
        try {
          const fetchedSchoolHolidays = await schoolHolidaysService.getSchoolHolidaysByPeriod(startDate, endDate);
          setSchoolHolidays(fetchedSchoolHolidays);
        } catch (error) {
          console.error('Error loading school holidays:', error);
          setSchoolHolidays([]);
        }
      }
    };
    loadSchoolHolidays();
  }, [monthDays]);

  // Helper pour vérifier si un jour est férié
  const isHoliday = (day: Date): boolean => {
    return holidays.some(holiday => isSameDay(new Date(holiday.date), day));
  };

  // Helper pour vérifier si un jour est dans une période de congés scolaires
  const getSchoolHolidayForDay = (day: Date): SchoolHoliday | null => {
    const holiday = schoolHolidays.find(holiday => {
      const dayTime = day.getTime();
      const startTime = new Date(holiday.startDate).setHours(0, 0, 0, 0);
      const endTime = new Date(holiday.endDate).setHours(23, 59, 59, 999);
      return dayTime >= startTime && dayTime <= endTime;
    }) || null;

    return holiday;
  };

  return (
    <Box sx={{ overflowX: 'auto', width: '100%' }}>
      <Box sx={{ minWidth: 220 + 44 * monthDays.length }}>
        {/* En-tête avec dates et congés scolaires */}
        <Box sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 100 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Espace pour les noms d'utilisateurs */}
            <Box sx={{ width: 220, minWidth: 220, maxWidth: 220, flexShrink: 0, mr: 1 }} />

            {/* Dates et bandeaux - EXACTEMENT comme les lignes utilisateurs */}
            <Box sx={{ flex: 1, minWidth: 0, position: 'relative', height: 60 }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                {monthDays.map((day, dayIndex) => {
                  const dayOfWeek = day.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const dayIsHoliday = isHoliday(day);
                  const isTodayDay = isToday(day);
                  const schoolHoliday = getSchoolHolidayForDay(day);

                  const totalDays = monthDays.length;
                  const dayWidthPercent = (1 / totalDays) * 100;
                  const dayLeftPercent = (dayIndex / totalDays) * 100;

                  return (
                    <Box
                      key={day.toISOString()}
                      sx={{
                        position: 'absolute',
                        left: `${dayLeftPercent}%`,
                        width: `${dayWidthPercent}%`,
                        top: 0,
                        bottom: 0,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isTodayDay ? 'primary.light' : isWeekend || dayIsHoliday ? 'grey.100' : 'transparent',
                        textAlign: 'center',
                        borderRadius: isTodayDay ? 1 : 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                    {/* Numéro du jour */}
                    <Typography variant="body2" fontWeight="bold" color={isTodayDay ? 'primary.main' : isWeekend || dayIsHoliday ? 'text.secondary' : 'text.primary'}>
                      {format(day, 'd')}
                    </Typography>

                    {/* Nom du jour */}
                    <Typography variant="caption" display="block" color={isTodayDay ? 'primary.main' : isWeekend ? 'text.secondary' : 'text.secondary'} sx={{ fontSize: '0.65rem' }}>
                      {format(day, 'EEE')}
                    </Typography>

                    {/* Indicateur "Aujourd'hui" */}
                    {isTodayDay && (
                      <Typography variant="caption" display="block" color="primary.main" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>
                        Auj.
                      </Typography>
                    )}

                    {/* Bandeau congé scolaire */}
                    {schoolHoliday && (
                      <Tooltip title={`${schoolHoliday.name} (Zone ${schoolHoliday.zone})`} arrow placement="top">
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '12px',
                            bgcolor: '#FFA726',
                            cursor: 'help',
                            '&:hover': {
                              opacity: 0.8
                            }
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Corps - Planning groupé par service */}
        <Stack spacing={1}>
        {Array.from(usersByService.entries()).map(([serviceId, serviceUsers]) => {
          // Gestion spéciale pour "Encadrement"
          if (serviceId === 'encadrement') {
            const serviceName = 'Encadrement';
            const serviceColor = '#ff9800';
            const isExpanded = expandedServices.has(serviceId);
            const userCount = serviceUsers.length;

            return (
              <Box key={serviceId}>
                {/* En-tête du service Encadrement */}
                <Card
                  sx={{
                    mb: 0.5,
                    background: 'linear-gradient(90deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)',
                    border: '1px solid rgba(255,152,0,0.2)'
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => onToggleService(serviceId)}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: serviceColor
                        }}
                      />
                      <BusinessIcon sx={{ color: 'warning.main' }} />
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {serviceName}
                      </Typography>
                      <Chip
                        label={`${userCount} ressource${userCount > 1 ? 's' : ''}`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                      <Box sx={{ flex: 1 }} />
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Lignes utilisateurs */}
                <Collapse in={isExpanded}>
                  <Box sx={{ ml: 2, mb: 1 }}>
                    <Stack spacing={0.5}>
                      {serviceUsers.map(({ user, items }) => {
                        // Grouper les items par tâche multi-jours
                        const taskBars = new Map<string, CalendarItem[]>();
                        const singleDayItems = new Map<string, CalendarItem[]>();

                        // Filtrer les congés
                        const leavesMap = new Map<string, CalendarItem[]>();

                        items.forEach(item => {
                          // Séparer les congés
                          if (item.type === 'leave') {
                            const dayKey = format(item.startTime, 'yyyy-MM-dd');
                            if (!leavesMap.has(dayKey)) {
                              leavesMap.set(dayKey, []);
                            }
                            leavesMap.get(dayKey)!.push(item);
                          } else if (item.originalTaskId && item.isSpanning) {
                            if (!taskBars.has(item.originalTaskId)) {
                              taskBars.set(item.originalTaskId, []);
                            }
                            taskBars.get(item.originalTaskId)!.push(item);
                          } else {
                            const dayKey = format(item.startTime, 'yyyy-MM-dd');
                            if (!singleDayItems.has(dayKey)) {
                              singleDayItems.set(dayKey, []);
                            }
                            singleDayItems.get(dayKey)!.push(item);
                          }
                        });

                        // Calculer le nombre max de barres empilées
                        const maxSingleDayBars = Math.max(...Array.from(singleDayItems.values()).map(items => items.length), 0);
                        const totalBars = taskBars.size + maxSingleDayBars;
                        // En mode "Disponibilités", réduire la hauteur à 48px minimum pour focus sur congés/télétravail (réduction de 20%)
                        const timelineHeight = viewFilter === 'availability'
                          ? 48
                          : Math.max(48, totalBars * 22 + 16);

                        return (
                          <Box key={user.id} sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                {/* Colonne utilisateur (220px fixe) */}
                                <Box sx={{ width: 220, minWidth: 220, maxWidth: 220, flexShrink: 0, mr: 1 }}>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Avatar
                                      src={user.avatarUrl}
                                      sx={{ width: 32, height: 32 }}
                                    >
                                      {user.firstName?.[0]}{user.lastName?.[0]}
                                    </Avatar>
                                    <Box flexGrow={1} minWidth={0}>
                                      <Typography variant="body2" fontWeight="bold" noWrap>
                                        {getUserDisplayName(user)}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>

                                {/* Zone timeline */}
                                <Box sx={{ flex: 1, minWidth: 0, position: 'relative', height: timelineHeight }}>
                                  {/* Grille de fond avec indicateurs télétravail */}
                                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                    {monthDays.map((day, dayIndex) => {
                                      const dayOfWeek = day.getDay();
                                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                      const teleworkResolution = teleworkSystem.getResolutionForDay(user.id, day);
                                      const isRemoteDay = teleworkResolution?.resolvedMode === 'remote';

                                      const dayIsHoliday = isHoliday(day);
                                      const isWeekendOrHoliday = isWeekend || dayIsHoliday;

                                      const totalDays = monthDays.length;
                                      const dayWidthPercent = (1 / totalDays) * 100;
                                      const dayLeftPercent = (dayIndex / totalDays) * 100;

                                      return (
                                        <Box
                                          key={day.toISOString()}
                                          sx={{
                                            position: 'absolute',
                                            left: `${dayLeftPercent}%`,
                                            width: `${dayWidthPercent}%`,
                                            top: 0,
                                            bottom: 0,
                                            borderRight: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: isWeekendOrHoliday ? 'grey.200' : 'transparent',
                                            zIndex: 0,
                                            ...(isRemoteDay && {
                                              border: '3px solid #ff9800',
                                              borderRadius: 1,
                                              boxSizing: 'border-box',
                                              bgcolor: 'rgba(255, 152, 0, 0.15)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center'
                                            })
                                          }}
                                        >
                                          {isRemoteDay && (
                                            <Typography
                                              sx={{
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                color: '#ff9800',
                                                opacity: 0.8,
                                                userSelect: 'none',
                                                pointerEvents: 'none'
                                              }}
                                            >
                                              TLT
                                            </Typography>
                                          )}
                                        </Box>
                                      );
                                    })}
                                  </Box>

                                  {/* Bandeaux verts pour les congés */}
                                  {Array.from(leavesMap.entries()).map(([dayKey, leaves]) => {
                                    const dayIndex = monthDays.findIndex(d =>
                                      format(d, 'yyyy-MM-dd') === dayKey
                                    );

                                    if (dayIndex === -1) return null;

                                    const totalDays = monthDays.length;
                                    const baseDayWidthPercent = (1 / totalDays) * 100;
                                    const baseDayLeftPercent = (dayIndex / totalDays) * 100;

                                    return leaves.map((leave, idx) => {
                                      // Calculer position et largeur selon halfDayType
                                      const isHalfDay = leave.halfDayType && leave.halfDayType !== 'full';
                                      const widthMultiplier = isHalfDay ? 0.5 : 1;
                                      const leftOffset = leave.halfDayType === 'afternoon' ? baseDayWidthPercent * 0.5 : 0;

                                      // Gradient de couleur selon type de demi-journée
                                      const getBgColor = () => {
                                        if (leave.halfDayType === 'morning') {
                                          return 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)';
                                        } else if (leave.halfDayType === 'afternoon') {
                                          return 'linear-gradient(90deg, #81c784 0%, #4caf50 100%)';
                                        }
                                        return '#4caf50';
                                      };

                                      // Icône selon type de demi-journée
                                      const getIcon = () => {
                                        if (leave.halfDayType === 'morning') return '🌅';
                                        if (leave.halfDayType === 'afternoon') return '🌆';
                                        return '🌞';
                                      };

                                      // Tooltip descriptif
                                      const getTooltipContent = () => {
                                        const dayTypeText =
                                          leave.halfDayType === 'morning' ? 'Matin uniquement' :
                                          leave.halfDayType === 'afternoon' ? 'Après-midi uniquement' :
                                          'Journée complète';

                                        return (
                                          <Box>
                                            <Typography variant="caption" fontWeight="bold" display="block">
                                              {leave.title}
                                            </Typography>
                                            <Typography variant="caption" display="block">
                                              {getIcon()} {dayTypeText}
                                            </Typography>
                                            {leave.description && (
                                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                                {leave.description}
                                              </Typography>
                                            )}
                                          </Box>
                                        );
                                      };

                                      return (
                                        <Tooltip
                                          key={`leave-banner-${dayKey}-${idx}`}
                                          title={getTooltipContent()}
                                          placement="top"
                                          arrow
                                        >
                                          <Box
                                            sx={{
                                              position: 'absolute',
                                              left: `calc(${baseDayLeftPercent}% + ${leftOffset}% + 2px)`,
                                              top: `${4 + idx * 24}px`,
                                              width: `calc(${baseDayWidthPercent * widthMultiplier}% - 4px)`,
                                              background: getBgColor(),
                                              color: 'white',
                                              borderRadius: 1,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              gap: 0.5,
                                              fontSize: '0.65rem',
                                              fontWeight: 'bold',
                                              py: 0.5,
                                              px: 0.5,
                                              zIndex: 8,
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              cursor: 'pointer',
                                              boxShadow: 1,
                                              '&:hover': {
                                                opacity: 0.9,
                                                boxShadow: 2,
                                              }
                                            }}
                                          >
                                            <span style={{ fontSize: '0.7rem' }}>{getIcon()}</span>
                                            <Typography noWrap fontSize="0.65rem" fontWeight="bold">
                                              {leave.title}
                                            </Typography>
                                          </Box>
                                        </Tooltip>
                                      );
                                    });
                                  })}

                                  {/* Barres continues pour tâches multi-jours */}
                                  {Array.from(taskBars.entries()).map(([taskId, items], barIndex) => {
                                    const firstItem = items[0];
                                    const lastItem = items[items.length - 1];
                                    const startDayIndex = monthDays.findIndex(d =>
                                      isSameDay(d, firstItem.startTime)
                                    );
                                    const endDayIndex = monthDays.findIndex(d =>
                                      isSameDay(d, lastItem.startTime)
                                    );

                                    if (startDayIndex === -1 || endDayIndex === -1) return null;

                                    const totalDays = monthDays.length;
                                    const spanDays = endDayIndex - startDayIndex + 1;
                                    const widthPercent = (spanDays / totalDays) * 100;
                                    const leftPercent = (startDayIndex / totalDays) * 100;

                                    return (
                                      <Box
                                        key={taskId}
                                        sx={{
                                          position: 'absolute',
                                          left: `calc(${leftPercent}% + 2px)`,
                                          top: `${barIndex * 22 + 8}px`,
                                          width: `calc(${widthPercent}% - 4px)`,
                                          height: 18,
                                          bgcolor: firstItem.color,
                                          borderRadius: 1,
                                          border: '1px solid rgba(0,0,0,0.1)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          px: 0.5,
                                          fontSize: '0.7rem',
                                          color: 'white',
                                          fontWeight: 500,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          cursor: 'pointer',
                                          zIndex: 10,
                                          boxShadow: 1,
                                          '&:hover': {
                                            opacity: 0.9,
                                            zIndex: 20,
                                            boxShadow: 2
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onItemClick(firstItem);
                                        }}
                                        title={firstItem.title}
                                      >
                                        {firstItem.title}
                                      </Box>
                                    );
                                  })}

                                  {/* Barres pour tâches 1 jour */}
                                  {Array.from(singleDayItems.entries()).map(([dayKey, items]) => {
                                    const dayIndex = monthDays.findIndex(d =>
                                      format(d, 'yyyy-MM-dd') === dayKey
                                    );

                                    if (dayIndex === -1) return null;

                                    const barOffset = taskBars.size;
                                    const totalDays = monthDays.length;
                                    const widthPercent = (1 / totalDays) * 100;
                                    const leftPercent = (dayIndex / totalDays) * 100;

                                    return items.map((item, idx) => {
                                      const barTop = (barOffset + idx) * 22 + 8;

                                      return (
                                        <Box
                                          key={item.id}
                                          sx={{
                                            position: 'absolute',
                                            left: `calc(${leftPercent}% + 2px)`,
                                            top: `${barTop}px`,
                                            width: `calc(${widthPercent}% - 4px)`,
                                            height: 18,
                                            bgcolor: item.color,
                                            borderRadius: 1,
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            px: 0.5,
                                            fontSize: '0.7rem',
                                            color: 'white',
                                            fontWeight: 500,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            cursor: 'pointer',
                                            zIndex: 10,
                                            boxShadow: 1,
                                            '&:hover': {
                                              opacity: 0.9,
                                              zIndex: 20,
                                              boxShadow: 2
                                            }
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onItemClick(item);
                                          }}
                                          title={item.title}
                                        >
                                          {item.title}
                                        </Box>
                                      );
                                    });
                                  })}

                                  {/* Overlays verts pour masquer les tâches lors des congés */}
                                  {Array.from(leavesMap.entries()).map(([dayKey, leaves]) => {
                                    const dayIndex = monthDays.findIndex(d =>
                                      format(d, 'yyyy-MM-dd') === dayKey
                                    );

                                    if (dayIndex === -1) return null;

                                    const totalDays = monthDays.length;
                                    const baseDayWidthPercent = (1 / totalDays) * 100;
                                    const baseDayLeftPercent = (dayIndex / totalDays) * 100;

                                    return leaves.map((leave, idx) => {
                                      const isHalfDay = leave.halfDayType && leave.halfDayType !== 'full';
                                      const widthMultiplier = isHalfDay ? 0.5 : 1;
                                      const leftOffset = leave.halfDayType === 'afternoon' ? baseDayWidthPercent * 0.5 : 0;

                                      return (
                                        <Box
                                          key={`leave-overlay-${dayKey}-${idx}`}
                                          sx={{
                                            position: 'absolute',
                                            left: `calc(${baseDayLeftPercent}% + ${leftOffset}% + 2px)`,
                                            top: 0,
                                            width: `calc(${baseDayWidthPercent * widthMultiplier}% - 4px)`,
                                            height: '100%',
                                            bgcolor: 'rgba(76, 175, 80, 0.7)',
                                            zIndex: 15,
                                            pointerEvents: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 1
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              color: 'white',
                                              fontWeight: 'bold',
                                              fontSize: '0.75rem',
                                              textAlign: 'center',
                                              transform: 'rotate(-45deg)'
                                            }}
                                          >
                                            Absent
                                          </Typography>
                                        </Box>
                                      );
                                    });
                                  })}
                                </Box>
                              </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Collapse>
              </Box>
            );
          }

          // Services normaux
          const service = services.find(s => s.id === serviceId);
          if (!service) return null;

          const isExpanded = expandedServices.has(serviceId);
          const userCount = serviceUsers.length;

          const serviceColor = service.color || '#1976d2';
          // Convertir la couleur hex en RGB pour le gradient
          const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : { r: 25, g: 118, b: 210 }; // Couleur par défaut
          };
          const rgb = hexToRgb(serviceColor);

          return (
            <Box key={serviceId}>
              {/* En-tête du service */}
              <Card
                sx={{
                  mb: 0.5,
                  background: `linear-gradient(90deg, rgba(${rgb.r},${rgb.g},${rgb.b},0.1) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},0.05) 100%)`,
                  border: `1px solid rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => onToggleService(serviceId)}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: serviceColor
                      }}
                    />
                    <BusinessIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">
                      {service.name}
                    </Typography>
                    <Chip
                      label={`${userCount} ressource${userCount > 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Box sx={{ flex: 1 }} />
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Stack>
                </CardContent>
              </Card>

              {/* Lignes utilisateurs */}
              <Collapse in={isExpanded}>
                <Box sx={{ ml: 2, mb: 1 }}>
                  <Stack spacing={0.5}>
                    {serviceUsers.map(({ user, items }) => {
                      // Grouper les items par tâche multi-jours
                      const taskBars = new Map<string, CalendarItem[]>();
                      const singleDayItems = new Map<string, CalendarItem[]>();

                      // Filtrer les congés
                      const leavesMap = new Map<string, CalendarItem[]>();

                      items.forEach(item => {
                        // Séparer les congés
                        if (item.type === 'leave') {
                          const dayKey = format(item.startTime, 'yyyy-MM-dd');
                          if (!leavesMap.has(dayKey)) {
                            leavesMap.set(dayKey, []);
                          }
                          leavesMap.get(dayKey)!.push(item);
                        } else if (item.originalTaskId && item.isSpanning) {
                          if (!taskBars.has(item.originalTaskId)) {
                            taskBars.set(item.originalTaskId, []);
                          }
                          taskBars.get(item.originalTaskId)!.push(item);
                        } else {
                          const dayKey = format(item.startTime, 'yyyy-MM-dd');
                          if (!singleDayItems.has(dayKey)) {
                            singleDayItems.set(dayKey, []);
                          }
                          singleDayItems.get(dayKey)!.push(item);
                        }
                      });

                      // Calculer le nombre max de barres empilées
                      const maxSingleDayBars = Math.max(...Array.from(singleDayItems.values()).map(items => items.length), 0);
                      const totalBars = taskBars.size + maxSingleDayBars;
                      // En mode "Disponibilités", réduire la hauteur à 48px minimum pour focus sur congés/télétravail (réduction de 20%)
                      const timelineHeight = viewFilter === 'availability'
                        ? 48
                        : Math.max(48, totalBars * 22 + 16);

                      return (
                        <Box key={user.id} sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                              {/* Colonne utilisateur (220px fixe) */}
                              <Box sx={{ width: 220, minWidth: 220, maxWidth: 220, flexShrink: 0, mr: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Avatar
                                    src={user.avatarUrl}
                                    sx={{ width: 32, height: 32 }}
                                  >
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </Avatar>
                                  <Box flexGrow={1} minWidth={0}>
                                    <Typography variant="body2" fontWeight="bold" noWrap>
                                      {getUserDisplayName(user)}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>

                              {/* Zone timeline */}
                              <Box sx={{ flex: 1, minWidth: 0, position: 'relative', height: timelineHeight }}>
                                {/* Grille de fond avec indicateurs télétravail */}
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                  {monthDays.map((day, dayIndex) => {
                                    const dayOfWeek = day.getDay();
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                    const teleworkResolution = teleworkSystem.getResolutionForDay(user.id, day);
                                    const isRemoteDay = teleworkResolution?.resolvedMode === 'remote';
                                    const dayIsHoliday = isHoliday(day);
                                    const isWeekendOrHoliday = isWeekend || dayIsHoliday;

                                    const totalDays = monthDays.length;
                                    const dayWidthPercent = (1 / totalDays) * 100;
                                    const dayLeftPercent = (dayIndex / totalDays) * 100;

                                    return (
                                      <Box
                                        key={day.toISOString()}
                                        sx={{
                                          position: 'absolute',
                                          left: `${dayLeftPercent}%`,
                                          width: `${dayWidthPercent}%`,
                                          top: 0,
                                          bottom: 0,
                                          borderRight: '1px solid',
                                          borderColor: 'divider',
                                          bgcolor: isWeekendOrHoliday ? 'grey.200' : 'transparent',
                                          zIndex: 0,
                                          ...(isRemoteDay && {
                                            border: '3px solid #ff9800',
                                            borderRadius: 1,
                                            boxSizing: 'border-box',
                                            bgcolor: 'rgba(255, 152, 0, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          })
                                        }}
                                      >
                                        {isRemoteDay && (
                                          <Typography
                                            sx={{
                                              fontSize: '10px',
                                              fontWeight: 'bold',
                                              color: '#ff9800',
                                              opacity: 0.8,
                                              userSelect: 'none',
                                              pointerEvents: 'none'
                                            }}
                                          >
                                            TLT
                                          </Typography>
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Box>

                                {/* Bandeaux verts pour les congés */}
                                {Array.from(leavesMap.entries()).map(([dayKey, leaves]) => {
                                  const dayIndex = monthDays.findIndex(d =>
                                    format(d, 'yyyy-MM-dd') === dayKey
                                  );

                                  if (dayIndex === -1) return null;

                                  const totalDays = monthDays.length;
                                  const baseDayWidthPercent = (1 / totalDays) * 100;
                                  const baseDayLeftPercent = (dayIndex / totalDays) * 100;

                                  return leaves.map((leave, idx) => {
                                    // Calculer position et largeur selon halfDayType
                                    const isHalfDay = leave.halfDayType && leave.halfDayType !== 'full';
                                    const widthMultiplier = isHalfDay ? 0.5 : 1;
                                    const leftOffset = leave.halfDayType === 'afternoon' ? baseDayWidthPercent * 0.5 : 0;

                                    // Gradient de couleur selon type de demi-journée
                                    const getBgColor = () => {
                                      if (leave.halfDayType === 'morning') {
                                        return 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)';
                                      } else if (leave.halfDayType === 'afternoon') {
                                        return 'linear-gradient(90deg, #81c784 0%, #4caf50 100%)';
                                      }
                                      return '#4caf50';
                                    };

                                    // Icône selon type de demi-journée
                                    const getIcon = () => {
                                      if (leave.halfDayType === 'morning') return '🌅';
                                      if (leave.halfDayType === 'afternoon') return '🌆';
                                      return '🌞';
                                    };

                                    // Tooltip descriptif
                                    const getTooltipContent = () => {
                                      const dayTypeText =
                                        leave.halfDayType === 'morning' ? 'Matin uniquement' :
                                        leave.halfDayType === 'afternoon' ? 'Après-midi uniquement' :
                                        'Journée complète';

                                      return (
                                        <Box>
                                          <Typography variant="caption" fontWeight="bold" display="block">
                                            {leave.title}
                                          </Typography>
                                          <Typography variant="caption" display="block">
                                            {getIcon()} {dayTypeText}
                                          </Typography>
                                          {leave.description && (
                                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                              {leave.description}
                                            </Typography>
                                          )}
                                        </Box>
                                      );
                                    };

                                    return (
                                      <Tooltip
                                        key={`leave-banner-${dayKey}-${idx}`}
                                        title={getTooltipContent()}
                                        placement="top"
                                        arrow
                                      >
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            left: `calc(${baseDayLeftPercent}% + ${leftOffset}% + 2px)`,
                                            top: `${4 + idx * 24}px`,
                                            width: `calc(${baseDayWidthPercent * widthMultiplier}% - 4px)`,
                                            background: getBgColor(),
                                            color: 'white',
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 0.5,
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            py: 0.5,
                                            px: 0.5,
                                            zIndex: 8,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            cursor: 'pointer',
                                            boxShadow: 1,
                                            '&:hover': {
                                              opacity: 0.9,
                                              boxShadow: 2,
                                            }
                                          }}
                                        >
                                          <span style={{ fontSize: '0.7rem' }}>{getIcon()}</span>
                                          <Typography noWrap fontSize="0.65rem" fontWeight="bold">
                                            {leave.title}
                                          </Typography>
                                        </Box>
                                      </Tooltip>
                                    );
                                  });
                                })}

                                {/* Barres continues pour tâches multi-jours */}
                                {Array.from(taskBars.entries()).map(([taskId, items], barIndex) => {
                                  const firstItem = items[0];
                                  const lastItem = items[items.length - 1];
                                  const startDayIndex = monthDays.findIndex(d =>
                                    isSameDay(d, firstItem.startTime)
                                  );
                                  const endDayIndex = monthDays.findIndex(d =>
                                    isSameDay(d, lastItem.startTime)
                                  );

                                  if (startDayIndex === -1 || endDayIndex === -1) return null;

                                  const totalDays = monthDays.length;
                                  const spanDays = endDayIndex - startDayIndex + 1;
                                  const widthPercent = (spanDays / totalDays) * 100;
                                  const leftPercent = (startDayIndex / totalDays) * 100;

                                  return (
                                    <Box
                                      key={taskId}
                                      sx={{
                                        position: 'absolute',
                                        left: `calc(${leftPercent}% + 2px)`,
                                        top: `${barIndex * 22 + 8}px`,
                                        width: `calc(${widthPercent}% - 4px)`,
                                        height: 18,
                                        bgcolor: firstItem.color,
                                        borderRadius: 1,
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 0.5,
                                        fontSize: '0.7rem',
                                        color: 'white',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        cursor: 'pointer',
                                        zIndex: 10,
                                        boxShadow: 1,
                                        '&:hover': {
                                          opacity: 0.9,
                                          zIndex: 20,
                                          boxShadow: 2
                                        }
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onItemClick(firstItem);
                                      }}
                                      title={firstItem.title}
                                    >
                                      {firstItem.title}
                                    </Box>
                                  );
                                })}

                                {/* Barres pour tâches 1 jour */}
                                {Array.from(singleDayItems.entries()).map(([dayKey, items]) => {
                                  const dayIndex = monthDays.findIndex(d =>
                                    format(d, 'yyyy-MM-dd') === dayKey
                                  );

                                  if (dayIndex === -1) return null;

                                  const barOffset = taskBars.size;
                                  const totalDays = monthDays.length;
                                  const widthPercent = (1 / totalDays) * 100;
                                  const leftPercent = (dayIndex / totalDays) * 100;

                                  return items.map((item, idx) => {
                                    const barTop = (barOffset + idx) * 22 + 8;

                                    return (
                                      <Box
                                        key={item.id}
                                        sx={{
                                          position: 'absolute',
                                          left: `calc(${leftPercent}% + 2px)`,
                                          top: `${barTop}px`,
                                          width: `calc(${widthPercent}% - 4px)`,
                                          height: 18,
                                          bgcolor: item.color,
                                          borderRadius: 1,
                                          border: '1px solid rgba(0,0,0,0.1)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          px: 0.5,
                                          fontSize: '0.7rem',
                                          color: 'white',
                                          fontWeight: 500,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          cursor: 'pointer',
                                          zIndex: 10,
                                          boxShadow: 1,
                                          '&:hover': {
                                            opacity: 0.9,
                                            zIndex: 20,
                                            boxShadow: 2
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onItemClick(item);
                                        }}
                                        title={item.title}
                                      >
                                        {item.title}
                                      </Box>
                                    );
                                  });
                                })}

                                {/* Overlays verts pour masquer les tâches lors des congés */}
                                {Array.from(leavesMap.entries()).map(([dayKey, leaves]) => {
                                  const dayIndex = monthDays.findIndex(d =>
                                    format(d, 'yyyy-MM-dd') === dayKey
                                  );

                                  if (dayIndex === -1) return null;

                                  const totalDays = monthDays.length;
                                  const baseDayWidthPercent = (1 / totalDays) * 100;
                                  const baseDayLeftPercent = (dayIndex / totalDays) * 100;

                                  return leaves.map((leave, idx) => {
                                    const isHalfDay = leave.halfDayType && leave.halfDayType !== 'full';
                                    const widthMultiplier = isHalfDay ? 0.5 : 1;
                                    const leftOffset = leave.halfDayType === 'afternoon' ? baseDayWidthPercent * 0.5 : 0;

                                    return (
                                      <Box
                                        key={`leave-overlay-${dayKey}-${idx}`}
                                        sx={{
                                          position: 'absolute',
                                          left: `calc(${baseDayLeftPercent}% + ${leftOffset}% + 2px)`,
                                          top: 0,
                                          width: `calc(${baseDayWidthPercent * widthMultiplier}% - 4px)`,
                                          height: '100%',
                                          bgcolor: 'rgba(76, 175, 80, 0.7)',
                                          zIndex: 15,
                                          pointerEvents: 'none',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: 1
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem',
                                            textAlign: 'center',
                                            transform: 'rotate(-45deg)'
                                          }}
                                        >
                                          Absent
                                        </Typography>
                                      </Box>
                                    );
                                  });
                                })}
                              </Box>
                            </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          );
        })}
        </Stack>
      </Box>
    </Box>
  );
};
