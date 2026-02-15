import { FoodItem } from './food.model.js'

// ====================================================
// SEED DE ALIMENTOS
// ====================================================
// Base nutricional com ~100 alimentos brasileiros comuns.
// Valores por 100g baseados na tabela TACO (UNICAMP).
//
// Fonte: TACO 4ª edição revisada e ampliada
// http://www.nepa.unicamp.br/taco/
//
// Cada alimento tem:
// - Macros por 100g (calorias, proteína, carboidratos, gordura)
// - Porções comuns (para UX: "1 xícara" = 158g)
//
// Categorias:
// grains, proteins, dairy, fruits, vegetables,
// legumes, fats, beverages, sweets, others

const foods = [
  // ============================================
  // GRAINS — Cereais, massas e pães
  // ============================================
  { name: 'Arroz branco cozido', category: 'grains', caloriesPer100g: 128, proteinPer100g: 2.5, carbsPer100g: 28.1, fatPer100g: 0.2, commonPortions: [{ name: '1 xícara', grams: 160 }, { name: '1 colher de servir', grams: 45 }] },
  { name: 'Arroz integral cozido', category: 'grains', caloriesPer100g: 124, proteinPer100g: 2.6, carbsPer100g: 25.8, fatPer100g: 1.0, commonPortions: [{ name: '1 xícara', grams: 160 }, { name: '1 colher de servir', grams: 45 }] },
  { name: 'Macarrão cozido', category: 'grains', caloriesPer100g: 102, proteinPer100g: 3.4, carbsPer100g: 19.9, fatPer100g: 0.5, commonPortions: [{ name: '1 prato raso', grams: 200 }, { name: '1 pegador', grams: 110 }] },
  { name: 'Macarrão integral cozido', category: 'grains', caloriesPer100g: 111, proteinPer100g: 4.5, carbsPer100g: 21.0, fatPer100g: 0.8, commonPortions: [{ name: '1 prato raso', grams: 200 }, { name: '1 pegador', grams: 110 }] },
  { name: 'Pão francês', category: 'grains', caloriesPer100g: 300, proteinPer100g: 8.0, carbsPer100g: 58.6, fatPer100g: 3.1, commonPortions: [{ name: '1 unidade', grams: 50 }] },
  { name: 'Pão integral', category: 'grains', caloriesPer100g: 253, proteinPer100g: 9.4, carbsPer100g: 49.9, fatPer100g: 2.9, commonPortions: [{ name: '1 fatia', grams: 30 }, { name: '2 fatias', grams: 60 }] },
  { name: 'Aveia em flocos', category: 'grains', caloriesPer100g: 394, proteinPer100g: 13.9, carbsPer100g: 66.6, fatPer100g: 8.5, commonPortions: [{ name: '1 colher de sopa', grams: 15 }, { name: '3 colheres de sopa', grams: 45 }] },
  { name: 'Tapioca (goma)', category: 'grains', caloriesPer100g: 343, proteinPer100g: 0.5, carbsPer100g: 84.3, fatPer100g: 0.1, commonPortions: [{ name: '1 porção', grams: 30 }] },
  { name: 'Batata inglesa cozida', category: 'grains', caloriesPer100g: 52, proteinPer100g: 1.2, carbsPer100g: 11.9, fatPer100g: 0.0, commonPortions: [{ name: '1 unidade média', grams: 140 }] },
  { name: 'Batata doce cozida', category: 'grains', caloriesPer100g: 77, proteinPer100g: 0.6, carbsPer100g: 18.4, fatPer100g: 0.1, commonPortions: [{ name: '1 unidade média', grams: 150 }] },
  { name: 'Mandioca cozida', category: 'grains', caloriesPer100g: 125, proteinPer100g: 0.6, carbsPer100g: 30.1, fatPer100g: 0.3, commonPortions: [{ name: '1 pedaço médio', grams: 100 }] },
  { name: 'Cuscuz de milho', category: 'grains', caloriesPer100g: 113, proteinPer100g: 2.5, carbsPer100g: 23.6, fatPer100g: 0.4, commonPortions: [{ name: '1 fatia', grams: 135 }] },
  { name: 'Milho cozido', category: 'grains', caloriesPer100g: 96, proteinPer100g: 3.2, carbsPer100g: 18.3, fatPer100g: 1.0, commonPortions: [{ name: '1 espiga', grams: 150 }] },

  // ============================================
  // PROTEINS — Carnes, aves, peixes e ovos
  // ============================================
  { name: 'Frango grelhado (peito)', category: 'proteins', caloriesPer100g: 159, proteinPer100g: 32.0, carbsPer100g: 0.0, fatPer100g: 2.5, commonPortions: [{ name: '1 filé médio', grams: 150 }, { name: '1 filé pequeno', grams: 100 }] },
  { name: 'Frango cozido (coxa)', category: 'proteins', caloriesPer100g: 215, proteinPer100g: 26.2, carbsPer100g: 0.0, fatPer100g: 11.8, commonPortions: [{ name: '1 coxa', grams: 100 }] },
  { name: 'Carne bovina (patinho) grelhada', category: 'proteins', caloriesPer100g: 219, proteinPer100g: 35.9, carbsPer100g: 0.0, fatPer100g: 7.3, commonPortions: [{ name: '1 bife médio', grams: 120 }, { name: '1 bife pequeno', grams: 80 }] },
  { name: 'Carne bovina (acém) cozida', category: 'proteins', caloriesPer100g: 212, proteinPer100g: 26.7, carbsPer100g: 0.0, fatPer100g: 11.2, commonPortions: [{ name: '1 pedaço médio', grams: 100 }] },
  { name: 'Carne moída refogada', category: 'proteins', caloriesPer100g: 212, proteinPer100g: 26.0, carbsPer100g: 0.0, fatPer100g: 11.5, commonPortions: [{ name: '1 concha média', grams: 100 }] },
  { name: 'Carne suína (lombo) assada', category: 'proteins', caloriesPer100g: 210, proteinPer100g: 33.3, carbsPer100g: 0.0, fatPer100g: 7.9, commonPortions: [{ name: '1 fatia', grams: 80 }] },
  { name: 'Salmão grelhado', category: 'proteins', caloriesPer100g: 243, proteinPer100g: 26.1, carbsPer100g: 0.0, fatPer100g: 15.0, commonPortions: [{ name: '1 filé', grams: 150 }, { name: '1 posta', grams: 120 }] },
  { name: 'Tilápia grelhada', category: 'proteins', caloriesPer100g: 128, proteinPer100g: 26.2, carbsPer100g: 0.0, fatPer100g: 2.7, commonPortions: [{ name: '1 filé', grams: 120 }] },
  { name: 'Atum em conserva (light)', category: 'proteins', caloriesPer100g: 116, proteinPer100g: 25.5, carbsPer100g: 0.0, fatPer100g: 0.9, commonPortions: [{ name: '1 lata drenada', grams: 80 }] },
  { name: 'Sardinha em conserva', category: 'proteins', caloriesPer100g: 214, proteinPer100g: 24.6, carbsPer100g: 0.0, fatPer100g: 12.5, commonPortions: [{ name: '1 lata drenada', grams: 84 }] },
  { name: 'Ovo cozido', category: 'proteins', caloriesPer100g: 146, proteinPer100g: 13.3, carbsPer100g: 0.6, fatPer100g: 9.5, commonPortions: [{ name: '1 unidade', grams: 50 }] },
  { name: 'Ovo mexido', category: 'proteins', caloriesPer100g: 170, proteinPer100g: 11.1, carbsPer100g: 1.6, fatPer100g: 13.0, commonPortions: [{ name: '2 ovos', grams: 120 }] },
  { name: 'Peru (peito) assado', category: 'proteins', caloriesPer100g: 153, proteinPer100g: 29.9, carbsPer100g: 0.0, fatPer100g: 3.2, commonPortions: [{ name: '1 fatia grossa', grams: 100 }] },

  // ============================================
  // DAIRY — Laticínios
  // ============================================
  { name: 'Leite integral', category: 'dairy', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.5, fatPer100g: 3.3, commonPortions: [{ name: '1 copo', grams: 200 }] },
  { name: 'Leite desnatado', category: 'dairy', caloriesPer100g: 35, proteinPer100g: 3.4, carbsPer100g: 5.0, fatPer100g: 0.1, commonPortions: [{ name: '1 copo', grams: 200 }] },
  { name: 'Iogurte natural integral', category: 'dairy', caloriesPer100g: 51, proteinPer100g: 4.1, carbsPer100g: 3.7, fatPer100g: 2.4, commonPortions: [{ name: '1 pote', grams: 170 }] },
  { name: 'Iogurte natural desnatado', category: 'dairy', caloriesPer100g: 42, proteinPer100g: 4.0, carbsPer100g: 5.5, fatPer100g: 0.3, commonPortions: [{ name: '1 pote', grams: 170 }] },
  { name: 'Queijo minas frescal', category: 'dairy', caloriesPer100g: 264, proteinPer100g: 17.4, carbsPer100g: 3.2, fatPer100g: 20.2, commonPortions: [{ name: '1 fatia', grams: 30 }] },
  { name: 'Queijo muçarela', category: 'dairy', caloriesPer100g: 330, proteinPer100g: 22.6, carbsPer100g: 3.0, fatPer100g: 25.2, commonPortions: [{ name: '1 fatia', grams: 20 }, { name: '2 fatias', grams: 40 }] },
  { name: 'Queijo cottage', category: 'dairy', caloriesPer100g: 98, proteinPer100g: 11.1, carbsPer100g: 3.4, fatPer100g: 4.3, commonPortions: [{ name: '2 colheres de sopa', grams: 60 }] },
  { name: 'Requeijão cremoso', category: 'dairy', caloriesPer100g: 257, proteinPer100g: 7.5, carbsPer100g: 2.8, fatPer100g: 24.0, commonPortions: [{ name: '1 colher de sopa', grams: 30 }] },
  { name: 'Ricota', category: 'dairy', caloriesPer100g: 140, proteinPer100g: 12.6, carbsPer100g: 3.8, fatPer100g: 8.1, commonPortions: [{ name: '1 fatia', grams: 40 }] },

  // ============================================
  // FRUITS — Frutas
  // ============================================
  { name: 'Banana prata', category: 'fruits', caloriesPer100g: 98, proteinPer100g: 1.3, carbsPer100g: 26.0, fatPer100g: 0.1, commonPortions: [{ name: '1 unidade', grams: 86 }] },
  { name: 'Maçã', category: 'fruits', caloriesPer100g: 56, proteinPer100g: 0.3, carbsPer100g: 15.2, fatPer100g: 0.0, commonPortions: [{ name: '1 unidade', grams: 130 }] },
  { name: 'Laranja', category: 'fruits', caloriesPer100g: 37, proteinPer100g: 1.0, carbsPer100g: 8.9, fatPer100g: 0.1, commonPortions: [{ name: '1 unidade', grams: 180 }] },
  { name: 'Mamão papaia', category: 'fruits', caloriesPer100g: 40, proteinPer100g: 0.5, carbsPer100g: 10.4, fatPer100g: 0.1, commonPortions: [{ name: '1 fatia', grams: 170 }] },
  { name: 'Manga', category: 'fruits', caloriesPer100g: 64, proteinPer100g: 0.4, carbsPer100g: 16.7, fatPer100g: 0.3, commonPortions: [{ name: '1 unidade média', grams: 200 }] },
  { name: 'Abacate', category: 'fruits', caloriesPer100g: 96, proteinPer100g: 1.2, carbsPer100g: 6.0, fatPer100g: 8.4, commonPortions: [{ name: '1/2 unidade', grams: 100 }, { name: '2 colheres de sopa', grams: 60 }] },
  { name: 'Morango', category: 'fruits', caloriesPer100g: 30, proteinPer100g: 0.9, carbsPer100g: 6.8, fatPer100g: 0.3, commonPortions: [{ name: '1 xícara', grams: 150 }, { name: '5 unidades', grams: 60 }] },
  { name: 'Uva', category: 'fruits', caloriesPer100g: 53, proteinPer100g: 0.7, carbsPer100g: 13.6, fatPer100g: 0.2, commonPortions: [{ name: '1 cacho pequeno', grams: 100 }] },
  { name: 'Melancia', category: 'fruits', caloriesPer100g: 33, proteinPer100g: 0.9, carbsPer100g: 8.1, fatPer100g: 0.0, commonPortions: [{ name: '1 fatia', grams: 200 }] },
  { name: 'Abacaxi', category: 'fruits', caloriesPer100g: 48, proteinPer100g: 0.9, carbsPer100g: 12.3, fatPer100g: 0.1, commonPortions: [{ name: '1 fatia', grams: 130 }] },
  { name: 'Melão', category: 'fruits', caloriesPer100g: 29, proteinPer100g: 0.7, carbsPer100g: 7.5, fatPer100g: 0.0, commonPortions: [{ name: '1 fatia', grams: 150 }] },
  { name: 'Goiaba', category: 'fruits', caloriesPer100g: 54, proteinPer100g: 1.1, carbsPer100g: 13.0, fatPer100g: 0.4, commonPortions: [{ name: '1 unidade', grams: 170 }] },
  { name: 'Pera', category: 'fruits', caloriesPer100g: 53, proteinPer100g: 0.6, carbsPer100g: 14.0, fatPer100g: 0.1, commonPortions: [{ name: '1 unidade', grams: 180 }] },
  { name: 'Kiwi', category: 'fruits', caloriesPer100g: 51, proteinPer100g: 1.3, carbsPer100g: 11.5, fatPer100g: 0.6, commonPortions: [{ name: '1 unidade', grams: 75 }] },

  // ============================================
  // VEGETABLES — Verduras e legumes
  // ============================================
  { name: 'Brócolis cozido', category: 'vegetables', caloriesPer100g: 25, proteinPer100g: 2.1, carbsPer100g: 4.4, fatPer100g: 0.3, commonPortions: [{ name: '1 xícara', grams: 100 }] },
  { name: 'Cenoura crua', category: 'vegetables', caloriesPer100g: 34, proteinPer100g: 1.3, carbsPer100g: 7.7, fatPer100g: 0.2, commonPortions: [{ name: '1 unidade média', grams: 80 }] },
  { name: 'Tomate', category: 'vegetables', caloriesPer100g: 15, proteinPer100g: 1.1, carbsPer100g: 3.1, fatPer100g: 0.2, commonPortions: [{ name: '1 unidade', grams: 100 }] },
  { name: 'Alface', category: 'vegetables', caloriesPer100g: 11, proteinPer100g: 1.3, carbsPer100g: 1.7, fatPer100g: 0.2, commonPortions: [{ name: '1 prato (folhas)', grams: 50 }] },
  { name: 'Abobrinha cozida', category: 'vegetables', caloriesPer100g: 15, proteinPer100g: 0.8, carbsPer100g: 3.2, fatPer100g: 0.1, commonPortions: [{ name: '1/2 unidade', grams: 100 }] },
  { name: 'Espinafre cozido', category: 'vegetables', caloriesPer100g: 22, proteinPer100g: 2.6, carbsPer100g: 3.1, fatPer100g: 0.2, commonPortions: [{ name: '1 xícara', grams: 100 }] },
  { name: 'Couve-flor cozida', category: 'vegetables', caloriesPer100g: 19, proteinPer100g: 1.2, carbsPer100g: 3.9, fatPer100g: 0.2, commonPortions: [{ name: '1 xícara', grams: 100 }] },
  { name: 'Couve refogada', category: 'vegetables', caloriesPer100g: 90, proteinPer100g: 3.1, carbsPer100g: 7.1, fatPer100g: 5.9, commonPortions: [{ name: '1 porção', grams: 60 }] },
  { name: 'Pepino', category: 'vegetables', caloriesPer100g: 10, proteinPer100g: 0.9, carbsPer100g: 2.0, fatPer100g: 0.1, commonPortions: [{ name: '1/2 unidade', grams: 100 }] },
  { name: 'Beterraba cozida', category: 'vegetables', caloriesPer100g: 32, proteinPer100g: 1.2, carbsPer100g: 7.2, fatPer100g: 0.1, commonPortions: [{ name: '1 unidade', grams: 100 }] },
  { name: 'Chuchu cozido', category: 'vegetables', caloriesPer100g: 17, proteinPer100g: 0.4, carbsPer100g: 3.8, fatPer100g: 0.1, commonPortions: [{ name: '1/2 unidade', grams: 85 }] },
  { name: 'Berinjela cozida', category: 'vegetables', caloriesPer100g: 19, proteinPer100g: 0.7, carbsPer100g: 4.5, fatPer100g: 0.1, commonPortions: [{ name: '1 xícara', grams: 100 }] },
  { name: 'Pimentão verde', category: 'vegetables', caloriesPer100g: 21, proteinPer100g: 1.1, carbsPer100g: 4.9, fatPer100g: 0.1, commonPortions: [{ name: '1 unidade', grams: 120 }] },
  { name: 'Abóbora cozida', category: 'vegetables', caloriesPer100g: 18, proteinPer100g: 0.7, carbsPer100g: 4.3, fatPer100g: 0.1, commonPortions: [{ name: '1 fatia', grams: 100 }] },
  { name: 'Vagem cozida', category: 'vegetables', caloriesPer100g: 25, proteinPer100g: 1.6, carbsPer100g: 5.1, fatPer100g: 0.1, commonPortions: [{ name: '1 xícara', grams: 100 }] },

  // ============================================
  // LEGUMES — Leguminosas
  // ============================================
  { name: 'Feijão preto cozido', category: 'legumes', caloriesPer100g: 77, proteinPer100g: 4.5, carbsPer100g: 14.0, fatPer100g: 0.5, commonPortions: [{ name: '1 concha', grams: 80 }, { name: '1 xícara', grams: 170 }] },
  { name: 'Feijão carioca cozido', category: 'legumes', caloriesPer100g: 76, proteinPer100g: 4.8, carbsPer100g: 13.6, fatPer100g: 0.5, commonPortions: [{ name: '1 concha', grams: 80 }, { name: '1 xícara', grams: 170 }] },
  { name: 'Lentilha cozida', category: 'legumes', caloriesPer100g: 93, proteinPer100g: 6.3, carbsPer100g: 16.3, fatPer100g: 0.5, commonPortions: [{ name: '1 concha', grams: 80 }] },
  { name: 'Grão-de-bico cozido', category: 'legumes', caloriesPer100g: 130, proteinPer100g: 6.7, carbsPer100g: 21.2, fatPer100g: 2.1, commonPortions: [{ name: '1 concha', grams: 80 }] },
  { name: 'Ervilha cozida', category: 'legumes', caloriesPer100g: 63, proteinPer100g: 4.1, carbsPer100g: 11.3, fatPer100g: 0.4, commonPortions: [{ name: '1 xícara', grams: 160 }] },
  { name: 'Soja cozida', category: 'legumes', caloriesPer100g: 151, proteinPer100g: 14.0, carbsPer100g: 7.9, fatPer100g: 7.0, commonPortions: [{ name: '1 xícara', grams: 170 }] },
  { name: 'Feijão branco cozido', category: 'legumes', caloriesPer100g: 99, proteinPer100g: 6.3, carbsPer100g: 17.6, fatPer100g: 0.5, commonPortions: [{ name: '1 concha', grams: 80 }] },
  { name: 'Tofu firme', category: 'legumes', caloriesPer100g: 64, proteinPer100g: 6.6, carbsPer100g: 2.4, fatPer100g: 3.5, commonPortions: [{ name: '1 fatia', grams: 80 }] },

  // ============================================
  // FATS — Gorduras e oleaginosas
  // ============================================
  { name: 'Azeite de oliva', category: 'fats', caloriesPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0, commonPortions: [{ name: '1 colher de sopa', grams: 13 }, { name: '1 fio', grams: 5 }] },
  { name: 'Óleo de coco', category: 'fats', caloriesPer100g: 862, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 99.1, commonPortions: [{ name: '1 colher de sopa', grams: 13 }] },
  { name: 'Manteiga', category: 'fats', caloriesPer100g: 726, proteinPer100g: 0.3, carbsPer100g: 0.0, fatPer100g: 82.0, commonPortions: [{ name: '1 colher de chá', grams: 5 }] },
  { name: 'Pasta de amendoim', category: 'fats', caloriesPer100g: 593, proteinPer100g: 22.5, carbsPer100g: 22.3, fatPer100g: 46.3, commonPortions: [{ name: '1 colher de sopa', grams: 20 }] },
  { name: 'Castanha-do-pará', category: 'fats', caloriesPer100g: 643, proteinPer100g: 14.5, carbsPer100g: 12.3, fatPer100g: 63.5, commonPortions: [{ name: '2 unidades', grams: 8 }] },
  { name: 'Castanha de caju', category: 'fats', caloriesPer100g: 570, proteinPer100g: 18.5, carbsPer100g: 29.1, fatPer100g: 46.3, commonPortions: [{ name: '10 unidades', grams: 15 }] },
  { name: 'Amendoim torrado', category: 'fats', caloriesPer100g: 606, proteinPer100g: 27.2, carbsPer100g: 12.5, fatPer100g: 49.4, commonPortions: [{ name: '1 punhado', grams: 30 }] },
  { name: 'Nozes', category: 'fats', caloriesPer100g: 620, proteinPer100g: 14.0, carbsPer100g: 10.0, fatPer100g: 59.0, commonPortions: [{ name: '3 unidades', grams: 12 }] },
  { name: 'Semente de chia', category: 'fats', caloriesPer100g: 486, proteinPer100g: 16.5, carbsPer100g: 42.1, fatPer100g: 30.7, commonPortions: [{ name: '1 colher de sopa', grams: 12 }] },
  { name: 'Semente de linhaça', category: 'fats', caloriesPer100g: 495, proteinPer100g: 14.1, carbsPer100g: 43.3, fatPer100g: 32.3, commonPortions: [{ name: '1 colher de sopa', grams: 12 }] },
  { name: 'Coco ralado', category: 'fats', caloriesPer100g: 592, proteinPer100g: 5.5, carbsPer100g: 26.3, fatPer100g: 53.9, commonPortions: [{ name: '1 colher de sopa', grams: 10 }] },

  // ============================================
  // BEVERAGES — Bebidas
  // ============================================
  { name: 'Café (sem açúcar)', category: 'beverages', caloriesPer100g: 2, proteinPer100g: 0.1, carbsPer100g: 0.0, fatPer100g: 0.0, commonPortions: [{ name: '1 xícara', grams: 50 }, { name: '1 caneca', grams: 200 }] },
  { name: 'Suco de laranja natural', category: 'beverages', caloriesPer100g: 45, proteinPer100g: 0.6, carbsPer100g: 10.4, fatPer100g: 0.2, commonPortions: [{ name: '1 copo', grams: 250 }] },
  { name: 'Água de coco', category: 'beverages', caloriesPer100g: 22, proteinPer100g: 0.0, carbsPer100g: 5.3, fatPer100g: 0.0, commonPortions: [{ name: '1 copo', grams: 250 }] },
  { name: 'Leite de coco', category: 'beverages', caloriesPer100g: 150, proteinPer100g: 1.4, carbsPer100g: 2.0, fatPer100g: 15.0, commonPortions: [{ name: '1/2 xícara', grams: 100 }] },
  { name: 'Chá verde (sem açúcar)', category: 'beverages', caloriesPer100g: 0, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 0.0, commonPortions: [{ name: '1 xícara', grams: 200 }] },
  { name: 'Suco de uva integral', category: 'beverages', caloriesPer100g: 57, proteinPer100g: 0.2, carbsPer100g: 14.2, fatPer100g: 0.1, commonPortions: [{ name: '1 copo', grams: 200 }] },

  // ============================================
  // SWEETS — Doces e açúcares
  // ============================================
  { name: 'Mel', category: 'sweets', caloriesPer100g: 309, proteinPer100g: 0.3, carbsPer100g: 84.0, fatPer100g: 0.0, commonPortions: [{ name: '1 colher de sopa', grams: 21 }] },
  { name: 'Chocolate amargo (70%)', category: 'sweets', caloriesPer100g: 528, proteinPer100g: 6.1, carbsPer100g: 45.2, fatPer100g: 35.4, commonPortions: [{ name: '1 quadrado', grams: 10 }, { name: '3 quadrados', grams: 30 }] },
  { name: 'Açúcar mascavo', category: 'sweets', caloriesPer100g: 369, proteinPer100g: 0.7, carbsPer100g: 94.5, fatPer100g: 0.0, commonPortions: [{ name: '1 colher de chá', grams: 5 }] },
  { name: 'Geleia de fruta', category: 'sweets', caloriesPer100g: 262, proteinPer100g: 0.3, carbsPer100g: 68.0, fatPer100g: 0.0, commonPortions: [{ name: '1 colher de sopa', grams: 20 }] },

  // ============================================
  // OTHERS — Outros
  // ============================================
  { name: 'Farinha de mandioca', category: 'others', caloriesPer100g: 361, proteinPer100g: 1.6, carbsPer100g: 87.0, fatPer100g: 0.4, commonPortions: [{ name: '1 colher de sopa', grams: 16 }] },
  { name: 'Granola', category: 'others', caloriesPer100g: 421, proteinPer100g: 10.0, carbsPer100g: 63.6, fatPer100g: 15.2, commonPortions: [{ name: '1 porção', grams: 40 }] },
  { name: 'Whey protein', category: 'others', caloriesPer100g: 375, proteinPer100g: 75.0, carbsPer100g: 12.5, fatPer100g: 3.1, commonPortions: [{ name: '1 scoop', grams: 30 }] },
  { name: 'Farinha de aveia', category: 'others', caloriesPer100g: 389, proteinPer100g: 13.9, carbsPer100g: 66.6, fatPer100g: 7.5, commonPortions: [{ name: '2 colheres de sopa', grams: 30 }] },
  { name: 'Polvilho doce', category: 'others', caloriesPer100g: 351, proteinPer100g: 0.3, carbsPer100g: 87.0, fatPer100g: 0.1, commonPortions: [{ name: '2 colheres de sopa', grams: 30 }] },
] as const

// Seed idempotente — usa upsert para não duplicar alimentos
export async function seedFoods(): Promise<number> {
  let count = 0

  for (const food of foods) {
    await FoodItem.updateOne(
      { name: food.name },
      { $setOnInsert: food },
      { upsert: true },
    )
    count++
  }

  return count
}
