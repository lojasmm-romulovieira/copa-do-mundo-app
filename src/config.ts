export const SELECOES_INICIAIS = [
  'Brasil',
  'Argentina',
  'Espanha',
  'França',
  'Portugal',
];

export const ESTRUTURA_TORNEIO: Record<string, string[]> = {
  'Beach Tennis': [
    'Feminino C',
    'Masculino C',
    'Feminino D',
    'Masculino D',
    'Feminino E',
    'Masculino E',
    'Misto C',
    'Misto D',
    'Misto E',
  ],
  'Vôlei de Areia': [
    'Feminino',
    'Masculino',
    'Misto',
  ],
  'Futevôlei': [
    'Masculino E',
    'Masculino Inter',
    'Misto',
  ],
};

export const SPORTS = Object.keys(ESTRUTURA_TORNEIO);

export function getCategories(sport: string): string[] {
  return ESTRUTURA_TORNEIO[sport] ?? [];
}
