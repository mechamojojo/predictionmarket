/**
 * Sistema de categorias para mercados
 * Categorias são detectadas automaticamente baseado em palavras-chave na pergunta
 */

export type MarketCategory =
  | "política"
  | "esportes"
  | "tecnologia"
  | "cultura"
  | "economia"
  | "entretenimento"
  | "outros";

export interface CategoryConfig {
  label: string;
  keywords: string[];
  color: string;
  bgColor: string;
}

export const CATEGORIES: Record<MarketCategory, CategoryConfig> = {
  política: {
    label: "Política",
    keywords: [
      "presidente",
      "eleição",
      "eleições",
      "governo",
      "político",
      "política",
      "congresso",
      "senado",
      "deputado",
      "prefeito",
      "governador",
      "lula",
      "bolsonaro",
      "pt",
      "psdb",
      "partido",
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  esportes: {
    label: "Esportes",
    keywords: [
      "futebol",
      "brasileirão",
      "copa",
      "mundial",
      "flamengo",
      "palmeiras",
      "corinthians",
      "fluminense",
      "atlético",
      "vasco",
      "gremio",
      "internacional",
      "jogador",
      "técnico",
      "campeonato",
      "liga",
      "esporte",
      "basquete",
      "vôlei",
      "tênis",
      "time",
      "times",
      "gol",
      "gols",
      "marca",
      "marcar",
      "jogo",
      "jogos",
      "partida",
      "partidas",
    ],
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  tecnologia: {
    label: "Tecnologia",
    keywords: [
      "tecnologia",
      "tech",
      "ia",
      "inteligência artificial",
      "chatgpt",
      "openai",
      "google",
      "apple",
      "microsoft",
      "meta",
      "facebook",
      "twitter",
      "x",
      "iphone",
      "android",
      "app",
      "software",
      "hardware",
      "startup",
      "blockchain",
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
  },
  cultura: {
    label: "Cultura",
    keywords: [
      "filme",
      "cinema",
      "música",
      "artista",
      "cantor",
      "banda",
      "show",
      "festival",
      "livro",
      "literatura",
      "arte",
      "museu",
      "teatro",
      "cultura",
      "capital",
      "capitais",
      "máxima",
      "mínima",
      "temperatura",
      "clima",
      "tempo",
      "chuva",
      "sol",
    ],
    color: "text-pink-600",
    bgColor: "bg-pink-50 border-pink-200",
  },
  economia: {
    label: "Economia",
    keywords: [
      "economia",
      "dólar",
      "real",
      "inflação",
      "juros",
      "selic",
      "ibovespa",
      "ações",
      "mercado",
      "financeiro",
      "banco",
      "crédito",
      "investimento",
      "pib",
      "desemprego",
      "bitcoin",
      "crypto",
      "criptomoeda",
      "criptomoedas",
      "pix",
      "fecha",
      "fechar",
      "fechamento",
      "novembro",
      "dezembro",
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
    ],
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
  entretenimento: {
    label: "Entretenimento",
    keywords: [
      "celebridade",
      "famoso",
      "influencer",
      "youtuber",
      "streamer",
      "netflix",
      "amazon",
      "disney",
      "série",
      "novela",
      "reality",
      "bbb",
      "big brother",
      "entretenimento",
      "fofoca",
      "vídeo",
      "video",
      "videos",
      "vídeos",
      "views",
      "visualizações",
      "visualização",
      "milhões",
      "milhão",
      "20m",
      "10m",
      "5m",
      "bate",
      "atinge",
      "alcança",
    ],
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
  },
  outros: {
    label: "Outros",
    keywords: [],
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
  },
};

/**
 * Detecta a categoria de um mercado baseado na pergunta
 */
export function detectMarketCategory(question: string): MarketCategory {
  const lowerQuestion = question.toLowerCase();

  // Contar matches por categoria
  const categoryScores: Record<MarketCategory, number> = {
    política: 0,
    esportes: 0,
    tecnologia: 0,
    cultura: 0,
    economia: 0,
    entretenimento: 0,
    outros: 0,
  };

  // Calcular scores
  for (const [category, config] of Object.entries(CATEGORIES)) {
    if (category === "outros") continue;

    for (const keyword of config.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        categoryScores[category as MarketCategory]++;
      }
    }
  }

  // Encontrar categoria com maior score
  let maxScore = 0;
  let detectedCategory: MarketCategory = "outros";

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category as MarketCategory;
    }
  }

  return detectedCategory;
}

/**
 * Obtém a configuração de uma categoria
 */
export function getCategoryConfig(category: MarketCategory): CategoryConfig {
  return CATEGORIES[category];
}

