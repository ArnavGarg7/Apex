// src/utils/f1Colors.js
export const COMPOUND_COLORS = {
  SOFT:         '#E8002D',
  MEDIUM:       '#FFF200',
  HARD:         '#F0F0F0',
  INTERMEDIATE: '#39B54A',
  INTER:        '#39B54A',
  WET:          '#0067FF',
  UNKNOWN:      '#555555',
};

export const COMPOUND_LABELS = {
  SOFT: 'S', MEDIUM: 'M', HARD: 'H',
  INTERMEDIATE: 'I', INTER: 'I', WET: 'W', UNKNOWN: '?',
};

export const TEAM_COLORS = {
  'Red Bull Racing': '#3671C6',
  'Red Bull':        '#3671C6',
  'Ferrari':         '#E8002D',
  'Mercedes':        '#27F4D2',
  'McLaren':         '#FF8000',
  'Aston Martin':    '#229971',
  'Alpine':          '#FF87BC',
  'Williams':        '#64C4FF',
  'Racing Bulls':    '#6692FF',
  'RB':              '#6692FF',
  'Kick Sauber':     '#52E252',
  'Sauber':          '#52E252',
  'Haas':            '#B6BABD',
  'Haas F1 Team':    '#B6BABD',
};

export const DRIVER_NUMBERS = {
  1:  { code: 'VER', name: 'Max Verstappen',      team: 'Red Bull Racing' },
  11: { code: 'PER', name: 'Sergio Perez',         team: 'Red Bull Racing' },
  16: { code: 'LEC', name: 'Charles Leclerc',      team: 'Ferrari'         },
  55: { code: 'SAI', name: 'Carlos Sainz',         team: 'Ferrari'         },
  44: { code: 'HAM', name: 'Lewis Hamilton',       team: 'Ferrari'         },
  63: { code: 'RUS', name: 'George Russell',       team: 'Mercedes'        },
  4:  { code: 'NOR', name: 'Lando Norris',         team: 'McLaren'         },
  81: { code: 'PIA', name: 'Oscar Piastri',        team: 'McLaren'         },
  14: { code: 'ALO', name: 'Fernando Alonso',      team: 'Aston Martin'    },
  18: { code: 'STR', name: 'Lance Stroll',         team: 'Aston Martin'    },
  10: { code: 'GAS', name: 'Pierre Gasly',         team: 'Alpine'          },
  31: { code: 'OCO', name: 'Esteban Ocon',         team: 'Alpine'          },
  23: { code: 'ALB', name: 'Alexander Albon',      team: 'Williams'        },
  2:  { code: 'SAR', name: 'Logan Sargeant',       team: 'Williams'        },
  22: { code: 'TSU', name: 'Yuki Tsunoda',         team: 'Racing Bulls'    },
  3:  { code: 'RIC', name: 'Daniel Ricciardo',     team: 'Racing Bulls'    },
  77: { code: 'BOT', name: 'Valtteri Bottas',      team: 'Kick Sauber'     },
  24: { code: 'ZHO', name: 'Guanyu Zhou',          team: 'Kick Sauber'     },
  20: { code: 'MAG', name: 'Kevin Magnussen',      team: 'Haas'            },
  27: { code: 'HUL', name: 'Nico Hulkenberg',      team: 'Haas'            },
};

export function getTeamColor(teamName) {
  return TEAM_COLORS[teamName] || '#555555';
}

export function getCompoundColor(compound) {
  return COMPOUND_COLORS[compound?.toUpperCase()] || COMPOUND_COLORS.UNKNOWN;
}

export function getCompoundLabel(compound) {
  return COMPOUND_LABELS[compound?.toUpperCase()] || '?';
}
