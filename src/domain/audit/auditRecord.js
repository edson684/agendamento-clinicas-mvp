// Lista branca de campos: senhas, tokens e conteúdo clínico NUNCA entram no registro.
export const createRecord = ({ quando, name, ator, recurso, resultado }) =>
  Object.freeze({ quando, evento: name, ator: ator ?? '-', recurso: recurso ?? '-', resultado: resultado ?? 'OK' });
