/**
 * Palabras que no se aceptan en el diseñador con IA.
 *
 * Se comparan ya normalizadas: en minúsculas, sin acentos (la ñ se conserva)
 * y sin letras repetidas ("peeene" → "pene"). Escríbelas aquí igual: en
 * minúsculas y sin acentos.
 *
 * - `PALABRAS`: la palabra completa. Úsalo cuando la raíz también forma palabras
 *   normales (por ejemplo `pito` sí, pero no "pitón").
 * - `RAICES`: cualquier palabra que empiece así (`pendej` → pendejo, pendejada…).
 *   Revisa que la raíz no sea el inicio de palabras comunes.
 * - `FRASES`: frases que intentan cambiar las instrucciones de la IA.
 *
 * Ojo con palabras que tienen otro significado en joyería o en Yucatán:
 * "pendientes", "bomba", "granada", "negro", "muerte", "calavera", "perrita",
 * "revolver los colores" o "año" escrito sin ñ ("ano") deben pasar.
 */

export const PALABRAS = [
  // Sexual y partes íntimas
  'pene', 'penes', 'pito', 'pitos', 'verga', 'vergas', 'vergota', 'vergudo', 'polla', 'pollas',
  'vagina', 'vaginas', 'vulva', 'clitoris', 'testiculo', 'testiculos', 'escroto',
  'teta', 'tetas', 'tetona', 'chichis', 'pezon', 'pezones', 'nalga', 'nalgas', 'culo', 'culos',
  'anal', 'sexo', 'sexual', 'sexuales', 'sexy', 'xxx', 'erotico', 'erotica', 'orgasmo', 'semen',
  'condon', 'condones', 'dildo', 'consolador', 'desnudo', 'desnuda', 'desnudos', 'desnudas', 'desnudez',
  'encuerado', 'encuerada', 'hentai', 'fetiche', 'bdsm', 'onlyfans',
  // Groserías e insultos
  'puta', 'putas', 'puto', 'putos', 'putita', 'putito', 'putazo', 'putiza', 'putero', 'pinche', 'pinches',
  'cabron', 'cabrona', 'cabrones', 'mierda', 'mierdas', 'culero', 'culera', 'culeros', 'mamada', 'mamadas',
  'mamon', 'mamona', 'mamones', 'joto', 'jotos', 'maricon', 'maricones', 'marica', 'puñal', 'puñetas',
  'idiota', 'imbecil', 'estupido', 'estupida', 'naco', 'naca',
  'coño', 'cojones', 'gilipollas', 'malparido', 'hijueputa',
  // Violencia, armas y drogas
  'matar', 'maten', 'asesinar', 'asesinato', 'asesino', 'sicario', 'sicarios', 'tortura',
  'violacion', 'violar', 'violador', 'secuestro', 'masacre', 'genocidio',
  'pistola', 'pistolas', 'rifle', 'rifles', 'metralleta', 'fusil', 'escopeta',
  'explosivo', 'explosivos', 'terrorista', 'terrorismo',
  'cocaina', 'marihuana', 'mariguana', 'metanfetamina', 'fentanilo', 'droga', 'drogas', 'lsd',
  // Odio
  'nazi', 'nazis', 'hitler', 'esvastica', 'kkk', 'supremacista',
  // Inglés
  'fuck', 'fucking', 'shit', 'bitch', 'bitches', 'dick', 'dicks', 'cock', 'cocks', 'pussy', 'cunt',
  'penis', 'boobs', 'tits', 'nude', 'nudes', 'naked', 'sex', 'whore', 'slut', 'rape', 'kill',
  'nigger', 'nigga', 'fag', 'faggot', 'swastika', 'gun', 'guns', 'weed',
];

export const RAICES = [
  'pendej', 'chingad', 'chingar', 'chingu', 'verguer', 'mierd', 'porn', 'masturb', 'eyacul',
  'pedofil', 'pederast', 'incest', 'zoofil', 'prostitu', 'decapit', 'descuartiz', 'suicid',
  'narco', 'nazism', 'neonazi', 'fuck', 'motherf', 'bullshit',
];

export const FRASES = [
  'ignora las instrucciones', 'ignora tus instrucciones', 'ignora todo', 'olvida las instrucciones',
  'olvida tus instrucciones', 'nuevas instrucciones', 'ignore previous', 'ignore all', 'ignore the',
  'system prompt', 'jailbreak',
];
