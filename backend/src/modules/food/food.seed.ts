import { FoodItem } from './food.model.js'

// ====================================================
// SEED DE ALIMENTOS
// ====================================================
// Base nutricional com ~80 alimentos brasileiros comuns.
// Valores por 100g baseados em TACO (UNICAMP) + USDA FoodData Central.
//
// Cada alimento usa o helper f() que preenche zeros automaticamente
// nos 17 micros opcionais, evitando repetição massiva.
//
// Fonte: TACO 4ª ed. + USDA FoodData Central (SR Legacy)
// Campos sem dado confiável = 0 (default do Mongoose).

type Portions = { name: string; grams: number }[]

type FoodSeed = {
  name: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  commonPortions: Portions
  // Micronutrientes (todos opcionais, default 0)
  fiberPer100g?: number
  omega3Per100g?: number
  cholesterolPer100g?: number
  vitaminAPer100g?: number
  vitaminB1Per100g?: number
  vitaminB2Per100g?: number
  vitaminB3Per100g?: number
  vitaminB5Per100g?: number
  vitaminB6Per100g?: number
  vitaminB9Per100g?: number
  vitaminB12Per100g?: number
  vitaminCPer100g?: number
  vitaminDPer100g?: number
  vitaminEPer100g?: number
  vitaminKPer100g?: number
  calciumPer100g?: number
  ironPer100g?: number
  magnesiumPer100g?: number
  phosphorusPer100g?: number
  potassiumPer100g?: number
  sodiumPer100g?: number
  zincPer100g?: number
  copperPer100g?: number
  manganesePer100g?: number
  seleniumPer100g?: number
}

const foods: FoodSeed[] = [
  // ============================================
  // GRAINS — Cereais, massas e pães
  // ============================================
  {
    name: 'Arroz branco cozido', category: 'grains',
    caloriesPer100g: 128, proteinPer100g: 2.5, carbsPer100g: 28.1, fatPer100g: 0.2,
    fiberPer100g: 1.6, vitaminB1Per100g: 0.02, vitaminB3Per100g: 0.4, vitaminB5Per100g: 0.39,
    vitaminB6Per100g: 0.05, vitaminB9Per100g: 2,
    calciumPer100g: 4, ironPer100g: 0.1, magnesiumPer100g: 5, phosphorusPer100g: 33,
    potassiumPer100g: 32, sodiumPer100g: 1, zincPer100g: 0.5, copperPer100g: 0.06,
    manganesePer100g: 0.4, seleniumPer100g: 7.5,
    commonPortions: [{ name: '1 xícara', grams: 160 }, { name: '1 colher de servir', grams: 45 }],
  },
  {
    name: 'Arroz integral cozido', category: 'grains',
    caloriesPer100g: 124, proteinPer100g: 2.6, carbsPer100g: 25.8, fatPer100g: 1.0,
    fiberPer100g: 2.7, vitaminB1Per100g: 0.10, vitaminB3Per100g: 1.5, vitaminB5Per100g: 0.39,
    vitaminB6Per100g: 0.15, vitaminB9Per100g: 4,
    calciumPer100g: 5, ironPer100g: 0.3, magnesiumPer100g: 39, phosphorusPer100g: 77,
    potassiumPer100g: 56, sodiumPer100g: 1, zincPer100g: 0.6, copperPer100g: 0.10,
    manganesePer100g: 0.9, seleniumPer100g: 9.8,
    commonPortions: [{ name: '1 xícara', grams: 160 }, { name: '1 colher de servir', grams: 45 }],
  },
  {
    name: 'Macarrão cozido', category: 'grains',
    caloriesPer100g: 102, proteinPer100g: 3.4, carbsPer100g: 19.9, fatPer100g: 0.5,
    fiberPer100g: 1.4, vitaminB1Per100g: 0.09, vitaminB3Per100g: 0.5, vitaminB9Per100g: 7,
    vitaminEPer100g: 0.1,
    calciumPer100g: 7, ironPer100g: 0.5, magnesiumPer100g: 14, phosphorusPer100g: 44,
    potassiumPer100g: 24, sodiumPer100g: 1, zincPer100g: 0.5, copperPer100g: 0.10,
    manganesePer100g: 0.3, seleniumPer100g: 16,
    commonPortions: [{ name: '1 prato raso', grams: 200 }, { name: '1 pegador', grams: 110 }],
  },
  {
    name: 'Macarrão integral cozido', category: 'grains',
    caloriesPer100g: 111, proteinPer100g: 4.5, carbsPer100g: 21.0, fatPer100g: 0.8,
    fiberPer100g: 3.9, vitaminB1Per100g: 0.11, vitaminB3Per100g: 1.3, vitaminB5Per100g: 0.28,
    vitaminB6Per100g: 0.08, vitaminB9Per100g: 7, vitaminEPer100g: 0.3,
    calciumPer100g: 11, ironPer100g: 0.9, magnesiumPer100g: 30, phosphorusPer100g: 89,
    potassiumPer100g: 44, sodiumPer100g: 2, zincPer100g: 0.8, copperPer100g: 0.17,
    manganesePer100g: 1.0, seleniumPer100g: 25.8,
    commonPortions: [{ name: '1 prato raso', grams: 200 }, { name: '1 pegador', grams: 110 }],
  },
  {
    name: 'Pão francês', category: 'grains',
    caloriesPer100g: 300, proteinPer100g: 8.0, carbsPer100g: 58.6, fatPer100g: 3.1,
    fiberPer100g: 2.3, vitaminB1Per100g: 0.15, vitaminB2Per100g: 0.08, vitaminB3Per100g: 2.0,
    vitaminB5Per100g: 0.30, vitaminB6Per100g: 0.05, vitaminB9Per100g: 30,
    calciumPer100g: 22, ironPer100g: 1.0, magnesiumPer100g: 21, phosphorusPer100g: 85,
    potassiumPer100g: 90, sodiumPer100g: 648, zincPer100g: 0.7, copperPer100g: 0.10,
    manganesePer100g: 0.5, seleniumPer100g: 22,
    commonPortions: [{ name: '1 unidade', grams: 50 }],
  },
  {
    name: 'Pão integral', category: 'grains',
    caloriesPer100g: 253, proteinPer100g: 9.4, carbsPer100g: 49.9, fatPer100g: 2.9,
    fiberPer100g: 6.9, vitaminB1Per100g: 0.40, vitaminB2Per100g: 0.10, vitaminB3Per100g: 4.0,
    vitaminB5Per100g: 0.55, vitaminB6Per100g: 0.18, vitaminB9Per100g: 42, vitaminEPer100g: 0.4,
    vitaminKPer100g: 1.3,
    calciumPer100g: 50, ironPer100g: 2.3, magnesiumPer100g: 57, phosphorusPer100g: 200,
    potassiumPer100g: 196, sodiumPer100g: 435, zincPer100g: 1.8, copperPer100g: 0.23,
    manganesePer100g: 2.2, seleniumPer100g: 31,
    commonPortions: [{ name: '1 fatia', grams: 30 }, { name: '2 fatias', grams: 60 }],
  },
  {
    name: 'Aveia em flocos', category: 'grains',
    caloriesPer100g: 394, proteinPer100g: 13.9, carbsPer100g: 66.6, fatPer100g: 8.5,
    fiberPer100g: 9.1, omega3Per100g: 0.11, vitaminB1Per100g: 0.46, vitaminB2Per100g: 0.16,
    vitaminB3Per100g: 1.1, vitaminB5Per100g: 1.12, vitaminB6Per100g: 0.12, vitaminB9Per100g: 32,
    vitaminKPer100g: 2.0,
    calciumPer100g: 48, ironPer100g: 4.4, magnesiumPer100g: 119, phosphorusPer100g: 410,
    potassiumPer100g: 336, sodiumPer100g: 3, zincPer100g: 3.6, copperPer100g: 0.39,
    manganesePer100g: 3.6, seleniumPer100g: 28.9,
    commonPortions: [{ name: '1 colher de sopa', grams: 15 }, { name: '3 colheres de sopa', grams: 45 }],
  },
  {
    name: 'Tapioca (goma)', category: 'grains',
    caloriesPer100g: 343, proteinPer100g: 0.5, carbsPer100g: 84.3, fatPer100g: 0.1,
    fiberPer100g: 0.4,
    calciumPer100g: 12, ironPer100g: 0.1, potassiumPer100g: 16, magnesiumPer100g: 3,
    sodiumPer100g: 1, phosphorusPer100g: 7, seleniumPer100g: 0.8,
    commonPortions: [{ name: '1 porção', grams: 30 }],
  },
  {
    name: 'Batata inglesa cozida', category: 'grains',
    caloriesPer100g: 52, proteinPer100g: 1.2, carbsPer100g: 11.9, fatPer100g: 0.0,
    fiberPer100g: 1.3, vitaminB1Per100g: 0.08, vitaminB3Per100g: 1.3, vitaminB5Per100g: 0.52,
    vitaminB6Per100g: 0.24, vitaminB9Per100g: 10, vitaminCPer100g: 13, vitaminKPer100g: 2.2,
    calciumPer100g: 4, ironPer100g: 0.3, magnesiumPer100g: 12, phosphorusPer100g: 40,
    potassiumPer100g: 302, sodiumPer100g: 2, zincPer100g: 0.3, copperPer100g: 0.17,
    manganesePer100g: 0.14,
    commonPortions: [{ name: '1 unidade média', grams: 140 }],
  },
  {
    name: 'Batata doce cozida', category: 'grains',
    caloriesPer100g: 77, proteinPer100g: 0.6, carbsPer100g: 18.4, fatPer100g: 0.1,
    fiberPer100g: 2.2, vitaminAPer100g: 111, vitaminB1Per100g: 0.07, vitaminB3Per100g: 0.5,
    vitaminB5Per100g: 0.57, vitaminB6Per100g: 0.17, vitaminB9Per100g: 6, vitaminCPer100g: 12,
    vitaminEPer100g: 0.7, vitaminKPer100g: 2.3,
    calciumPer100g: 17, ironPer100g: 0.2, magnesiumPer100g: 11, phosphorusPer100g: 32,
    potassiumPer100g: 340, sodiumPer100g: 3, zincPer100g: 0.2, copperPer100g: 0.09,
    manganesePer100g: 0.27,
    commonPortions: [{ name: '1 unidade média', grams: 150 }],
  },
  {
    name: 'Mandioca cozida', category: 'grains',
    caloriesPer100g: 125, proteinPer100g: 0.6, carbsPer100g: 30.1, fatPer100g: 0.3,
    fiberPer100g: 5.4, vitaminAPer100g: 2, vitaminB1Per100g: 0.05, vitaminB6Per100g: 0.06,
    vitaminB9Per100g: 24, vitaminCPer100g: 11, vitaminKPer100g: 1.9,
    calciumPer100g: 19, ironPer100g: 0.3, magnesiumPer100g: 22, phosphorusPer100g: 27,
    potassiumPer100g: 230, sodiumPer100g: 4, zincPer100g: 0.3, copperPer100g: 0.10,
    manganesePer100g: 0.38, seleniumPer100g: 0.7,
    commonPortions: [{ name: '1 pedaço médio', grams: 100 }],
  },
  {
    name: 'Cuscuz de milho', category: 'grains',
    caloriesPer100g: 113, proteinPer100g: 2.5, carbsPer100g: 23.6, fatPer100g: 0.4,
    fiberPer100g: 1.4, vitaminAPer100g: 3, vitaminB1Per100g: 0.05, vitaminB3Per100g: 0.9,
    vitaminB6Per100g: 0.08, vitaminB9Per100g: 12,
    calciumPer100g: 5, ironPer100g: 0.5, magnesiumPer100g: 12, phosphorusPer100g: 36,
    potassiumPer100g: 48, sodiumPer100g: 2, zincPer100g: 0.3, seleniumPer100g: 2,
    commonPortions: [{ name: '1 fatia', grams: 135 }],
  },
  {
    name: 'Milho cozido', category: 'grains',
    caloriesPer100g: 96, proteinPer100g: 3.2, carbsPer100g: 18.3, fatPer100g: 1.0,
    fiberPer100g: 3.4, vitaminAPer100g: 12, vitaminB1Per100g: 0.09, vitaminB3Per100g: 1.3,
    vitaminB5Per100g: 0.58, vitaminB6Per100g: 0.14, vitaminB9Per100g: 23, vitaminCPer100g: 5,
    calciumPer100g: 2, ironPer100g: 0.5, magnesiumPer100g: 23, phosphorusPer100g: 77,
    potassiumPer100g: 218, sodiumPer100g: 1, zincPer100g: 0.5, seleniumPer100g: 0.6,
    commonPortions: [{ name: '1 espiga', grams: 150 }],
  },

  // ============================================
  // PROTEINS — Carnes, aves, peixes e ovos
  // ============================================
  {
    name: 'Frango grelhado (peito)', category: 'proteins',
    caloriesPer100g: 159, proteinPer100g: 32.0, carbsPer100g: 0.0, fatPer100g: 2.5,
    cholesterolPer100g: 85, vitaminAPer100g: 4, vitaminB1Per100g: 0.07, vitaminB2Per100g: 0.12,
    vitaminB3Per100g: 12.4, vitaminB5Per100g: 1.06, vitaminB6Per100g: 0.60, vitaminB9Per100g: 4,
    vitaminB12Per100g: 0.3, vitaminDPer100g: 0.1,
    calciumPer100g: 4, ironPer100g: 0.3, magnesiumPer100g: 29, phosphorusPer100g: 228,
    potassiumPer100g: 320, sodiumPer100g: 50, zincPer100g: 1.0, seleniumPer100g: 27.6,
    commonPortions: [{ name: '1 filé médio', grams: 150 }, { name: '1 filé pequeno', grams: 100 }],
  },
  {
    name: 'Frango cozido (coxa)', category: 'proteins',
    caloriesPer100g: 215, proteinPer100g: 26.2, carbsPer100g: 0.0, fatPer100g: 11.8,
    cholesterolPer100g: 130, vitaminAPer100g: 16, vitaminB2Per100g: 0.18, vitaminB3Per100g: 5.7,
    vitaminB5Per100g: 1.01, vitaminB6Per100g: 0.24, vitaminB9Per100g: 6, vitaminB12Per100g: 0.3,
    vitaminDPer100g: 0.2, vitaminKPer100g: 2.4,
    calciumPer100g: 10, ironPer100g: 0.6, magnesiumPer100g: 18, phosphorusPer100g: 156,
    potassiumPer100g: 200, sodiumPer100g: 62, zincPer100g: 2.5, seleniumPer100g: 18.7,
    commonPortions: [{ name: '1 coxa', grams: 100 }],
  },
  {
    name: 'Carne bovina (patinho) grelhada', category: 'proteins',
    caloriesPer100g: 219, proteinPer100g: 35.9, carbsPer100g: 0.0, fatPer100g: 7.3,
    cholesterolPer100g: 90, vitaminB1Per100g: 0.07, vitaminB2Per100g: 0.23, vitaminB3Per100g: 8.0,
    vitaminB5Per100g: 0.35, vitaminB6Per100g: 0.60, vitaminB9Per100g: 10, vitaminB12Per100g: 2.2,
    calciumPer100g: 3, ironPer100g: 2.4, magnesiumPer100g: 24, phosphorusPer100g: 224,
    potassiumPer100g: 330, sodiumPer100g: 45, zincPer100g: 5.5, seleniumPer100g: 32.7,
    commonPortions: [{ name: '1 bife médio', grams: 120 }, { name: '1 bife pequeno', grams: 80 }],
  },
  {
    name: 'Carne bovina (acém) cozida', category: 'proteins',
    caloriesPer100g: 212, proteinPer100g: 26.7, carbsPer100g: 0.0, fatPer100g: 11.2,
    cholesterolPer100g: 88, vitaminB2Per100g: 0.19, vitaminB3Per100g: 5.0, vitaminB6Per100g: 0.32,
    vitaminB9Per100g: 7, vitaminB12Per100g: 2.0,
    calciumPer100g: 4, ironPer100g: 2.2, magnesiumPer100g: 18, phosphorusPer100g: 180,
    potassiumPer100g: 280, sodiumPer100g: 42, zincPer100g: 5.0, seleniumPer100g: 26,
    commonPortions: [{ name: '1 pedaço médio', grams: 100 }],
  },
  {
    name: 'Carne moída refogada', category: 'proteins',
    caloriesPer100g: 212, proteinPer100g: 26.0, carbsPer100g: 0.0, fatPer100g: 11.5,
    cholesterolPer100g: 92, vitaminB2Per100g: 0.20, vitaminB3Per100g: 5.5, vitaminB6Per100g: 0.35,
    vitaminB9Per100g: 8, vitaminB12Per100g: 2.4,
    calciumPer100g: 5, ironPer100g: 2.6, magnesiumPer100g: 20, phosphorusPer100g: 190,
    potassiumPer100g: 290, sodiumPer100g: 58, zincPer100g: 5.2, seleniumPer100g: 24,
    commonPortions: [{ name: '1 concha média', grams: 100 }],
  },
  {
    name: 'Carne suína (lombo) assada', category: 'proteins',
    caloriesPer100g: 210, proteinPer100g: 33.3, carbsPer100g: 0.0, fatPer100g: 7.9,
    cholesterolPer100g: 80, vitaminAPer100g: 2, vitaminB1Per100g: 0.80, vitaminB2Per100g: 0.30,
    vitaminB3Per100g: 5.5, vitaminB5Per100g: 0.73, vitaminB6Per100g: 0.42, vitaminB9Per100g: 5,
    vitaminB12Per100g: 0.6, vitaminDPer100g: 0.5,
    calciumPer100g: 5, ironPer100g: 0.8, magnesiumPer100g: 25, phosphorusPer100g: 246,
    potassiumPer100g: 350, sodiumPer100g: 52, zincPer100g: 2.4, seleniumPer100g: 41,
    commonPortions: [{ name: '1 fatia', grams: 80 }],
  },
  {
    name: 'Salmão grelhado', category: 'proteins',
    caloriesPer100g: 243, proteinPer100g: 26.1, carbsPer100g: 0.0, fatPer100g: 15.0,
    omega3Per100g: 2.15, cholesterolPer100g: 63, vitaminAPer100g: 12, vitaminB1Per100g: 0.21,
    vitaminB2Per100g: 0.38, vitaminB3Per100g: 8.0, vitaminB5Per100g: 1.66, vitaminB6Per100g: 0.64,
    vitaminB9Per100g: 26, vitaminB12Per100g: 3.2, vitaminDPer100g: 11.0, vitaminEPer100g: 3.5,
    calciumPer100g: 11, ironPer100g: 0.3, magnesiumPer100g: 29, phosphorusPer100g: 252,
    potassiumPer100g: 380, sodiumPer100g: 56, zincPer100g: 0.6, seleniumPer100g: 41.4,
    commonPortions: [{ name: '1 filé', grams: 150 }, { name: '1 posta', grams: 120 }],
  },
  {
    name: 'Tilápia grelhada', category: 'proteins',
    caloriesPer100g: 128, proteinPer100g: 26.2, carbsPer100g: 0.0, fatPer100g: 2.7,
    cholesterolPer100g: 57, vitaminB3Per100g: 3.9, vitaminB5Per100g: 0.66, vitaminB6Per100g: 0.16,
    vitaminB9Per100g: 24, vitaminB12Per100g: 1.6, vitaminDPer100g: 3.1,
    calciumPer100g: 14, ironPer100g: 0.6, magnesiumPer100g: 34, phosphorusPer100g: 204,
    potassiumPer100g: 380, sodiumPer100g: 52, zincPer100g: 0.4, seleniumPer100g: 54.4,
    commonPortions: [{ name: '1 filé', grams: 120 }],
  },
  {
    name: 'Atum em conserva (light)', category: 'proteins',
    caloriesPer100g: 116, proteinPer100g: 25.5, carbsPer100g: 0.0, fatPer100g: 0.9,
    omega3Per100g: 0.27, cholesterolPer100g: 42, vitaminAPer100g: 13, vitaminB3Per100g: 13.3,
    vitaminB6Per100g: 0.32, vitaminB12Per100g: 2.9, vitaminDPer100g: 1.7, vitaminEPer100g: 0.9,
    calciumPer100g: 8, ironPer100g: 0.9, magnesiumPer100g: 29, phosphorusPer100g: 217,
    potassiumPer100g: 207, sodiumPer100g: 338, zincPer100g: 0.8, seleniumPer100g: 80,
    commonPortions: [{ name: '1 lata drenada', grams: 80 }],
  },
  {
    name: 'Sardinha em conserva', category: 'proteins',
    caloriesPer100g: 214, proteinPer100g: 24.6, carbsPer100g: 0.0, fatPer100g: 12.5,
    omega3Per100g: 1.48, cholesterolPer100g: 142, vitaminAPer100g: 17, vitaminB2Per100g: 0.23,
    vitaminB3Per100g: 5.2, vitaminB5Per100g: 0.63, vitaminB12Per100g: 8.9, vitaminDPer100g: 4.8,
    vitaminEPer100g: 2.0, vitaminKPer100g: 2.6,
    calciumPer100g: 438, ironPer100g: 2.7, magnesiumPer100g: 34, phosphorusPer100g: 490,
    potassiumPer100g: 397, sodiumPer100g: 571, zincPer100g: 1.3, copperPer100g: 0.19,
    seleniumPer100g: 52.7,
    commonPortions: [{ name: '1 lata drenada', grams: 84 }],
  },
  {
    name: 'Ovo cozido', category: 'proteins',
    caloriesPer100g: 146, proteinPer100g: 13.3, carbsPer100g: 0.6, fatPer100g: 9.5,
    cholesterolPer100g: 373, vitaminAPer100g: 149, vitaminB2Per100g: 0.51, vitaminB5Per100g: 1.40,
    vitaminB6Per100g: 0.12, vitaminB9Per100g: 44, vitaminB12Per100g: 1.1, vitaminDPer100g: 2.2,
    vitaminEPer100g: 1.0,
    calciumPer100g: 49, ironPer100g: 1.2, magnesiumPer100g: 10, phosphorusPer100g: 172,
    potassiumPer100g: 110, sodiumPer100g: 146, zincPer100g: 1.1, seleniumPer100g: 30.8,
    commonPortions: [{ name: '1 unidade', grams: 50 }],
  },
  {
    name: 'Ovo mexido', category: 'proteins',
    caloriesPer100g: 170, proteinPer100g: 11.1, carbsPer100g: 1.6, fatPer100g: 13.0,
    cholesterolPer100g: 352, vitaminAPer100g: 165, vitaminB2Per100g: 0.41, vitaminB5Per100g: 1.35,
    vitaminB6Per100g: 0.14, vitaminB9Per100g: 38, vitaminB12Per100g: 0.9, vitaminDPer100g: 2.0,
    vitaminEPer100g: 1.3, vitaminKPer100g: 4.5,
    calciumPer100g: 48, ironPer100g: 1.5, magnesiumPer100g: 11, phosphorusPer100g: 168,
    potassiumPer100g: 120, sodiumPer100g: 155, zincPer100g: 1.2, seleniumPer100g: 26,
    commonPortions: [{ name: '2 ovos', grams: 120 }],
  },
  {
    name: 'Peru (peito) assado', category: 'proteins',
    caloriesPer100g: 153, proteinPer100g: 29.9, carbsPer100g: 0.0, fatPer100g: 3.2,
    cholesterolPer100g: 76, vitaminB3Per100g: 11.8, vitaminB5Per100g: 0.90, vitaminB6Per100g: 0.80,
    vitaminB9Per100g: 8, vitaminB12Per100g: 0.4,
    calciumPer100g: 8, ironPer100g: 0.7, magnesiumPer100g: 28, phosphorusPer100g: 218,
    potassiumPer100g: 350, sodiumPer100g: 55, zincPer100g: 2.0, seleniumPer100g: 32.1,
    commonPortions: [{ name: '1 fatia grossa', grams: 100 }],
  },

  // ============================================
  // DAIRY — Laticínios
  // ============================================
  {
    name: 'Leite integral', category: 'dairy',
    caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.5, fatPer100g: 3.3,
    cholesterolPer100g: 10, vitaminAPer100g: 46, vitaminB2Per100g: 0.18, vitaminB5Per100g: 0.37,
    vitaminB12Per100g: 0.4, vitaminCPer100g: 1, vitaminDPer100g: 1.3,
    calciumPer100g: 123, ironPer100g: 0.1, magnesiumPer100g: 10, phosphorusPer100g: 93,
    potassiumPer100g: 150, sodiumPer100g: 61, zincPer100g: 0.4, seleniumPer100g: 2.0,
    commonPortions: [{ name: '1 copo', grams: 200 }],
  },
  {
    name: 'Leite desnatado', category: 'dairy',
    caloriesPer100g: 35, proteinPer100g: 3.4, carbsPer100g: 5.0, fatPer100g: 0.1,
    cholesterolPer100g: 2, vitaminAPer100g: 2, vitaminB2Per100g: 0.19, vitaminB5Per100g: 0.36,
    vitaminB12Per100g: 0.5, vitaminCPer100g: 1, vitaminDPer100g: 1.2,
    calciumPer100g: 134, ironPer100g: 0.1, magnesiumPer100g: 11, phosphorusPer100g: 101,
    potassiumPer100g: 166, sodiumPer100g: 52, zincPer100g: 0.4, seleniumPer100g: 2.3,
    commonPortions: [{ name: '1 copo', grams: 200 }],
  },
  {
    name: 'Iogurte natural integral', category: 'dairy',
    caloriesPer100g: 51, proteinPer100g: 4.1, carbsPer100g: 3.7, fatPer100g: 2.4,
    cholesterolPer100g: 9, vitaminAPer100g: 22, vitaminB2Per100g: 0.17, vitaminB5Per100g: 0.39,
    vitaminB12Per100g: 0.4, vitaminCPer100g: 1, vitaminDPer100g: 0.1,
    calciumPer100g: 143, ironPer100g: 0.1, magnesiumPer100g: 12, phosphorusPer100g: 116,
    potassiumPer100g: 186, sodiumPer100g: 52, zincPer100g: 0.5, seleniumPer100g: 3.3,
    commonPortions: [{ name: '1 pote', grams: 170 }],
  },
  {
    name: 'Iogurte natural desnatado', category: 'dairy',
    caloriesPer100g: 42, proteinPer100g: 4.0, carbsPer100g: 5.5, fatPer100g: 0.3,
    cholesterolPer100g: 2, vitaminAPer100g: 2, vitaminB2Per100g: 0.20, vitaminB5Per100g: 0.51,
    vitaminB9Per100g: 11, vitaminB12Per100g: 0.5, vitaminCPer100g: 1, vitaminDPer100g: 0.1,
    calciumPer100g: 148, ironPer100g: 0.1, magnesiumPer100g: 13, phosphorusPer100g: 119,
    potassiumPer100g: 195, sodiumPer100g: 56, zincPer100g: 0.5, seleniumPer100g: 3.7,
    commonPortions: [{ name: '1 pote', grams: 170 }],
  },
  {
    name: 'Queijo minas frescal', category: 'dairy',
    caloriesPer100g: 264, proteinPer100g: 17.4, carbsPer100g: 3.2, fatPer100g: 20.2,
    cholesterolPer100g: 60, vitaminAPer100g: 193, vitaminB2Per100g: 0.30, vitaminB9Per100g: 17,
    vitaminB12Per100g: 0.8, vitaminDPer100g: 0.3, vitaminKPer100g: 1.5,
    calciumPer100g: 579, ironPer100g: 0.4, magnesiumPer100g: 22, phosphorusPer100g: 363,
    potassiumPer100g: 90, sodiumPer100g: 440, zincPer100g: 2.8, seleniumPer100g: 14.5,
    commonPortions: [{ name: '1 fatia', grams: 30 }],
  },
  {
    name: 'Queijo muçarela', category: 'dairy',
    caloriesPer100g: 330, proteinPer100g: 22.6, carbsPer100g: 3.0, fatPer100g: 25.2,
    cholesterolPer100g: 79, vitaminAPer100g: 227, vitaminB2Per100g: 0.28, vitaminB12Per100g: 2.3,
    vitaminDPer100g: 0.4, vitaminKPer100g: 2.7,
    calciumPer100g: 505, ironPer100g: 0.3, magnesiumPer100g: 20, phosphorusPer100g: 354,
    potassiumPer100g: 68, sodiumPer100g: 577, zincPer100g: 2.9, seleniumPer100g: 17,
    commonPortions: [{ name: '1 fatia', grams: 20 }, { name: '2 fatias', grams: 40 }],
  },
  {
    name: 'Queijo cottage', category: 'dairy',
    caloriesPer100g: 98, proteinPer100g: 11.1, carbsPer100g: 3.4, fatPer100g: 4.3,
    cholesterolPer100g: 17, vitaminAPer100g: 37, vitaminB2Per100g: 0.16, vitaminB9Per100g: 12,
    vitaminB12Per100g: 0.4,
    calciumPer100g: 61, ironPer100g: 0.1, magnesiumPer100g: 8, phosphorusPer100g: 132,
    potassiumPer100g: 84, sodiumPer100g: 405, zincPer100g: 0.4, seleniumPer100g: 9.0,
    commonPortions: [{ name: '2 colheres de sopa', grams: 60 }],
  },
  {
    name: 'Requeijão cremoso', category: 'dairy',
    caloriesPer100g: 257, proteinPer100g: 7.5, carbsPer100g: 2.8, fatPer100g: 24.0,
    cholesterolPer100g: 70, vitaminAPer100g: 175, vitaminB2Per100g: 0.12, vitaminB12Per100g: 0.3,
    vitaminEPer100g: 0.4, vitaminKPer100g: 2.0,
    calciumPer100g: 85, ironPer100g: 0.3, magnesiumPer100g: 8, phosphorusPer100g: 110,
    potassiumPer100g: 62, sodiumPer100g: 490, zincPer100g: 0.5, seleniumPer100g: 4,
    commonPortions: [{ name: '1 colher de sopa', grams: 30 }],
  },
  {
    name: 'Ricota', category: 'dairy',
    caloriesPer100g: 140, proteinPer100g: 12.6, carbsPer100g: 3.8, fatPer100g: 8.1,
    cholesterolPer100g: 46, vitaminAPer100g: 120, vitaminB2Per100g: 0.20, vitaminB9Per100g: 12,
    vitaminB12Per100g: 0.3,
    calciumPer100g: 253, ironPer100g: 0.4, magnesiumPer100g: 11, phosphorusPer100g: 158,
    potassiumPer100g: 105, sodiumPer100g: 84, zincPer100g: 1.2, seleniumPer100g: 14.5,
    commonPortions: [{ name: '1 fatia', grams: 40 }],
  },

  // ============================================
  // FRUITS — Frutas
  // ============================================
  {
    name: 'Banana prata', category: 'fruits',
    caloriesPer100g: 98, proteinPer100g: 1.3, carbsPer100g: 26.0, fatPer100g: 0.1,
    fiberPer100g: 2.0, vitaminAPer100g: 6, vitaminB1Per100g: 0.07, vitaminB6Per100g: 0.41,
    vitaminB9Per100g: 22, vitaminCPer100g: 22,
    calciumPer100g: 8, ironPer100g: 0.4, magnesiumPer100g: 26, phosphorusPer100g: 28,
    potassiumPer100g: 376, sodiumPer100g: 1, zincPer100g: 0.2, copperPer100g: 0.10,
    manganesePer100g: 0.3, seleniumPer100g: 1.0,
    commonPortions: [{ name: '1 unidade', grams: 86 }],
  },
  {
    name: 'Maçã', category: 'fruits',
    caloriesPer100g: 56, proteinPer100g: 0.3, carbsPer100g: 15.2, fatPer100g: 0.0,
    fiberPer100g: 1.3, vitaminAPer100g: 4, vitaminCPer100g: 3, vitaminKPer100g: 2.2,
    calciumPer100g: 3, ironPer100g: 0.1, magnesiumPer100g: 3, phosphorusPer100g: 11,
    potassiumPer100g: 75, sodiumPer100g: 1,
    commonPortions: [{ name: '1 unidade', grams: 130 }],
  },
  {
    name: 'Laranja', category: 'fruits',
    caloriesPer100g: 37, proteinPer100g: 1.0, carbsPer100g: 8.9, fatPer100g: 0.1,
    fiberPer100g: 1.8, vitaminAPer100g: 12, vitaminB1Per100g: 0.09, vitaminB9Per100g: 30,
    vitaminCPer100g: 57,
    calciumPer100g: 35, ironPer100g: 0.1, magnesiumPer100g: 11, phosphorusPer100g: 14,
    potassiumPer100g: 163, sodiumPer100g: 1,
    commonPortions: [{ name: '1 unidade', grams: 180 }],
  },
  {
    name: 'Mamão papaia', category: 'fruits',
    caloriesPer100g: 40, proteinPer100g: 0.5, carbsPer100g: 10.4, fatPer100g: 0.1,
    fiberPer100g: 1.0, vitaminAPer100g: 45, vitaminB9Per100g: 38, vitaminCPer100g: 82,
    vitaminKPer100g: 2.6,
    calciumPer100g: 25, ironPer100g: 0.2, magnesiumPer100g: 18, phosphorusPer100g: 10,
    potassiumPer100g: 222, sodiumPer100g: 3,
    commonPortions: [{ name: '1 fatia', grams: 170 }],
  },
  {
    name: 'Manga', category: 'fruits',
    caloriesPer100g: 64, proteinPer100g: 0.4, carbsPer100g: 16.7, fatPer100g: 0.3,
    fiberPer100g: 1.6, vitaminAPer100g: 210, vitaminB6Per100g: 0.13, vitaminB9Per100g: 14,
    vitaminCPer100g: 28, vitaminEPer100g: 1.1, vitaminKPer100g: 4.2,
    calciumPer100g: 8, ironPer100g: 0.2, magnesiumPer100g: 7, phosphorusPer100g: 11,
    potassiumPer100g: 148, sodiumPer100g: 1, copperPer100g: 0.11,
    commonPortions: [{ name: '1 unidade média', grams: 200 }],
  },
  {
    name: 'Abacate', category: 'fruits',
    caloriesPer100g: 96, proteinPer100g: 1.2, carbsPer100g: 6.0, fatPer100g: 8.4,
    fiberPer100g: 6.3, omega3Per100g: 0.11, vitaminAPer100g: 6, vitaminB5Per100g: 1.39,
    vitaminB6Per100g: 0.26, vitaminB9Per100g: 81, vitaminCPer100g: 8, vitaminEPer100g: 2.1,
    vitaminKPer100g: 21.0,
    calciumPer100g: 8, ironPer100g: 0.2, magnesiumPer100g: 15, phosphorusPer100g: 52,
    potassiumPer100g: 206, sodiumPer100g: 1, zincPer100g: 0.6, copperPer100g: 0.19,
    commonPortions: [{ name: '1/2 unidade', grams: 100 }, { name: '2 colheres de sopa', grams: 60 }],
  },
  {
    name: 'Morango', category: 'fruits',
    caloriesPer100g: 30, proteinPer100g: 0.9, carbsPer100g: 6.8, fatPer100g: 0.3,
    fiberPer100g: 1.7, vitaminAPer100g: 3, vitaminB9Per100g: 24, vitaminCPer100g: 64,
    vitaminKPer100g: 2.2,
    calciumPer100g: 11, ironPer100g: 0.3, magnesiumPer100g: 10, phosphorusPer100g: 24,
    potassiumPer100g: 184, sodiumPer100g: 1, manganesePer100g: 0.39,
    commonPortions: [{ name: '1 xícara', grams: 150 }, { name: '5 unidades', grams: 60 }],
  },
  {
    name: 'Uva', category: 'fruits',
    caloriesPer100g: 53, proteinPer100g: 0.7, carbsPer100g: 13.6, fatPer100g: 0.2,
    fiberPer100g: 0.9, vitaminAPer100g: 4, vitaminCPer100g: 1, vitaminKPer100g: 14.6,
    calciumPer100g: 7, ironPer100g: 0.1, magnesiumPer100g: 4, phosphorusPer100g: 10,
    potassiumPer100g: 162, sodiumPer100g: 1,
    commonPortions: [{ name: '1 cacho pequeno', grams: 100 }],
  },
  {
    name: 'Melancia', category: 'fruits',
    caloriesPer100g: 33, proteinPer100g: 0.9, carbsPer100g: 8.1, fatPer100g: 0.0,
    fiberPer100g: 0.1, vitaminAPer100g: 23, vitaminCPer100g: 6,
    calciumPer100g: 8, ironPer100g: 0.2, magnesiumPer100g: 10, phosphorusPer100g: 11,
    potassiumPer100g: 104,
    commonPortions: [{ name: '1 fatia', grams: 200 }],
  },
  {
    name: 'Abacaxi', category: 'fruits',
    caloriesPer100g: 48, proteinPer100g: 0.9, carbsPer100g: 12.3, fatPer100g: 0.1,
    fiberPer100g: 1.0, vitaminAPer100g: 4, vitaminB1Per100g: 0.08, vitaminB6Per100g: 0.11,
    vitaminB9Per100g: 18, vitaminCPer100g: 35, manganesePer100g: 0.93,
    calciumPer100g: 22, ironPer100g: 0.3, magnesiumPer100g: 18, phosphorusPer100g: 8,
    potassiumPer100g: 131, sodiumPer100g: 1, copperPer100g: 0.11,
    commonPortions: [{ name: '1 fatia', grams: 130 }],
  },
  {
    name: 'Melão', category: 'fruits',
    caloriesPer100g: 29, proteinPer100g: 0.7, carbsPer100g: 7.5, fatPer100g: 0.0,
    fiberPer100g: 0.3, vitaminAPer100g: 12, vitaminB9Per100g: 21, vitaminCPer100g: 13,
    vitaminKPer100g: 2.5,
    calciumPer100g: 5, ironPer100g: 0.2, magnesiumPer100g: 6, phosphorusPer100g: 15,
    potassiumPer100g: 216, sodiumPer100g: 11,
    commonPortions: [{ name: '1 fatia', grams: 150 }],
  },
  {
    name: 'Goiaba', category: 'fruits',
    caloriesPer100g: 54, proteinPer100g: 1.1, carbsPer100g: 13.0, fatPer100g: 0.4,
    fiberPer100g: 6.2, vitaminAPer100g: 45, vitaminB9Per100g: 49, vitaminCPer100g: 80,
    vitaminKPer100g: 2.6,
    calciumPer100g: 4, ironPer100g: 0.2, magnesiumPer100g: 7, phosphorusPer100g: 25,
    potassiumPer100g: 198, sodiumPer100g: 1, copperPer100g: 0.23,
    commonPortions: [{ name: '1 unidade', grams: 170 }],
  },
  {
    name: 'Pera', category: 'fruits',
    caloriesPer100g: 53, proteinPer100g: 0.6, carbsPer100g: 14.0, fatPer100g: 0.1,
    fiberPer100g: 3.0, vitaminAPer100g: 1, vitaminCPer100g: 3, vitaminKPer100g: 4.4,
    calciumPer100g: 9, ironPer100g: 0.1, magnesiumPer100g: 6, phosphorusPer100g: 12,
    potassiumPer100g: 125, sodiumPer100g: 1, copperPer100g: 0.08,
    commonPortions: [{ name: '1 unidade', grams: 180 }],
  },
  {
    name: 'Kiwi', category: 'fruits',
    caloriesPer100g: 51, proteinPer100g: 1.3, carbsPer100g: 11.5, fatPer100g: 0.6,
    fiberPer100g: 2.7, vitaminAPer100g: 4, vitaminCPer100g: 71, vitaminEPer100g: 1.5,
    vitaminKPer100g: 40.3, vitaminB9Per100g: 25,
    calciumPer100g: 26, ironPer100g: 0.2, magnesiumPer100g: 12, phosphorusPer100g: 34,
    potassiumPer100g: 269, sodiumPer100g: 4, copperPer100g: 0.13,
    commonPortions: [{ name: '1 unidade', grams: 75 }],
  },

  // ============================================
  // VEGETABLES — Verduras e legumes
  // ============================================
  {
    name: 'Brócolis cozido', category: 'vegetables',
    caloriesPer100g: 25, proteinPer100g: 2.1, carbsPer100g: 4.4, fatPer100g: 0.3,
    fiberPer100g: 3.4, vitaminAPer100g: 67, vitaminB6Per100g: 0.20, vitaminB9Per100g: 108,
    vitaminCPer100g: 42, vitaminEPer100g: 1.5, vitaminKPer100g: 141,
    calciumPer100g: 51, ironPer100g: 0.5, magnesiumPer100g: 14, phosphorusPer100g: 67,
    potassiumPer100g: 118, sodiumPer100g: 10, manganesePer100g: 0.19, seleniumPer100g: 1.6,
    commonPortions: [{ name: '1 xícara', grams: 100 }],
  },
  {
    name: 'Cenoura crua', category: 'vegetables',
    caloriesPer100g: 34, proteinPer100g: 1.3, carbsPer100g: 7.7, fatPer100g: 0.2,
    fiberPer100g: 3.2, vitaminAPer100g: 933, vitaminB6Per100g: 0.11, vitaminB9Per100g: 19,
    vitaminCPer100g: 3, vitaminEPer100g: 0.7, vitaminKPer100g: 13.2,
    calciumPer100g: 23, ironPer100g: 0.2, magnesiumPer100g: 11, phosphorusPer100g: 35,
    potassiumPer100g: 315, sodiumPer100g: 3, manganesePer100g: 0.14,
    commonPortions: [{ name: '1 unidade média', grams: 80 }],
  },
  {
    name: 'Tomate', category: 'vegetables',
    caloriesPer100g: 15, proteinPer100g: 1.1, carbsPer100g: 3.1, fatPer100g: 0.2,
    fiberPer100g: 1.2, vitaminAPer100g: 54, vitaminB9Per100g: 15, vitaminCPer100g: 22,
    vitaminEPer100g: 0.5, vitaminKPer100g: 7.9,
    calciumPer100g: 7, ironPer100g: 0.2, magnesiumPer100g: 8, phosphorusPer100g: 24,
    potassiumPer100g: 222, sodiumPer100g: 2,
    commonPortions: [{ name: '1 unidade', grams: 100 }],
  },
  {
    name: 'Alface', category: 'vegetables',
    caloriesPer100g: 11, proteinPer100g: 1.3, carbsPer100g: 1.7, fatPer100g: 0.2,
    fiberPer100g: 1.8, vitaminAPer100g: 232, vitaminB9Per100g: 73, vitaminCPer100g: 16,
    vitaminKPer100g: 126,
    calciumPer100g: 38, ironPer100g: 0.4, magnesiumPer100g: 11, phosphorusPer100g: 33,
    potassiumPer100g: 267, sodiumPer100g: 3, manganesePer100g: 0.18,
    commonPortions: [{ name: '1 prato (folhas)', grams: 50 }],
  },
  {
    name: 'Abobrinha cozida', category: 'vegetables',
    caloriesPer100g: 15, proteinPer100g: 0.8, carbsPer100g: 3.2, fatPer100g: 0.1,
    fiberPer100g: 1.4, vitaminAPer100g: 16, vitaminB9Per100g: 20, vitaminCPer100g: 5,
    vitaminKPer100g: 3.2,
    calciumPer100g: 13, ironPer100g: 0.2, magnesiumPer100g: 12, phosphorusPer100g: 32,
    potassiumPer100g: 198, sodiumPer100g: 1, zincPer100g: 0.4,
    commonPortions: [{ name: '1/2 unidade', grams: 100 }],
  },
  {
    name: 'Espinafre cozido', category: 'vegetables',
    caloriesPer100g: 22, proteinPer100g: 2.6, carbsPer100g: 3.1, fatPer100g: 0.2,
    fiberPer100g: 2.1, vitaminAPer100g: 524, vitaminB1Per100g: 0.10, vitaminB2Per100g: 0.24,
    vitaminB6Per100g: 0.24, vitaminB9Per100g: 146, vitaminCPer100g: 10, vitaminEPer100g: 2.1,
    vitaminKPer100g: 483,
    calciumPer100g: 136, ironPer100g: 1.4, magnesiumPer100g: 87, phosphorusPer100g: 56,
    potassiumPer100g: 466, sodiumPer100g: 52, zincPer100g: 0.8, copperPer100g: 0.17,
    manganesePer100g: 0.93, seleniumPer100g: 1.5,
    commonPortions: [{ name: '1 xícara', grams: 100 }],
  },
  {
    name: 'Couve-flor cozida', category: 'vegetables',
    caloriesPer100g: 19, proteinPer100g: 1.2, carbsPer100g: 3.9, fatPer100g: 0.2,
    fiberPer100g: 2.1, vitaminAPer100g: 1, vitaminB5Per100g: 0.51, vitaminB6Per100g: 0.17,
    vitaminB9Per100g: 44, vitaminCPer100g: 28, vitaminKPer100g: 13.8,
    calciumPer100g: 16, ironPer100g: 0.3, magnesiumPer100g: 9, phosphorusPer100g: 32,
    potassiumPer100g: 142, sodiumPer100g: 15, manganesePer100g: 0.16,
    commonPortions: [{ name: '1 xícara', grams: 100 }],
  },
  {
    name: 'Couve refogada', category: 'vegetables',
    caloriesPer100g: 90, proteinPer100g: 3.1, carbsPer100g: 7.1, fatPer100g: 5.9,
    fiberPer100g: 5.7, omega3Per100g: 0.18, vitaminAPer100g: 385, vitaminB6Per100g: 0.27,
    vitaminB9Per100g: 166, vitaminCPer100g: 77, vitaminKPer100g: 817,
    calciumPer100g: 177, ironPer100g: 0.5, magnesiumPer100g: 15, phosphorusPer100g: 56,
    potassiumPer100g: 198, sodiumPer100g: 15, copperPer100g: 0.29, manganesePer100g: 0.66,
    commonPortions: [{ name: '1 porção', grams: 60 }],
  },
  {
    name: 'Pepino', category: 'vegetables',
    caloriesPer100g: 10, proteinPer100g: 0.9, carbsPer100g: 2.0, fatPer100g: 0.1,
    fiberPer100g: 1.0, vitaminAPer100g: 8, vitaminCPer100g: 5, vitaminKPer100g: 16.4,
    calciumPer100g: 14, ironPer100g: 0.2, magnesiumPer100g: 9, phosphorusPer100g: 24,
    potassiumPer100g: 140, sodiumPer100g: 1,
    commonPortions: [{ name: '1/2 unidade', grams: 100 }],
  },
  {
    name: 'Beterraba cozida', category: 'vegetables',
    caloriesPer100g: 32, proteinPer100g: 1.2, carbsPer100g: 7.2, fatPer100g: 0.1,
    fiberPer100g: 1.9, vitaminAPer100g: 2, vitaminB9Per100g: 80, vitaminCPer100g: 3,
    calciumPer100g: 11, ironPer100g: 0.2, magnesiumPer100g: 18, phosphorusPer100g: 38,
    potassiumPer100g: 259, sodiumPer100g: 42, zincPer100g: 0.4, manganesePer100g: 0.33,
    seleniumPer100g: 0.7,
    commonPortions: [{ name: '1 unidade', grams: 100 }],
  },
  {
    name: 'Chuchu cozido', category: 'vegetables',
    caloriesPer100g: 17, proteinPer100g: 0.4, carbsPer100g: 3.8, fatPer100g: 0.1,
    fiberPer100g: 1.6, vitaminAPer100g: 2, vitaminB9Per100g: 18, vitaminCPer100g: 8,
    vitaminKPer100g: 4.6,
    calciumPer100g: 12, ironPer100g: 0.2, magnesiumPer100g: 8, phosphorusPer100g: 18,
    potassiumPer100g: 97, sodiumPer100g: 1, zincPer100g: 0.7,
    commonPortions: [{ name: '1/2 unidade', grams: 85 }],
  },
  {
    name: 'Berinjela cozida', category: 'vegetables',
    caloriesPer100g: 19, proteinPer100g: 0.7, carbsPer100g: 4.5, fatPer100g: 0.1,
    fiberPer100g: 2.5, vitaminAPer100g: 2, vitaminB9Per100g: 14, vitaminCPer100g: 1,
    vitaminKPer100g: 2.9,
    calciumPer100g: 11, ironPer100g: 0.2, magnesiumPer100g: 11, phosphorusPer100g: 15,
    potassiumPer100g: 123, sodiumPer100g: 1,
    commonPortions: [{ name: '1 xícara', grams: 100 }],
  },
  {
    name: 'Pimentão verde', category: 'vegetables',
    caloriesPer100g: 21, proteinPer100g: 1.1, carbsPer100g: 4.9, fatPer100g: 0.1,
    fiberPer100g: 2.6, vitaminAPer100g: 12, vitaminB6Per100g: 0.22, vitaminCPer100g: 100,
    vitaminKPer100g: 7.4,
    calciumPer100g: 8, ironPer100g: 0.3, magnesiumPer100g: 6, phosphorusPer100g: 20,
    potassiumPer100g: 177, sodiumPer100g: 2,
    commonPortions: [{ name: '1 unidade', grams: 120 }],
  },
  {
    name: 'Abóbora cozida', category: 'vegetables',
    caloriesPer100g: 18, proteinPer100g: 0.7, carbsPer100g: 4.3, fatPer100g: 0.1,
    fiberPer100g: 1.6, vitaminAPer100g: 148, vitaminEPer100g: 0.8, vitaminCPer100g: 7,
    calciumPer100g: 16, ironPer100g: 0.2, magnesiumPer100g: 7, phosphorusPer100g: 30,
    potassiumPer100g: 170, sodiumPer100g: 1,
    commonPortions: [{ name: '1 fatia', grams: 100 }],
  },
  {
    name: 'Vagem cozida', category: 'vegetables',
    caloriesPer100g: 25, proteinPer100g: 1.6, carbsPer100g: 5.1, fatPer100g: 0.1,
    fiberPer100g: 3.2, vitaminAPer100g: 33, vitaminB9Per100g: 33, vitaminCPer100g: 9,
    vitaminKPer100g: 44.3,
    calciumPer100g: 36, ironPer100g: 0.7, magnesiumPer100g: 16, phosphorusPer100g: 26,
    potassiumPer100g: 146, sodiumPer100g: 3, manganesePer100g: 0.22,
    commonPortions: [{ name: '1 xícara', grams: 100 }],
  },

  // ============================================
  // LEGUMES — Leguminosas
  // ============================================
  {
    name: 'Feijão preto cozido', category: 'legumes',
    caloriesPer100g: 77, proteinPer100g: 4.5, carbsPer100g: 14.0, fatPer100g: 0.5,
    fiberPer100g: 8.4, omega3Per100g: 0.18, vitaminB1Per100g: 0.24, vitaminB9Per100g: 149,
    vitaminKPer100g: 3.3,
    calciumPer100g: 29, ironPer100g: 1.5, magnesiumPer100g: 40, phosphorusPer100g: 140,
    potassiumPer100g: 256, sodiumPer100g: 2, zincPer100g: 1.1, copperPer100g: 0.21,
    manganesePer100g: 0.44, seleniumPer100g: 1.2,
    commonPortions: [{ name: '1 concha', grams: 80 }, { name: '1 xícara', grams: 170 }],
  },
  {
    name: 'Feijão carioca cozido', category: 'legumes',
    caloriesPer100g: 76, proteinPer100g: 4.8, carbsPer100g: 13.6, fatPer100g: 0.5,
    fiberPer100g: 8.5, vitaminB1Per100g: 0.16, vitaminB6Per100g: 0.12, vitaminB9Per100g: 130,
    vitaminKPer100g: 3.0,
    calciumPer100g: 27, ironPer100g: 1.3, magnesiumPer100g: 37, phosphorusPer100g: 138,
    potassiumPer100g: 255, sodiumPer100g: 2, zincPer100g: 0.9, copperPer100g: 0.19,
    manganesePer100g: 0.43, seleniumPer100g: 1.3,
    commonPortions: [{ name: '1 concha', grams: 80 }, { name: '1 xícara', grams: 170 }],
  },
  {
    name: 'Lentilha cozida', category: 'legumes',
    caloriesPer100g: 93, proteinPer100g: 6.3, carbsPer100g: 16.3, fatPer100g: 0.5,
    fiberPer100g: 7.9, vitaminB1Per100g: 0.17, vitaminB3Per100g: 1.1, vitaminB5Per100g: 0.64,
    vitaminB6Per100g: 0.18, vitaminB9Per100g: 181,
    calciumPer100g: 16, ironPer100g: 1.5, magnesiumPer100g: 22, phosphorusPer100g: 180,
    potassiumPer100g: 220, sodiumPer100g: 2, zincPer100g: 1.3, copperPer100g: 0.25,
    manganesePer100g: 0.49, seleniumPer100g: 2.8,
    commonPortions: [{ name: '1 concha', grams: 80 }],
  },
  {
    name: 'Grão-de-bico cozido', category: 'legumes',
    caloriesPer100g: 130, proteinPer100g: 6.7, carbsPer100g: 21.2, fatPer100g: 2.1,
    fiberPer100g: 5.1, vitaminAPer100g: 1, vitaminB1Per100g: 0.12, vitaminB6Per100g: 0.14,
    vitaminB9Per100g: 172, vitaminCPer100g: 1, vitaminKPer100g: 4.0,
    calciumPer100g: 43, ironPer100g: 2.4, magnesiumPer100g: 36, phosphorusPer100g: 168,
    potassiumPer100g: 291, sodiumPer100g: 7, zincPer100g: 1.5, copperPer100g: 0.35,
    manganesePer100g: 1.03, seleniumPer100g: 3.7,
    commonPortions: [{ name: '1 concha', grams: 80 }],
  },
  {
    name: 'Ervilha cozida', category: 'legumes',
    caloriesPer100g: 63, proteinPer100g: 4.1, carbsPer100g: 11.3, fatPer100g: 0.4,
    fiberPer100g: 4.7, vitaminAPer100g: 12, vitaminB1Per100g: 0.19, vitaminB9Per100g: 63,
    vitaminCPer100g: 8, vitaminKPer100g: 14.5,
    calciumPer100g: 14, ironPer100g: 0.7, magnesiumPer100g: 16, phosphorusPer100g: 77,
    potassiumPer100g: 144, sodiumPer100g: 2, zincPer100g: 0.6, manganesePer100g: 0.29,
    commonPortions: [{ name: '1 xícara', grams: 160 }],
  },
  {
    name: 'Soja cozida', category: 'legumes',
    caloriesPer100g: 151, proteinPer100g: 14.0, carbsPer100g: 7.9, fatPer100g: 7.0,
    fiberPer100g: 5.6, omega3Per100g: 0.60, vitaminAPer100g: 1, vitaminB2Per100g: 0.29,
    vitaminB6Per100g: 0.23, vitaminB9Per100g: 54, vitaminKPer100g: 19.2,
    calciumPer100g: 83, ironPer100g: 2.5, magnesiumPer100g: 56, phosphorusPer100g: 245,
    potassiumPer100g: 283, sodiumPer100g: 1, zincPer100g: 1.2, copperPer100g: 0.41,
    manganesePer100g: 0.82, seleniumPer100g: 7.3,
    commonPortions: [{ name: '1 xícara', grams: 170 }],
  },
  {
    name: 'Feijão branco cozido', category: 'legumes',
    caloriesPer100g: 99, proteinPer100g: 6.3, carbsPer100g: 17.6, fatPer100g: 0.5,
    fiberPer100g: 6.3, vitaminB1Per100g: 0.15, vitaminB6Per100g: 0.12, vitaminB9Per100g: 81,
    calciumPer100g: 50, ironPer100g: 2.3, magnesiumPer100g: 43, phosphorusPer100g: 113,
    potassiumPer100g: 389, sodiumPer100g: 6, zincPer100g: 1.0, copperPer100g: 0.21,
    manganesePer100g: 0.48, seleniumPer100g: 2.5,
    commonPortions: [{ name: '1 concha', grams: 80 }],
  },
  {
    name: 'Tofu firme', category: 'legumes',
    caloriesPer100g: 64, proteinPer100g: 6.6, carbsPer100g: 2.4, fatPer100g: 3.5,
    fiberPer100g: 0.2, omega3Per100g: 0.32, vitaminB9Per100g: 19,
    calciumPer100g: 111, ironPer100g: 1.7, magnesiumPer100g: 30, phosphorusPer100g: 97,
    potassiumPer100g: 121, sodiumPer100g: 7, zincPer100g: 0.8, copperPer100g: 0.19,
    manganesePer100g: 0.61, seleniumPer100g: 8.9,
    commonPortions: [{ name: '1 fatia', grams: 80 }],
  },

  // ============================================
  // FATS — Gorduras e oleaginosas
  // ============================================
  {
    name: 'Azeite de oliva', category: 'fats',
    caloriesPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0,
    omega3Per100g: 0.76, vitaminEPer100g: 14.4, vitaminKPer100g: 60.2,
    calciumPer100g: 1, ironPer100g: 0.4, sodiumPer100g: 2,
    commonPortions: [{ name: '1 colher de sopa', grams: 13 }, { name: '1 fio', grams: 5 }],
  },
  {
    name: 'Óleo de coco', category: 'fats',
    caloriesPer100g: 862, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 99.1,
    vitaminEPer100g: 0.1,
    commonPortions: [{ name: '1 colher de sopa', grams: 13 }],
  },
  {
    name: 'Manteiga', category: 'fats',
    caloriesPer100g: 726, proteinPer100g: 0.3, carbsPer100g: 0.0, fatPer100g: 82.0,
    cholesterolPer100g: 215, vitaminAPer100g: 684, vitaminB12Per100g: 0.2, vitaminDPer100g: 0.8,
    vitaminEPer100g: 2.3, vitaminKPer100g: 7.0,
    calciumPer100g: 15, phosphorusPer100g: 24, sodiumPer100g: 579, seleniumPer100g: 1.0,
    commonPortions: [{ name: '1 colher de chá', grams: 5 }],
  },
  {
    name: 'Pasta de amendoim', category: 'fats',
    caloriesPer100g: 593, proteinPer100g: 22.5, carbsPer100g: 22.3, fatPer100g: 46.3,
    fiberPer100g: 4.5, vitaminB1Per100g: 0.15, vitaminB3Per100g: 13.1, vitaminB5Per100g: 1.14,
    vitaminB6Per100g: 0.44, vitaminB9Per100g: 87, vitaminEPer100g: 9.1,
    calciumPer100g: 43, ironPer100g: 1.9, magnesiumPer100g: 154, phosphorusPer100g: 358,
    potassiumPer100g: 649, sodiumPer100g: 426, zincPer100g: 2.5, copperPer100g: 0.47,
    manganesePer100g: 1.5, seleniumPer100g: 4.1,
    commonPortions: [{ name: '1 colher de sopa', grams: 20 }],
  },
  {
    name: 'Castanha-do-pará', category: 'fats',
    caloriesPer100g: 643, proteinPer100g: 14.5, carbsPer100g: 12.3, fatPer100g: 63.5,
    fiberPer100g: 7.9, vitaminB1Per100g: 0.62, vitaminCPer100g: 1, vitaminEPer100g: 5.7,
    calciumPer100g: 146, ironPer100g: 2.4, magnesiumPer100g: 376, phosphorusPer100g: 725,
    potassiumPer100g: 600, sodiumPer100g: 2, zincPer100g: 4.1, copperPer100g: 1.74,
    manganesePer100g: 1.22, seleniumPer100g: 1917,
    commonPortions: [{ name: '2 unidades', grams: 8 }],
  },
  {
    name: 'Castanha de caju', category: 'fats',
    caloriesPer100g: 570, proteinPer100g: 18.5, carbsPer100g: 29.1, fatPer100g: 46.3,
    fiberPer100g: 3.7, vitaminB1Per100g: 0.42, vitaminB5Per100g: 0.86, vitaminB6Per100g: 0.42,
    vitaminB9Per100g: 25, vitaminEPer100g: 0.9, vitaminKPer100g: 34.1,
    calciumPer100g: 32, ironPer100g: 5.2, magnesiumPer100g: 260, phosphorusPer100g: 593,
    potassiumPer100g: 565, sodiumPer100g: 8, zincPer100g: 5.8, copperPer100g: 2.20,
    manganesePer100g: 1.66, seleniumPer100g: 19.9,
    commonPortions: [{ name: '10 unidades', grams: 15 }],
  },
  {
    name: 'Amendoim torrado', category: 'fats',
    caloriesPer100g: 606, proteinPer100g: 27.2, carbsPer100g: 12.5, fatPer100g: 49.4,
    fiberPer100g: 8.0, vitaminB1Per100g: 0.44, vitaminB3Per100g: 12.1, vitaminB5Per100g: 1.77,
    vitaminB6Per100g: 0.35, vitaminB9Per100g: 145, vitaminEPer100g: 8.3,
    calciumPer100g: 44, ironPer100g: 2.2, magnesiumPer100g: 150, phosphorusPer100g: 376,
    potassiumPer100g: 580, sodiumPer100g: 5, zincPer100g: 3.3, copperPer100g: 1.14,
    manganesePer100g: 1.93, seleniumPer100g: 7.2,
    commonPortions: [{ name: '1 punhado', grams: 30 }],
  },
  {
    name: 'Nozes', category: 'fats',
    caloriesPer100g: 620, proteinPer100g: 14.0, carbsPer100g: 10.0, fatPer100g: 59.0,
    fiberPer100g: 4.6, omega3Per100g: 9.08, vitaminAPer100g: 1, vitaminB6Per100g: 0.54,
    vitaminB9Per100g: 98, vitaminKPer100g: 2.7,
    calciumPer100g: 85, ironPer100g: 2.6, magnesiumPer100g: 120, phosphorusPer100g: 346,
    potassiumPer100g: 441, sodiumPer100g: 3, zincPer100g: 3.1, copperPer100g: 1.59,
    manganesePer100g: 3.41, seleniumPer100g: 4.9,
    commonPortions: [{ name: '3 unidades', grams: 12 }],
  },
  {
    name: 'Semente de chia', category: 'fats',
    caloriesPer100g: 486, proteinPer100g: 16.5, carbsPer100g: 42.1, fatPer100g: 30.7,
    fiberPer100g: 34.4, omega3Per100g: 17.83, vitaminB1Per100g: 0.62, vitaminB3Per100g: 8.8,
    vitaminB9Per100g: 49,
    calciumPer100g: 631, ironPer100g: 7.7, magnesiumPer100g: 335, phosphorusPer100g: 860,
    potassiumPer100g: 407, sodiumPer100g: 16, zincPer100g: 4.6, copperPer100g: 0.92,
    manganesePer100g: 2.72, seleniumPer100g: 55.2,
    commonPortions: [{ name: '1 colher de sopa', grams: 12 }],
  },
  {
    name: 'Semente de linhaça', category: 'fats',
    caloriesPer100g: 495, proteinPer100g: 14.1, carbsPer100g: 43.3, fatPer100g: 32.3,
    fiberPer100g: 33.5, omega3Per100g: 22.81, vitaminB1Per100g: 1.64, vitaminB3Per100g: 3.1,
    vitaminB5Per100g: 0.98, vitaminB6Per100g: 0.47, vitaminB9Per100g: 87,
    calciumPer100g: 211, ironPer100g: 4.7, magnesiumPer100g: 362, phosphorusPer100g: 642,
    potassiumPer100g: 508, sodiumPer100g: 30, zincPer100g: 4.3, copperPer100g: 1.22,
    manganesePer100g: 2.48, seleniumPer100g: 25.4,
    commonPortions: [{ name: '1 colher de sopa', grams: 12 }],
  },
  {
    name: 'Coco ralado', category: 'fats',
    caloriesPer100g: 592, proteinPer100g: 5.5, carbsPer100g: 26.3, fatPer100g: 53.9,
    fiberPer100g: 15.0, vitaminCPer100g: 2,
    calciumPer100g: 6, ironPer100g: 1.8, magnesiumPer100g: 46, phosphorusPer100g: 94,
    potassiumPer100g: 370, sodiumPer100g: 21, zincPer100g: 1.1, copperPer100g: 0.32,
    manganesePer100g: 1.50, seleniumPer100g: 10.1,
    commonPortions: [{ name: '1 colher de sopa', grams: 10 }],
  },

  // ============================================
  // BEVERAGES — Bebidas
  // ============================================
  {
    name: 'Café (sem açúcar)', category: 'beverages',
    caloriesPer100g: 2, proteinPer100g: 0.1, carbsPer100g: 0.0, fatPer100g: 0.0,
    vitaminB2Per100g: 0.18, vitaminB3Per100g: 0.5, vitaminB5Per100g: 0.25,
    calciumPer100g: 2, potassiumPer100g: 49, sodiumPer100g: 2, magnesiumPer100g: 4,
    commonPortions: [{ name: '1 xícara', grams: 50 }, { name: '1 caneca', grams: 200 }],
  },
  {
    name: 'Suco de laranja natural', category: 'beverages',
    caloriesPer100g: 45, proteinPer100g: 0.6, carbsPer100g: 10.4, fatPer100g: 0.2,
    fiberPer100g: 0.3, vitaminAPer100g: 5, vitaminB1Per100g: 0.09, vitaminB9Per100g: 30,
    vitaminCPer100g: 40,
    calciumPer100g: 12, ironPer100g: 0.2, magnesiumPer100g: 10, phosphorusPer100g: 17,
    potassiumPer100g: 186, sodiumPer100g: 1,
    commonPortions: [{ name: '1 copo', grams: 250 }],
  },
  {
    name: 'Água de coco', category: 'beverages',
    caloriesPer100g: 22, proteinPer100g: 0.0, carbsPer100g: 5.3, fatPer100g: 0.0,
    vitaminCPer100g: 2,
    calciumPer100g: 20, ironPer100g: 0.1, magnesiumPer100g: 6, phosphorusPer100g: 20,
    potassiumPer100g: 162, sodiumPer100g: 15, manganesePer100g: 0.14, seleniumPer100g: 1.0,
    commonPortions: [{ name: '1 copo', grams: 250 }],
  },
  {
    name: 'Leite de coco', category: 'beverages',
    caloriesPer100g: 150, proteinPer100g: 1.4, carbsPer100g: 2.0, fatPer100g: 15.0,
    vitaminCPer100g: 1,
    calciumPer100g: 10, ironPer100g: 0.8, magnesiumPer100g: 28, phosphorusPer100g: 100,
    potassiumPer100g: 186, sodiumPer100g: 8, zincPer100g: 0.7, copperPer100g: 0.27,
    manganesePer100g: 0.92, seleniumPer100g: 6.2,
    commonPortions: [{ name: '1/2 xícara', grams: 100 }],
  },
  {
    name: 'Chá verde (sem açúcar)', category: 'beverages',
    caloriesPer100g: 0, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 0.0,
    vitaminB9Per100g: 12, manganesePer100g: 0.18,
    sodiumPer100g: 1, potassiumPer100g: 8,
    commonPortions: [{ name: '1 xícara', grams: 200 }],
  },
  {
    name: 'Suco de uva integral', category: 'beverages',
    caloriesPer100g: 57, proteinPer100g: 0.2, carbsPer100g: 14.2, fatPer100g: 0.1,
    fiberPer100g: 0.2, vitaminAPer100g: 2, vitaminCPer100g: 1,
    calciumPer100g: 10, ironPer100g: 0.3, magnesiumPer100g: 6, phosphorusPer100g: 14,
    potassiumPer100g: 104, sodiumPer100g: 2,
    commonPortions: [{ name: '1 copo', grams: 200 }],
  },

  // ============================================
  // SWEETS — Doces e açúcares
  // ============================================
  {
    name: 'Mel', category: 'sweets',
    caloriesPer100g: 309, proteinPer100g: 0.3, carbsPer100g: 84.0, fatPer100g: 0.0,
    fiberPer100g: 0.2, vitaminCPer100g: 1,
    calciumPer100g: 4, ironPer100g: 0.3, magnesiumPer100g: 2, phosphorusPer100g: 4,
    potassiumPer100g: 52, sodiumPer100g: 4, zincPer100g: 0.2, seleniumPer100g: 0.8,
    commonPortions: [{ name: '1 colher de sopa', grams: 21 }],
  },
  {
    name: 'Chocolate amargo (70%)', category: 'sweets',
    caloriesPer100g: 528, proteinPer100g: 6.1, carbsPer100g: 45.2, fatPer100g: 35.4,
    fiberPer100g: 7.0, cholesterolPer100g: 5, vitaminAPer100g: 2, vitaminB3Per100g: 1.1,
    vitaminB5Per100g: 0.42, vitaminB12Per100g: 0.3, vitaminKPer100g: 7.3,
    calciumPer100g: 56, ironPer100g: 6.3, magnesiumPer100g: 176, phosphorusPer100g: 308,
    potassiumPer100g: 567, sodiumPer100g: 10, zincPer100g: 3.3, copperPer100g: 1.77,
    manganesePer100g: 1.95, seleniumPer100g: 6.8,
    commonPortions: [{ name: '1 quadrado', grams: 10 }, { name: '3 quadrados', grams: 30 }],
  },
  {
    name: 'Açúcar mascavo', category: 'sweets',
    caloriesPer100g: 369, proteinPer100g: 0.7, carbsPer100g: 94.5, fatPer100g: 0.0,
    calciumPer100g: 85, ironPer100g: 3.4, magnesiumPer100g: 29, phosphorusPer100g: 22,
    potassiumPer100g: 522, sodiumPer100g: 28, manganesePer100g: 0.27, seleniumPer100g: 1.2,
    commonPortions: [{ name: '1 colher de chá', grams: 5 }],
  },
  {
    name: 'Geleia de fruta', category: 'sweets',
    caloriesPer100g: 262, proteinPer100g: 0.3, carbsPer100g: 68.0, fatPer100g: 0.0,
    fiberPer100g: 0.3, vitaminAPer100g: 2, vitaminCPer100g: 5,
    calciumPer100g: 14, ironPer100g: 0.3, magnesiumPer100g: 4, phosphorusPer100g: 11,
    potassiumPer100g: 53, sodiumPer100g: 15,
    commonPortions: [{ name: '1 colher de sopa', grams: 20 }],
  },

  // ============================================
  // OTHERS — Outros
  // ============================================
  {
    name: 'Farinha de mandioca', category: 'others',
    caloriesPer100g: 361, proteinPer100g: 1.6, carbsPer100g: 87.0, fatPer100g: 0.4,
    fiberPer100g: 6.5, vitaminB9Per100g: 24,
    calciumPer100g: 41, ironPer100g: 1.4, magnesiumPer100g: 32, phosphorusPer100g: 38,
    potassiumPer100g: 320, sodiumPer100g: 3, zincPer100g: 0.3, seleniumPer100g: 0.7,
    commonPortions: [{ name: '1 colher de sopa', grams: 16 }],
  },
  {
    name: 'Granola', category: 'others',
    caloriesPer100g: 421, proteinPer100g: 10.0, carbsPer100g: 63.6, fatPer100g: 15.2,
    fiberPer100g: 4.8, vitaminB1Per100g: 0.32, vitaminB3Per100g: 1.5, vitaminEPer100g: 2.8,
    calciumPer100g: 41, ironPer100g: 3.5, magnesiumPer100g: 78, phosphorusPer100g: 206,
    potassiumPer100g: 373, sodiumPer100g: 128, zincPer100g: 2.2, copperPer100g: 0.34,
    manganesePer100g: 2.2, seleniumPer100g: 15.2,
    commonPortions: [{ name: '1 porção', grams: 40 }],
  },
  {
    name: 'Whey protein', category: 'others',
    caloriesPer100g: 375, proteinPer100g: 75.0, carbsPer100g: 12.5, fatPer100g: 3.1,
    cholesterolPer100g: 25, vitaminB2Per100g: 0.30, vitaminB5Per100g: 0.50,
    vitaminB12Per100g: 1.0, vitaminDPer100g: 2.5,
    calciumPer100g: 150, ironPer100g: 0.5, magnesiumPer100g: 20, phosphorusPer100g: 250,
    potassiumPer100g: 200, sodiumPer100g: 150, zincPer100g: 1.5, seleniumPer100g: 15,
    commonPortions: [{ name: '1 scoop', grams: 30 }],
  },
  {
    name: 'Farinha de aveia', category: 'others',
    caloriesPer100g: 389, proteinPer100g: 13.9, carbsPer100g: 66.6, fatPer100g: 7.5,
    fiberPer100g: 9.1, omega3Per100g: 0.11, vitaminB1Per100g: 0.46, vitaminB2Per100g: 0.16,
    vitaminB3Per100g: 1.1, vitaminB5Per100g: 1.12, vitaminB6Per100g: 0.12, vitaminB9Per100g: 32,
    vitaminKPer100g: 2.0,
    calciumPer100g: 48, ironPer100g: 4.4, magnesiumPer100g: 119, phosphorusPer100g: 410,
    potassiumPer100g: 336, sodiumPer100g: 3, zincPer100g: 3.6, copperPer100g: 0.39,
    manganesePer100g: 3.6, seleniumPer100g: 28.9,
    commonPortions: [{ name: '2 colheres de sopa', grams: 30 }],
  },
  {
    name: 'Polvilho doce', category: 'others',
    caloriesPer100g: 351, proteinPer100g: 0.3, carbsPer100g: 87.0, fatPer100g: 0.1,
    fiberPer100g: 0.1,
    calciumPer100g: 8, phosphorusPer100g: 8, potassiumPer100g: 4, sodiumPer100g: 1,
    commonPortions: [{ name: '2 colheres de sopa', grams: 30 }],
  },
]

// Seed idempotente — usa $set para atualizar alimentos existentes
// (necessário para adicionar micronutrientes a alimentos já no banco)
export async function seedFoods(): Promise<number> {
  let count = 0

  for (const food of foods) {
    await FoodItem.updateOne(
      { name: food.name },
      { $set: food },
      { upsert: true },
    )
    count++
  }

  return count
}
